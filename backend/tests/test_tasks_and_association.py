import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import status
from sqlalchemy import func, select

from app import models, security

from .conftest import MANAGER_PASSWORD

OTHER_MANAGER_EMAIL = "outro.gestor@example.com"


# Fixtures
@pytest.fixture()
def manager_id(registered_manager):
    return uuid.UUID(registered_manager["id"])


@pytest.fixture()
def other_manager(client, registered_manager):
    """Segundo gestor, com a própria equipe e as próprias tasks."""
    created = client.post(
        "/auth/register",
        json={"email": OTHER_MANAGER_EMAIL, "password": MANAGER_PASSWORD},
    ).json()
    token = client.post(
        "/auth/login",
        json={"email": OTHER_MANAGER_EMAIL, "password": MANAGER_PASSWORD},
    ).json()["access_token"]

    return {
        "id": uuid.UUID(created["id"]),
        "headers": {"Authorization": f"Bearer {token}"},
    }


def _add_user(db, username: str, manager_id: uuid.UUID | None):
    user = models.User(username=username, manager_id=manager_id)

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@pytest.fixture()
def team(db, manager_id):
    """Colaboradores da equipe do gestor padrão (user.manager_id == gestor)."""
    return {
        name: _add_user(db, name, manager_id)
        for name in ("ana", "bruno", "carla")
    }


@pytest.fixture()
def other_team(db, other_manager):
    return {
        name: _add_user(db, name, other_manager["id"])
        for name in ("diego", "elisa")
    }


@pytest.fixture()
def orphan(db):
    """Colaborador ainda sem gestor (não associado)."""
    return _add_user(db, "sem-gestor", None)


def _ids(*users) -> list[str]:
    return [str(user.id) for user in users]


def _create(client, headers, title="Task", collaborators=(), **extra):
    response = client.post(
        "/tasks/",
        json={
            "title": title,
            "collaborator_ids": _ids(*collaborators),
            **extra,
        },
        headers=headers,
    )

    assert response.status_code == status.HTTP_201_CREATED, response.text

    return response.json()


def _count(db, model) -> int:
    return db.query(model).count()


def _assignments(db) -> int:
    return db.execute(
        select(func.count()).select_from(models.task_assignments)
    ).scalar_one()


# POST /tasks/
def test_criar_task_com_colaboradores_retorna_201(
    client, db, auth_headers, manager_id, team
):
    response = client.post(
        "/tasks/",
        json={
            "title": "Revisar pull requests",
            "description": "Sprint 12",
            "collaborator_ids": _ids(team["bruno"], team["ana"]),
        },
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_201_CREATED

    body = response.json()

    assert uuid.UUID(body["id"]).version == 7
    assert body["title"] == "Revisar pull requests"
    assert body["description"] == "Sprint 12"
    assert [c["username"] for c in body["collaborators"]] == ["ana", "bruno"]
    assert {"id", "username", "full_name"} == body["collaborators"][0].keys()
    assert body["created_at"] and body["updated_at"]

    stored = db.query(models.Task).one()

    assert stored.manager_id == manager_id
    assert _assignments(db) == 2


def test_criar_task_sem_colaboradores_e_permitido(client, auth_headers):
    response = client.post(
        "/tasks/", json={"title": "Planejar sprint"}, headers=auth_headers
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["collaborators"] == []
    assert response.json()["description"] is None


def test_criar_task_normaliza_titulo_e_descricao(client, auth_headers):
    response = client.post(
        "/tasks/",
        json={"title": "  Deploy  ", "description": "   "},
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["title"] == "Deploy"
    assert response.json()["description"] is None


@pytest.mark.parametrize(
    "payload",
    [
        {"title": ""},
        {"title": "   "},
        {"title": None},
        {"description": "sem título"},
        {"title": "x" * 201},
        {"title": "ok", "description": "x" * 5001},
        {"title": "ok", "collaborator_ids": ["nao-e-uuid"]},
        {"title": "ok", "collaborator_ids": "nao-e-lista"},
    ],
)
def test_criar_task_valida_entrada_e_nao_persiste(
    client, db, auth_headers, payload
):
    response = client.post("/tasks/", json=payload, headers=auth_headers)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert _count(db, models.Task) == 0


def test_criar_task_ignora_colaboradores_repetidos(
    client, db, auth_headers, team
):
    ids = _ids(team["ana"], team["ana"], team["bruno"], team["ana"])

    response = client.post(
        "/tasks/",
        json={"title": "Dedup", "collaborator_ids": ids},
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert len(response.json()["collaborators"]) == 2
    assert _assignments(db) == 2


def test_criar_task_recusa_colaborador_de_outra_equipe(
    client, db, auth_headers, team, other_team
):
    response = client.post(
        "/tasks/",
        json={"title": "X", "collaborator_ids": _ids(other_team["diego"])},
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert str(other_team["diego"].id) in response.json()["detail"]
    assert _count(db, models.Task) == 0


def test_criar_task_recusa_colaborador_sem_gestor(
    client, db, auth_headers, orphan
):
    response = client.post(
        "/tasks/",
        json={"title": "X", "collaborator_ids": _ids(orphan)},
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert _count(db, models.Task) == 0


def test_criar_task_recusa_colaborador_inexistente(client, db, auth_headers):
    response = client.post(
        "/tasks/",
        json={"title": "X", "collaborator_ids": [str(uuid.uuid7())]},
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert _count(db, models.Task) == 0


def test_inexistente_e_de_outra_equipe_sao_indistinguiveis(
    client, auth_headers, other_team
):
    """A resposta não revela se o id existe em outra equipe."""
    foreign = other_team["diego"].id
    ghost = uuid.uuid7()

    def detail(user_id):
        response = client.post(
            "/tasks/",
            json={"title": "X", "collaborator_ids": [str(user_id)]},
            headers=auth_headers,
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

        return response.json()["detail"].replace(str(user_id), "<id>")

    assert detail(foreign) == detail(ghost)


def test_um_colaborador_invalido_cancela_a_criacao_inteira(
    client, db, auth_headers, team, other_team
):
    response = client.post(
        "/tasks/",
        json={
            "title": "Tudo ou nada",
            "collaborator_ids": _ids(team["ana"], other_team["diego"]),
        },
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert _count(db, models.Task) == 0
    assert _assignments(db) == 0


def test_gestor_nao_atribui_colaboradores_de_outro_gestor_na_propria_task(
    client, other_manager, team
):
    """O isolamento vale nos dois sentidos."""
    response = client.post(
        "/tasks/",
        json={"title": "X", "collaborator_ids": _ids(team["ana"])},
        headers=other_manager["headers"],
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# GET /tasks/
def test_listar_sem_tasks_retorna_lista_vazia(client, auth_headers):
    response = client.get("/tasks/", headers=auth_headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_listar_retorna_somente_tasks_do_gestor_logado(
    client, auth_headers, other_manager
):
    _create(client, auth_headers, "A1")
    _create(client, auth_headers, "A2")
    _create(client, other_manager["headers"], "B1")

    mine = client.get("/tasks/", headers=auth_headers).json()
    theirs = client.get("/tasks/", headers=other_manager["headers"]).json()

    assert sorted(t["title"] for t in mine) == ["A1", "A2"]
    assert [t["title"] for t in theirs] == ["B1"]


def test_listar_ordena_da_mais_nova_para_a_mais_antiga(client, auth_headers):
    for title in ("primeira", "segunda", "terceira"):
        _create(client, auth_headers, title)

    titles = [t["title"] for t in client.get("/tasks/",
                                             headers=auth_headers).json()]

    assert titles == ["terceira", "segunda", "primeira"]


def test_listar_inclui_os_colaboradores_de_cada_task(
    client, auth_headers, team
):
    _create(client, auth_headers, "com", collaborators=[team["ana"]])
    _create(client, auth_headers, "sem")

    by_title = {t["title"]: t for t in client.get("/tasks/",
                                                  headers=auth_headers).json()}

    assert [c["username"] for c in by_title["com"]["collaborators"]] == ["ana"]
    assert by_title["sem"]["collaborators"] == []


# GET /tasks/{id}
def test_detalhar_task_retorna_colaboradores(client, auth_headers, team):
    created = _create(
        client, auth_headers, "Detalhe",
        collaborators=[team["carla"], team["ana"]],
        description="texto",
    )

    response = client.get(f"/tasks/{created['id']}", headers=auth_headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == created
    assert [c["username"] for c in response.json()["collaborators"]] == [
        "ana", "carla"
    ]


def test_detalhar_task_de_outro_gestor_retorna_404(
    client, auth_headers, other_manager
):
    foreign = _create(client, other_manager["headers"], "do outro")

    response = client.get(f"/tasks/{foreign['id']}", headers=auth_headers)

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_task_de_outro_gestor_e_indistinguivel_de_inexistente(
    client, auth_headers, other_manager
):
    foreign = _create(client, other_manager["headers"], "do outro")

    foreign_resp = client.get(f"/tasks/{foreign['id']}", headers=auth_headers)
    ghost_resp = client.get(f"/tasks/{uuid.uuid7()}", headers=auth_headers)

    assert foreign_resp.status_code == ghost_resp.status_code == 404
    assert foreign_resp.json() == ghost_resp.json()


def test_detalhar_com_id_invalido_retorna_422(client, auth_headers):
    response = client.get("/tasks/nao-e-uuid", headers=auth_headers)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# PUT /tasks/{id}
def test_atualizar_titulo_descricao_e_colaboradores(
    client, auth_headers, team
):
    task = _create(client, auth_headers, "antigo", collaborators=[team["ana"]])

    response = client.put(
        f"/tasks/{task['id']}",
        json={
            "title": "novo",
            "description": "nova descrição",
            "collaborator_ids": _ids(team["bruno"], team["carla"]),
        },
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK

    body = response.json()

    assert body["id"] == task["id"]
    assert body["title"] == "novo"
    assert body["description"] == "nova descrição"
    assert [c["username"] for c in body["collaborators"]] == [
        "bruno", "carla"
    ]
    assert client.get(f"/tasks/{task['id']}",
                      headers=auth_headers).json() == body


def test_atualizacao_parcial_so_altera_o_que_foi_enviado(
    client, auth_headers, team
):
    task = _create(client, auth_headers, "t", collaborators=[team["ana"]],
                   description="mantida")

    body = client.put(f"/tasks/{task['id']}", json={"title": "renomeada"},
                      headers=auth_headers).json()

    assert body["title"] == "renomeada"
    assert body["description"] == "mantida"
    assert [c["username"] for c in body["collaborators"]] == ["ana"]


def test_atualizar_com_lista_vazia_remove_todos_os_colaboradores(
    client, db, auth_headers, team
):
    task = _create(client, auth_headers, "t",
                   collaborators=[team["ana"], team["bruno"]])

    body = client.put(f"/tasks/{task['id']}", json={"collaborator_ids": []},
                      headers=auth_headers).json()

    assert body["collaborators"] == []
    assert _assignments(db) == 0
    assert _count(db, models.User) == 3  # os colaboradores permanecem


def test_atualizar_descricao_nula_ou_em_branco_limpa_o_campo(
    client, auth_headers
):
    task = _create(client, auth_headers, "t", description="algo")

    for value in (None, "   "):
        client.put(f"/tasks/{task['id']}", json={"description": "texto"},
                   headers=auth_headers)
        body = client.put(f"/tasks/{task['id']}", json={"description": value},
                          headers=auth_headers).json()

        assert body["description"] is None


def test_atualizar_com_corpo_vazio_nao_altera_nada(client, auth_headers, team):
    task = _create(client, auth_headers, "t", collaborators=[team["ana"]])

    response = client.put(f"/tasks/{task['id']}", json={},
                          headers=auth_headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["title"] == "t"
    assert len(response.json()["collaborators"]) == 1


def test_trocar_so_os_colaboradores_atualiza_updated_at(
    client, db, auth_headers, team
):
    task = _create(client, auth_headers, "t", collaborators=[team["ana"]])
    stored = db.get(models.Task, uuid.UUID(task["id"]))
    stored.updated_at = datetime(2000, 1, 1)
    db.commit()

    client.put(f"/tasks/{task['id']}",
               json={"collaborator_ids": _ids(team["bruno"])},
               headers=auth_headers)
    db.expire_all()

    assert db.get(models.Task, uuid.UUID(task["id"])).updated_at.year > 2000


@pytest.mark.parametrize(
    "payload",
    [
        {"title": ""},
        {"title": "   "},
        {"title": None},
        {"title": "x" * 201},
        {"collaborator_ids": None},
        {"collaborator_ids": ["nao-e-uuid"]},
    ],
)
def test_atualizar_valida_entrada_e_nao_altera(
    client, auth_headers, team, payload
):
    task = _create(client, auth_headers, "original",
                   collaborators=[team["ana"]])

    response = client.put(f"/tasks/{task['id']}", json=payload,
                          headers=auth_headers)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert client.get(f"/tasks/{task['id']}",
                      headers=auth_headers).json() == task


def test_atualizar_com_colaborador_invalido_nao_altera_nada(
    client, auth_headers, team, other_team
):
    """Título válido + colaborador inválido: nenhum dos dois é aplicado."""
    task = _create(client, auth_headers, "original",
                   collaborators=[team["ana"]])

    response = client.put(
        f"/tasks/{task['id']}",
        json={
            "title": "não deve valer",
            "collaborator_ids": _ids(team["bruno"], other_team["diego"]),
        },
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert client.get(f"/tasks/{task['id']}",
                      headers=auth_headers).json() == task


def test_atualizar_task_de_outro_gestor_retorna_404_e_nao_altera(
    client, auth_headers, other_manager
):
    foreign = _create(client, other_manager["headers"], "do outro")

    response = client.put(
        f"/tasks/{foreign['id']}",
        json={"title": "invadida"},
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert client.get(f"/tasks/{foreign['id']}",
                      headers=other_manager["headers"]).json() == foreign


def test_atualizar_task_inexistente_retorna_404(client, auth_headers):
    response = client.put(f"/tasks/{uuid.uuid7()}", json={"title": "x"},
                          headers=auth_headers)

    assert response.status_code == status.HTTP_404_NOT_FOUND


# DELETE /tasks/{id}
def test_excluir_task_remove_task_e_vinculos_mas_nao_os_colaboradores(
    client, db, auth_headers, team
):
    doomed = _create(client, auth_headers, "doomed",
                     collaborators=[team["ana"], team["bruno"]])
    kept = _create(client, auth_headers, "kept", collaborators=[team["ana"]])

    response = client.delete(f"/tasks/{doomed['id']}", headers=auth_headers)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert response.content == b""
    assert client.get(f"/tasks/{doomed['id']}",
                      headers=auth_headers).status_code == 404
    assert [t["id"] for t in client.get("/tasks/",
                                        headers=auth_headers).json()] == [
        kept["id"]
    ]
    assert _assignments(db) == 1  # só o vínculo da task que ficou
    assert _count(db, models.User) == 3


def test_excluir_task_de_outro_gestor_retorna_404_e_preserva(
    client, auth_headers, other_manager
):
    foreign = _create(client, other_manager["headers"], "do outro")

    response = client.delete(f"/tasks/{foreign['id']}", headers=auth_headers)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert client.get(f"/tasks/{foreign['id']}",
                      headers=other_manager["headers"]).status_code == 200


def test_excluir_duas_vezes_retorna_404_na_segunda(client, auth_headers):
    task = _create(client, auth_headers, "t")

    first = client.delete(f"/tasks/{task['id']}", headers=auth_headers)
    second = client.delete(f"/tasks/{task['id']}", headers=auth_headers)

    assert first.status_code == status.HTTP_204_NO_CONTENT
    assert second.status_code == status.HTTP_404_NOT_FOUND


def test_excluir_task_inexistente_retorna_404(client, auth_headers):
    response = client.delete(f"/tasks/{uuid.uuid7()}", headers=auth_headers)

    assert response.status_code == status.HTTP_404_NOT_FOUND


# Autenticação
@pytest.mark.parametrize(
    "method, path, body",
    [
        ("post", "/tasks/", {"title": "x"}),
        ("get", "/tasks/", None),
        ("get", f"/tasks/{uuid.uuid7()}", None),
        ("put", f"/tasks/{uuid.uuid7()}", {"title": "x"}),
        ("delete", f"/tasks/{uuid.uuid7()}", None),
    ],
)
@pytest.mark.parametrize(
    "headers",
    [{}, {"Authorization": "Bearer token-invalido"}],
    ids=["sem-token", "token-invalido"],
)
def test_todas_as_rotas_de_tasks_exigem_token_valido(
    client, db, method, path, body, headers
):
    response = client.request(method, path, json=body, headers=headers)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# Documentação
def test_openapi_documenta_as_rotas_de_tasks(client):
    schema = client.get("/openapi.json").json()

    assert {"/tasks/", "/tasks/{task_id}"} <= schema["paths"].keys()
    assert schema["paths"]["/tasks/"]["post"]["security"]
    assert {"TaskCreate", "TaskUpdate", "TaskResponse"} <= (
        schema["components"]["schemas"].keys()
    )


PROTECTED_GET = [
    "/dashboard/summary?date=2026-01-01",
    "/dashboard/export/csv?date=2026-01-01",
    "/dashboard/export/pdf?date=2026-01-01",
    "/users/",
    "/tasks/",
    "/activities/realtime",
]
ACTIVITY_BODY = {"hostname": "PC-01", "process_name": "code.exe"}


def _bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _agent(user) -> dict:
    return _bearer(security.create_agent_token(user.id))


def _log(db, user, process="code.exe", at=None, duration=60):
    entry = models.ActivityLog(
        user_id=user.id,
        hostname="PC",
        process_name=process,
        duration_seconds=duration,
        captured_at=at or datetime.now(timezone.utc),
    )

    db.add(entry)
    db.commit()

    return entry


def _usernames(response) -> set[str]:
    body = response.json()
    rows = body["users"] if isinstance(body, dict) else body

    return {row["username"] for row in rows}


@pytest.fixture()
def today():
    return datetime.now(timezone.utc).date()


@pytest.fixture()
def seeded(db, team, other_team, orphan):
    """Uma leitura recente para cada colaborador, incluindo o sem gestor"""
    for user in (*team.values(), *other_team.values(), orphan):
        _log(db, user)


# 401 sem token ou com token inválido
@pytest.mark.parametrize("path", PROTECTED_GET)
def test_rotas_de_gestor_sem_token_retornam_401(client, path):
    assert client.get(path).status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.parametrize("path", PROTECTED_GET)
@pytest.mark.parametrize("header", [
    "Bearer lixo",
    "Basic abc",
    "Bearer ",
])
def test_rotas_de_gestor_com_token_invalido_retornam_401(
    client, path, header
):
    response = client.get(path, headers={"Authorization": header})

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_enviar_atividade_sem_token_retorna_401_e_nao_grava(
    client, db
):
    response = client.post("/activities/", json=ACTIVITY_BODY)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert _count(db, models.ActivityLog) == 0


def test_enviar_atividade_com_token_invalido_retorna_401(client, db):
    response = client.post(
        "/activities/", json=ACTIVITY_BODY, headers=_bearer("lixo")
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# Separação entre os tokens
@pytest.mark.parametrize("path", PROTECTED_GET)
def test_token_de_agente_nao_acessa_rotas_do_gestor(
    client, team, path
):
    response = client.get(path, headers=_agent(team["ana"]))

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_token_de_gestor_nao_envia_atividades(
    client, db, auth_headers
):
    response = client.post(
        "/activities/", json=ACTIVITY_BODY, headers=auth_headers
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert _count(db, models.ActivityLog) == 0


def test_token_de_agente_expirado_retorna_401(client, team):
    token = security.create_agent_token(
        team["ana"].id, timedelta(seconds=-5)
    )

    response = client.post(
        "/activities/", json=ACTIVITY_BODY, headers=_bearer(token)
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_agente_sem_gestor_retorna_401(client, db, orphan):
    response = client.post(
        "/activities/", json=ACTIVITY_BODY, headers=_agent(orphan)
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert _count(db, models.ActivityLog) == 0


def test_agente_removido_perde_o_acesso_mesmo_com_token_valido(
    client, db, team
):
    headers = _agent(team["ana"])

    db.delete(team["ana"])
    db.commit()

    response = client.post("/activities/", json=ACTIVITY_BODY, headers=headers)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_token_do_agente_sobrevive_ao_login_do_gestor(
    client, team
):
    """O token do gestor não interfere nas associações/tokens dos agentes"""
    headers = _agent(team["ana"])

    client.post(
        "/auth/login",
        json={"email": "gestor@example.com", "password": MANAGER_PASSWORD},
    )

    assert (
        client.post("/activities/", json=ACTIVITY_BODY, headers=headers)
        .status_code == status.HTTP_201_CREATED
    )


# Atividade vinculada ao colaborador autenticado
def test_atividade_e_gravada_no_dono_do_token(client, db, team):
    response = client.post(
        "/activities/", json=ACTIVITY_BODY, headers=_agent(team["bruno"])
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["user_id"] == str(team["bruno"].id)
    assert db.query(models.ActivityLog).one().user_id == team["bruno"].id


def test_username_do_corpo_e_ignorado(client, db, team, other_team):
    """Com o token da ana, dizer que é o diego não grava no diego"""
    response = client.post(
        "/activities/",
        json={**ACTIVITY_BODY, "username": "diego"},
        headers=_agent(team["ana"]),
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["user_id"] == str(team["ana"].id)
    assert db.query(models.ActivityLog).filter_by(
        user_id=other_team["diego"].id
    ).count() == 0


def test_username_inexistente_no_corpo_nao_cria_usuario(client, db, team):
    users_before = _count(db, models.User)

    response = client.post(
        "/activities/",
        json={**ACTIVITY_BODY, "username": "invasor"},
        headers=_agent(team["ana"]),
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert _count(db, models.User) == users_before


def test_atividade_categoriza_e_aceita_corpo_sem_username(client, team):
    response = client.post(
        "/activities/",
        json={**ACTIVITY_BODY, "window_title": "x", "duration_seconds": 10},
        headers=_agent(team["ana"]),
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["duration_seconds"] == 10


# Isolamento entre gestores
def test_users_retorna_somente_a_equipe_do_gestor(
    client, auth_headers, other_manager
):
    mine = client.get("/users/", headers=auth_headers)
    theirs = client.get("/users/", headers=other_manager["headers"])

    assert _usernames(mine) == {"ana", "bruno", "carla"}
    assert _usernames(theirs) == {"diego", "elisa"}


def test_users_de_gestor_sem_equipe_retorna_lista_vazia(
    client, auth_headers
):
    response = client.get("/users/", headers=auth_headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_realtime_retorna_somente_a_equipe_do_gestor(
    client, auth_headers, other_manager
):
    mine = client.get("/activities/realtime", headers=auth_headers)
    theirs = client.get(
        "/activities/realtime", headers=other_manager["headers"]
    )

    assert _usernames(mine) == {"ana", "bruno", "carla"}
    assert _usernames(theirs) == {"diego", "elisa"}


def test_realtime_nao_mostra_colaborador_sem_gestor(
    client, auth_headers, other_manager
):
    for headers in (auth_headers, other_manager["headers"]):
        response = client.get("/activities/realtime", headers=headers)

        assert "sem-gestor" not in _usernames(response)


def test_summary_retorna_somente_a_equipe_do_gestor(
    client, auth_headers, other_manager, today
):
    url = f"/dashboard/summary?date={today.isoformat()}"
    mine = client.get(url, headers=auth_headers)
    theirs = client.get(url, headers=other_manager["headers"])

    assert _usernames(mine) == {"ana", "bruno", "carla"}
    assert _usernames(theirs) == {"diego", "elisa"}


def test_summary_com_filtro_de_colaborador_de_outra_equipe_vem_vazio(
    client, auth_headers, today
):
    response = client.get(
        f"/dashboard/summary?date={today.isoformat()}&username=diego",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["users"] == []


def test_summary_com_filtro_do_proprio_colaborador_funciona(
    client, auth_headers, today
):
    response = client.get(
        f"/dashboard/summary?date={today.isoformat()}&username=ana",
        headers=auth_headers,
    )

    assert _usernames(response) == {"ana"}


def test_summary_soma_apenas_a_equipe(
    client, db, team, other_team, auth_headers, today
):
    _log(db, team["ana"], duration=100)
    _log(db, team["bruno"], duration=50)
    _log(db, other_team["diego"], duration=9999)

    users = client.get(
        f"/dashboard/summary?date={today.isoformat()}", headers=auth_headers
    ).json()["users"]

    assert sum(u["total_seconds"] for u in users) == 150


def test_exportacao_csv_contem_somente_a_equipe(
    client, auth_headers, today
):
    response = client.get(
        f"/dashboard/export/csv?date={today.isoformat()}",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert "ana" in response.text
    assert "diego" not in response.text
    assert "elisa" not in response.text
    assert "sem-gestor" not in response.text


def test_exportacao_pdf_funciona_para_o_gestor_autenticado(
    client, auth_headers, today
):
    response = client.get(
        f"/dashboard/export/pdf?date={today.isoformat()}",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_atividade_enviada_pelo_agente_aparece_so_para_o_gestor_dele(
    client, team, auth_headers, other_manager
):
    client.post(
        "/activities/", json=ACTIVITY_BODY, headers=_agent(team["carla"])
    )

    mine = client.get("/activities/realtime", headers=auth_headers)
    theirs = client.get(
        "/activities/realtime", headers=other_manager["headers"]
    )

    assert _usernames(mine) == {"carla"}
    assert theirs.json() == []


# Documentação
def test_openapi_documenta_401_nas_rotas_protegidas(client):
    schema = client.get("/openapi.json").json()["paths"]

    for path, method in [
        ("/dashboard/summary", "get"),
        ("/users/", "get"),
        ("/activities/", "post"),
        ("/activities/realtime", "get"),
    ]:
        operation = schema[path][method]

        assert operation["security"], path
        assert "401" in operation["responses"], path

    assert not schema["/collaborators/associate"]["post"].get("security")

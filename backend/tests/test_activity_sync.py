import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import status
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import crud, models, security
from app.schema_upgrades import apply_schema_upgrades

from .conftest import MANAGER_PASSWORD

URL = "/activities/sync"
T0 = datetime(2026, 11, 20, 13, 0, 0, tzinfo=timezone.utc)


# Fixtures e helpers
@pytest.fixture()
def manager(client, registered_manager):
    return registered_manager


@pytest.fixture()
def collaborator(db, manager):
    user = models.User(
        username="ana",
        machine_name="PC-ANA",
        manager_id=uuid.UUID(manager["id"]),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def _headers(user) -> dict:
    return {
        "Authorization": f"Bearer {security.create_agent_token(user.id)}"
    }


def _item(minutes=0, process="code.exe", host="PC-ANA", **extra) -> dict:
    started = T0 + timedelta(minutes=minutes)

    return {
        "client_id": str(uuid.uuid4()),
        "hostname": host,
        "process_name": process,
        "scope": "in_scope",
        "started_at": started.isoformat(),
        "ended_at": (started + timedelta(seconds=90)).isoformat(),
        **extra,
    }


def _sync(client, user, *items):
    return client.post(
        URL, json={"activities": list(items)}, headers=_headers(user)
    )


def _count(db) -> int:
    db.expire_all()

    return db.query(models.ActivityLog).count()


def _task(db, manager_id, title="Task") -> models.Task:
    task = models.Task(manager_id=uuid.UUID(str(manager_id)), title=title)

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


# Autenticação (HTTP 401)
def test_sem_token_retorna_401_e_nao_persiste(client, db, collaborator):
    response = client.post(URL, json={"activities": [_item()]})

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert _count(db) == 0


@pytest.mark.parametrize("token", ["lixo", "", "a.b.c"])
def test_token_invalido_retorna_401(client, db, collaborator, token):
    response = client.post(
        URL,
        json={"activities": [_item()]},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert _count(db) == 0


def test_token_de_gestor_retorna_401(client, db, collaborator, manager):
    token = security.create_access_token(manager["id"])

    response = client.post(
        URL,
        json={"activities": [_item()]},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert _count(db) == 0


def test_token_de_agente_expirado_retorna_401(client, db, collaborator):
    token = security.create_agent_token(
        collaborator.id, timedelta(seconds=-5)
    )

    response = client.post(
        URL,
        json={"activities": [_item()]},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert _count(db) == 0


def test_colaborador_sem_gestor_retorna_401(client, db):
    orphan = models.User(username="sem-gestor")

    db.add(orphan)
    db.commit()
    db.refresh(orphan)

    assert _sync(client, orphan, _item()).status_code == 401
    assert _count(db) == 0


def test_token_de_colaborador_inexistente_retorna_401(client, db):
    ghost = models.User(id=uuid.uuid7(), username="fantasma")

    assert _sync(client, ghost, _item()).status_code == 401


def test_autenticacao_vem_antes_da_validacao_do_corpo(client, db):
    response = client.post(URL, json={"activities": []})

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# Sucesso
def test_grava_registro_completo_no_dono_do_token(
    client, db, manager, collaborator
):
    task = _task(db, manager["id"])
    item = _item(
        task_id=str(task.id),
        scope="out_of_scope",
        window_title="  YouTube  ",
    )

    response = _sync(client, collaborator, item)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "confirmed_ids": [item["client_id"]],
        "created": 1,
        "duplicates": 0,
        "rejected": [],
    }

    row = db.query(models.ActivityLog).one()

    assert row.user_id == collaborator.id
    assert row.task_id == task.id
    assert row.scope == "out_of_scope"
    assert row.hostname == "PC-ANA"
    assert row.process_name == "code.exe"
    assert row.window_title == "YouTube"
    assert row.duration_seconds == 90
    assert row.is_idle is False
    assert crud._as_utc(row.started_at) == T0
    assert crud._as_utc(row.ended_at) == T0 + timedelta(seconds=90)
    assert crud._as_utc(row.captured_at) == T0 + timedelta(seconds=90)


def test_task_e_opcional(client, db, collaborator):
    response = _sync(client, collaborator, _item())

    assert response.status_code == status.HTTP_200_OK
    assert db.query(models.ActivityLog).one().task_id is None


def test_lote_com_varios_registros_confirma_todos_na_ordem(
    client, db, collaborator
):
    items = [_item(minutes=i, process=f"app{i}.exe") for i in range(5)]

    body = _sync(client, collaborator, *items).json()

    assert body["confirmed_ids"] == [i["client_id"] for i in items]
    assert body["created"] == 5
    assert _count(db) == 5


def test_instante_em_outro_fuso_e_normalizado_para_utc(
    client, db, collaborator
):
    item = _item()
    item["started_at"] = "2026-11-20T10:00:00-03:00"  # == 13:00 UTC
    item["ended_at"] = "2026-11-20T10:01:30-03:00"

    assert _sync(client, collaborator, item).status_code == 200

    row = db.query(models.ActivityLog).one()

    assert crud._as_utc(row.started_at) == T0


def test_duracao_e_derivada_da_janela_e_nao_do_cliente(
    client, db, collaborator
):
    item = _item(duration_seconds=99999)

    _sync(client, collaborator, item)

    assert db.query(models.ActivityLog).one().duration_seconds == 90


def test_registro_sincronizado_e_categorizado_pelas_regras(
    client, db, collaborator
):
    category = models.Category(name="Desenvolvimento")

    db.add(category)
    db.flush()
    db.add(models.CategorizationRule(
        category_id=category.id, keyword="code", match_field="process"
    ))
    db.commit()

    _sync(client, collaborator, _item(process="Code.exe"))

    assert db.query(models.ActivityLog).one().category_id == category.id


def test_registro_sincronizado_aparece_no_painel_em_tempo_real(
    client, db, auth_headers, collaborator
):
    now = datetime.now(timezone.utc).replace(microsecond=0)
    item = _item()
    item["started_at"] = (now - timedelta(seconds=30)).isoformat()
    item["ended_at"] = now.isoformat()

    _sync(client, collaborator, item)

    entries = client.get("/activities/realtime", headers=auth_headers).json()

    assert [e["username"] for e in entries] == ["ana"]
    assert entries[0]["process_name"] == "code.exe"
    assert entries[0]["status"] == "online"


# Idempotência / deduplicação
def test_reenviar_o_mesmo_lote_nao_duplica_linhas(client, db, collaborator):
    items = [_item(minutes=i) for i in range(3)]

    first = _sync(client, collaborator, *items).json()
    second = _sync(client, collaborator, *items)

    assert second.status_code == status.HTTP_200_OK

    body = second.json()

    assert first["created"] == 3
    assert body["created"] == 0
    assert body["duplicates"] == 3
    # Mesmo reenvio continua confirmando os IDs (o Agente os marca como
    # sincronizados mesmo que a resposta anterior tenha se perdido)
    assert body["confirmed_ids"] == [i["client_id"] for i in items]
    assert _count(db) == 3


def test_reenvio_parcial_grava_so_o_que_falta(client, db, collaborator):
    old = [_item(minutes=i) for i in range(2)]
    new = [_item(minutes=10)]

    _sync(client, collaborator, *old)

    body = _sync(client, collaborator, *old, *new).json()

    assert body["created"] == 1
    assert body["duplicates"] == 2
    assert len(body["confirmed_ids"]) == 3
    assert _count(db) == 3


def test_duplicado_no_mesmo_lote_e_gravado_uma_vez(client, db, collaborator):
    a = _item()
    b = {**_item(), "started_at": a["started_at"],
         "ended_at": a["ended_at"]}

    body = _sync(client, collaborator, a, b).json()

    assert body["created"] == 1
    assert body["duplicates"] == 1
    assert set(body["confirmed_ids"]) == {a["client_id"], b["client_id"]}
    assert _count(db) == 1


def test_duplicado_com_outro_client_id_mantem_o_registro_original(
    client, db, collaborator
):
    original = _item()
    retry = {
        **original,
        "client_id": str(uuid.uuid4()),
        "scope": "out_of_scope",
        "ended_at": (T0 + timedelta(minutes=30)).isoformat(),
    }

    _sync(client, collaborator, original)

    body = _sync(client, collaborator, retry).json()

    assert body["duplicates"] == 1
    assert body["confirmed_ids"] == [retry["client_id"]]

    row = db.query(models.ActivityLog).one()

    assert row.scope == "in_scope"
    assert row.duration_seconds == 90


def test_duplicado_com_mesmo_instante_em_outro_fuso(client, db, collaborator):
    a = _item()
    b = {
        **a,
        "client_id": str(uuid.uuid4()),
        "started_at": "2026-11-20T10:00:00-03:00",
        "ended_at": "2026-11-20T10:01:30-03:00",
    }

    _sync(client, collaborator, a)

    assert _sync(client, collaborator, b).json()["duplicates"] == 1
    assert _count(db) == 1


@pytest.mark.parametrize(
    "change",
    [
        {"process_name": "chrome.exe"},
        {"hostname": "OUTRA-MAQUINA"},
        {"started_at": (T0 + timedelta(seconds=1)).isoformat(),
         "ended_at": (T0 + timedelta(seconds=91)).isoformat()},
    ],
    ids=["processo", "maquina", "inicio"],
)
def test_chave_diferente_nao_e_duplicado(client, db, collaborator, change):
    base = _item()
    other = {**base, "client_id": str(uuid.uuid4()), **change}

    _sync(client, collaborator, base)

    body = _sync(client, collaborator, other).json()

    assert body["created"] == 1
    assert body["duplicates"] == 0
    assert _count(db) == 2


def test_mesma_chave_em_colaboradores_diferentes_nao_colide(
    client, db, manager, collaborator
):
    bruno = models.User(
        username="bruno", manager_id=uuid.UUID(manager["id"])
    )

    db.add(bruno)
    db.commit()
    db.refresh(bruno)

    item = _item()

    assert _sync(client, collaborator, item).json()["created"] == 1
    assert _sync(client, bruno, item).json()["created"] == 1
    assert _count(db) == 2


def test_leituras_avulsas_sem_started_at_nao_colidem_no_indice(
    client, db, collaborator
):
    body = {"hostname": "PC-ANA", "process_name": "code.exe"}

    for _ in range(3):
        response = client.post(
            "/activities/", json=body, headers=_headers(collaborator)
        )

        assert response.status_code == status.HTTP_201_CREATED

    assert _count(db) == 3


def test_banco_impede_duplicata_mesmo_fora_da_api(db, collaborator):
    def add():
        db.add(models.ActivityLog(
            user_id=collaborator.id,
            hostname="PC-ANA",
            process_name="code.exe",
            started_at=T0,
            ended_at=T0 + timedelta(seconds=5),
        ))
        db.commit()

    add()

    with pytest.raises(IntegrityError):
        add()

    db.rollback()


def test_corrida_entre_lotes_simultaneos_nao_duplica_nem_falha(
    client, db, collaborator, monkeypatch
):
    """
    Outro lote grava o mesmo registro entre a consulta de existentes e o
    commit: o índice único barra, o lote refaz a consulta e conclui
    """
    item = _item()
    real = crud._existing_dedup_keys
    state = {"calls": 0}

    def racy(session, user_id, started_ats):
        state["calls"] += 1

        if state["calls"] == 1:
            # Concorrente grava o registro depois desta consulta (vazia).
            # Usa um engine próprio, descartado em seguida: uma conexão
            # extra no pool compartilhado ficaria com o schema do SQLite em
            # cache e quebraria testes de reflexão que rodam depois
            other_engine = create_engine(str(session.get_bind().url))

            try:
                with Session(other_engine) as concurrent:
                    concurrent.add(models.ActivityLog(
                        user_id=user_id, hostname="PC-ANA",
                        process_name="code.exe", started_at=T0,
                        ended_at=T0 + timedelta(seconds=90),
                    ))
                    concurrent.commit()
            finally:
                other_engine.dispose()

            return set()

        return real(session, user_id, started_ats)

    monkeypatch.setattr(crud, "_existing_dedup_keys", racy)

    response = _sync(client, collaborator, item)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["created"] == 0
    assert response.json()["duplicates"] == 1
    assert response.json()["confirmed_ids"] == [item["client_id"]]
    assert _count(db) == 1


def test_conflito_persistente_retorna_409_sem_confirmar(
    client, db, collaborator, monkeypatch
):
    monkeypatch.setattr(
        crud, "_existing_dedup_keys", lambda *_args: set()
    )
    # Com a consulta de existentes "cega", o segundo lote tenta gravar a
    # mesma chave em todas as tentativas e esgota o limite
    _sync(client, collaborator, _item())

    response = _sync(client, collaborator, _item())

    assert response.status_code == status.HTTP_409_CONFLICT
    assert "confirmed_ids" not in response.text
    assert _count(db) == 1


# Task e escopo
def test_task_de_outro_gestor_e_rejeitada_sem_travar_o_resto(
    client, db, manager, collaborator
):
    other = client.post(
        "/auth/register",
        json={"email": "outro@example.com", "password": MANAGER_PASSWORD},
    ).json()
    foreign = _task(db, other["id"], "alheia")
    own = _task(db, manager["id"], "minha")

    bad = _item(minutes=0, task_id=str(foreign.id))
    good = _item(minutes=1, task_id=str(own.id))
    missing = _item(minutes=2, task_id=str(uuid.uuid4()))

    body = _sync(client, collaborator, bad, good, missing).json()

    assert body["confirmed_ids"] == [good["client_id"]]
    assert body["created"] == 1
    assert body["rejected"] == [
        {"client_id": bad["client_id"], "reason": "task_not_found"},
        {"client_id": missing["client_id"], "reason": "task_not_found"},
    ]
    assert db.query(models.ActivityLog).one().task_id == own.id


def test_lote_so_com_rejeitados_nao_grava_nada(
    client, db, collaborator
):
    item = _item(task_id=str(uuid.uuid4()))

    response = _sync(client, collaborator, item)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["confirmed_ids"] == []
    assert response.json()["created"] == 0
    assert _count(db) == 0


def test_apagar_a_task_preserva_o_registro(client, db, manager, collaborator):
    task = _task(db, manager["id"])

    _sync(client, collaborator, _item(task_id=str(task.id)))

    db.delete(task)
    db.commit()

    assert _count(db) == 1


# Validação (422): nada é persistido
def _invalid_cases():
    base = _item()

    def without(key):
        return {k: v for k, v in base.items() if k != key}

    naive = {**base, "started_at": "2026-11-20T13:00:00",
             "ended_at": "2026-11-20T13:01:00"}
    reversed_ = {**base, "ended_at": (T0 - timedelta(seconds=1)).isoformat()}

    return {
        "scope_invalido": {**base, "scope": "talvez"},
        "scope_ausente": without("scope"),
        "client_id_ausente": without("client_id"),
        "client_id_invalido": {**base, "client_id": "123"},
        "processo_vazio": {**base, "process_name": "   "},
        "host_com_controle": {**base, "hostname": "a\nb"},
        "inicio_sem_fuso": naive,
        "fim_antes_do_inicio": reversed_,
        "task_id_invalido": {**base, "task_id": "x"},
        "processo_longo": {**base, "process_name": "x" * 256},
    }


@pytest.mark.parametrize(
    "item", list(_invalid_cases().values()), ids=list(_invalid_cases())
)
def test_item_invalido_retorna_422_sem_persistir(
    client, db, collaborator, item
):
    valid = _item(minutes=5)

    response = _sync(client, collaborator, valid, item)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert _count(db) == 0


def test_lote_vazio_ou_ausente_retorna_422(client, db, collaborator):
    for body in ({"activities": []}, {}, {"activities": None}):
        response = client.post(
            URL, json=body, headers=_headers(collaborator)
        )

        assert response.status_code == 422


def test_lote_acima_do_limite_retorna_422(client, db, collaborator):
    from app import schemas

    items = [
        _item(minutes=i) for i in range(schemas.ACTIVITY_SYNC_MAX_ITEMS + 1)
    ]

    assert _sync(client, collaborator, *items).status_code == 422
    assert _count(db) == 0


def test_lote_no_limite_e_aceito(client, db, collaborator):
    from app import schemas

    items = [
        _item(minutes=i) for i in range(schemas.ACTIVITY_SYNC_MAX_ITEMS)
    ]

    body = _sync(client, collaborator, *items).json()

    assert body["created"] == schemas.ACTIVITY_SYNC_MAX_ITEMS


def test_client_id_repetido_no_lote_retorna_422(client, db, collaborator):
    item = _item()
    other = {**_item(minutes=5), "client_id": item["client_id"]}

    assert _sync(client, collaborator, item, other).status_code == 422
    assert _count(db) == 0


def test_username_do_corpo_e_ignorado(client, db, manager, collaborator):
    bruno = models.User(
        username="bruno", manager_id=uuid.UUID(manager["id"])
    )

    db.add(bruno)
    db.commit()

    _sync(client, collaborator, _item(username="bruno"))

    assert db.query(models.ActivityLog).one().user_id == collaborator.id


# Documentação e migração
def test_openapi_documenta_a_rota_de_sincronizacao(client):
    operation = client.get("/openapi.json").json()["paths"][URL]["post"]

    assert {"200", "401", "409", "422"} <= set(operation["responses"])
    assert operation["security"]


def test_migracao_adiciona_colunas_e_indice_preservando_dados(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")

    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE managers (id CHAR(32) PRIMARY KEY)"))
        conn.execute(text("CREATE TABLE tasks (id CHAR(32) PRIMARY KEY)"))
        conn.execute(text(
            "CREATE TABLE users (id CHAR(32) PRIMARY KEY, "
            "username VARCHAR(150) NOT NULL)"
        ))
        conn.execute(text(
            "CREATE TABLE activity_logs (id CHAR(32) PRIMARY KEY, "
            "user_id CHAR(32) NOT NULL, hostname VARCHAR(150) NOT NULL, "
            "process_name VARCHAR(255) NOT NULL)"
        ))
        # Duas linhas antigas iguais: NULL em started_at não pode colidir
        conn.execute(text(
            "INSERT INTO activity_logs VALUES ('a', 'u', 'pc', 'code')"
        ))
        conn.execute(text(
            "INSERT INTO activity_logs VALUES ('b', 'u', 'pc', 'code')"
        ))

    apply_schema_upgrades(engine)
    apply_schema_upgrades(engine)  # idempotente

    inspector = inspect(engine)

    assert {"task_id", "scope", "started_at", "ended_at"} <= {
        c["name"] for c in inspector.get_columns("activity_logs")
    }
    assert "uq_activity_dedup" in {
        i["name"] for i in inspector.get_indexes("activity_logs")
    }

    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM activity_logs"))

        assert count.scalar() == 2

    engine.dispose()


def test_migracao_ignora_banco_sem_a_tabela(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'empty.db'}")

    apply_schema_upgrades(engine)

    assert "activity_logs" not in inspect(engine).get_table_names()

    engine.dispose()

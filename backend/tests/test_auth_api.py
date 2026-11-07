import uuid
from datetime import timedelta

import pytest
from fastapi import APIRouter, Depends, FastAPI, status
from fastapi.testclient import TestClient

from app import crud, models, security

from .conftest import MANAGER_EMAIL, MANAGER_PASSWORD


# POST /auth/register
def test_register_cria_gestor_e_armazena_hash_da_senha(client, db):
    response = client.post(
        "/auth/register",
        json={"email": MANAGER_EMAIL, "password": MANAGER_PASSWORD},
    )

    assert response.status_code == status.HTTP_201_CREATED

    body = response.json()

    assert body["email"] == MANAGER_EMAIL
    assert uuid.UUID(body["id"]).version == 7
    assert "password" not in body and "password_hash" not in body

    stored = db.query(models.Manager).one()

    assert stored.password_hash != MANAGER_PASSWORD
    assert MANAGER_PASSWORD not in stored.password_hash
    assert security.verify_password(MANAGER_PASSWORD, stored.password_hash)


def test_register_normaliza_email_para_minusculas(client, db):
    response = client.post(
        "/auth/register",
        json={
            "email": "  Gestor.Maiusculo@Example.COM ",
            "password": MANAGER_PASSWORD,
        },
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["email"] == "gestor.maiusculo@example.com"


def test_register_rejeita_email_duplicado(client, registered_manager):
    response = client.post(
        "/auth/register",
        json={"email": MANAGER_EMAIL, "password": "outra-senha-123"},
    )

    assert response.status_code == status.HTTP_409_CONFLICT


def test_register_rejeita_email_duplicado_ignorando_caixa(
    client, registered_manager
):
    response = client.post(
        "/auth/register",
        json={"email": MANAGER_EMAIL.upper(), "password": "outra-senha-123"},
    )

    assert response.status_code == status.HTTP_409_CONFLICT


def test_register_corrida_no_mesmo_email_vira_409(client, db, monkeypatch):
    """Duas requisições passam na checagem prévia; o índice único barra."""
    client.post(
        "/auth/register",
        json={"email": MANAGER_EMAIL, "password": MANAGER_PASSWORD},
    )
    monkeypatch.setattr(crud, "get_manager_by_email", lambda *_: None)

    response = client.post(
        "/auth/register",
        json={"email": MANAGER_EMAIL, "password": "outra-senha-123"},
    )

    assert response.status_code == status.HTTP_409_CONFLICT
    assert db.query(models.Manager).count() == 1


@pytest.mark.parametrize(
    "payload",
    [
        {"email": "nao-e-email", "password": MANAGER_PASSWORD},
        {"email": MANAGER_EMAIL, "password": "curta"},
        {"email": MANAGER_EMAIL, "password": "á" * 40},  # 80 bytes em UTF-8
        {"email": MANAGER_EMAIL},
        {"password": MANAGER_PASSWORD},
    ],
)
def test_register_valida_entrada(client, payload):
    assert (
        client.post("/auth/register", json=payload).status_code
        == status.HTTP_422_UNPROCESSABLE_CONTENT
    )


def test_erro_de_validacao_nao_ecoa_a_senha_enviada(client):
    secret = "curta"

    response = client.post(
        "/auth/register", json={"email": MANAGER_EMAIL, "password": secret}
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert secret not in response.text
    # O restante do erro continua útil ao frontend.
    assert response.json()["detail"][0]["loc"] == ["body", "password"]


def test_erro_de_validacao_de_outros_campos_continua_com_input(client):
    response = client.post(
        "/auth/register",
        json={"email": "nao-e-email", "password": MANAGER_PASSWORD},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert MANAGER_PASSWORD not in response.text


# POST /auth/login
def test_login_valido_retorna_token_jwt(client, registered_manager):
    response = client.post(
        "/auth/login",
        json={"email": MANAGER_EMAIL, "password": MANAGER_PASSWORD},
    )

    assert response.status_code == status.HTTP_200_OK

    body = response.json()

    assert body["token_type"] == "bearer"
    assert body["expires_in"] == security.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    assert (security.decode_access_token(body["access_token"])
            == uuid.UUID(registered_manager["id"]))


def test_login_ignora_caixa_do_email(client, registered_manager):
    response = client.post(
        "/auth/login",
        json={"email": MANAGER_EMAIL.upper(), "password": MANAGER_PASSWORD},
    )

    assert response.status_code == status.HTTP_200_OK


def test_login_com_senha_incorreta_retorna_401_generico(
    client, registered_manager
):
    response = client.post(
        "/auth/login",
        json={"email": MANAGER_EMAIL, "password": "senha-errada-123"},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.headers["www-authenticate"] == "Bearer"
    assert "access_token" not in response.json()


def test_login_com_email_inexistente_e_indistinguivel_de_senha_errada(
    client, registered_manager
):
    wrong_password = client.post(
        "/auth/login",
        json={"email": MANAGER_EMAIL, "password": "senha-errada-123"},
    )
    unknown_email = client.post(
        "/auth/login",
        json={"email": "ninguem@example.com", "password": MANAGER_PASSWORD},
    )

    assert (
        unknown_email.status_code
        == wrong_password.status_code
        == status.HTTP_401_UNAUTHORIZED
    )
    assert unknown_email.json() == wrong_password.json()


def test_login_com_email_inexistente_ainda_executa_verificacao_bcrypt(
    client, db, monkeypatch
):
    """Equaliza o tempo de resposta: não revela quais e-mails existem."""
    calls = []
    real_verify = security.verify_password

    def spy(password, password_hash):
        calls.append(password_hash)
        return real_verify(password, password_hash)

    monkeypatch.setattr(security, "verify_password", spy)

    client.post(
        "/auth/login",
        json={"email": "ninguem@example.com", "password": "qualquer-coisa"},
    )

    assert calls == [security.DUMMY_PASSWORD_HASH]


def test_login_com_senha_acima_de_72_bytes_retorna_401(
    client, registered_manager
):
    response = client.post(
        "/auth/login",
        json={"email": MANAGER_EMAIL, "password": "x" * 200},
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_login_valida_formato_do_corpo(client):
    assert (
        client.post("/auth/login", json={}).status_code
        == status.HTTP_422_UNPROCESSABLE_CONTENT
    )
    assert client.post(
        "/auth/login", json={"email": "x", "password": "y"}
    ).status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# GET /auth/me (rota protegida por get_current_manager)
def test_rota_protegida_aceita_token_valido(client, auth_headers):
    response = client.get("/auth/me", headers=auth_headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["email"] == MANAGER_EMAIL


def test_rota_protegida_sem_token_retorna_401(client, db):
    response = client.get("/auth/me")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize(
    "authorization",
    [
        "Bearer token-invalido",
        "Bearer a.b.c",
        "Bearer ",
        "Basic dXNlcjpwYXNz",
        "token-sem-esquema",
    ],
)
def test_rota_protegida_com_token_invalido_retorna_401(
    client, db, authorization
):
    response = client.get("/auth/me", headers={"Authorization": authorization})

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_rota_protegida_com_token_expirado_retorna_401(
    client, registered_manager
):
    token = security.create_access_token(
        registered_manager["id"], expires_delta=timedelta(seconds=-1)
    )

    response = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_rota_protegida_com_token_de_gestor_inexistente_retorna_401(
    client, db
):
    token = security.create_access_token(uuid.uuid7())

    response = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_dependencia_protege_qualquer_rota_do_app(auth_headers):
    """get_current_manager funciona em rotas fora de /auth (ex.: futuras)."""
    mini_app = FastAPI()

    @mini_app.get("/protegida")
    def protegida(manager=Depends(security.get_current_manager)):
        return {"email": manager.email}

    mini_client = TestClient(mini_app)

    assert (
        mini_client.get("/protegida").status_code
        == status.HTTP_401_UNAUTHORIZED
    )

    ok = mini_client.get("/protegida", headers=auth_headers)

    assert ok.status_code == status.HTTP_200_OK
    assert ok.json() == {"email": MANAGER_EMAIL}


def test_dependencia_pode_proteger_um_router_inteiro(auth_headers):
    mini_app = FastAPI()
    router = APIRouter(dependencies=[Depends(security.get_current_manager)])

    @router.get("/a")
    def a():
        return "a"

    @router.get("/b")
    def b():
        return "b"

    mini_app.include_router(router)
    mini_client = TestClient(mini_app)

    assert mini_client.get("/a").status_code == status.HTTP_401_UNAUTHORIZED
    assert mini_client.get("/b").status_code == status.HTTP_401_UNAUTHORIZED
    assert (
        mini_client.get("/a", headers=auth_headers).status_code
        == status.HTTP_200_OK
    )


# Documentação OpenAPI / compatibilidade
def test_openapi_documenta_auth_e_esquema_bearer(client):
    schema = client.get("/openapi.json").json()

    paths = schema["paths"].keys()

    assert {"/auth/register", "/auth/login", "/auth/me"} <= paths
    assert "HTTPBearer" in schema["components"]["securitySchemes"]
    assert schema["paths"]["/auth/me"]["get"]["security"]


def test_rotas_publicas_e_rotas_ainda_abertas(client, db):
    """
    Fixa o que ainda NÃO exige token: healthcheck, pareamento do Agente
    (público por necessidade) e /config e /categories (dados globais,
    pendentes de decisão). Dashboard, users, activities e tasks estão
    protegidos (veja test_tasks_and_association.py)

    Ao proteger /config ou /categories, atualize este teste de propósito
    """
    assert client.get("/").status_code == status.HTTP_200_OK
    assert client.get("/config/").status_code == status.HTTP_200_OK
    assert client.get("/categories/").status_code == status.HTTP_200_OK
    # Sem token, mas chega à validação do corpo (não é barrada por 401)
    assert client.post("/collaborators/associate", json={}).status_code == (
        status.HTTP_422_UNPROCESSABLE_CONTENT
    )

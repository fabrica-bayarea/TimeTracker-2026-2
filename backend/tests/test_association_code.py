import re

import pytest
from fastapi import status
from sqlalchemy import create_engine, inspect, text

from app import crud, models, schemas, utils
from app.schema_upgrades import apply_schema_upgrades

from .conftest import MANAGER_EMAIL, MANAGER_PASSWORD

CODE_PATTERN = re.compile(r"^\d{6}$")


def _register(client, email, password=MANAGER_PASSWORD):
    response = client.post(
        "/auth/register", json={"email": email, "password": password}
    )

    assert response.status_code == status.HTTP_201_CREATED

    return response.json()


def _headers(client, email, password=MANAGER_PASSWORD):
    response = client.post(
        "/auth/login", json={"email": email, "password": password}
    )

    return {"Authorization": f"Bearer {response.json()['access_token']}"}


# Geração
def test_gerador_produz_6_digitos_com_zeros_a_esquerda(monkeypatch):
    monkeypatch.setattr(utils, "randbelow", lambda _: 42)

    assert utils.generate_association_code() == "000042"


def test_gerador_sempre_no_formato_esperado():
    codes = {utils.generate_association_code() for _ in range(500)}

    assert all(CODE_PATTERN.match(code) for code in codes)
    assert len(codes) > 1


# Criação da conta
def test_register_gera_codigo_de_6_digitos(client, db):
    _register(client, MANAGER_EMAIL)

    stored = db.query(models.Manager).one()

    assert CODE_PATTERN.match(stored.association_code)


def test_register_nao_expoe_o_codigo_na_resposta(client, db):
    body = _register(client, MANAGER_EMAIL)

    assert "association_code" not in body


def test_codigos_de_gestores_diferentes_sao_distintos(client, db):
    for index in range(5):
        _register(client, f"gestor{index}@example.com")

    codes = [m.association_code for m in db.query(models.Manager).all()]

    assert len(set(codes)) == 5


def test_sorteio_repetido_e_descartado_ate_achar_codigo_livre(
    client, db, monkeypatch
):
    _register(client, "primeiro@example.com")
    taken = db.query(models.Manager).one().association_code
    sequence = iter([taken, taken, "123456"])

    monkeypatch.setattr(crud, "generate_association_code", lambda: next(sequence))

    _register(client, "segundo@example.com")

    second = (
        db.query(models.Manager)
          .filter(models.Manager.email == "segundo@example.com")
          .one()
    )

    assert second.association_code == "123456"


def test_register_retorna_503_quando_nao_ha_codigo_livre(
    client, db, monkeypatch
):
    _register(client, "primeiro@example.com")
    taken = db.query(models.Manager).one().association_code

    monkeypatch.setattr(crud, "generate_association_code", lambda: taken)

    response = client.post(
        "/auth/register",
        json={"email": "segundo@example.com", "password": MANAGER_PASSWORD},
    )

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert db.query(models.Manager).count() == 1


def test_colisao_de_codigo_na_gravacao_tenta_novamente(
    client, db, monkeypatch
):
    """
    Outra requisição pega o código entre a checagem e o commit: o índice
    único barra e o cadastro é refeito com outro código, sem virar 409
    """
    _register(client, "primeiro@example.com")
    taken = db.query(models.Manager).one().association_code
    sequence = iter(["654321"])

    # A checagem prévia "não vê" o código ocupado; só o índice único o pega
    real_in_use = crud._association_code_in_use
    calls = {"n": 0}

    def in_use(session, code):
        calls["n"] += 1

        if calls["n"] == 1:
            return False

        return real_in_use(session, code)

    monkeypatch.setattr(crud, "_association_code_in_use", in_use)
    monkeypatch.setattr(
        crud,
        "generate_association_code",
        lambda: taken if calls["n"] == 0 else next(sequence),
    )

    _register(client, "segundo@example.com")

    second = (
        db.query(models.Manager)
          .filter(models.Manager.email == "segundo@example.com")
          .one()
    )

    assert second.association_code == "654321"


# GET /auth/me
def test_me_retorna_o_codigo_do_proprio_gestor(client, db, auth_headers):
    response = client.get("/auth/me", headers=auth_headers)

    assert response.status_code == status.HTTP_200_OK

    body = response.json()

    assert CODE_PATTERN.match(body["association_code"])
    assert body["association_code"] == (
        db.query(models.Manager).one().association_code
    )
    assert "password_hash" not in body


def test_codigo_permanece_o_mesmo_entre_chamadas_e_logins(client, auth_headers):
    first = client.get("/auth/me", headers=auth_headers).json()
    second = client.get(
        "/auth/me", headers=_headers(client, MANAGER_EMAIL)
    ).json()

    assert first["association_code"] == second["association_code"]


def test_cada_gestor_ve_apenas_o_proprio_codigo(client, db):
    _register(client, "a@example.com")
    _register(client, "b@example.com")

    code_a = client.get("/auth/me", headers=_headers(client, "a@example.com"))
    code_b = client.get("/auth/me", headers=_headers(client, "b@example.com"))

    assert code_a.json()["email"] == "a@example.com"
    assert code_b.json()["email"] == "b@example.com"
    assert code_a.json()["association_code"] != code_b.json()["association_code"]


def test_me_sem_token_nao_expoe_codigo(client, db):
    response = client.get("/auth/me")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "association_code" not in response.text


def test_me_gera_codigo_para_gestor_antigo_sem_codigo(client, db, auth_headers):
    manager = db.query(models.Manager).one()
    manager.association_code = None
    db.commit()

    response = client.get("/auth/me", headers=auth_headers)

    assert response.status_code == status.HTTP_200_OK
    assert CODE_PATTERN.match(response.json()["association_code"])

    db.refresh(manager)

    assert manager.association_code == response.json()["association_code"]


def test_schema_exige_codigo_de_6_digitos():
    base = {"id": "0190a000-0000-7000-8000-000000000000",
            "email": MANAGER_EMAIL, "created_at": "2026-01-01T00:00:00Z"}

    schemas.ManagerProfileOut(**base, association_code="012345")

    for invalid in ("12345", "1234567", "abcdef", ""):
        with pytest.raises(ValueError):
            schemas.ManagerProfileOut(**base, association_code=invalid)


def test_openapi_documenta_o_codigo_em_auth_me(client):
    schema = client.get("/openapi.json").json()
    ref = (schema["paths"]["/auth/me"]["get"]["responses"]["200"]
                 ["content"]["application/json"]["schema"]["$ref"])
    name = ref.rsplit("/", 1)[-1]

    assert "association_code" in schema["components"]["schemas"][name]["properties"]


def test_banco_tem_indice_unico_no_codigo(db):
    from app.database import engine

    indexes = {
        i["name"]: i for i in inspect(engine).get_indexes("managers")
    }

    assert indexes["ix_managers_association_code"]["unique"]


# Migração de bancos legados
@pytest.fixture()
def legacy_managers_engine(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")

    with engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE managers (id CHAR(32) PRIMARY KEY, "
            "email VARCHAR(255) NOT NULL)"
        ))

        for index in range(3):
            conn.execute(text(
                "INSERT INTO managers (id, email) VALUES (:id, :email)"
            ), {"id": f"id{index}", "email": f"g{index}@example.com"})

    yield engine

    engine.dispose()


def _codes(engine) -> list[str | None]:
    with engine.connect() as conn:
        return [
            row[0] for row in conn.execute(
                text("SELECT association_code FROM managers ORDER BY id")
            )
        ]


def test_migracao_preenche_codigo_unico_para_gestores_existentes(
    legacy_managers_engine,
):
    apply_schema_upgrades(legacy_managers_engine)

    codes = _codes(legacy_managers_engine)

    assert all(code and CODE_PATTERN.match(code) for code in codes)
    assert len(set(codes)) == 3


def test_migracao_cria_indice_unico_e_preserva_dados(legacy_managers_engine):
    apply_schema_upgrades(legacy_managers_engine)

    indexes = {
        i["name"]: i
        for i in inspect(legacy_managers_engine).get_indexes("managers")
    }

    assert indexes["ix_managers_association_code"]["unique"]

    with legacy_managers_engine.connect() as conn:
        emails = [r[0] for r in conn.execute(
            text("SELECT email FROM managers ORDER BY id")
        )]

    assert emails == ["g0@example.com", "g1@example.com", "g2@example.com"]


def test_migracao_nao_troca_codigos_existentes(legacy_managers_engine):
    apply_schema_upgrades(legacy_managers_engine)
    before = _codes(legacy_managers_engine)

    apply_schema_upgrades(legacy_managers_engine)

    assert _codes(legacy_managers_engine) == before

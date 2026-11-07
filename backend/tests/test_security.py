import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app import security

SECRET = security.JWT_SECRET_KEY


def _encode(payload: dict, key: str = SECRET, algorithm: str = "HS256"):
    return jwt.encode(payload, key, algorithm=algorithm)


def _valid_payload(**overrides) -> dict:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(uuid.uuid7()),
        "aud": security.JWT_AUDIENCE,
        "iat": now,
        "exp": now + timedelta(minutes=5),
    }
    payload.update(overrides)

    return {k: v for k, v in payload.items() if v is not None}


# Senhas
def test_hash_password_nao_guarda_texto_puro_e_usa_bcrypt():
    hashed = security.hash_password("minha-senha-123")

    assert hashed != "minha-senha-123"
    assert "minha-senha-123" not in hashed
    assert hashed.startswith("$2b$")


def test_hash_password_usa_salt_diferente_a_cada_chamada():
    assert (security.hash_password("mesma-senha-1")
            != security.hash_password("mesma-senha-1"))


def test_verify_password_aceita_correta_e_rejeita_incorreta():
    hashed = security.hash_password("senha-correta-1")

    assert security.verify_password("senha-correta-1", hashed) is True
    assert security.verify_password("senha-errada-1", hashed) is False


def test_verify_password_com_hash_malformado_retorna_false():
    assert security.verify_password("qualquer", "isto-nao-e-bcrypt") is False


def test_verify_password_com_senha_acima_de_72_bytes_retorna_false():
    hashed = security.hash_password("senha-correta-1")

    assert security.verify_password("x" * 100, hashed) is False


def test_dummy_hash_e_um_hash_bcrypt_valido():
    # Se for inválido, o login deixaria de equalizar o tempo de resposta.
    assert security.verify_password("x", security.DUMMY_PASSWORD_HASH) is False
    assert security.DUMMY_PASSWORD_HASH.startswith("$2b$12$")


# JWT: geração
def test_create_access_token_gera_jwt_com_claims_esperadas():
    manager_id = uuid.uuid7()

    token = security.create_access_token(manager_id)
    claims = jwt.decode(
        token,
        SECRET,
        algorithms=["HS256"],
        audience=security.JWT_AUDIENCE,
    )

    assert claims["sub"] == str(manager_id)
    assert claims["aud"] == security.JWT_AUDIENCE
    assert {"iat", "exp"} <= claims.keys()
    assert jwt.get_unverified_header(token)["alg"] == "HS256"


def test_expiracao_padrao_vem_de_access_token_expire_minutes():
    token = security.create_access_token(uuid.uuid7())
    claims = jwt.decode(
        token, SECRET, algorithms=["HS256"], audience=security.JWT_AUDIENCE
    )

    assert security.ACCESS_TOKEN_EXPIRE_MINUTES == 30  # definido no conftest
    assert claims["exp"] - claims["iat"] == 30 * 60


def test_expiracao_pode_ser_sobrescrita_por_chamada():
    token = security.create_access_token(
        uuid.uuid7(), expires_delta=timedelta(minutes=2)
    )
    claims = jwt.decode(
        token, SECRET, algorithms=["HS256"], audience=security.JWT_AUDIENCE
    )

    assert claims["exp"] - claims["iat"] == 120


# JWT: validação
def test_decode_access_token_devolve_o_id_do_gestor():
    manager_id = uuid.uuid7()
    token = security.create_access_token(manager_id)

    assert security.decode_access_token(token) == manager_id


def test_decode_aceita_subject_como_string():
    manager_id = uuid.uuid7()
    token = security.create_access_token(str(manager_id))

    assert security.decode_access_token(token) == manager_id


def test_decode_rejeita_token_expirado():
    token = security.create_access_token(
        uuid.uuid7(), expires_delta=timedelta(seconds=-1)
    )

    with pytest.raises(security.InvalidTokenError):
        security.decode_access_token(token)


def test_decode_rejeita_assinatura_adulterada():
    token = security.create_access_token(uuid.uuid7())
    header, payload, signature = token.split(".")
    flipped = ("A" if signature[0] != "A" else "B") + signature[1:]

    with pytest.raises(security.InvalidTokenError):
        security.decode_access_token(f"{header}.{payload}.{flipped}")


def test_decode_rejeita_payload_adulterado_com_assinatura_original():
    token = security.create_access_token(uuid.uuid7())
    forged = security.create_access_token(uuid.uuid7())
    header, _, signature = token.split(".")
    _, forged_payload, _ = forged.split(".")

    with pytest.raises(security.InvalidTokenError):
        security.decode_access_token(f"{header}.{forged_payload}.{signature}")


def test_decode_rejeita_token_assinado_com_outra_chave():
    other_key = "outra-chave-com-mais-de-32-caracteres!!"
    token = _encode(_valid_payload(), key=other_key)

    with pytest.raises(security.InvalidTokenError):
        security.decode_access_token(token)


def test_decode_rejeita_algoritmo_none():
    token = jwt.encode(_valid_payload(), key=None, algorithm="none")

    with pytest.raises(security.InvalidTokenError):
        security.decode_access_token(token)


@pytest.mark.filterwarnings("ignore:The HMAC key is")
def test_decode_rejeita_outro_algoritmo_hmac():
    token = _encode(_valid_payload(), algorithm="HS512")

    with pytest.raises(security.InvalidTokenError):
        security.decode_access_token(token)


def test_decode_rejeita_audiencia_diferente():
    token = _encode(_valid_payload(aud="time-tracker:agent"))

    with pytest.raises(security.InvalidTokenError):
        security.decode_access_token(token)


@pytest.mark.parametrize("missing", ["sub", "exp", "iat", "aud"])
def test_decode_rejeita_token_sem_claim_obrigatoria(missing):
    payload = _valid_payload()
    del payload[missing]

    with pytest.raises(security.InvalidTokenError):
        security.decode_access_token(_encode(payload))


def test_decode_rejeita_subject_que_nao_e_uuid():
    token = _encode(_valid_payload(sub="123"))

    with pytest.raises(security.InvalidTokenError):
        security.decode_access_token(token)


@pytest.mark.parametrize("garbage", ["", "abc", "a.b.c", "Bearer xyz"])
def test_decode_rejeita_lixo(garbage):
    with pytest.raises(security.InvalidTokenError):
        security.decode_access_token(garbage)


# Configuração
@pytest.mark.parametrize("raw", [None, "", "   "])
def test_secret_key_ausente_e_recusada_com_instrucao(raw):
    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY é obrigatória") as exc:
        security._resolve_secret_key(raw)

    assert "secrets.token_urlsafe" in str(exc.value)


def test_secret_key_curta_e_recusada():
    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY"):
        security._resolve_secret_key("curta")


def test_secret_key_valida_e_mantida():
    key = "k" * security.MIN_SECRET_KEY_LENGTH

    assert security._resolve_secret_key(f"  {key}  ") == key


@pytest.mark.parametrize("raw", ["0", "-5", "abc", "1.5"])
def test_expiracao_invalida_e_recusada(raw):
    with pytest.raises(RuntimeError, match="ACCESS_TOKEN_EXPIRE_MINUTES"):
        security._resolve_expire_minutes(raw)


@pytest.mark.parametrize("raw", [None, "", "  "])
def test_expiracao_ausente_usa_padrao(raw):
    assert (security._resolve_expire_minutes(raw)
            == security.DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES)


def test_expiracao_valida_e_lida():
    assert security._resolve_expire_minutes("15") == 15

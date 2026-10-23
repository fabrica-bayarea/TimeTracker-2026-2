import pytest
from sqlalchemy import create_engine, inspect, text

from app.schema_upgrades import apply_schema_upgrades


@pytest.fixture()
def legacy_engine(tmp_path):
    """Banco no formato anterior: `users` sem a coluna `manager_id`."""
    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")

    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE managers (id CHAR(32) PRIMARY KEY)"))
        conn.execute(text(
            "CREATE TABLE users (id CHAR(32) PRIMARY KEY, "
            "username VARCHAR(150) NOT NULL)"
        ))
        conn.execute(text(
            "INSERT INTO users (id, username) VALUES ('a', 'joao')"
        ))

    yield engine

    engine.dispose()


def _columns(engine) -> set[str]:
    return {c["name"] for c in inspect(engine).get_columns("users")}


def test_adiciona_manager_id_em_banco_legado_preservando_dados(legacy_engine):
    assert "manager_id" not in _columns(legacy_engine)

    apply_schema_upgrades(legacy_engine)

    assert "manager_id" in _columns(legacy_engine)

    with legacy_engine.connect() as conn:
        row = conn.execute(text("SELECT username, manager_id FROM users"))

        assert row.one() == ("joao", None)


def test_cria_indice_em_manager_id(legacy_engine):
    apply_schema_upgrades(legacy_engine)

    indexes = {i["name"] for i in inspect(legacy_engine).get_indexes("users")}

    assert "ix_users_manager_id" in indexes


def test_e_idempotente(legacy_engine):
    apply_schema_upgrades(legacy_engine)
    apply_schema_upgrades(legacy_engine)

    assert "manager_id" in _columns(legacy_engine)


def test_nao_faz_nada_sem_a_tabela_users(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'empty.db'}")

    apply_schema_upgrades(engine)

    assert inspect(engine).get_table_names() == []

    engine.dispose()


def test_banco_novo_ja_tem_a_coluna_e_nada_muda(db):
    from app.database import engine

    before = _columns(engine)

    apply_schema_upgrades(engine)

    assert "manager_id" in before
    assert _columns(engine) == before

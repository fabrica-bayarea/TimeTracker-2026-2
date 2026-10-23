"""
Ajustes de schema para bancos já existentes

`Base.metadata.create_all` só cria tabelas que faltam, mas não adiciona colunas
novas a tabelas antigas. Enquanto o projeto não usar migrações versionadas
(Alembic), as colunas adicionadas depois da primeira versão entram aqui


Cada ajuste é idempotente e roda a cada inicialização
"""

from sqlalchemy import Uuid, inspect, text
from sqlalchemy.engine import Engine


def _add_users_manager_id(engine: Engine) -> None:
    """users.manager_id: gestor responsável pelo colaborador (equipe)"""
    inspector = inspect(engine)

    if "users" not in inspector.get_table_names():
        return

    if "manager_id" in {c["name"] for c in inspector.get_columns("users")}:
        return

    uuid_type = Uuid().compile(dialect=engine.dialect)

    with engine.begin() as conn:
        conn.execute(text(
            f"ALTER TABLE users ADD COLUMN manager_id {uuid_type} "
            "REFERENCES managers (id)"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_users_manager_id "
            "ON users (manager_id)"
        ))


def apply_schema_upgrades(engine: Engine) -> None:
    """Chame depois de `Base.metadata.create_all`"""
    _add_users_manager_id(engine)

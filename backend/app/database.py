from os import getenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

from .utils import ROOT_DIR

load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = getenv(
    "DATABASE_URL",
    "postgresql://timetracker:timetracker@db:5432/timetracker",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependência do FastAPI: abre e fecha a sessão do banco por requisição.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

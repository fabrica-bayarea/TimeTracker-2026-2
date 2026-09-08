from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models # registra modelos antes do create_all.
from .routers import activities, dashboard, categories, config, users

_ = models

# Possibilidade: Alembic para migrações versionadas para prod
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Time Tracker API",
    description=(
        "API do **Time Tracker**. Expõe endpoints analíticos para "
        "o dashboard web e configurações consultadas pelo agente desktop.\n\n"
        "Documentação interativa disponível em "
        "`/docs` (Swagger UI) e `/redoc` (ReDoc)."
    ),
    version="1.0.0",
    contact={"name": "Time Tracker - Open Source (MIT)"},
    license_info={"name": "MIT"},
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Ajustar allow_origins para o domínio real do dashboard em prod.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(activities.router)
app.include_router(dashboard.router)
app.include_router(categories.router)
app.include_router(config.router)
app.include_router(users.router)


@app.get("/", tags=["Status"], summary="Healthcheck da API")
def root():
    return (
        {
            "status": "ok",
            "service": "time-tracker-api",
            "docs": "/docs"
        }
    )

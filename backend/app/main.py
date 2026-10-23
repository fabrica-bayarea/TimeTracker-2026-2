from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


from .database import Base, engine
from . import models # registra modelos antes do create_all.
from .routers import (
    activities,
    auth,
    dashboard,
    categories,
    config,
    tasks,
    users,
)
from .schema_upgrades import apply_schema_upgrades

_ = models

# Possibilidade: Alembic para migrações versionadas para prod
Base.metadata.create_all(bind=engine)
apply_schema_upgrades(engine)

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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request,
    exc: RequestValidationError
):
    """
    Mantém o formato padrão do 422 do FastAPI, mas sem devolver o valor
    enviado em campos de senha (credenciais não devem ser expostas).
    """
    errors = []

    for error in exc.errors():
        if "password" in error.get("loc", ()):
            error = {k: v for k, v in error.items() if k != "input"}

        errors.append(error)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": jsonable_encoder(errors)},
    )


app.include_router(auth.router)
app.include_router(activities.router)
app.include_router(dashboard.router)
app.include_router(categories.router)
app.include_router(config.router)
app.include_router(tasks.router)
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

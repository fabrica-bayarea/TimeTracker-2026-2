# Time Tracker — Backend (FastAPI)

Backend do projeto Time Tracker, conforme o SRS v1.0.0 (seções 6 e 7).

## Rodando com Docker (recomendado — RNF06)

```bash
docker compose up --build
```

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

Popule categorias e regras padrão (uma vez, com os containers no ar):

```bash
docker compose exec api python seed.py
```

## Rodando localmente (sem Docker)

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Suba um Postgres local e ajuste DATABASE_URL (veja .env.example)
export DATABASE_URL=postgresql://timetracker:timetracker@localhost:5432/timetracker

python seed.py
uvicorn app.main:app --reload
```

## Estrutura do projeto

```
app/
  main.py          # cria o app FastAPI, CORS, inclui routers, configura Swagger
  database.py      # engine/session SQLAlchemy
  models.py        # entidades: User, Category, CategorizationRule, ActivityLog, SystemSettings
  schemas.py       # schemas Pydantic (request/response)
  crud.py          # lógica de acesso a dados + motor de categorização (RF07)
  routers/
    activities.py  # POST /activities (RF01/RF02) e GET /activities/realtime (RF09)
    dashboard.py   # GET /dashboard/summary (RF10) e exportações CSV/PDF (RF11)
    categories.py  # categorias e regras de categorização (RF07/RF08)
    config.py      # GET/PUT /config (RF06 - config remota do agente)
    users.py       # listagem de colaboradores
seed.py            # popula categorias/regras/config padrão
```

## Endpoints principais

| Método | Rota | Descrição | RF |
|---|---|---|---|
| POST | `/activities/` | Agente envia leitura da janela ativa | RF01, RF02, RF05 |
| GET | `/activities/realtime` | Painel em tempo real | RF09 |
| GET | `/dashboard/summary?date=` | Sumário diário por categoria | RF10 |
| GET | `/dashboard/export/csv` | Exporta relatório em CSV | RF11 |
| GET | `/dashboard/export/pdf` | Exporta relatório em PDF | RF11 |
| GET/POST | `/categories/` | Lista/cria categorias | RF07 |
| GET/POST/PUT/DELETE | `/categories/rules` | Regras de palavra-chave | RF07, RF08 |
| GET/PUT | `/config/` | Intervalo de captura e tempo de inatividade | RF06 |
| GET | `/users/` | Lista colaboradores | RF05 |

## Próximos passos sugeridos

- Adicionar autenticação (JWT) nas rotas de escrita (`config`, `categories/rules`) para uso pelo gestor.
- Trocar `Base.metadata.create_all` por migrações com Alembic antes de produção.
- Adicionar índice único em `(user_id, captured_at)` se o agente puder reenviar duplicados.

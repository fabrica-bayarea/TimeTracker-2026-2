# Time Tracker — Backend (FastAPI)

Backend do projeto Time Tracker, conforme o SRS v1.0.0 (seções 6 e 7).

## Rodando com Docker (recomendado — RNF06)

```bash
cp .env.example .env   # preencha JWT_SECRET_KEY (obrigatória) e as senhas
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
# Obrigatória (a API não inicia sem ela); mantenha a mesma entre reinícios
export JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(64))")

python seed.py
uvicorn app.main:app --reload
```

## Estrutura do projeto

```
app/
  main.py          # cria o app FastAPI, CORS, inclui routers, configura Swagger
  database.py      # engine/session SQLAlchemy
  models.py        # entidades: User, Manager, Category, CategorizationRule, ActivityLog, SystemSettings
  schemas.py       # schemas Pydantic (request/response)
  crud.py          # lógica de acesso a dados + motor de categorização (RF07)
  security.py      # hash de senha (bcrypt), JWT (gestor e agente) e dependência get_current_manager
  rate_limit.py    # limite de tentativas inválidas do código de associação
  routers/
    auth.py        # POST /auth/register, POST /auth/login, GET /auth/me (RF-02)
    activities.py  # POST /activities (RF01/RF02) e GET /activities/realtime (RF09)
    dashboard.py   # GET /dashboard/summary (RF10) e exportações CSV/PDF (RF11)
    categories.py  # categorias e regras de categorização (RF07/RF08)
    config.py      # GET/PUT /config (RF06 - config remota do agente)
    users.py       # listagem de colaboradores e POST /collaborators/associate (RF-04)
seed.py            # popula categorias/regras/config padrão
tests/             # testes automatizados (pytest)
```

## Endpoints principais

| Método | Rota | Descrição | RF |
|---|---|---|---|
| POST | `/auth/register` | Cria a conta do gestor (e-mail e senha) | RF-02 |
| POST | `/auth/login` | Login do gestor; retorna token JWT | RF-02 |
| GET | `/auth/me` | Gestor autenticado e seu código de associação (rota protegida) | RF-02, RF-03 |
| POST | `/collaborators/associate` | Agente associa o colaborador ao gestor pelo código de 6 dígitos e recebe o token do Agente | RF-01, RF-04 |
| POST | `/activities/` | Agente envia leitura da janela ativa | RF01, RF02, RF05 |
| GET | `/activities/realtime` | Painel em tempo real | RF09 |
| GET | `/dashboard/summary?date=` | Sumário diário por categoria | RF10 |
| GET | `/dashboard/export/csv` | Exporta relatório em CSV | RF11 |
| GET | `/dashboard/export/pdf` | Exporta relatório em PDF | RF11 |
| GET/POST | `/categories/` | Lista/cria categorias | RF07 |
| GET/POST/PUT/DELETE | `/categories/rules` | Regras de palavra-chave | RF07, RF08 |
| GET/PUT | `/config/` | Intervalo de captura e tempo de inatividade | RF06 |
| GET | `/users/` | Lista colaboradores | RF05 |

## Autenticação do gestor (JWT)

Variáveis de ambiente (veja `.env.example`):

| Variável | Padrão | Descrição |
|---|---|---|
| `JWT_SECRET_KEY` | *(obrigatória)* | Chave de assinatura dos tokens, mínimo de 32 caracteres. Gere com `python -c "import secrets; print(secrets.token_urlsafe(64))"`. **Sem ela a API não inicia.** Mantenha a mesma chave entre reinicializações: trocá-la invalida todos os tokens (gestores e Agentes). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Validade do token de acesso, em minutos. |
| `AGENT_TOKEN_EXPIRE_MINUTES` | `525600` (365 dias) | Validade do token do Agente Desktop, em minutos. |

### Contrato (para o Frontend)

```http
POST /auth/register   {"email": "gestor@empresa.com", "password": "mínimo 8 caracteres"}
→ 201 {"id": "<uuid>", "email": "gestor@empresa.com", "created_at": "..."}
→ 409 e-mail já cadastrado · 422 dados inválidos

POST /auth/login      {"email": "gestor@empresa.com", "password": "..."}
→ 200 {"access_token": "<jwt>", "token_type": "bearer", "expires_in": 3600}
→ 401 {"detail": "E-mail ou senha inválidos."}   (mensagem igual para e-mail inexistente e senha errada)

GET /auth/me          Authorization: Bearer <jwt>
→ 200 {"id": "...", "email": "...", "created_at": "...", "association_code": "048215"}
→ 401 token ausente, inválido ou expirado
→ 503 não foi possível gerar o código de associação (muito improvável; tente de novo)
```

- `association_code` é o código de **6 dígitos** (string, com zeros à esquerda) que o colaborador informa no Agente. É gerado no cadastro, único no sistema e **não muda** entre logins. Cada gestor só enxerga o próprio código.
- O `POST /auth/register` **não** devolve o código; o Dashboard o obtém em `GET /auth/me` após o login.
- Bancos criados antes desta funcionalidade são atualizados na inicialização (`schema_upgrades.py`): a coluna é adicionada e cada gestor existente recebe um código único.

- O corpo do login é **JSON** (não `x-www-form-urlencoded`).
- E-mails são normalizados para minúsculas e domínios reservados (`.test`, `.local`, `localhost`) são recusados com `422`; a senha tem no máximo 72 bytes (limite do bcrypt).
- O token **não é renovado**: ao expirar (`401`), o gestor precisa fazer login novamente.
- Erros `422` em campos de senha não devolvem o valor enviado.
- No Swagger (`/docs`), use **Authorize** e cole o `access_token` para testar rotas protegidas.

### Associação do colaborador (Agente Desktop)

```http
POST /collaborators/associate   (sem autenticação)
{"association_code": "048215", "username": "joao", "machine_name": "PC-JOAO-01"}
→ 200 {"access_token": "<jwt>", "token_type": "bearer", "expires_in": 31536000,
       "collaborator_id": "<uuid>", "username": "joao", "machine_name": "PC-JOAO-01",
       "manager_id": "<uuid>", "already_associated": false}
→ 404 código inexistente (nada é gravado e nenhum token é emitido)
→ 409 colaborador já pertence a outro gestor (o vínculo não é transferido)
→ 422 formato inválido (código com 6 dígitos; usuário e máquina obrigatórios)
→ 429 muitas tentativas inválidas da mesma origem (cabeçalho Retry-After)
```

- É **idempotente**: repetir com o mesmo gestor responde 200 com `already_associated: true`, atualiza `machine_name` e emite um novo token.
- O colaborador é identificado por `username` (único). O token do Agente tem audiência própria (`time-tracker:agent`) e **não** vale como sessão de gestor, nem o contrário.
- Após 10 tentativas com código inexistente em 15 minutos, a origem recebe 429. O contador é por processo e usa o IP da conexão; atrás de proxy/túnel, configure o proxy para repassar o IP real (ex.: `uvicorn --proxy-headers`).
- O token do Agente só vale em `POST /activities/` (veja "Quem acessa o quê").

### Protegendo rotas

`get_current_manager` (em `app/security.py`) valida o JWT e devolve o gestor autenticado, ou responde `401`:

```python
from fastapi import APIRouter, Depends
from .. import models, security

# uma rota
@router.get("/exemplo")
def exemplo(manager: models.Manager = Depends(security.get_current_manager)):
    ...

# um router inteiro
router = APIRouter(
    prefix="/config",
    dependencies=[Depends(security.get_current_manager)],
)
```

### Quem acessa o quê

| Rota | Credencial | Observação |
|---|---|---|
| `POST /auth/register`, `POST /auth/login`, `POST /collaborators/associate`, `GET /` | nenhuma | Públicas por necessidade (o `associate` tem limite de tentativas). |
| `POST /activities/` | **token do Agente** | O registro é gravado no colaborador dono do token; o `username` do corpo é ignorado. |
| `GET /activities/realtime`, `GET /dashboard/*`, `GET /users/`, `/tasks/*`, `GET /auth/me` | **token do gestor** | Os dados retornados são somente os da equipe do gestor logado. |
| `/config/*`, `/categories/*` | nenhuma (por enquanto) | Dados globais, ainda abertos; pendente de decisão. |

- Sem `Authorization: Bearer ...` válido, as rotas protegidas respondem **401**.
- Os dois tokens têm audiências diferentes: o token do Agente não acessa rotas de gestor e o do gestor não envia atividades.
- O Agente é revalidado a cada chamada: se o colaborador for removido ou ficar sem gestor, o token deixa de funcionar mesmo antes de expirar.
- Um colaborador nunca enxerga dados de outro; um gestor nunca enxerga dados de outra equipe (consultas inexistentes ou de outra equipe voltam vazias ou 404, sem revelar a diferença).

### Resetar o banco (desenvolvimento)

```bash
docker compose down -v        # apaga o volume do Postgres (todos os dados)
docker compose up --build
docker compose exec api python seed.py
```

Depois do reset, as contas de gestor e os colaboradores deixam de existir. Os tokens antigos (de gestor e de Agente) passam a responder 401, mesmo com `JWT_SECRET_KEY` igual: os gestores precisam se cadastrar de novo e os Agentes precisam ser associados novamente com o novo código. Para só invalidar tokens sem apagar dados, troque a `JWT_SECRET_KEY`.

## Testes

```bash
pip install -r requirements-dev.txt
pytest
```

Os testes usam um SQLite temporário (não tocam no Postgres) e exigem Python 3.14, o mesmo do `Dockerfile` (`uuid.uuid7`).

## Próximos passos sugeridos

- Proteger as rotas de escrita (`config`, `categories/rules`) e as de leitura com `get_current_manager` e isolar os dados por equipe (B-01).
- Trocar `Base.metadata.create_all` por migrações com Alembic antes de produção.
- Adicionar índice único em `(user_id, captured_at)` se o agente puder reenviar duplicados.

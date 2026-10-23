# Time Tracker — Agente Desktop (C# / .NET 8)

## 1. Como o agente funciona

```
┌────────────────────────────┐
│ SettingsPollingService      │  GET /config/ a cada 60s (configurável)
│ (capture_interval_seconds,  │  → mantém CaptureService atualizado
│  idle_timeout_seconds)      │
└──────────────┬──────────────┘
               │ SettingsChanged
               ▼
┌────────────────────────────┐
│ CaptureService               │  a cada capture_interval_seconds:
│  - ActiveWindowTracker       │    • processo + título da janela ativa
│  - IdleDetector               │    • idle = tempo sem mouse/teclado >= limite
└──────────────┬──────────────┘
               │ Enqueue(ActivitySample)
               ▼
┌────────────────────────────┐
│ LocalQueue (SQLite)          │  fila persistida em disco — nada se perde
└──────────────┬──────────────┘  se a rede cair
               │
               ▼
┌────────────────────────────┐
│ QueueSenderService            │  POST /activities/ em ordem; remove da fila
│  (retry + backoff)            │  só após HTTP 201; senão retenta com backoff
└────────────────────────────┘
```

Cada capture é uma **amostra pontual**: no instante do tick, o agente lê qual
é a janela ativa e reporta `duration_seconds = capture_interval_seconds`
(ou seja, assume que aquela janela representa a atividade durante todo aquele
intervalo).

> Trade-off consciente: se o usuário trocar de janela no meio de um intervalo,
> só a janela ativa **no instante exato do tick** é registrada. Para maior
> granularidade, reduza `capture_interval_seconds` via `PUT /config/` no
> dashboard — o agente já reage a mudanças de configuração em tempo real
> (`SettingsPollingService.SettingsChanged` reprograma o timer de captura).

---

## 2. Estrutura do projeto

```
TimeTrackerAgent/
├── TimeTracker.Agent.csproj
├── appsettings.json                # BaseUrl, endpoints, intervalos locais de fallback
├── Program.cs                      # entry point (instância única + tray)
├── Config/AppConfig.cs
├── Models/DomainModels.cs          # ActivitySample, AgentSettings
├── Dtos/ApiDtos.cs                 # espelha schemas.ActivityLogCreate / SystemSettingsOut
├── Data/LocalQueue.cs              # fila SQLite de resiliência (não existe na API, é do agente)
├── Services/
│   ├── ApiClient.cs                # HttpApiClient — POST /activities/, GET /config/
│   ├── MachineIdentityService.cs   # usuário Windows + nome da máquina
│   ├── ActiveWindowTracker.cs      # Win32: processo + título da janela ativa
│   ├── IdleDetector.cs             # Win32: GetLastInputInfo (só o tempo, não o conteúdo)
│   ├── SettingsPollingService.cs   # polling de GET /config/
│   ├── CaptureService.cs           # timer de captura periódica
│   ├── QueueSenderService.cs       # esvazia a fila local com retry/backoff
│   └── AgentOrchestrator.cs        # composição central usada pela UI
└── UI/
    ├── TrayApplicationContext.cs   # menu da bandeja: Status / Pausar / Sair
    ├── FirstRunNoticeForm.cs       # aviso único de transparência (não é gate — a API não modela consentimento)
    └── StatusForm.cs               # mostra última captura, idle, fila pendente, conexão
```

---

## 3. Mapeamento de campos (`Dtos/ApiDtos.cs` ↔ `schemas.py`)

A serialização usa `JsonNamingPolicy.SnakeCaseLower` (nativo do .NET 8), então
as propriedades C# em PascalCase batem automaticamente com o JSON em
snake_case esperado pelo Pydantic — não há atributos manuais para manter.

| `schemas.ActivityLogCreate` | `ActivityLogCreateDto` (C#) |
| --- | --- |
| `username` | `Username` |
| `hostname` | `Hostname` |
| `process_name` | `ProcessName` |
| `window_title` | `WindowTitle` |
| `duration_seconds` | `DurationSeconds` |
| `is_idle` | `IsIdle` |
| `captured_at` | `CapturedAt` (enviado como `DateTime` com `Kind=Utc` → serializa com sufixo `Z`) |

| `schemas.SystemSettingsOut` | `SystemSettingsDto` (C#) |
| --- | --- |
| `capture_interval_seconds` | `CaptureIntervalSeconds` |
| `idle_timeout_seconds` | `IdleTimeoutSeconds` |
| `updated_at` | `UpdatedAt` |

---

### Tasks na bandeja (US-14.1)

O submenu **Tasks** da bandeja lista `GET /tasks/my-tasks` (atualizado a cada
abertura do menu e a cada `Agent.TasksPollingIntervalMs`). Clicar em uma task
a define como ativa (✓); clicar em outra troca; "Encerrar task atual" volta
ao estado "Aguardando task". O estado fica só em memória e é exibido no
`StatusForm`.

---

## 4. Configuração (`appsettings.json`)

```json
"Api": {
  "BaseUrl": "http://localhost:8000/",
  "RequireHttps": false
}
```

O backend real, em desenvolvimento (`uvicorn`), roda em **HTTP puro** por
padrão em `http://localhost:8000` — por isso `RequireHttps` é `false` aqui.
**Em produção**, publique a API atrás de HTTPS (reverse proxy/TLS) e mude
`BaseUrl` para `https://...` e `RequireHttps` para `true`.

---

## 5. Build e execução

Pré-requisitos: **.NET 8 SDK** com workload Windows Desktop, no Windows 10/11 x64.

```bash
dotnet restore
dotnet build -c Release
dotnet run
```

Para testar de ponta a ponta:

```bash
# terminal 1 — backend real (FastAPI)
uvicorn app.main:app --reload

# terminal 2 — agente
dotnet run --project TimeTrackerAgent
```

O agente cria seu banco de fila local em:
`%LOCALAPPDATA%\TimeTrackerAgent\agent-queue.db`

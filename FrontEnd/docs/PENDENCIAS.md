# Pendências e estado de integração — 30/10/2026

**Revisão vigente:** branch `main`, checkout `eec089a976cd2678473ad2f992269538fd1a4a57`. A auditoria de resiliência e acessibilidade de 30/10/2026 confirmou que as pendências externas abaixo continuam vigentes.

Este snapshot substitui os checkpoints anteriores deste documento. As afirmações históricas de que o backend não tinha CRUD de Tasks, código de associação ou associação colaborador–gestor deixaram de representar o checkout: PRs #142, #145 e #146 estão incorporados na branch. Seus merges locais são `5b72a3e`, `dffb107` e `cccc5ac`, respectivamente. O PR #144 do Agent também está incorporado (`189a7e9`), mas seus caminhos de API ainda não correspondem ao backend atual. O snapshot anterior completo foi preservado ao final deste arquivo com status histórico identificado.

## Resumo vigente

| ID    | Pendência ou entrega acompanhada                        | Responsável           | Prioridade | Status                                    |
| ----- | ------------------------------------------------------- | --------------------- | ---------- | ----------------------------------------- |
| FE-01 | CRUD real de Tasks no frontend                          | Frontend              | Alta       | IMPLEMENTADO, AGUARDANDO HOMOLOGAÇÃO REAL |
| FE-02 | Código de associação na sessão autenticada              | Frontend              | Alta       | IMPLEMENTADO, AGUARDANDO HOMOLOGAÇÃO REAL |
| BE-01 | Autorização e isolamento das rotas globais              | Backend               | Alta       | DEPENDENTE DO BACKEND                     |
| BE-02 | Consulta segura da equipe do gestor                     | Backend               | Alta       | BLOQUEADO POR CONTRATO                    |
| BE-03 | CORS, HTTPS e origem de produção                        | Backend/implantação   | Alta       | DEPENDENTE DO BACKEND                     |
| BE-04 | Seed de `SystemSettings` incompatível com UUID          | Backend               | Alta       | DEPENDENTE DO BACKEND                     |
| BE-05 | Configuração salva não governa o status realtime        | Backend               | Média      | DEPENDENTE DO BACKEND                     |
| BE-06 | Empate de capturas, reenvio e idempotência              | Backend/Agent         | Alta       | DEPENDENTE DO BACKEND E DO AGENT          |
| BE-07 | Capturas futuras e semântica de fuso                    | Backend               | Alta       | DEPENDENTE DO BACKEND                     |
| BE-08 | Exportações globais, neutralização CSV e fidelidade PDF | Backend               | Média      | DEPENDENTE DO BACKEND                     |
| BE-09 | Linha única de configuração sem garantia transacional   | Backend               | Média      | DEPENDENTE DO BACKEND                     |
| BE-10 | Realtime de usuário não mede conexão por máquina        | Backend/Agent         | Média      | DEPENDENTE DO BACKEND E DO AGENT          |
| AG-01 | Rota e payload de associação do Agent divergentes       | Agent                 | Alta       | DEPENDENTE DO AGENT                       |
| AG-02 | Listagem de Tasks para token do Agent ausente           | Backend/Agent         | Alta       | DEPENDENTE DO BACKEND E DO AGENT          |
| AG-03 | Atividade não contém Task nem autoria de Agent          | Backend/Agent         | Alta       | DEPENDENTE DO BACKEND E DO AGENT          |
| I-01  | Resumo diário por Task, jornada e horas trabalhadas     | Backend/Agent/Produto | Alta       | BLOQUEADO POR CONTRATO                    |
| I-02  | Homologação contra API e banco de teste reais           | Backend/Frontend      | Média      | PENDENTE DE AMBIENTE                      |
| F-01  | PWA e validação humana em dispositivos/navegadores      | Frontend/Produto      | Baixa      | NECESSITA DEFINIÇÃO                       |

## Entregas do Frontend

### FE-01 — CRUD autenticado de Tasks

- **Responsável / prioridade / status:** Frontend; Alta; **IMPLEMENTADO, AGUARDANDO HOMOLOGAÇÃO REAL**.
- **Descrição técnica:** integrar lista, detalhe, criação, atualização parcial e exclusão à API real, usando JWT do gestor, validação de payload/resposta, cancelamento e tratamento de `DELETE 204`.
- **Comportamento atual comprovado:** `api.tasks`, `api.getTask`, `api.createTask`, `api.updateTask` e `api.deleteTask` consomem `/tasks/` e `/tasks/{task_id}`. O hook só altera a lista após resposta válida; bloqueia mutações duplicadas e ignora listagens antigas. Produção permite Task sem descrição ou colaboradores. O editor real omite `collaborator_ids` em atualizações para preservar atribuições existentes. A ordenação padrão agora desempata `created_at` igual por UUID decrescente, conforme `crud.list_tasks`.
- **Comportamento esperado:** CRUD persistente por gestor; erros `401`, `403`, `404` e `422` sem feedback de sucesso; cancelamento e respostas atrasadas sem corromper a lista.
- **Impacto no Frontend:** tela Tasks habilitada para CRUD. A atribuição de novas pessoas continua bloqueada conforme BE-02.
- **Endpoints/schemas:** `GET/POST /tasks/`, `GET/PUT/DELETE /tasks/{task_id}`, `TaskCreate`, `TaskUpdate`, `TaskResponse`, `TaskCollaboratorOut`.
- **Evidências:** `FrontEnd/src/shared/api/api.js`, `validators.js`, `features/tasks/hooks/useTasks.js`, `features/tasks/pages/TasksPage.jsx`; backend `backend/app/routers/tasks.py`, `schemas.py`, `crud.py`.
- **Dependências:** sessão JWT válida; endpoint seguro de equipe para habilitar atribuições; ambiente de integração para homologação real.
- **Critérios de aceite:** sucesso somente após resposta confirmada; lista não muda em erro; `204` não tenta ler JSON; título >200 e descrição >5.000 são recusados no cliente; vazio/nulo de descrição e lista vazia de colaboradores são aceitos.
- **Testes necessários:** Vitest de schemas/API/hook/tela, MSW, E2E com respostas HTTP interceptadas e E2E real read-only em ambiente autorizado. A auditoria de 30/10 adicionou cobertura para logout/troca de gestor com listagem e mutação pendentes, cancelamento de criação/edição/exclusão, `401` em listagem e todas as mutações, e desempate de ordenação.
- **Issue/PR confirmada:** PR #142 mergeado em `5b72a3e`; não foi confirmada Issue associada nesta auditoria.

### FE-02 — Código de associação na sessão do gestor

- **Responsável / prioridade / status:** Frontend; Alta; **IMPLEMENTADO, AGUARDANDO HOMOLOGAÇÃO REAL**.
- **Descrição técnica:** validar `association_code` como string de seis dígitos, preservar zeros à esquerda e preferir o perfil `/auth/me` já carregado pela sessão.
- **Comportamento atual comprovado:** `POST /auth/register` continua validado como `ManagerOut` sem código. `GET /auth/me` usa `ManagerProfileOut` com `association_code`. A sessão não expõe código inválido; o hook limita o estado ao ID do gestor, aborta consulta anterior e ignora respostas fora de ordem. A cópia é habilitada somente para código válido.
- **Comportamento esperado:** mostrar o código somente ao gestor autenticado correspondente; limpar código em logout/401/troca de gestor; manter carregamento, erro e retry.
- **Impacto no Frontend:** card de associação do Dashboard funcional, sem chamada extra a `/auth/me` quando o perfil já contém o código.
- **Endpoints/schemas:** `POST /auth/register` → `ManagerOut`; `GET /auth/me` → `ManagerProfileOut`.
- **Evidências:** `FrontEnd/src/shared/api/validators.js`, `api.js`, `shared/auth/ManagerSession.jsx`, `features/dashboard/hooks/useAssociationCode.js`; backend `backend/app/routers/auth.py`, `schemas.py`, `crud.py`.
- **Dependências:** serviço backend configurado, migração aplicada e teste com gestor real de homologação.
- **Critérios de aceite:** cadastro sem código aceito; perfil exige `/^\d{6}$/`; `001234` é preservado; ausência/invalidez nunca permite cópia; logout e resposta atrasada não deixam código anterior visível.
- **Testes necessários:** validadores, API `/auth/me`, hook com zeros à esquerda, ausência/invalidez, logout, troca de gestor e respostas fora de ordem; homologação real autorizada.
- **Issue/PR confirmada:** PR #145 mergeado em `dffb107`.

## Pendências do Backend

### BE-01 — Autorização e isolamento das rotas globais

- **Responsável / prioridade / status:** Backend; Alta; **DEPENDENTE DO BACKEND**.
- **Descrição técnica:** rotas legadas de usuários, atividades, dashboard, exportação e configuração não usam `get_current_manager` nem filtram por `manager_id`. Enviar Bearer pelo frontend não as torna autorizadas.
- **Comportamento atual comprovado:** `/auth/me` e o CRUD `/tasks` verificam identidade do gestor. `GET /users/`, `POST /activities/`, `GET /activities/realtime`, `GET /dashboard/summary`, exportações, `/config/` e rotas de categorias dependem somente do banco; consultas são globais e `PUT /config/` é global. O Dashboard, Colaboradores, Relatórios e Configurações exibem avisos de escopo.
- **Comportamento esperado:** cada operação privada exige credencial apropriada; consultas e exportações de gestor filtram pela identidade autenticada. `POST /activities/` deve usar credencial do Agent, identificar colaborador autorizado e não confiar em `username` como autorização.
- **Impacto no Frontend:** filtros de usuário e dados exibidos são globais; interface não consegue reparar exposição ou impor isolamento. Avisos informam o alcance observado.
- **Endpoints/schemas:** routers `users.py`, `activities.py`, `dashboard.py`, `config.py`, `categories.py`; `ActivityLogCreate`, `UserOut`, `DailySummaryResponse`, `SystemSettingsOut`.
- **Evidências:** handlers sem dependência `security.get_current_manager`; `crud.list_users` lista todos; `get_realtime_view` e `get_daily_summary` não filtram gestor; `config` consulta a primeira configuração global.
- **Dependências:** decisões de autenticação/autorização e tokens distintos de gestor e Agent.
- **Critérios de aceite:** teste sem token, token inválido/expirado, gestor A consultando/exportando dados de B, alteração de configuração por gestor não autorizado e Agent enviando atividade de outro colaborador; comprovar `401/403` e isolamento no servidor.
- **Testes necessários:** testes backend de integração com dois gestores, colaboradores de equipes distintas, usuários sem equipe e tokens com audiências distintas.
- **Issue/PR relacionada:** nenhuma Issue/PR corretiva foi confirmada nesta revisão.

### BE-02 — Endpoint seguro de consulta da equipe

- **Responsável / prioridade / status:** Backend; Alta; **BLOQUEADO POR CONTRATO**.
- **Descrição técnica:** fornecer lista autenticada de colaboradores cujo `User.manager_id` corresponda ao gestor autenticado.
- **Comportamento atual comprovado:** `GET /users/` não exige JWT e `crud.list_users` retorna todos os usuários sem filtro. O backend valida colaboradores recebidos em `TaskCreate`/`TaskUpdate` contra `User.manager_id`, mas essa validação ocorre após o envio do ID. Não há GET seguro de equipe.
- **Comportamento esperado:** contrato autenticado, escopado pelo gestor do token, com esquema de saída documentado e `401/403` apropriados; não aceitar `manager_id` escolhido pelo cliente como controle de acesso.
- **Impacto no Frontend:** a UI real não consulta `/users/` para alimentar o editor. Ela permite Tasks sem colaboradores e exibe atribuições já retornadas pela Task em modo somente leitura. A lista global continua disponível nas páginas antigas com aviso.
- **Endpoints/schemas:** atual `GET /users/` e `UserOut`; rota futura ainda sem nome ou schema aprovado. A sugestão de rota futura não é contrato implementado.
- **Evidências:** `backend/app/routers/users.py:list_users`, `backend/app/crud.py:list_users`; isolamento de IDs em `backend/app/crud.py:_get_team_collaborators`; bloqueio explícito no `FrontEnd/src/features/tasks/components/TaskForm.jsx`.
- **Dependências:** BE-01 e associação de colaboradores por código.
- **Critérios de aceite:** respostas do gestor A não contêm usuários de B nem usuários sem gestor; chamadas ausentes/inválidas retornam erro; não há parâmetro client-side usado para ampliar a equipe.
- **Testes necessários:** testes API com duas equipes, sem token, JWT expirado, equipe vazia, colaborador não associado e tentativa de ID cruzado; testes frontend verificam ausência de chamada a `/users/` na tela Tasks.
- **Issue/PR relacionada:** PR #146 implementa associação pelo código, mas não implementa listagem autenticada de equipe.

### BE-03 — CORS e HTTPS por ambiente

- **Responsável / prioridade / status:** Backend/implantação; Alta; **DEPENDENTE DO BACKEND**.
- **Descrição técnica:** definir origens e transporte seguros para frontend e Agent.
- **Comportamento atual comprovado:** `backend/app/main.py` define `allow_origins=["*"]` junto a `allow_credentials=True`; não há ambiente real validado nesta tarefa. O frontend permite `VITE_API_URL`; fallback de desenvolvimento é `http://localhost:8000` e build sem origem configurada usa a mesma origem.
- **Comportamento esperado:** origens explícitas por ambiente, TLS em produção e política compatível com headers Bearer.
- **Impacto no Frontend:** a origem e o CORS publicados não foram homologados; não é possível confirmar login ou CRUD cross-origin real.
- **Endpoints/schemas:** CORS global em `backend/app/main.py`; `VITE_API_URL` em `FrontEnd/src/shared/api/api.js`.
- **Evidências:** configuração acima e `agent/appsettings.json` com HTTP local e `RequireHttps=false` para desenvolvimento.
- **Dependências:** domínio, reverse proxy, certificados e configuração de deploy.
- **Critérios de aceite:** testes de preflight e requests Bearer na origem publicada; HTTP bloqueado em produção; origens não autorizadas recusadas.
- **Testes necessários:** E2E real em HTTPS homologado e teste CORS no domínio final.
- **Issue/PR relacionada:** não confirmada.

### BE-04 — Seed de configuração usa chave incompatível

- **Responsável / prioridade / status:** Backend; Alta; **DEPENDENTE DO BACKEND**.
- **Descrição técnica:** seed consulta e grava `SystemSettings.id == 1`, mas o modelo declara chave UUID.
- **Comportamento atual comprovado:** `backend/seed.py` faz query por inteiro `1` e tenta criar `SystemSettings(id=1)`; `backend/app/models.py` declara `id = Uuid(...), primary_key=True`. O seed não foi executado nem o banco alterado nesta auditoria.
- **Comportamento esperado:** seed usa UUID gerado pelo modelo e é idempotente; teste de inicialização cobre o banco suportado.
- **Impacto no Frontend:** configurações podem falhar na preparação de ambiente; `GET /config/` cria uma linha se não encontrar nenhuma.
- **Endpoints/schemas:** `SystemSettings`, `/config/`.
- **Evidências:** `backend/seed.py`, `backend/app/models.py`, `backend/app/crud.py:get_settings`.
- **Dependências:** equipe Backend e mecanismo de seed/deploy.
- **Critérios de aceite:** seed executa duas vezes sem erro, gera chave UUID válida e deixa uma configuração consultável.
- **Testes necessários:** teste de seed e migração em banco limpo, sem substituir UUID por inteiro.
- **Issue/PR relacionada:** não confirmada.

### BE-05 — Configuração salva não governa o status realtime

- **Responsável / prioridade / status:** Backend; Média; **DEPENDENTE DO BACKEND**.
- **Descrição técnica:** UI e Agent usam `idle_timeout_seconds`, mas a classificação realtime aplica constantes próprias.
- **Comportamento atual comprovado:** `crud.get_realtime_view` usa `IDLE_AFTER_SECONDS=300` e `OFFLINE_AFTER_SECONDS=900`; não consulta `SystemSettings.idle_timeout_seconds`. O Agent consulta `/config/` e altera seu comportamento de captura/polling.
- **Comportamento esperado:** decidir e aplicar no servidor quais parâmetros controlam status; definir separadamente inatividade de uso e conexão do Agent.
- **Impacto no Frontend:** salvar configuração não muda as classificações exibidas, embora a tela mostre o valor global.
- **Endpoints/schemas:** `GET/PUT /config/`, `SystemSettingsUpdate`, `GET /activities/realtime`.
- **Evidências:** `backend/app/crud.py`, `utils.py`, `routers/config.py`; `agent/Services/SettingsPollingService.cs`.
- **Dependências:** BE-10 e definição de produto.
- **Critérios de aceite:** alteração de configuração tem efeito determinístico documentado e testado; atividade inativa não vira estado de conexão sem regra aprovada.
- **Testes necessários:** teste de integração com diferentes limites, instantes de captura e flag `is_idle`.
- **Issue/PR relacionada:** não confirmada.

### BE-06 — Empate de capturas e idempotência de atividade

- **Responsável / prioridade / status:** Backend e Agent; Alta; **DEPENDENTE DO BACKEND E DO AGENT**.
- **Descrição técnica:** realtime pode retornar mais de uma captura por usuário quando várias linhas compartilham o maior `captured_at`; retries de fila não têm identificador idempotente de evento.
- **Comportamento atual comprovado:** subquery agrega por usuário e `max(captured_at)`, depois faz join que pode retornar empates. `ActivityLogCreate` e `ActivityLog` não têm chave de evento externa; cada POST de `create_activity_log` insere nova linha. O Agent mantém fila persistente com retry.
- **Comportamento esperado:** desempate estável (ou identidade por máquina) e mecanismo idempotente para reenvio de eventos.
- **Impacto no Frontend:** `validRealtime` rejeita duplicatas do mesmo username; resumo e exportação podem somar duplicatas já persistidas.
- **Endpoints/schemas:** `POST /activities/`, `GET /activities/realtime`, `ActivityLogCreate`, `ActivityLog`.
- **Evidências:** `backend/app/crud.py:get_realtime_view/create_activity_log`, `backend/app/schemas.py:ActivityLogCreate`, `agent/Services/QueueSenderService.cs`.
- **Dependências:** formato de evento do Agent e estratégia de confirmação de persistência.
- **Critérios de aceite:** mesmo evento reenviado não duplica registro/tempo; realtime devolve uma linha determinística por máquina ou escopo acordado.
- **Testes necessários:** empates, repetição do mesmo evento, retry após timeout e duas máquinas do mesmo username.
- **Issue/PR relacionada:** não confirmada.

### BE-07 — Capturas futuras e referência de fuso

- **Responsável / prioridade / status:** Backend; Alta; **DEPENDENTE DO BACKEND**.
- **Descrição técnica:** `captured_at` pode ser informado sem limite máximo e o sumário agrupa por `date(captured_at)` sem contrato de fuso.
- **Comportamento atual comprovado:** `ActivityLogCreate.captured_at` é opcional e não rejeita horário futuro. Realtime calcula `(now - captured_at)` e pode produzir segundos negativos. `get_daily_summary` usa `func.date(captured_at)`; o schema `DailySummaryResponse` não declara timezone.
- **Comportamento esperado:** definir tolerância de clock skew, referência de data de negócio e normalização UTC/`America/Sao_Paulo` no servidor.
- **Impacto no Frontend:** resposta realtime negativa é rejeitada; o Dashboard não pode afirmar virada de dia ou soma diária em Brasília com evidência atual.
- **Endpoints/schemas:** `/activities/`, `/activities/realtime`, `/dashboard/summary`, `ActivityLogCreate`, `DailySummaryResponse`.
- **Evidências:** `backend/app/schemas.py`, `crud.py:get_realtime_view/get_daily_summary`, `models.py:ActivityLog`.
- **Dependências:** sincronização de relógio do Agent e regra de negócio do produto.
- **Critérios de aceite:** capturas fora da tolerância são tratadas explicitamente; sumário define e testa o timezone, inclusive meia-noite e horário de verão aplicável.
- **Testes necessários:** captura futura/passada, offset UTC, virada do dia e banco suportado.
- **Issue/PR relacionada:** não confirmada.

### BE-08 — Exportações globais e segurança/fidelidade dos arquivos

- **Responsável / prioridade / status:** Backend; Média; **DEPENDENTE DO BACKEND**.
- **Descrição técnica:** exportações herdam escopo global do sumário, CSV não neutraliza conteúdo de fórmula e PDF tem título que sugere produtividade além do agregado por categoria.
- **Comportamento atual comprovado:** `/dashboard/export/csv` e `/dashboard/export/pdf` são públicos e usam o sumário global; `csv.writer` serializa campos sem neutralização explícita de fórmula; o PDF tem título “Relatorio de Produtividade” embora liste tempo por categoria. Não foi gerado arquivo com dados reais nesta auditoria.
- **Comportamento esperado:** aplicar autorização/escopo do gestor; definir neutralização CSV e título/semântica fiéis aos dados.
- **Impacto no Frontend:** filtro por username não é controle de autorização; download pode conter dados de outras equipes.
- **Endpoints/schemas:** exportações CSV/PDF e `/dashboard/summary`.
- **Evidências:** `backend/app/routers/dashboard.py:export_csv/export_pdf`, `crud.py:get_daily_summary`; aviso de escopo em `ReportsPage.jsx`.
- **Dependências:** BE-01, regra de agregação e revisão de segurança de arquivos.
- **Critérios de aceite:** autorização cruzada negada, CSV abre sem execução de fórmula a partir de dados de texto e título descreve o conteúdo real.
- **Testes necessários:** dois gestores, células com prefixos de fórmula e caracteres Unicode/acentos em PDF.
- **Issue/PR relacionada:** não confirmada.

### BE-09 — Configuração singleton sem garantia transacional

- **Responsável / prioridade / status:** Backend; Média; **DEPENDENTE DO BACKEND**.
- **Descrição técnica:** `SystemSettings` usa chave UUID sem constraint singleton; `get_settings` consulta `.first()` e cria registro quando ausente.
- **Comportamento atual comprovado:** duas inicializações concorrentes podem criar configurações diferentes; não há registro canônico assegurado. Schemas aceitam inteiros `>=1` sem limite superior. Não foi reproduzido em banco.
- **Comportamento esperado:** garantir uma única configuração e definir limites compatíveis com o banco/semântica.
- **Impacto no Frontend:** leitura/edição pode atingir linha não determinística; limite alto pode exceder capacidade/operabilidade do Agent.
- **Endpoints/schemas:** `/config/`, `SystemSettings`, `SystemSettingsUpdate`.
- **Evidências:** `backend/app/models.py:SystemSettings`, `crud.py:get_settings/update_settings`, `schemas.py:SystemSettingsBase`.
- **Dependências:** migração/estratégia de singleton.
- **Critérios de aceite:** inicializações concorrentes resultam em uma linha; limites inválidos são rejeitados no servidor.
- **Testes necessários:** concorrência em banco suportado e limites mínimo/máximo.
- **Issue/PR relacionada:** não confirmada.

### BE-10 — Realtime não comprova conexão do Agent

- **Responsável / prioridade / status:** Backend e Agent; Média; **DEPENDENTE DO BACKEND E DO AGENT**.
- **Descrição técnica:** resposta é agrupada por usuário, usa `captured_at` enviado pelo Agent e classifica `offline` por `is_idle` ou idade; não contém instante de recebimento por máquina.
- **Comportamento atual comprovado:** `is_idle=true` pode produzir `offline` mesmo em captura recente; múltiplos Agents de um usuário não são distinguidos por um contrato de status.
- **Comportamento esperado:** status por identidade estável de máquina com `last_received_at` do servidor; inatividade de uso separada de conectividade.
- **Impacto no Frontend:** textos das telas descrevem estado como cálculo de atividade e informam que “offline” não prova desconexão. Frontend não infere conexão.
- **Endpoints/schemas:** `GET /activities/realtime`, `RealtimeEntry`, `ActivityLogCreate`; futuro endpoint de status ainda não definido.
- **Evidências:** `backend/app/crud.py:get_realtime_view`, `schemas.py:RealtimeEntry`, `agent/Services/QueueSenderService.cs`.
- **Dependências:** heartbeat/recebimento e identificador de máquina.
- **Critérios de aceite:** usuário idle com heartbeat recente continua conectado; ausência de recebimento >15 min é calculada por máquina, se essa regra permanecer aprovada.
- **Testes necessários:** idle com heartbeat, perda de rede, retry de fila e dois Agents por usuário.
- **Issue/PR relacionada:** não confirmada.

## Pendências do Agent

### AG-01 — Rota e payload de associação incompatíveis

- **Responsável / prioridade / status:** Agent; Alta; **DEPENDENTE DO AGENT**.
- **Descrição técnica:** o cliente local ainda chama o caminho e campos usados por contrato anterior.
- **Comportamento atual comprovado:** backend implementa `POST /collaborators/associate` com `association_code`, `username` e `machine_name`; o Agent configura `associate/` e envia `code`, `username` e `hostname`. Resposta backend retorna `access_token`; Agent aceita esse nome. Backend pode retornar `429` com `Retry-After`; tratamento do Agent não lista `429` como erro específico.
- **Comportamento esperado:** alinhar endpoint, nomes de campos e mensagens/cooldown para `429`, mantendo código como string para zeros à esquerda e token de Agent distinto do JWT de gestor.
- **Impacto no Frontend:** código é apresentado pelo Dashboard, mas associação não conclui com a versão atual do Agent até alinhamento.
- **Endpoints/schemas:** backend `POST /collaborators/associate`, `AssociationRequest`, `AssociationOut`; Agent `AssociateRequestDto`, `appsettings.json`, `ApiClient.AssociateAsync`.
- **Evidências:** `agent/appsettings.json`, `agent/Dtos/ApiDtos.cs`, `agent/Services/ApiClient.cs`; `backend/app/routers/users.py`, `schemas.py`.
- **Dependências:** equipe do Agent; backend implementado pela PR #146.
- **Critérios de aceite:** teste real de associação nova, idempotente, inválida, já ligada a outro gestor e `429`; Agent persiste/usa token do Agent sem expô-lo.
- **Testes necessários:** testes Agent para DTO/rota/status e integração com backend em banco descartável.
- **Issue/PR confirmada:** PR #146 mergeado em `cccc5ac`; PR #122 é citado no histórico do Agent, mas não foi usado como prova de compatibilidade atual.

### AG-02 — Consulta de Tasks para token do Agent

- **Responsável / prioridade / status:** Backend e Agent; Alta; **DEPENDENTE DO BACKEND E DO AGENT**.
- **Descrição técnica:** bandeja do Agent consome `/tasks/my-tasks`; backend expõe apenas `/tasks/` com `get_current_manager`.
- **Comportamento atual comprovado:** não existe rota literal `GET /tasks/my-tasks`; o caminho coincide com `GET /tasks/{task_id}` e a validação UUID do backend responde `422`. `GET /tasks/` requer JWT com audiência de gestor, distinto do token de Agent.
- **Comportamento esperado:** endpoint autenticado por token de Agent, consulta atribuídas ao colaborador do token e retorna apenas IDs/títulos/descrições permitidos; agente adapta URL e trata erros/expiração.
- **Impacto no Frontend:** Tasks podem ser criadas/atribuídas pelo gestor, mas a bandeja do Agent não consegue buscar essa lista pelo contrato atual.
- **Endpoints/schemas:** backend `tasks.py`, `security.decode_agent_token`; Agent `appsettings.json:MyTasks`, `ApiClient.GetMyTasksAsync`, `TaskDto`.
- **Evidências:** `agent/appsettings.json` declara `tasks/my-tasks`; backend `backend/app/routers/tasks.py` lista só rota `/` e itens, todos sob `get_current_manager`.
- **Dependências:** associação de colaborador e BE-02.
- **Critérios de aceite:** Agent A recebe somente Tasks atribuídas a A; token ausente/inválido/expirado resulta em erro apropriado; token de gestor não é usado pelo Agent.
- **Testes necessários:** dois colaboradores/equipes, listas vazias, Task não atribuída, token cruzado e expiração.
- **Issue/PR confirmada:** PR #144 mergeado em `189a7e9` adiciona cliente de bandeja; a rota correspondente do backend não foi encontrada.

### AG-03 — Atividade não identifica Agent nem Task

- **Responsável / prioridade / status:** Backend e Agent; Alta; **DEPENDENTE DO BACKEND E DO AGENT**.
- **Descrição técnica:** `ActivityLogCreate` não inclui `task_id` nem identificador idempotente/máquina; rota de ingestão não autentica token de Agent.
- **Comportamento atual comprovado:** Agent envia `username`, `hostname`, `process_name`, `window_title`, `duration_seconds`, `is_idle`, `captured_at`; backend aceita esses campos e não vincula a Task selecionada.
- **Comportamento esperado:** contrato para autoria do Agent, identidade de máquina, evento idempotente e Task ativa, com consentimento/semântica de duração definidos.
- **Impacto no Frontend:** Dashboard não apresenta horas por Task; estado online/offline não é conexão comprovada. O mock de resumo por Task é usado só em desenvolvimento/testes.
- **Endpoints/schemas:** `POST /activities/`, `ActivityLogCreate`, `ActivityLog`; Agent `ActivityLogCreateDto`, `AgentOrchestrator`.
- **Evidências:** `backend/app/schemas.py`, `routers/activities.py`, `models.py`; `agent/Dtos/ApiDtos.cs`, `Services/ApiClient.cs`.
- **Dependências:** desenho de endpoint Agent, ciclo de início/troca/fim e regras de duração/atividade.
- **Critérios de aceite:** evento prova identidade de Agent; repetição não duplica; mudança de Task é registrada sem sobreposição; dados por gestor e colaborador são autorizados.
- **Testes necessários:** início, troca, encerramento, fila/retry, duas máquinas e associação a gestor distinto.
- **Issue/PR relacionada:** PR #144 inclui controle local de Task em bandeja; não confirma envio de `task_id` à API.

## Pendências de integração e validação

### I-01 — Jornada e resumo real por Task

- **Responsável / prioridade / status:** Backend/Agent/Produto; Alta; **BLOQUEADO POR CONTRATO**.
- **Descrição técnica:** não há endpoints para jornada de primeira/última atividade nem agregação autorizada de duração por Task.
- **Comportamento atual comprovado:** backend expõe sumário diário por categoria e realtime; não tem `/dashboard/tasks-summary`, `/dashboard/attendance` ou `/dashboard/task-hours`. `useTaskAnalytics` usa `devApi`; em produção mostra indisponível. Nenhuma duração é derivada de realtime ou categoria.
- **Comportamento esperado:** definir dados ligados a Task, timezone, registros sem Task, inatividade, tarefas sem eventos e filtros autorizados; então implementar endpoint/schema.
- **Impacto no Frontend:** card de resumo por Task e indicadores de jornada permanecem indisponíveis em produção; dados não são fabricados.
- **Endpoints/schemas:** atual `GET /dashboard/summary`/`DailySummaryResponse`; agregações por Task/jornada ausentes.
- **Evidências:** routers `backend/app/routers/dashboard.py`, schema sem Task, `FrontEnd/src/features/dashboard/hooks/useTaskAnalytics.js`.
- **Dependências:** AG-03, BE-01, BE-07 e definição de produto.
- **Critérios de aceite:** só registros persistidos com `task_id` são agregados; timezone e limites são claros; autorização de equipe testada.
- **Testes necessários:** usuário com/sem registros, Task sem eventos, atividade geral, timezone, filtro e gestor cruzado.
- **Issue/PR relacionada:** não confirmada.

### I-02 — Homologação de integração real

- **Responsável / prioridade / status:** Frontend/Backend; Média; **PENDENTE DE AMBIENTE**.
- **Descrição técnica:** validar contratos novos com FastAPI e banco de teste reais sem dados de produção.
- **Comportamento atual comprovado:** Vitest/MSW e Playwright interceptado exercitam formatos e UI; ainda não comprovam CORS, migração, persistência, autorização real ou dados de banco.
- **Comportamento esperado:** ambiente descartável/homologação com gestores e colaboradores de teste, origem HTTPS/CORS configurada e credenciais autorizadas.
- **Impacto no Frontend:** FE-01/FE-02 não recebem status “homologado” apenas por passar mocks.
- **Endpoints/schemas:** `/auth/register`, `/auth/login`, `/auth/me`, CRUD `/tasks`; associação do Agent quando alinhada.
- **Evidências:** `FrontEnd/e2e/real-api.spec.js` opt-in; nenhuma chamada real foi feita durante esta auditoria.
- **Dependências:** backend, banco, credenciais de teste e configuração `RUN_REAL_API`/`VITE_API_URL`.
- **Critérios de aceite:** smoke read-only autorizado de sessão, tarefas e respostas; criar/editar/excluir somente em banco descartável dedicado.
- **Testes necessários:** `npm run test:e2e:real` com ambiente confirmado; suíte não é executada contra produção.
- **Issue/PR relacionada:** nenhuma confirmada.

### F-01 — PWA e validação humana

- **Responsável / prioridade / status:** Frontend/Produto; Baixa; **NECESSITA DEFINIÇÃO**.
- **Descrição técnica:** o frontend é responsivo, mas não possui política PWA/offline nem homologação humana de leitores de tela, zoom nativo e matriz de navegadores.
- **Comportamento atual comprovado:** há testes automatizados de layout e axe-core; não há manifest/service worker nem validação em dispositivos reais nesta tarefa.
- **Comportamento esperado:** definir navegadores, largura mínima, instalação, cache permitido e fluxo offline/logout antes de implementar persistência local.
- **Impacto no Frontend:** instalação/offline e validação humana permanecem fora da homologação automática.
- **Endpoints/schemas:** não se aplica.
- **Evidências:** configuração Vite e `FrontEnd/e2e/accessibility.spec.js`; ausência de manifest/service worker.
- **Dependências:** decisão de produto e política de dados sensíveis.
- **Critérios de aceite:** matriz aprovada e execução manual documentada em dispositivos/navegadores alvo.
- **Testes necessários:** leitor de tela, zoom nativo e tamanhos definidos após decisão.
- **Issue/PR relacionada:** não confirmada.

## Histórico e limites desta auditoria

- Os PRs #142, #145 e #146 foram confirmados pela ancestralidade Git local; não foram tratados como presentes apenas por referência no pedido.
- O PR #142 adiciona CRUD manager-scoped; o PR #145 inclui código no perfil autenticado; o PR #146 implementa associação via `/collaborators/associate`.
- Mocks de Task e agregações de Dashboard continuam isolados por `import.meta.env.DEV`/testes e não são prova de integração real.
- Esta atualização alterou somente documentos e código em `FrontEnd/`; `backend/`, `agent/` e `requisitos/` foram consultados em leitura.

---

## Snapshot histórico preservado — versão anterior a 30/10/2026

O conteúdo abaixo registra pendências e status do checkout anterior. Ele foi mantido para rastreabilidade e não representa o estado atual descrito no início deste arquivo.

# Pendências do frontend e dependências externas

Revisão: **22/10/2026**. `backend/`, `agent/` e `requisitos/` foram consultados somente para leitura. Os IDs em **Problema/requisito** apontam para [RN/RF](../../requisitos/requisitos/rn_rf.md), [RNF](../../requisitos/requisitos/rnf.md), [critérios de aceite](../../requisitos/requisitos/ca.md) ou [RBAC](../../requisitos/rbac.md). Situação e prioridade refletem o código e os contratos observados neste checkout.

As PRs #122 (Agent, merge `e43673b4dca212eaa991308d14c9dc25b6c64061`) e #123 (autenticação do backend, merge `0fc4e7b7333ceb4fdd120f7f1f753f9836163e30`) já foram incorporadas à `main` da organização. A issue #138 de 21/10 e esta revisão integram a sessão do gestor no frontend. A apresentação aprovada em 13/10 permanece como registro histórico; ela não elimina o novo fluxo. Associação no backend continua ausente.

## Navegação

- [Auditoria de dependências](#auditoria-dependencias)
- [Estado do MVP](#estado-do-mvp)
- [Resumo das pendências](#resumo-das-pendencias)
- [Pendências do Backend](#pendencias-backend)
- [Pendências de integração](#pendencias-integracao)
- [Pendências do Agent](#pendencias-agent)
- [Pendências futuras do Frontend](#pendencias-frontend)
- [Propostas de contratos](#propostas-de-contratos-de-integracao)
  - [Tasks e escopo](#proposta-tasks-crud)
  - [Colaboradores atribuídos às Tasks](#proposta-task-collaborators)
  - [Código de associação do gestor](#proposta-association-code)
  - [Associação do Agent](#proposta-agent-association)
  - [Autorização e isolamento](#proposta-authorization)
  - [Primeiro e último registro diário](#proposta-attendance)
  - [Horas agregadas por Task](#proposta-task-hours)
  - [Datas e fusos horários](#proposta-timezone)
- [Decisões pendentes da liderança](#decisoes-pendentes-lideranca)
- [Próximos passos](#proximos-passos)

<a id="auditoria-dependencias"></a>

## Auditoria de dependências npm — 13/10/2026

Depois das correções compatíveis abaixo, `npm audit --json` reportou **7 entradas** no grafo de desenvolvimento: 5 altas e 2 moderadas. Os pacotes de produção não aparecem como vulneráveis. O relatório agrupa cadeias transitivas; não é evidência de exploração do projeto.

| Pacote instalado                                                                               | Dependência                                      | Severidade/estado                                                                                                                                                      | Decisão                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vite` 6.4.3 → 6.4.4                                                                           | Direta de desenvolvimento                        | Dois advisories upstream recentes (1 baixa, 1 moderada) afetavam `<=6.4.3`; 6.4.4 corrige na mesma linha 6.x.                                                          | Corrigido em `package.json` e `package-lock.json`; build, cobertura e E2E passaram com 6.4.4.                                                                                               |
| `source-map-js` 1.2.1 → 1.2.2                                                                  | Transitiva via PostCSS e `magicast`              | Alta; 1.2.2 é a versão corrigida dentro do intervalo declarado.                                                                                                        | Corrigido no lockfile; reduziu a contagem do npm de 8 para 7.                                                                                                                               |
| `braces` 3.0.3, `chokidar` 3.6.0, `micromatch` 4.0.8, `fast-glob` 3.3.3 e `tailwindcss` 3.4.17 | Transitivas e Tailwind direto de desenvolvimento | 5 entradas altas associadas à vulnerabilidade de recursão do `braces`; o advisory não informa versão corrigida para `braces`. O `npm audit` sugere Tailwind CSS 4.3.3. | Não aplicar: o salto para Tailwind 4 é major e requer revisão/migração visual e de configuração. `fast-glob` e `micromatch` já estão nas versões compatíveis máximas publicadas observadas. |
| `postcss-selector-parser` 6.1.4 e `postcss-nested` 6.2.0                                       | Transitivas do Tailwind                          | 2 entradas moderadas. A correção 7.1.6 fica fora das faixas `^6.x` exigidas pelos consumidores atuais.                                                                 | Não aplicar override major sem validação; a correção automatizada sugerida também migra para Tailwind 4.                                                                                    |

O resultado atual do `npm audit` não listou Vite, embora advisories oficiais do próprio projeto indiquem que 6.4.3 era afetado. O Vite foi atualizado com base nesses advisories. O histórico da instalação que reportou inicialmente 8 vulnerabilidades permanece em [Testes](TESTES.md).

<a id="estado-do-mvp"></a>

## Estado do MVP — revisão de 21/10/2026

| Funcionalidade                           | Prioridade              | Estado                                 | Área/frontend afetado                         | Contrato/dependência e impacto                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------- | ----------------------- | -------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrada e saída/últimos registros do dia | Alta                    | **BLOQUEADO POR BACKEND**              | `DashboardPage`; filtros por data e usuário   | Não ha endpoint de jornada, agregação diária nem campos confiáveis de primeiro/último registro. `GET /activities/realtime` representa a última leitura atual e não serve como entrada/saída. O backend precisa fornecer registros extremos por dia e agrupar segundo `America/Sao_Paulo`; até lá o painel não exibe horários inventados. Detalhes: I-06/I-07. |
| Gerenciar Tasks persistidas              | Alta                    | **UI PARCIAL; INTEGRAÇÃO BLOQUEADA**   | `TasksPage`; resumo do Dashboard              | A UI de lista/formulário/edição/exclusão e o resumo por Task funcionam somente com serviço demonstrativo em desenvolvimento. Os mocks são voláteis; produção não chama rotas não confirmadas. Backend não oferece CRUD, atribuições ou agregação persistente (#133/#140). Detalhes: I-03 e proposta candidata.                                                |
| Relacionar Task ao Agent/atividade       | Alta para monitoramento | **BLOQUEADO POR BACKEND/AGENT**        | `TasksPage`; integração futura                | Payload do Agent e atividade não tem `task_id`; não ha comando/seleção/início/fim de Task. Criar uma Task no futuro não poderá ser anunciado como início de monitoramento sem esse contrato separado. Detalhes: I-03.                                                                                                                                         |
| Sessão e páginas do gestor               | Alta                    | **FRONTEND IMPLEMENTADO; B-01 ABERTO** | `ManagerSessionProvider`, `App`, rotas e menu | #138 integrou cadastro/login, validação `/auth/me`, `sessionStorage` e guardas. B-01 permanece aberto: API de dados sem JWT obrigatório nem isolamento por gestor. O status de MVP aberto em 13/10 é histórico e foi atualizado pela issue #138 de 21/10.                                                                                                     |

Os bloqueios funcionais impedem concluir o recorte anunciado como utilizável somente com o frontend atual. A apresentação de status realtime e o resumo por categoria continuam sendo fontes distintas; nenhuma delas é convertida em jornada ou Task.

### Entregas frontend desta revisão — 22/10/2026

- O filtro de aplicativo deriva opções dos `process_name` recebidos no realtime e filtra somente a tabela atual de última atividade. Pode ser combinado com o usuário selecionado; não altera os indicadores ou o resumo diário e não responde a perguntas históricas de uso.
- A demonstração de Tasks em desenvolvimento oferece lista, criação, edição e exclusão em memória, título/descrição, seleção múltipla de colaboradores, busca e ordenação. Produção apresenta a prévia desabilitada enquanto o CRUD backend não existe.
- O Dashboard tem filtro e card de resumo por Task isolados dos indicadores gerais. O mock de `/dashboard/tasks-summary` responde vazio, sem fabricar métricas. O card agora consegue apresentar um resumo recebido e distingue origem da API, demonstração, erro, carregamento e ausência de registros; a página de produção ainda não fornece esse resumo e mantém o aviso de integração pendente.
- A resolução de `VITE_API_URL` usa `http://localhost:8000` somente durante o desenvolvimento e usa a mesma origem em produção quando não configurada. Uma origem separada continua sendo fornecida no build e depende de CORS/HTTPS no ambiente publicado.
- A leitura do Backend local confirmou que `/dashboard/tasks-summary`, `TaskId` em `ActivityLog` e a resposta de agregação por Task continuam ausentes. A integração de produção segue bloqueada; a proposta candidata de contrato não é uma rota implementada.

<a id="resumo-das-pendencias"></a>

## Resumo das pendências

**Atualização de alinhamentos da liderança: 02/10/2026.** As decisões abaixo foram incorporadas às entradas I-01, I-03, I-05/B-10, I-06, I-07, B-03 e B-06. Elas registram a direção acordada; não significam que backend, Agent ou contratos já tenham sido alterados.

| ID   | Pendência                                                         | Área                 | Prioridade | Status                                               |
| ---- | ----------------------------------------------------------------- | -------------------- | ---------- | ---------------------------------------------------- |
| B-01 | Autorização dos endpoints e isolamento dos dados                  | Backend              | Alta       | AGUARDANDO BACKEND                                   |
| B-02 | CORS e HTTPS por ambiente                                         | Backend              | Alta       | AGUARDANDO BACKEND                                   |
| B-03 | Seed incompatível com chave UUID                                  | Backend              | Alta       | AGUARDANDO BACKEND                                   |
| B-04 | Limite salvo não aplicado ao realtime                             | Backend              | Média      | PARCIAL; BACKEND PENDENTE                            |
| B-05 | Capturas empatadas no realtime                                    | Backend              | Média      | AGUARDANDO BACKEND                                   |
| B-06 | Reenvio de atividades sem deduplicação                            | Backend              | Alta       | AGUARDANDO BACKEND                                   |
| B-07 | Datas futuras e tempo relativo negativo                           | Backend              | Média      | AGUARDANDO BACKEND                                   |
| B-08 | Segurança e fidelidade dos arquivos exportados                    | Backend              | Média      | AGUARDANDO BACKEND                                   |
| B-09 | Configuração global sem unicidade garantida                       | Backend              | Média      | AGUARDANDO BACKEND                                   |
| B-10 | Flag de inatividade pode gerar status `offline`                   | Backend              | Média      | AGUARDANDO BACKEND                                   |
| I-01 | Conta, login e sessão do gestor                                   | Integração           | Alta       | FRONTEND IMPLEMENTADO; B-01 ABERTO                   |
| I-02 | Associação gestor–colaborador e código                            | Integração           | Alta       | AGENT INTEGRADO; BACKEND BLOQUEADO                   |
| I-03 | Tasks, atribuição, escopo e monitoramento consentido              | Integração           | Alta       | BLOQUEADO                                            |
| I-04 | Jornada individual e possível hora extra                          | Integração           | Alta       | BLOQUEADO                                            |
| I-05 | Conexão real do agente                                            | Integração           | Média      | BLOQUEADO                                            |
| I-06 | Dashboard, timeline e relatórios completos                        | Integração           | Alta       | BLOQUEADO                                            |
| I-07 | Referência de fuso e virada do dia                                | Integração           | Média      | BLOQUEADO                                            |
| I-08 | Teste de integração com serviço real                              | Integração           | Média      | PENDENTE DE AMBIENTE                                 |
| F-01 | Integração das telas após contratos                               | Frontend             | Alta       | BLOQUEADO                                            |
| F-02 | Instalação PWA e política offline                                 | Frontend             | Média      | FRONTEND FUTURO                                      |
| F-03 | Validação humana e matriz de navegadores                          | Frontend             | Média      | FRONTEND FUTURO                                      |
| F-04 | Harmonizar caminho POST de Task demonstrativa                     | Frontend             | Baixa      | RESOLVIDO — DEMONSTRATIVO; VALIDAÇÃO LOCAL CONCLUÍDA |
| D-01 | Atualizar [responsividade.md](../../requisitos/responsividade.md) | Documentação externa | Baixa      | AGUARDANDO REVISÃO EXTERNA                           |
| A-01 | Identidade e revisão visual da interface desktop do Agent         | Agent                | Alta       | ABERTO PARA EQUIPE DO AGENT                          |

Cada ID identifica uma pendência específica para facilitar referências no texto e na ordem de execução. A letra indica a área: `B` = backend, `I` = integração entre frontend e backend, `F` = frontend, `A` = Agent e `D` = documentação externa. O número distingue os itens da mesma área; não indica prioridade nem status, que aparecem em colunas próprias.

Os status descrevem a dependência atual; a prioridade indica impacto. Eles não indicam que todo o frontend esteja parado.

| Status                                                   | Significado                                                                                                                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BLOQUEADO**                                            | A funcionalidade não pode ser concluída com os contratos, dados ou ambiente disponíveis no momento; depende de definição ou implementação externa.                            |
| **ADIADO PARA DEPOIS DO MVP**                            | Decisão histórica do recorte de 13/10, atualizada para autenticação pelo pedido da issue #138 em 21/10; a linha atual da sessão está no resumo acima.                         |
| **AGUARDANDO BACKEND**                                   | A correção precisa ser feita ou garantida no servidor, como a autorização dos endpoints.                                                                                      |
| **PARCIAL; BACKEND PENDENTE**                            | O Agent já consome a configuração, mas a classificação realtime ainda depende de limites próprios do backend.                                                                 |
| **AGENT INTEGRADO; BACKEND BLOQUEADO**                   | O cliente Agent da PR #122 foi integrado; geração/consulta de código, associação e vínculo autorizado continuam ausentes no backend; consulte I-02.                           |
| **PENDENTE DE AMBIENTE**                                 | O cenário de integração está preparado; falta serviço real, banco, origem configurada e dados autorizados para executá-lo.                                                    |
| **DIVERGÊNCIA DE GRAFIA; COMPATIBILIDADE NÃO VALIDADA**  | Status histórico do checkpoint anterior à validação de F-04; o teste integrado posterior reproduziu a falha e a rota foi corrigida. Consulte o registro de 21/10/2026 abaixo. |
| **RESOLVIDO — DEMONSTRATIVO; VALIDAÇÃO LOCAL CONCLUÍDA** | O caminho demonstrativo foi harmonizado e os testes focados, inclusive cliente + MSW real de testes, passaram. Isso não conclui #133 ou #134. Consulte F-04.                  |
| **FRONTEND IMPLEMENTADO; B-01 ABERTO**                   | Cadastro, login, sessão e guarda de navegação existem no frontend; as rotas privadas ainda precisam exigir JWT e isolar dados no backend.                                     |
| **FRONTEND FUTURO**                                      | Trabalho previsto para uma etapa posterior do frontend, como instalação PWA ou validação em dispositivos reais.                                                               |
| **ABERTO PARA EQUIPE DO AGENT**                          | Há correção ou revisão necessária em arquivos do Agent, que foram consultados somente para leitura nesta auditoria.                                                           |
| **AGUARDANDO REVISÃO EXTERNA**                           | Depende da revisão de um documento fora de `FrontEnd/`; neste caso, `requisitos/responsividade.md`.                                                                           |

As seções abaixo trazem requisitos, motivo e trabalho necessário para cada ID. O motivo específico aparece em **Motivo do bloqueio** ou **Motivo da pendência**.

<a id="pendencias-backend"></a>

## Pendências do backend

### B-01 — Autorização dos endpoints e isolamento dos dados — Alta

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** ausência de autorização; [RN-15](../../requisitos/requisitos/rn_rf.md#rn-15--controle-de-acesso-aos-dados), [RF-23](../../requisitos/requisitos/rn_rf.md#rf-23--consultar-registros), [CA-09](../../requisitos/requisitos/ca.md#ca-09--privacidade-e-segurança) e [escopo de acesso no RBAC](../../requisitos/rbac.md#5-escopo-de-acesso).
- **Frontend afetado:** todas as páginas com dados, especialmente `SettingsPage`, `DashboardPage`, `CollaboratorsPage` e `ReportsPage`.
- **Backend relacionado:** `app/main.py`, routers `users`, `activities`, `dashboard` e `config`.
- **Atual/impacto:** `get_current_manager` protege `GET /auth/me`, mas não está aplicado aos endpoints de dados. Consultas globais e `PUT /config/` permitem leitura/escrita sem identidade validada.
- **Alteração necessária:** impor identidade, permissões e restrição por equipe no servidor, inclusive nas exportações e no recebimento de atividades.
- **Workaround frontend:** não existe para proteção real; avisos informam a limitação, mas não protegem a API.
- **Motivo do bloqueio:** esconder componentes ou filtrar listas localmente não autoriza nem isola dados no servidor. O frontend agora exige sessão válida antes de abrir páginas do gestor e envia Bearer nas consultas privadas, mas a autorização das rotas e o isolamento continuam ausentes.
- **Contrato necessário:** aplicar `get_current_manager` às rotas de usuários, atividades realtime, resumo/exportação, configurações e demais dados privados; associar consultas ao gestor identificado e retornar `401` sem token válido e `403` quando autenticado sem permissão. O `PUT /activities/` do Agent deve usar credencial própria e escopo por colaborador, sem aceitar JWT do gestor como identidade do Agent.
- **Critérios de aceite:** testar sem token, token inválido/expirado, gestor A lendo e alterando dados do gestor B, exportações, configuração e envio de atividades do Agent; provar isolamento em testes de API.
- **Frontend realizado:** `ManagerSessionProvider`, guarda das cinco páginas de gestor, Bearer centralizado, expiração em `401`, preservação de `403`, logout acessível e sessão em `sessionStorage`. Isso não substitui autorização do servidor.
- **Política proposta:** [autorização e isolamento por gestor](#proposta-authorization).

### B-02 — CORS e HTTPS por ambiente — Alta

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** política de origem ampla e transmissão segura ainda dependente da implantação; [RNF-03](../../requisitos/requisitos/rnf.md#rnf-03--comunicação-segura)/[CA-09](../../requisitos/requisitos/ca.md#ca-09--privacidade-e-segurança).
- **Frontend afetado:** `src/shared/api/api.js` e todas as requisições.
- **Backend relacionado:** `app/main.py`, configuração de serviço/reverse proxy externa.
- **Atual/impacto:** `allow_origins=["*"]` com `allow_credentials=True`; o cliente usa `localhost:8000` somente no desenvolvimento e a mesma origem no build de produção sem variável configurada. O ambiente real não foi validado.
- **Alteração necessária:** definir origens, credenciais e HTTPS por ambiente; fornecer a origem correta para `VITE_API_URL`.
- **Workaround frontend:** `VITE_API_URL` pode ser configurada no build quando a API tem origem separada; a mesma origem pode ser usada por proxy reverso. Isso não cria TLS nem corrige CORS no servidor.
- **Motivo do bloqueio:** infraestrutura e política de resposta HTTP estão fora de `FrontEnd`.

### B-03 — Seed incompatível com chave UUID — Alta

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** `seed.py` usa `SystemSettings.id == 1` e insere `id=1`, enquanto o modelo declara UUID; sem RF específico.
- **Frontend afetado:** `SettingsPage`, leitura/gravação de configurações.
- **Backend relacionado:** `seed.py`, `app/models.py`.
- **Atual/impacto:** incompatibilidade identificada por leitura; pode impedir seed/inicialização. Não foi executado seed nem teste de banco.
- **Alteração necessária:** alinhar seed ao tipo/chave e validar inicialização de configurações.
- **Alinhamento da liderança:** o possível bug foi identificado para alinhamento com Danyyel junto aos demais ajustes críticos do backend; ainda não há confirmação de correção.
- **Workaround frontend:** apenas mostrar erro e permitir retry; não corrige inicialização.
- **Motivo do bloqueio:** exige edição e validação de código/banco do backend.

### B-04 — Limite salvo não aplicado ao realtime — Média

- **Status:** PARCIAL; BACKEND PENDENTE.
- **Problema/requisito:** configuração editável não governa o cálculo exibido; [RF-14](../../requisitos/requisitos/rn_rf.md#rf-14--controlar-atividade-e-inatividade)/[RF-21](../../requisitos/requisitos/rn_rf.md#rf-21--configurar-limite-de-inatividade).
- **Frontend afetado:** `SettingsPage`, indicadores do painel e tabela de colaboradores.
- **Backend relacionado:** `app/crud.py:get_realtime_view`, `app/utils.py:MAX_IDLE_SECONDS`, `/config/`.
- **Atual/impacto:** o Agent consulta `/config/` e atualiza periodicamente `capture_interval_seconds` e `idle_timeout_seconds`; a classificação realtime do backend ainda usa limites próprios de 5 e 15 minutos. Salvar não altera esses limites de classificação.
- **Alteração necessária:** backend deve aplicar os limites configurados no realtime e validar a propagação; configuração individual depende de I-04.
- **Workaround frontend:** aviso explícito, já presente. Recalcular status localmente não é aceitável.
- **Motivo do bloqueio:** semântica do status e aplicação da configuração pertencem ao servidor/agente.

### B-05 — Capturas empatadas no realtime — Média

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** join pelo maior `captured_at` pode retornar várias entradas do mesmo usuário; [RF-16](../../requisitos/requisitos/rn_rf.md#rf-16--acompanhar-colaboradores-online)/[RF-27](../../requisitos/requisitos/rn_rf.md#rf-27--exibir-dashboard-analítico).
- **Frontend afetado:** `validRealtime`, `useDashboardData`, `CollaboratorsPage`.
- **Backend relacionado:** `app/crud.py:get_realtime_view`.
- **Atual/impacto:** anteriormente o Map escolhia a última entrada pela ordem da resposta; agora a fonte ambígua é rejeitada e anunciada como inválida. Demais fontes continuam disponíveis.
- **Alteração necessária:** desempate determinístico e uma entrada por usuário no servidor.
- **Workaround frontend:** degradação explícita é aceitável como proteção, mas escolher arbitrariamente uma captura não resolve o problema.
- **Motivo do bloqueio:** o frontend não recebe identificador/ordem que permita identificar a leitura correta.

### B-06 — Reenvio de atividades sem deduplicação — Alta

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** ausência de chave de idempotência/unicidade de reenvio; [RF-19](../../requisitos/requisitos/rn_rf.md#rf-19--sincronizar-registros)/[CA-05](../../requisitos/requisitos/ca.md#ca-05--armazenamento-e-sincronização)/[CA-09](../../requisitos/requisitos/ca.md#ca-09--privacidade-e-segurança).
- **Frontend afetado:** total registrado no painel e arquivos de relatório.
- **Backend relacionado:** `ActivityLogCreate`, `create_activity_log`, modelo `ActivityLog`.
- **Atual/impacto:** o Agent usa fila persistente e retry, enquanto cada POST ainda pode inserir uma atividade; reenvios podem duplicar duração agregada.
- **Alteração necessária:** definir identidade do registro e deduplicação servidor/agente com confirmação de sincronização.
- **Alinhamento da liderança:** o possível bug de reenvio/duplicidade foi encaminhado para alinhamento com Danyyel; a correção e a estratégia de idempotência ainda precisam ser confirmadas.
- **Workaround frontend:** não existe; remover totais ou deduplicar agregados no navegador perderia dados legítimos.
- **Motivo do bloqueio:** o dashboard recebe agregados sem identidade dos registros originais.

### B-07 — Datas futuras e tempo relativo negativo — Média

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** `captured_at` aceita data fornecida pelo agente sem política para relógio adiantado; [RF-13](../../requisitos/requisitos/rn_rf.md#rf-13--registrar-períodos-de-utilização)/[RF-16](../../requisitos/requisitos/rn_rf.md#rf-16--acompanhar-colaboradores-online)/[RF-27](../../requisitos/requisitos/rn_rf.md#rf-27--exibir-dashboard-analítico).
- **Frontend afetado:** validação de realtime no painel e colaboradores.
- **Backend relacionado:** `ActivityLogCreate`, `create_activity_log`, `get_realtime_view`.
- **Atual/impacto:** cutoff tem apenas limite inferior; captura futura pode produzir `seconds_since_last_activity < 0` e status online inadequado. O frontend rejeita a fonte inválida em vez de exibir segundos negativos.
- **Alteração necessária:** definir tratamento de clock skew e validar/normalizar captura no servidor, sem perder a data legítima do registro.
- **Workaround frontend:** rejeição com erro é proteção aceitável; truncar para zero esconderia o defeito.
- **Motivo do bloqueio:** a origem e a referência temporal devem ser confiáveis no servidor.

### B-08 — Segurança e fidelidade dos arquivos exportados — Média

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** CSV recebe strings diretamente e PDF chama dados de categoria de produtividade; [RF-25](../../requisitos/requisitos/rn_rf.md#rf-25--exportar-relatórios), [RN-19](../../requisitos/requisitos/rn_rf.md#rn-19--visão-gerencial-do-dashboard)/[CA-07](../../requisitos/requisitos/ca.md#ca-07--consulta-relatórios-e-exportação).
- **Frontend afetado:** downloads em `ReportsPage`.
- **Backend relacionado:** `app/routers/dashboard.py:export_csv/export_pdf`.
- **Atual/impacto:** `csv.writer` faz escape CSV, mas não neutraliza fórmulas de planilha em textos controlados externamente; título do PDF é “Relatorio de Produtividade” embora o conteúdo seja duração por categoria. Riscos identificados por leitura, sem arquivo real gerado.
- **Alteração necessária:** definir neutralização segura de fórmulas no CSV e título coerente com tempo registrado; validar caracteres Unicode no PDF com dados reais.
- **Workaround frontend:** não existe para corrigir o arquivo de origem sem transformá-lo; o frontend valida MIME/tamanho e explica seu escopo parcial.
- **Motivo do bloqueio:** a geração e a semântica do conteúdo são responsabilidade do backend.

### B-09 — Configuração global sem unicidade garantida — Média

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** `SystemSettings` é descrito como linha única, mas possui somente chave UUID; sem RF específico.
- **Frontend afetado:** `SettingsPage`.
- **Backend relacionado:** `app/models.py:SystemSettings`, `app/crud.py:get_settings/update_settings`.
- **Atual/impacto:** leitura usa `.first()` e insere quando não encontra registro. Inicialização concorrente pode criar várias linhas; não há garantia explícita de qual configuração será editada. É uma possibilidade identificada por leitura, não reproduzida no banco.
- **Alteração necessária:** garantir singleton de forma transacional e determinar registro canônico no servidor; também definir limites superiores dos inteiros compatíveis com as colunas do banco, hoje validados apenas com `ge=1` nos schemas.
- **Workaround frontend:** bloquear envios duplicados protege interações locais, mas não concorrência entre clientes nem validação do armazenamento.
- **Motivo do bloqueio:** unicidade, concorrência e limites do banco precisam ser impostos no backend, sem inventar limites de negócio no navegador.

### B-10 — Flag de inatividade pode gerar status `offline` — Média

- **Status:** AGUARDANDO BACKEND.
- **Problema/requisito:** a regra mistura inatividade de uso e conexão do agente, embora [RN-10/RF-14](../../requisitos/requisitos/rn_rf.md#rf-14--controlar-atividade-e-inatividade) e [RN-11/RF-16](../../requisitos/requisitos/rn_rf.md#rf-16--acompanhar-colaboradores-online) tratem esses conceitos separadamente.
- **Frontend afetado:** indicadores e badges de status no Dashboard e em Colaboradores.
- **Backend relacionado:** classificação de `/activities/realtime` baseada em `is_idle` e no tempo desde o último evento.
- **Comportamento no backend consultado:** quando `is_idle=true`, a API pode retornar `offline` mesmo para uma captura recém-recebida. `seconds_since_last_activity` é calculado a partir de `captured_at` enviado pelo Agent; não há timestamp separado de recebimento/persistência. Sincronização atrasada ou relógio divergente também pode distorcer a idade. Portanto, o estado atual não comprova ausência de registro recente da máquina.
- **Decisão da liderança:** considerar o Agent `offline` quando a máquina ficar mais de 15 minutos sem um novo registro no banco de dados. Inatividade de uso (`is_idle`) não deve, por si só, significar que o Agent perdeu conexão.
- **Atual/impacto:** a regra acordada ainda não está garantida pelo contrato/runtime atual: a resposta pode classificar `offline` a partir de `is_idle` ou do intervalo desde `captured_at`, agrupado pelo último registro do usuário. Não informa o último recebimento no banco por máquina.
- **Alteração necessária:** persistir timestamp de recebimento no servidor, identificar Agents/máquinas de modo estável, calcular a regra acordada por máquina sem usar `is_idle` e expor status/instante de conexão no contrato autorizado. Definir tratamento de máquinas sem registro e de colaboradores com múltiplos Agents.
- **Workaround frontend:** exibir o status retornado com texto neutro, sem reinterpretar o campo ou afirmar desconexão.
- **Motivo da pendência:** o critério de produto foi definido, mas precisa ser implementado e exposto pelo backend; o frontend não consegue inferir a última gravação da máquina a partir dos campos atuais.

**Complemento frontend (16/10/2026):** Colaboradores agora distingue o instante local de recepção da consulta da idade realtime calculada pelo servidor. O primeiro não confirma gravação no banco; o segundo ainda depende do `captured_at` enviado pelo Agent e pode refletir relógio divergente ou sincronização atrasada. Nenhum campo novo foi presumido. Para estado de conexão confiável, permanece necessário status e instante do último recebimento por identidade estável de Agent/máquina, com escopo autorizado. A equipe responsável e os critérios de aceitação já constam nesta pendência B-10.

- **Equipe responsável/contrato necessário:** equipe Backend deve persistir o instante de recebimento da gravação e associá-lo a um identificador estável de Agent/máquina; expor esse instante e `connection_status` numa resposta autenticada e limitada à equipe do gestor. O contrato também deve definir máquinas sem registro e múltiplos Agents por colaborador.
- **Critérios de aceitação:** `offline` após mais de 15 minutos sem novo registro persistido por máquina; `is_idle` não altera o estado de conexão; a resposta identifica cada máquina autorizada, declara o instante de recebimento com timezone e distingue ausência de registro de falha da consulta.

<a id="pendencias-integracao"></a>

## Pendências de integração Frontend + Backend

As descrições históricas de [Sprint 1](../../requisitos/sprints/sprint1.md), [Sprint 2](../../requisitos/sprints/sprint2.md) e [EP-01](../../requisitos/epicos/EP-01.md) mencionam dados simulados e monitoramento “fingindo” task. Elas não autorizam mocks em produção nesta revisão: prevalecem as restrições do usuário e as regras atuais de [task ativa](../../requisitos/requisitos/rn_rf.md#rn-05--monitoramento-vinculado-à-task) e [ciência do colaborador](../../requisitos/requisitos/rn_rf.md#rn-06--transparência-e-ciência). A liderança definiu que o Dashboard deve apresentar somente as horas gastas em cada task e não deve exibir rankings. I-06 continua bloqueada pela ausência de tarefas, registros vinculados e consultas agregadas; a tela de referência e RN-19/RF-27 podem precisar ser alinhados a essa decisão em documentação mantida fora de `FrontEnd/`.

### I-01 — Conta, login e sessão do gestor — Alta

- **Status técnico:** sessão e navegação do gestor implementadas no frontend; proteção dos dados **bloqueada por B-01**.
- **Problema/requisito:** [RF-02](../../requisitos/requisitos/rn_rf.md#rf-02--criar-e-acessar-conta-do-gestor)/[RF-23](../../requisitos/requisitos/rn_rf.md#rf-23--consultar-registros) e [CA-01](../../requisitos/requisitos/ca.md#ca-01--identificação-acesso-e-associação).
- **Backend implementado pela PR #123:** cadastro `POST /auth/register`, login `POST /auth/login`, JWT assinado/expirável, validação do token e consulta protegida `GET /auth/me`. O merge é `0fc4e7b7333ceb4fdd120f7f1f753f9836163e30`; `ManagerOut` contém `id`, `email`, `created_at` e não contém código de associação.
- **Histórico de produto:** na apresentação de 13/10, login/cadastro foram adiados para manter o acesso direto do MVP. A issue oficial #138, aberta em 21/10, pede integração real; a instrução de execução também autoriza sessão e rotas protegidas no frontend. Esse avanço não altera o requisito de autorização do backend.
- **Frontend implementado nesta revisão:** formulários acessíveis, validação de e-mail e senha conforme o schema real, cadastro sem login automático, login seguido de `GET /auth/me`, token somente em `sessionStorage`, restauração validada, logout, guarda das rotas do gestor, injeção centralizada de Bearer em consultas privadas e limpeza/redirect após `401`. Respostas `403` preservam a sessão.
- **Limites:** a sessão de navegador não revoga JWT no servidor; não há refresh token. As cinco rotas de dados continuam respondendo sem identidade e sem filtro por gestor. Logo, a guarda é defesa de interface e não autoriza declarar o Dashboard seguro para dados reais.
- **Alternativas avaliadas; nenhuma foi ativada:**

  | Estratégia                          | XSS e exposição                                                                   | Recarga/restauração                                                                                             | Backend necessário                                                                                     |
  | ----------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
  | JWT em memória                      | JavaScript da página ainda pode ler o token; não há cópia persistente no storage. | A recarga encerra a sessão e exige novo login.                                                                  | Nenhuma mudança para enviar o Bearer pelo contrato JSON atual.                                         |
  | `sessionStorage`                    | Legível por JavaScript e sujeito a roubo por XSS.                                 | Sobrevive à recarga da mesma aba; normalmente termina com a aba/sessão do navegador.                            | Nenhuma mudança; precisa limpar no logout e em `401`.                                                  |
  | `localStorage`                      | Legível por JavaScript e sujeito a roubo por XSS; aumenta o tempo de exposição.   | Restaura após recargas e reinício do navegador; sincronização de logout entre abas também precisa ser definida. | Nenhuma mudança; precisa limpar no logout e em `401`.                                                  |
  | Cookie `HttpOnly; Secure; SameSite` | JavaScript não lê o JWT; XSS ainda pode iniciar ações autenticadas na página.     | Enviado automaticamente e pode restaurar após recarga até expirar ou ser removido.                              | Emissão/remoção do cookie, CORS com credenciais e proteção CSRF; o contrato atual retorna JWT em JSON. |

- **Estratégia aplicada para #138:** `sessionStorage`, conforme solicitado na issue. Ele é legível por JavaScript e exposto a XSS; o frontend não armazena senha, nunca registra o token e remove-o no logout ou em `401`. A recomendação arquitetural de longo prazo continua sendo avaliar cookie `HttpOnly; Secure; SameSite`, com CORS e proteção CSRF no backend.
- **Expiração:** `/auth/me` valida sessão restaurada; um `401` de chamada marcada privada limpa a sessão e redireciona. `403` não apaga a identidade. Sem revogação/renovação no backend, o logout remove a cópia local, mas o JWT continua válido até expirar. Respostas `401` concorrentes convergem no mesmo evento de sessão inválida.
- **Contrato externo necessário (B-01/#137):** exigir token válido para `GET /users/`, `GET /activities/realtime`, `GET /dashboard/summary`, exportações, `GET/PUT /config/` e novas rotas de dados; filtrar cada consulta pelo gestor autenticado. O cliente já envia Bearer nessas chamadas, mas a API atual não o valida.
- **Critérios de aceite restantes:** cobertura de API prova que rotas de dados rejeitam token ausente/inválido/expirado, `403` preserva token válido sem permissão, gestores distintos não compartilham dados e cadastro/login mantêm respostas sem vazamento. Executar E2E real somente com ambiente e conta de teste autorizados.
- **Workaround frontend:** a guarda evita que a interface exponha telas sem sessão validada, mas não há workaround que proteja as respostas da API enquanto B-01 estiver pendente.

### I-02 — Associação gestor–colaborador e código — Alta

- **Status:** cliente de associação do Agent integrado; associação do backend **BLOQUEADA**.
- **Problema/requisito:** [RF-03](../../requisitos/requisitos/rn_rf.md#rf-03--disponibilizar-código-de-associação)/[RF-04](../../requisitos/requisitos/rn_rf.md#rf-04--associar-colaborador)/[RF-05](../../requisitos/requisitos/rn_rf.md#rf-05--gerenciar-colaboradores-associados), [CA-01](../../requisitos/requisitos/ca.md#ca-01--identificação-acesso-e-associação)/[CA-07](../../requisitos/requisitos/ca.md#ca-07--consulta-relatórios-e-exportação) e [associação no RBAC](../../requisitos/rbac.md#6-associação).
- **Frontend afetado:** painel, colaboradores, relatórios e futura exibição do código do gestor.
- **A. Implementado no frontend para a US-06.2:** `AssociationCodeCard` aparece no Dashboard somente para a identidade validada do gestor. O componente aceita apenas string de seis algarismos, preserva zeros à esquerda, oferece cópia com feedback acessível, falha de Clipboard API, carregamento, erro, nova tentativa e estado de contrato pendente. A resposta atrasada é descartada após logout/troca de sessão. Nenhum código demonstrativo é apresentado.
- **B. Implementado e integrado pela PR #122:** o Agent recebe código numérico de seis dígitos como string, envia `POST /associate/` com `code`, `username` e `hostname`, aceita token na resposta como `token` ou `access_token`, persiste o token protegido por DPAPI, reutiliza Bearer nas chamadas posteriores e não inicia monitoramento antes da associação. Commit de implementação `ed48ad7cfff9e724406ef9ffffeb6c0f132caf32`; merge `e43673b4dca212eaa991308d14c9dc25b6c64061`.
- **C. Pendente no backend após inspeção de `routers/`, `models.py`, `schemas.py` e `crud.py`:** geração e consulta autenticada do código (issue #113), `POST /associate/`, persistência do vínculo, validação/validade do código e isolamento de colaboradores por gestor. Não há `association_code` em `ManagerOut`; `GET /auth/me` não retorna esse campo e não substitui uma consulta do código.
- **D. Integração de produção pendente:** falta o contrato confirmado de leitura autenticada do código. O Backend precisa decidir entre incluir `association_code` como string de seis dígitos em `GET /auth/me` ou declarar uma rota autenticada específica, com resposta e erros definidos. A autorização deve derivar o gestor do JWT, sem aceitar `manager_id` enviado pelo navegador. Se `/auth/me` for escolhido, o schema do Backend e o validador estrito do Frontend precisam ser atualizados em conjunto. O adapter opcional de `useAssociationCode` usado em testes recebe uma string; ele é uma seam interna de teste e não define endpoint nem contrato HTTP. O cliente de produção não consulta nem gera código.
- **Segurança e impacto:** o token protegido localmente do Agent e o JWT do gestor são credenciais distintas. As rotas de usuários, realtime, painel, exportação e configuração continuam globais e sem dependência `get_current_manager`; a autenticação nova não prova autorização nem isolamento. Filtros locais não protegem dados. Estados realtime não são prova de associação ou conexão ativa.
- **Motivo do bloqueio:** a PR #122 implementa o lado cliente Agent, mas o backend deste checkout ainda não tem código, endpoints ou persistência de associação. Também falta autorização e isolamento por gestor.
- **Propostas detalhadas:** [consulta do código](#proposta-association-code) e [associação do Agent](#proposta-agent-association).

### I-03 — Tasks, atribuição, escopo e monitoramento consentido — Alta

- **Status:** UI frontend parcialmente implementada; persistência, integração real e monitoramento seguem BLOQUEADOS.
- **Prioridade para o MVP de 13/10:** alta. Sem consulta e criação persistentes, a tela Tasks não pode ser apresentada como funcional.
- **Problema/requisito:** [RF-06](../../requisitos/requisitos/rn_rf.md#rf-06--criar-e-editar-tasks) a [RF-13](../../requisitos/requisitos/rn_rf.md#rf-13--registrar-períodos-de-utilização), [RF-17](../../requisitos/requisitos/rn_rf.md#rf-17--encerrar-ou-trocar-task), [RN-18](../../requisitos/requisitos/rn_rf.md#rn-18--finalidade-e-minimização) e [CA-02](../../requisitos/requisitos/ca.md#ca-02--tasks-e-início-do-monitoramento)/[CA-03](../../requisitos/requisitos/ca.md#ca-03--monitoramento-da-atividade)/[CA-04](../../requisitos/requisitos/ca.md#ca-04--estado-e-execução-da-task).
- **Frontend afetado:** `TasksPage`, painel e relatórios.
- **Backend relacionado:** modelos/schemas/routers não contêm task; atividades não contêm vínculo, início/fim ou classificação de escopo.
- **Agent relacionado:** `agent/Dtos/ApiDtos.cs`, `agent/Services/QueueSenderService.cs` e payload de atividade não têm `task_id` nem comandos de seleção/início/encerramento.
- **Atual/impacto:** não há Task model/schema nem endpoints de produção. A tela de produção exibe uma prévia desabilitada sem fazer chamadas presumidas. Com `VITE_USE_MOCKS=true`, a UI de demonstração lista, cria, edita e exclui Tasks em memória; exige título, descrição e colaborador válido da lista carregada; impede submissão durante carregamento/falha e sinaliza atribuições removidas. A edição sincroniza uma Task alterada pelo catálogo sem substituir um rascunho digitado. O serviço simulado envia Bearer da sessão de demonstração e usa `/tasks/`, conforme o caminho da issue #133. Os dados continuam voláteis e pertencem a uma única identidade demonstrativa. O Dashboard limpa filtro removido, atualiza catálogo/resumo e mantém métricas gerais separadas; o mock de `/dashboard/tasks-summary` responde vazio, sem fabricar horas.
- **Alinhamento da liderança para Sprint 2:** será solicitado a Danyyel que crie uma task padrão. A solicitação ainda não equivale a task disponível na API nem define se ela será criada como seed, configuração ou registro operacional.
- **Contrato necessário:** para o recorte implementado de #134, o Backend precisa definir consulta/criação/edição/exclusão persistentes, título/descrição, atribuições e escopo de gestor. A forma de exclusão (arquivamento ou remoção física) requer decisão de retenção. Para RF-06 completo, também são necessários aplicações do escopo e autorização. A integração Agent exige ainda listagem/seleção/início/encerramento, `task_id` nos registros e confirmação de ciência.
- **Limite do frontend:** a UI de demonstração não é workaround de produção. Não usar `localStorage`, CRUD fictício em produção ou categorias como substituto da integração real. O formulário não chama `api.js`; só recebe `devApi` em desenvolvimento com mocks ativos.
- **Motivo do bloqueio:** depende do modelo central de monitoramento e de implementação backend/agente.
- **Propostas detalhadas:** [gerenciamento de Tasks](#proposta-tasks-crud) e [atribuição de colaboradores](#proposta-task-collaborators).

### I-04 — Jornada individual e possível hora extra — Alta

- **Status:** BLOQUEADO.
- **Problema/requisito:** [RF-20](../../requisitos/requisitos/rn_rf.md#rf-20--configurar-jornada)/[RF-21](../../requisitos/requisitos/rn_rf.md#rf-21--configurar-limite-de-inatividade)/[RF-22](../../requisitos/requisitos/rn_rf.md#rf-22--identificar-possível-hora-extra) e [CA-06](../../requisitos/requisitos/ca.md#ca-06--jornada-e-inatividade).
- **Frontend afetado:** configurações, painel e relatórios.
- **Backend relacionado:** `SystemSettings` tem somente dois inteiros globais; não há jornada individual.
- **Atual/impacto:** formulário global funcional; dias, entrada/saída, intervalo/carga horária e possível hora extra indisponíveis.
- **Contrato necessário:** jornada/limite por colaborador, validações de horários/fuso, propagação ao agente e cálculo de indicação de possível hora extra a partir das tasks.
- **Workaround frontend:** preservar edição global com aviso; cálculo local ou persistência local não são aceitáveis.
- **Motivo do bloqueio:** faltam persistência e registros necessários para comparar jornada e task.

### I-05 — Conexão real do agente — Média

- **Status:** BLOQUEADO.
- **Problema/requisito:** [RF-05](../../requisitos/requisitos/rn_rf.md#rf-05--gerenciar-colaboradores-associados)/[RF-16](../../requisitos/requisitos/rn_rf.md#rf-16--acompanhar-colaboradores-online)/[RF-27](../../requisitos/requisitos/rn_rf.md#rf-27--exibir-dashboard-analítico) e [CA-04](../../requisitos/requisitos/ca.md#ca-04--estado-e-execução-da-task) exigem Online enquanto conectado/autenticado.
- **Frontend afetado:** métricas de estado e tabela de última atividade.
- **Backend relacionado:** `/activities/realtime`, estados calculados por tempo desde atividade e retenção de até 24 horas.
- **Agent relacionado:** `AgentOrchestrator.IsOnline` é estado local derivado de tentativas de envio e não é publicado na API. `PendingCount`, pausa do monitoramento e versão também permanecem locais; o Frontend não consegue consultá-los.
- **Decisão da liderança:** o Agent deverá ser considerado offline após mais de 15 minutos sem novo registro no banco de dados daquela máquina. `is_idle` representa inatividade de uso e não deve substituir esse critério de conexão.
- **Atual/impacto:** a regra foi definida, mas ainda não está implementada/confirmada no backend. `offline` ainda pode decorrer de `is_idle` ou do intervalo desde `captured_at`; a consulta retorna somente a captura mais recente por usuário e não informa gravação recebida por máquina. Ausência após retenção de 24 horas não permite inferir o último registro. Falha de envio, fila local, pausa, versão e sincronização não estão disponíveis ao Frontend; ver B-10.
- **Contrato necessário:** expor informação calculada a partir da última gravação recebida por máquina e aplicar o limite acordado de 15 minutos, distinguindo conexão de inatividade. Se o painel também precisar de fila, pausa, versão ou tentativas de envio, Agent e Backend devem definir telemetria própria; o navegador não deve estimar esses estados. Autenticação e autorização da API dependem de #137/B-01, embora a sessão frontend já tenha sido integrada em I-01.
- **Workaround frontend:** mostrar última leitura com aviso é aceitável para o contrato atual; inferir conexão real não é.
- **Critérios de aceite:** status online/offline por máquina usa instante de recebimento no servidor, limite estrito de mais de 900 segundos e não depende de `is_idle`; atividade e falha HTTP têm estados distintos; cada máquina é identificável sem agrupar Agents diferentes; campos operacionais adicionais são enviados pelo Agent, autorizados e não inferidos pelo frontend.
- **Testes recomendados:** limite de 900/901 segundos, captura inativa recente, envio atrasado da fila local, falha de rede com fila vazia e com pendências, usuário com mais de uma máquina, ausência de telemetria e tentativa de acesso fora do gestor.
- **Motivo do bloqueio:** navegador do gestor não observa diretamente a conexão, estado da fila ou pausa do Agent; o servidor e o cliente não oferecem contrato de telemetria/autorização suficiente.

### I-06 — Dashboard, timeline e relatórios completos — Alta

- **Status:** BLOQUEADO.
- **Prioridade para o MVP 13/10:** alta para entrada/último registro diário. O backend não oferece campos de primeiro/último registro nem endpoint diário; é necessária consulta dos registros extremos por usuário e data. O endpoint e schema candidatos, sem chamada no cliente, estão detalhados em [PROPOSTA — NÃO IMPLEMENTADO: primeiro e último registro diário](#proposta-attendance).
- **Área/arquivos responsáveis:** Backend, `backend/app/models.py`, `schemas.py`, `crud.py` e `routers/dashboard.py`; a consulta e o schema precisam ser confirmados pelo responsável da API antes da integração frontend.
- **Semântica:** `last_activity_at` deve ser exibido como “Último registro” (ou “Saída / último registro”), nunca como encerramento definitivo sem evento explícito. Ausência de registro, dia em andamento e indisponibilidade da fonte devem ser distinguíveis. Falha dessa fonte não pode derrubar resumo, usuários ou realtime.
- **Problema/requisito:** [RF-24](../../requisitos/requisitos/rn_rf.md#rf-24--gerar-relatórios)/[RF-25](../../requisitos/requisitos/rn_rf.md#rf-25--exportar-relatórios)/[RF-27](../../requisitos/requisitos/rn_rf.md#rf-27--exibir-dashboard-analítico) e [CA-07](../../requisitos/requisitos/ca.md#ca-07--consulta-relatórios-e-exportação)/[CA-10](../../requisitos/requisitos/ca.md#ca-10--dashboard-analítico).
- **Frontend afetado:** `DashboardPage`, `ReportsPage` e visualizações preservadas.
- **Backend relacionado:** `DailySummaryResponse`, `/dashboard/summary`, `/dashboard/export/csv|pdf`.
- **Decisão da liderança:** o Dashboard deve apresentar somente as horas gastas em cada task; rankings não serão utilizados.
- **Atual/impacto:** a API atual fornece data, usuário, duração registrada por categoria e CSV/PDF do resumo. Não há task ativa nem duração agregada por task, período ou timeline confiável.
- **Contrato necessário:** consultas autorizadas que forneçam duração por task e filtros definidos; dados de task precisam estar vinculados aos registros. Exportação deve respeitar filtros e permissões. A definição exclui rankings; não define por si só métricas adicionais de produtividade.
- **Workaround frontend:** manter resumo/exportação diária atual. Não inventar duração por task, série temporal ou reconstruir períodos a partir de realtime. A decisão de não usar rankings está registrada; implementação por task aguarda os dados e consultas do backend.
- **Motivo do bloqueio:** a fonte agregada atual não fornece duração por task nem as consultas necessárias para apresentar as horas gastas em cada tarefa.
- **Propostas detalhadas:** [primeiro e último registro diário](#proposta-attendance) e [horas agregadas por Task](#proposta-task-hours).

### I-07 — Referência de fuso e virada do dia — Média

- **Status:** BLOQUEADO.
- **Prioridade para o MVP 13/10:** alta para a jornada diária. Brasília (`America/Sao_Paulo`) é a referência definida; o agrupamento existente por `date(captured_at)` não declara esse fuso e o Agent envia `captured_at` em UTC. O backend precisa agrupar a data no fuso acordado e informar o timezone do contrato. Não compensar agrupamento incorreto no navegador.
- **Problema/requisito:** significado do filtro diário e períodos da jornada; [RF-20](../../requisitos/requisitos/rn_rf.md#rf-20--configurar-jornada)/[RF-24](../../requisitos/requisitos/rn_rf.md#rf-24--gerar-relatórios)/[RF-27](../../requisitos/requisitos/rn_rf.md#rf-27--exibir-dashboard-analítico).
- **Frontend afetado:** `todayIso`, filtros de data, resumo e exportação.
- **Backend relacionado:** `captured_at` com timezone e `func.date` em `get_daily_summary`.
- **Decisão da liderança:** usar o fuso de Brasília. Será alinhada com Danyyel a configuração equivalente no backend; a intenção é usar variável de ambiente para permitir configuração futura por região. O nome e o mecanismo exatos da variável ainda não foram definidos.
- **Atual/impacto:** o frontend usa o dia local do navegador e a agregação existente aplica `date(captured_at)` sem informar o fuso; o Agent serializa `captured_at` em UTC. Logo, a data padrão do filtro e a data agrupada podem divergir de Brasília.
- **Contrato necessário:** backend deve agrupar por `America/Sao_Paulo` e declarar o timezone da resposta diária. O frontend poderá formatar timestamps com `Intl.DateTimeFormat` usando o timezone confirmado; não deve reagrupar registros nem compensar erro do backend.
- **Workaround frontend:** não há correção segura unilateral; a data enviada pelo navegador e a agregação do banco precisam compartilhar a configuração regional acordada.
- **Motivo do bloqueio:** a decisão de Brasília está registrada, mas depende de alinhamento e configuração coordenada no backend e no frontend, incluindo o contrato para a variável de ambiente planejada.
- **Regras propostas:** [datas e fusos horários](#proposta-timezone).

### I-08 — Teste de integração com serviço real — Média

- **Status:** PENDENTE DE AMBIENTE.
- **Problema/requisito:** confirmar CORS, dados e conteúdo de exportação; [CA-07](../../requisitos/requisitos/ca.md#ca-07--consulta-relatórios-e-exportação)/[CA-09](../../requisitos/requisitos/ca.md#ca-09--privacidade-e-segurança)/[CA-10](../../requisitos/requisitos/ca.md#ca-10--dashboard-analítico).
- **Frontend afetado:** `e2e/real-api.spec.js` e telas com API.
- **Backend relacionado:** FastAPI/banco em execução com dados de teste; origem configurada.
- **Atual/impacto:** há frontend, backend e Agent para um fluxo ponta a ponta; E2E principal intercepta HTTP somente nos testes. O teste real é opt-in e não escreve dados. Ainda falta serviço real, banco, origem configurada e dados autorizados para comprovar integração/arquivos reais.
- **Contrato/alteração necessária:** disponibilizar ambiente de teste autorizado, dados e origem; executar `RUN_REAL_API=1 npm run test:e2e:real` e conferir CSV/PDF, falhas e reinício. Sem alteração de endpoints.
- **Workaround frontend:** fixtures de teste protegem comportamento do cliente, mas não comprovam a API real.
- **Motivo da pendência:** o ambiente depende de serviço e banco disponíveis e de dados de teste autorizados; executar o cenário requer o ambiente real configurado.

<a id="pendencias-agent"></a>

## Pendências do Agent

### A-01 — Identidade e revisão visual da interface desktop — Alta

- **Identificação:** A-01; área responsável: equipe do Agent; prioridade P1 para identidade/status enganosos e P2 para revisão visual e de privacidade; status: ABERTO PARA EQUIPE DO AGENT.
- **Problema:** o formulário de associação mostra o placeholder `{orchestrator.Username}` em vez do nome real. As telas também usam dimensões e posições fixas; a bandeja mantém o ícone genérico do Windows Forms. O formulário de status rotula como conexão atual um indicador que reflete somente tentativas de envio.
- **Evidência:** em [`AssociationForm.cs`](../../agent/UI/AssociationForm.cs#L42), a estação usa interpolação, mas a linha `"Usuário: {orchestrator.Username}\n\n"` é uma string comum. [`StatusForm.cs`](../../agent/UI/StatusForm.cs#L28) define `ClientSize` 420×260 e posiciona controles por coordenadas fixas; [`AssociationForm.cs`](../../agent/UI/AssociationForm.cs#L36) define 380×230. [`TrayApplicationContext.cs`](../../agent/UI/TrayApplicationContext.cs#L47) usa `SystemIcons.Application` com comentário para substituí-lo por ícone próprio. `StatusForm` exibe o título da janela capturada. `AgentOrchestrator.IsOnline` começa como `true` e é atualizado pelo evento `SendAttempted`; [`QueueSenderService.cs`](../../agent/Services/QueueSenderService.cs#L47) retorna quando a fila está vazia sem confirmar a conexão.
- **Impacto:** durante a associação, o colaborador não consegue confirmar pela janela qual usuário está sendo associado. “Conexão com o servidor: OK” pode aparecer sem tentativa de envio ou permanecer após o último envio bem-sucedido, sem provar contato atual. Rótulos longos ou escala ampliada podem deixar os formulários apertados; a aparência do ícone não identifica a aplicação. Exibir título de janela amplia a exposição de texto potencialmente sensível.
- **Justificativa:** identidade correta evita associação feita com contexto equivocado; um status temporalmente honesto e uma hierarquia legível melhoram confiança e compreensão. O código consultado é externo ao escopo autorizado do Frontend.
- **Solução proposta:** corrigir a string para `$"Usuário: {orchestrator.Username}\n\n"`. Em tarefa própria do Agent, renomear o indicador atual para “Último envio” ou publicar conexão confirmada por heartbeat; não iniciar o estado em conectado sem evidência. Reorganizar controles em layouts ancorados/contêineres com escala adequada, tratar textos longos, revisar teclado/foco e estados, substituir o ícone genérico e confirmar se o título da janela é necessário. Não há justificativa observada para migrar de Windows Forms.
- **Dependências:** equipe do Agent; não depende de mudança no Frontend. Uma política sobre exibir título de janela deve seguir os requisitos de privacidade do produto.
- **Critérios de aceite:** formulário de associação mostra o valor real de usuários de teste distintos; usuário consegue concluir os controles por teclado com foco visível; telas permanecem legíveis a 100%, 150% e 200% de escala e com usuário/estação longos; conexão, associação, pausa e erro são distinguíveis sem depender somente de cor; a informação de janela respeita a decisão de privacidade.
- **Testes recomendados:** teste de apresentação do texto com nomes de usuários distintos; inspeção manual em Windows Forms nas escalas indicadas e com textos longos; verificação de ordem de Tab, foco, estados de conexão/associação/pausa e título de janela; build e testes da solução do Agent após a correção.

<a id="pendencias-frontend"></a>

## Pendências futuras do Frontend

### F-01 — Integração das telas após contratos — Alta

- **Status:** BLOQUEADO.
- **Problema/requisito:** implementar UI real para I-01 a I-07; RFs indicados nesses itens.
- **Frontend afetado:** acesso, colaboradores, tasks, configurações, painel, relatórios e testes.
- **Backend relacionado:** contratos ainda ausentes/desalinhados descritos na seção anterior.
- **Atual/impacto:** funcionalidades indisponíveis são informadas sem inputs de persistência fictícia.
- **Definição necessária:** contratos aprovados e disponíveis, regras de erro/validação e dados para testes.
- **Workaround frontend:** não existe para completar a funcionalidade; páginas informativas são aceitáveis enquanto bloqueada.
- **Motivo do bloqueio:** telas, payloads e métricas não podem ser implementados antes das definições reais.

### F-02 — Instalação PWA e política offline — Média

- **Status:** FRONTEND FUTURO.
- **Problema/requisito:** a [visão do produto](../../requisitos/visao.md#1-visão-geral) e a [diretriz de responsividade](../../requisitos/responsividade.md#1-objetivo) chamam a aplicação de Dashboard PWA, sem detalhar instalação/offline.
- **Frontend afetado:** entrada Vite, recursos estáticos e futura configuração de manifest/service worker.
- **Backend relacionado:** política de sessão, cache e acesso a dados sensíveis ainda indefinida.
- **Atual/impacto:** aplicação web responsiva, sem manifest/service worker; não é instalável como PWA.
- **Definição necessária:** decidir instalação, navegadores, cache permitido, atualização e comportamento offline/logout.
- **Workaround frontend:** acesso web atual; não simular dados offline nem persistir dados corporativos como substituto de backend.
- **Motivo do bloqueio:** exige decisão de produto/segurança antes de escolher cache e comportamento offline.

### F-03 — Validação humana e matriz de navegadores — Média

- **Status:** FRONTEND FUTURO.
- **Problema/requisito:** completar usabilidade de [RNF-12](../../requisitos/requisitos/rnf.md#rnf-12--usabilidade) e as [diretrizes de responsividade](../../requisitos/responsividade.md#6-critérios); a [matriz de navegadores ainda está pendente](../../requisitos/requisitos/rnf.md#4-pontos-pendentes).
- **Frontend afetado:** todas as telas, menu, tabelas, filtros e estados de erro.
- **Backend relacionado:** nenhum contrato novo; serviço real é necessário apenas para validação de dados.
- **Atual/impacto:** teclado, larguras, ampliação CSS, orientação horizontal e axe-core automatizados; leitor de tela, zoom nativo e dispositivos reais não comprovados.
- **Definição necessária:** navegadores/largura mínima suportados e acesso a leitor de tela/dispositivos para inspeção humana.
- **Workaround frontend:** testes automatizados existentes são proteção parcial; não equivalem a inspeção humana.
- **Motivo do bloqueio:** definição de suporte e recursos de validação externos não estão disponíveis nesta tarefa.

### F-04 — Harmonizar caminho POST de Task demonstrativa — Baixa

- **Área responsável:** Frontend.
- **Status:** RESOLVIDA NO FRONTEND — VALIDAÇÃO LOCAL CONCLUÍDA.
- **Issue relacionada:** #134 (interface) e #133 (caminho de coleção citado pela issue Backend): https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/134 e https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/133.
- **Requisito relacionado:** RF-06/RF-11; depende de I-03 antes de habilitar operação real.
- **Arquivo ou componente:** src/dev-mocks/client.js, src/dev-mocks/handlers.js, src/dev-mocks/client.test.js e src/dev-mocks/handlers.test.js.

#### Registro original da auditoria documental — checkpoint `f8556a1`

- **Problema identificado:** no commit f8556a1114a52ffc5064ab9ab8506a388778561b, a listagem demonstrativa chama GET /tasks/, a criação chama POST /tasks sem barra final, e os handlers MSW declaram GET/POST /tasks/. Atualização e exclusão usam o caminho do item sem barra terminal. A documentação anterior dizia que a rota local estava alinhada a /tasks/; essa afirmação não descreve a string de criação daquele checkpoint.
- **Evidência:** o cliente configura essas chamadas em src/dev-mocks/client.js e as rotas estão registradas em src/dev-mocks/handlers.js. O Backend local não possui router de Tasks. Nesta auditoria documental não foi executado teste de roteamento do MSW nem chamada ao Backend.
- **Causa provável:** o caminho da criação foi escrito sem barra terminal enquanto listagem e handler usam a forma com barra. O matcher MSW pode tratar barra terminal como opcional; isso não foi confirmado nesta revisão. O endpoint de produção ainda não existe, então comportamento de redirect do servidor também é desconhecido.
- **Impacto:** a grafia não canônica dificulta provar equivalência entre cliente e handler e pode divergir do contrato futuro, mesmo que a demonstração atual seja compatível. Não há evidência suficiente nesta revisão para declarar falha funcional reproduzida.
- **Solução proposta:** escolher uma forma canônica para coleção após confirmar o contrato Backend; alinhar cliente demonstrativo, handler, testes de cliente/handler e documentação. Para a proposta atual, usar /tasks/ em GET e POST de coleção e /tasks/{task_id} para itens, sem depender de redirecionamento implícito.
- **Critérios de aceitação:** GET e POST do CRUD de demonstração usam o mesmo caminho literal da coleção; handlers cobrem cada método e caminho; contrato publicado usa o mesmo caminho; requests de criação não dependem de redirect; respostas e erros continuam identificáveis por método.
- **Testes recomendados:** testar diretamente cada método e caminho no cliente e MSW; incluir criação e listagem com mock ativo; quando existir API, verificar o caminho canônico e ausência de 307/308 inesperado em homologação.
- **Condição de desbloqueio:** revisão do código Frontend e confirmação do caminho final com Backend antes de habilitar CRUD em produção.
- **Relações:** I-03, #133, #134 e proposta de CRUD em [Contratos da API](CONTRATOS_API.md) e [Propostas de contratos](PROPOSTA_CONTRATOS_BACKEND.md).

#### Validação e encerramento — 21/10/2026, branch `main`, checkout baseado no HEAD `a20750c25bb24d1665ffb965e14aa80a73f590ae`

O checkout começou no commit-base `a20750c`; a correção de código e testes descrita abaixo foi gravada no commit seguinte, `fc3132ab5133b2ad9ea12da1e8ce1bbb987822eb`, que é o HEAD revalidado nesta revisão documental.

- **Causa confirmada:** `devApi.createTask()` chamava `POST /tasks`, que não correspondia ao handler `POST /tasks/`. O handler curinga devolveu 501 (`Sem mock de desenvolvimento...`); a criação integrada falhou antes da correção. Não houve redirecionamento HTTP.
- **Comportamento observado antes da alteração:** a listagem `GET /tasks/` e o handler POST usavam a barra final; `createTask()` não. O teste integrado com o MSW de testes reproduziu a falha com status 501.
- **Alteração implementada:** o cliente agora chama `POST /tasks/`. Método, corpo JSON, validação de título/descrição/IDs, Bearer demonstrativo, `AbortSignal`, validação da resposta e erros permanecem preservados.
- **Arquivos de código/teste alterados:** `src/dev-mocks/client.js`, `src/dev-mocks/client.test.js` e `src/dev-mocks/handlers.test.js`.
- **Testes focados:** `npm.cmd run test -- src/dev-mocks/client.test.js src/dev-mocks/handlers.test.js` — 2 arquivos e 18 testes passaram. O teste integrado usa `fetch` real interceptado pelo `setupServer` do MSW e confirma criação e listagem pelo mesmo caminho.
- **Validação geral:** lint, typecheck, cobertura, build, verificações do bundle e E2E passaram. A cobertura teve 296 testes em 58 arquivos; 30 cenários E2E passaram e 2 testes de API real foram ignorados por falta de serviço/credenciais autorizados.
- **Resultado de formatação:** `format:check` e, consequentemente, `check:full` pararam por dois documentos inalterados e fora do escopo F-04 (`docs/ARQUITETURA.md`, `docs/README.md`). Os arquivos alterados nesta correção passaram no Prettier direcionado. Os comandos de cobertura, build, teste de bundle e E2E foram executados separadamente e passaram.
- **Handlers validados:** GET autenticado 200; POST autenticado válido 201; POST sem autenticação 401; POST inválido 422; PUT 200; DELETE 200; item inexistente 404; dados em memória, consulta após criação/exclusão e reset do estado/sequência de IDs.
- **Critérios F-04 atendidos:** GET e POST da coleção usam `/tasks/`; cliente e handler estão alinhados; a chamada não depende de redirect; pathname de `createTask()` é verificado literalmente; cliente + MSW e CRUD demonstrativo foram exercitados.
- **Limitações e dependências externas:** GET de item não existe no mock e não foi adicionado. A issue #133 permanece aberta: o Backend ainda precisa implementar/persistir CRUD de Tasks, atribuições e autorização por gestor. A issue #134 permanece aberta: a interface ainda não consome CRUD real. Produção continua sem chamadas fictícias de Tasks.
- **Documentação relacionada:** `CONTRATOS_API.md`, `PROPOSTA_CONTRATOS_BACKEND.md`, `MATRIZ_ISSUES_FRONTEND.md`, `FUNCIONALIDADES.md`, `TESTES.md`, `ALTERACOES.md`, `PLANO_EXECUCAO_FRONTEND.md` e `RELATORIO_EXECUCAO_FRONTEND.md` registram a correção e mantêm os bloqueios externos.

#### Revalidação documental no HEAD `fc3132ab5133b2ad9ea12da1e8ce1bbb987822eb` — 21/10/2026

- **Estado do código:** `devApi.tasks()` e `devApi.createTask()` usam `GET/POST /tasks/`; `updateTask()` e `deleteTask()` usam `/tasks/{task_id}`. Os handlers MSW declaram os mesmos caminhos e não há chamada de Tasks no cliente HTTP de produção.
- **Evidência de teste existente no checkout:** `client.test.js` verifica o pathname do GET/POST, método e autenticação; `handlers.test.js` cobre CRUD demonstrativo, códigos de erro e integração cliente + MSW. O teste integrado confirma criação e listagem pela coleção `/tasks/`.
- **Limite do mock:** não existe GET demonstrativo de item. CRUD persiste apenas na memória do mock, com um catálogo fixo e uma identidade demonstrativa; não implementa isolamento entre gestores nem `403`.
- **Status de issues consultado no GitHub em 21/10/2026:** #133, #134, #137, #138 e #140 permaneciam abertas. Tecnicamente, #133 depende do CRUD persistente e autorizado no Backend; #134 tem interface parcial e depende da integração real; #137 segue sem autorização/isolamento nas rotas de dados; #138 tem sessão implementada no frontend, aguardando homologação real; #140 tem visualização demonstrativa sem agregação real.
- **Resultado desta revalidação:** F-04 continua resolvida no Frontend demonstrativo. Os resultados atuais de `format:check`, `lint`, `typecheck` e `check:full` são registrados em [Relatório](RELATORIO_EXECUCAO_FRONTEND.md) e [Testes](TESTES.md); eles não alteram o status das issues de Backend nem da integração real.

## Pendência de documentação externa

### D-01 — Atualizar `requisitos/responsividade.md` — Baixa

- **Status:** AGUARDANDO REVISÃO EXTERNA.
- **Problema/requisito:** [responsividade.md](../../requisitos/responsividade.md) ainda cita Vite 5.0.8, Vitest 3.2.4, Recharts 2.10.3 e `src/index.css`. O frontend atual usa Vite 6.4.3, Vitest 4.1.11, não depende de Recharts e mantém os estilos em `src/app/styles/index.css`.
- **Frontend afetado:** leitores que usam o requisito como referência de implementação.
- **Atual/impacto:** o documento externo pode levar à escolha de dependências e caminhos desatualizados; as diretrizes de responsividade continuam como requisito, mas o inventário técnico não reflete o frontend presente.
- **Alteração necessária:** revisar versões, dependências e caminhos no documento de requisitos quando sua manutenção for autorizada. Para o estado atual, consultar [README](../README.md), [Arquitetura](ARQUITETURA.md) e `package.json`.
- **Motivo da pendência:** o arquivo fica fora de `FrontEnd/` e não foi alterado nesta revisão documental.

<a id="propostas-de-contratos-de-integracao"></a>

## Propostas de contratos de integração

> **Todos os contratos desta seção são PROPOSTA — NÃO IMPLEMENTADO.** São candidatos para discussão e confirmação pelo Backend e pela liderança. Não representam rotas disponíveis para integração real. A demonstração local pode simular parte desses fluxos sob os mocks isolados de desenvolvimento; isso não confirma os contratos. [Contratos da API](CONTRATOS_API.md) continua sendo a referência dos contratos existentes; os status e bloqueios permanecem nos IDs abaixo.

### Inventário dos contratos observados

Estado dos contratos observado no checkout em 21/10/2026. A tabela resume a auditoria que fundamenta as propostas; os contratos efetivamente implementados e seu comportamento ficam descritos em [Contratos da API](CONTRATOS_API.md).

| Área                   | Contrato observado                                                                                                                                             | Lacuna ou incompatibilidade                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Autenticação do gestor | POST /auth/register, POST /auth/login e GET /auth/me. A última exige JWT de gestor e retorna id, email e created_at.                                           | O frontend agora integra cadastro/login e guarda páginas, mas apenas `/auth/me` exige JWT no backend. `ManagerOut` não inclui código de associação. Ver I-01, B-01 e I-02.           |
| Colaboradores          | GET /users/ retorna usuários como UserOut.                                                                                                                     | A rota não exige identidade nem filtra por gestor; não há associação persistida gestor–colaborador nos modelos inspecionados. Ver B-01 e I-02.                                       |
| Atividades e realtime  | POST /activities/, GET /activities/realtime, resumo diário e exportações existem. ActivityLogCreate não contém task_id e captured_at aceita datetime opcional. | As rotas de dados não exigem JWT. Realtime não representa entrada/saída diária. O resumo agrega duration_seconds por categoria usando date(captured_at). Ver B-01, B-06 e I-06/I-07. |
| Tasks e atribuição     | Não foi encontrado modelo, schema ou router de Tasks.                                                                                                          | Não há criação, consulta ou edição persistentes, escopo de aplicações por Task nem atribuição de colaboradores. Categorias não substituem o escopo de Task. Ver I-03.                |
| Associação pelo Agent  | O cliente Agent da PR #122 envia POST /associate/ com code, username e hostname; aceita token ou access_token na resposta.                                     | Não foram encontrados no backend a rota, a validação do código, a persistência do vínculo ou a emissão de credencial de Agent. Ver I-02.                                             |
| Fuso horário           | O Agent serializa captured_at em UTC. O resumo do backend filtra date(captured_at) sem declarar fuso.                                                          | A data do resumo pode divergir do dia de Brasília; o contrato do backend não declara timezone. Ver I-07.                                                                             |
| Configuração           | GET/PUT /config/ usa capture_interval_seconds e idle_timeout_seconds.                                                                                          | A configuração é global, as rotas não exigem identidade e não representam jornada por colaborador. Ver B-01, B-09 e I-04.                                                            |

### Convenções transversais candidatas

- IDs persistidos são UUIDs, seguindo os modelos atuais.
- Os erros mantêm o envelope FastAPI observado, por exemplo: { "detail": "..." }. Não se propõe novo envelope.
- Endpoints gerenciais recebem Authorization: Bearer &lt;JWT_DO_GESTOR&gt;. O servidor deriva o gestor do token validado e nunca confia em manager_id enviado pelo browser.
- Datas de calendário usam AAAA-MM-DD. Instantes usam ISO 8601/RFC 3339 com offset explícito; a serialização preferencial é UTC com Z.
- Recursos fora do escopo não devem revelar a existência de dados de outro gestor. A convenção proposta usa 404 para recurso inexistente ou fora do escopo e 401 para token ausente ou inválido; 403 fica reservado à identidade autenticada sem a função exigida.
- A referência de calendário definida pela liderança é Brasília, America/Sao_Paulo. O nome e o mecanismo da configuração futura por ambiente continuam pendentes em I-07.

### I-03 — Tasks e atribuição

<a id="proposta-tasks-crud"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: contrato persistente para o CRUD de Tasks

**Histórico de auditoria em 21/10/2026:** no checkpoint f8556a1, `devApi.createTask()` enviava POST /tasks sem barra terminal, enquanto o handler MSW declarava POST /tasks/. A execução posterior, baseada no checkout `a20750c`, reproduziu 501 no teste integrado, alinhou cliente e handler em `/tasks/` e validou o fluxo local; essa correção foi registrada em `fc3132a`. I-03 continua proposta não implementada até o Backend publicar o CRUD real.

**Necessidade e referências:** RF-06 e RF-11, RN-03 e RN-04, CA-02 a CA-04 e pendência I-03. O RF-06 pede criação/edição pelo Dashboard, descrição, colaboradores e aplicações no escopo. Consultar Tasks persistidas também é necessário para TasksPage. Criar ou editar uma Task não inicia monitoramento; início, encerramento, ciência do colaborador e envio de task_id dependem de contratos próprios do Agent.

| Método | Endpoint candidato     | Uso proposto                                                            |
| ------ | ---------------------- | ----------------------------------------------------------------------- |
| GET    | /tasks/                | Listar Tasks do gestor autenticado.                                     |
| POST   | /tasks/                | Criar Task com título, descrição e colaboradores.                       |
| GET    | /tasks/{task_id}       | Consultar uma Task do gestor autenticado.                               |
| PUT    | /tasks/{task_id}       | Substituir título, descrição e colaboradores; não inicia monitoramento. |
| DELETE | /tasks/{task_id}       | Remover ou arquivar após decisão de retenção do histórico.              |
| PUT    | /tasks/{task_id}/scope | Substituir a lista completa de aplicações do escopo.                    |

Os métodos do CRUD acima são uma proposta alinhada à interface demonstrada e aos caminhos de coleção e item descritos pela issue #133; ainda não são contrato confirmado nem implementação do Backend. A issue #133 está aberta e pede CRUD persistente, atribuição e autorização. A issue #134 também está aberta; sua UI parcial continua usando somente o serviço demonstrativo. A exclusão da interface só existe nos mocks; retenção de registros e arquivamento devem ser decididos antes de implementar o `DELETE` real. A rota local foi alinhada a `/tasks/` para não deixar a demonstração exercitar um caminho divergente da issue.

`PUT /tasks/{task_id}/scope` é uma extensão candidata para o escopo de aplicações, não uma rota descrita pela issue #133 nem existente no Backend. Só deve ser adotada após confirmação explícita do contrato e da regra de negócio.

**Parâmetros e schemas candidatos:** task_id é UUID no caminho. GET /tasks não exige filtro nesta proposta; paginação, ordenação e filtros por estado ainda precisam ser definidos. POST recebe `title`, `description` e `collaborator_ids`. PUT substitui esses mesmos campos integralmente. A UI atual exige título e descrição não vazios, descrição de até 200 caracteres e pelo menos um colaborador; os limites e regras definitivos precisam ser acordados no Backend/produto. PUT /tasks/{task_id}/scope substitui o conjunto integral do escopo, não é incremental.

Requisição de criação:

```json
{
  "title": "Relatório mensal",
  "description": "Revisar o relatório mensal",
  "collaborator_ids": ["d94a4d6c-8542-4c3e-889b-89db302ef4cc"]
}
```

Requisição candidata de edição integral:

```json
{
  "title": "Relatório mensal",
  "description": "Revisar e publicar o relatório mensal",
  "collaborator_ids": ["d94a4d6c-8542-4c3e-889b-89db302ef4cc"]
}
```

Requisição para substituir o escopo:

```json
{
  "applications": [{ "process_name": "EXCEL.EXE" }, { "process_name": "POWERPNT.EXE" }]
}
```

Resposta candidata, usada em GET /tasks/{task_id} e nos itens da listagem:

```json
{
  "id": "6e7b94da-5651-46a0-bf28-fcb8f4f14c04",
  "title": "Relatório mensal",
  "description": "Revisar o relatório mensal",
  "collaborators": [
    {
      "id": "d94a4d6c-8542-4c3e-889b-89db302ef4cc",
      "username": "ana",
      "full_name": "Ana Souza"
    }
  ],
  "applications": [{ "process_name": "EXCEL.EXE" }, { "process_name": "POWERPNT.EXE" }],
  "created_at": "2026-10-13T14:20:00Z",
  "updated_at": "2026-10-13T14:20:00Z"
}
```

A listagem responde com um array desses objetos. Os campos e schemas são candidatos, não implementados. O mock de desenvolvimento aceita os mesmos campos básicos sem `applications`; o contrato do escopo de aplicações continua separado.

**Validação, autorização e respostas:**

- title e description não podem ficar vazios depois de remover espaços. O mock limita description a 200 caracteres; esse valor local não confirma o limite do contrato ou da regra de negócio.
- Cada aplicação do escopo precisa de identificador estável. Rejeitar duplicatas e entradas vazias. A escolha entre nome de processo, executável, padrão ou outra chave permanece pendente.
- task_id deve ser UUID e o servidor deve confirmar que a Task pertence ao gestor autenticado.
- Todas as rotas exigem JWT de gestor e limitam leitura/escrita às Tasks desse gestor e aos colaboradores da equipe. IDs enviados pelo browser não concedem acesso.
- POST responde 201; consultas/edição respondem 200; exclusão deve definir 200 ou 204 após decidir entre arquivar e remover; 401 sem autenticação; 404 se inexistente ou fora do escopo; 409 para conflito de estado após definição de regra; 422 para payload inválido; 5xx para indisponibilidade.

**Impacto e dependências:** a prévia de produção só poderá se tornar CRUD integrado depois da implementação e publicação do contrato. A camada visual e seus testes de serviço simulado já existem; a API de produção ainda precisa validar schemas, autorizar gestor, persistir escopo/histórico e decidir semântica de exclusão. O Agent precisa receber lista/escopo e só registrar atividade durante execução consentida. A liderança define identidade e correspondência de aplicações, campos obrigatórios, limites, arquivamento/exclusão e efeito de alterar escopo durante Task ativa.

<a id="proposta-task-collaborators"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: associar colaboradores às Tasks

**Necessidade e referências:** RF-06 exige atribuição pelo gestor; RF-07 restringe a lista do Agent às Tasks do colaborador; RN-04 limita acesso às Tasks atribuídas. I-03 depende primeiro da associação gestor–colaborador de I-02.

| Método | Endpoint candidato             | Uso proposto                                                |
| ------ | ------------------------------ | ----------------------------------------------------------- |
| GET    | /tasks/{task_id}/collaborators | Consultar colaboradores atribuídos a uma Task do gestor.    |
| PUT    | /tasks/{task_id}/collaborators | Substituir o conjunto completo de colaboradores atribuídos. |

Estas rotas são uma alternativa de desenho caso o Backend queira separar atribuições do recurso Task. A proposta principal de CRUD acima já inclui `collaborator_ids` em POST/PUT; a implementação deve escolher um único formato, sem manter dois contratos concorrentes.

Requisição candidata:

```json
{
  "collaborator_ids": [
    "d94a4d6c-8542-4c3e-889b-89db302ef4cc",
    "52ba0ef0-0c95-4cbf-b5a8-897b0b93ef27"
  ]
}
```

Resposta candidata:

```json
{
  "task_id": "6e7b94da-5651-46a0-bf28-fcb8f4f14c04",
  "collaborators": [
    {
      "id": "d94a4d6c-8542-4c3e-889b-89db302ef4cc",
      "username": "ana",
      "full_name": "Ana Souza"
    }
  ]
}
```

O corpo collaborator_ids e o schema de resposta não estão implementados. As opções podem vir de GET /users/ depois que a rota for protegida e filtrada por gestor; hoje a resposta é global e aberta.

- task_id e cada collaborator_id são UUIDs. Rejeitar IDs duplicados e colaboradores não associados ao gestor.
- A semântica candidata de [] é remover todas as atribuições; a liderança ainda deve confirmar se a lista vazia é válida.
- Não vincular colaborador de outro gestor, mesmo quando o cliente conhece o UUID. O gestor precisa possuir a Task e cada colaborador deve pertencer à sua equipe. A autorização da Task pelo Agent deve usar credencial própria do colaborador e validação no servidor.
- Respostas propostas: 200 em consulta/substituição; 401 sem JWT; 404 para Task ou colaborador fora do escopo; 409 se alteração conflitar com execução ativa; 422 para UUID/lista inválida; 5xx para falha do serviço.
- O formulário depende de colaboradores carregados com isolamento real; não é seguro usar a resposta global atual de /users/. A interface deve distinguir erro de carregamento de lista vazia.
- Backend precisa da associação gestor–colaborador, relação muitos-para-muitos Task–colaborador, validação transacional do escopo e proteção da listagem. O Agent precisa de consulta de Tasks disponíveis, seleção/início/fim e regra para alteração de atribuição. A liderança define multiplicidade de colaboradores, efeito de remoção durante execução e se lista vazia é permitida.

### I-02 — Associação gestor–colaborador e código

<a id="proposta-association-code"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: consultar o código de associação do gestor

**Necessidade e referências:** RF-03, CA-01, Sprint 2 US-06, issue #113 e I-02. GET /auth/me existe, mas ManagerOut não contém association_code; não se deve assumir que a rota atual fornece o código.

Sugestão de GET /auth/association-code, exigindo JWT do gestor:

```http
GET /auth/association-code
Authorization: Bearer <JWT_DO_GESTOR>
```

Resposta candidata:

```json
{
  "code": "012345"
}
```

O endpoint e schema são candidatos, não implementados. code é string de seis algarismos para preservar zeros à esquerda. Não se define validade na resposta até que expiração e rotação sejam decididas.

<a id="proposta-agent-association"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: associação do Agent

A PR #122 do Agent espera POST /associate/, mas a rota não foi encontrada no backend inspecionado. O payload candidato preserva os campos que o cliente envia:

```json
{
  "code": "012345",
  "username": "colaborador",
  "hostname": "ESTACAO-01"
}
```

Resposta candidata compatível com o cliente:

```json
{
  "access_token": "<JWT_DO_AGENT>",
  "token_type": "bearer",
  "expires_in": 3600
}
```

Endpoint e schemas são candidatos, não implementados. O JWT de Agent deve ter audiência/finalidade próprias e não pode ser aceito como JWT de gestor. O Agent atual também tolera a propriedade token como alternativa a access_token.

- Consultar o código exige gestor autenticado. Associar aceita o código como prova de vínculo, valida seis algarismos e deve aplicar limite de tentativas.
- code nunca é número, para preservar zeros à esquerda. username e hostname precisam ser validados e associados de forma estável; depender somente desses campos exige análise de segurança.
- Consulta: 401 sem JWT; 404 ou 409 se não houver código ativo, conforme decisão de produto; 5xx em falha do serviço.
- Associação: 422 para payload malformado; 404 ou 410 para código inválido/expirado; 409 para vínculo existente ou conflito; 429 para excesso de tentativas; 5xx em falha. O Agent mapeia vários desses status como código inválido, mas a tolerância do cliente não define o contrato do servidor.
- Associação válida deve persistir o vínculo e emitir credencial de Agent. Código inválido não cria usuário, vínculo ou sessão.
- O card visual já está no Dashboard autenticado e permanece sem chamada de API enquanto não existir contrato real de código. A sessão do gestor está integrada no frontend; depois que o backend definir a rota/campo e o escopo de autorização, será possível ligar o cliente HTTP oficial ao estado visual. O frontend nunca reutiliza o token do Agent.
- Backend precisa de campo/entidade, geração segura, endpoint autenticado, associação, vínculo persistente e credenciais distintas por tipo de cliente. O Agent já envia o payload e protege o token com DPAPI; schema final precisa ser alinhado. A liderança define geração sob demanda/no cadastro, expiração, rotação, revogação, reutilização/uso único, tentativas, troca de gestor e identidade duradoura do Agent.

### B-01 — Autorização e isolamento por gestor

<a id="proposta-authorization"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: política de autorização por rota

**Necessidade e referências:** RN-15, RF-23, CA-09, RBAC seção 5 e B-01. Esta é uma condição transversal. get_current_manager existe e protege somente GET /auth/me; não protege automaticamente os outros routers. Não se propõe uma rota de autorização separada.

A proposta de proteger rotas gerenciais inclui:

- Rotas existentes: GET /users/, GET /activities/realtime, GET /dashboard/summary, GET /dashboard/export/csv e GET /dashboard/export/pdf.
- GET/PUT /config/ somente depois de decidir se a configuração continua global ou passa a pertencer ao gestor.
- Endpoints candidatos de Tasks, atribuições, jornada, registros diários e horas por Task descritos nas propostas desta seção.

Exemplo de chamada futura a rota protegida:

```http
GET /users/
Authorization: Bearer <JWT_DO_GESTOR>
```

A resposta candidata é um array de UserOut limitado aos colaboradores associados ao gestor. GET /users/ existe, mas autenticação JWT e filtro de equipe ainda não estão implementados. POST /activities/ é usado pelo Agent e precisa de autenticação de Agent, identidade associada e autorização do vínculo; não se deve proteger essa rota com JWT de gestor sem definir fluxo compatível. Categorias e configuração global exigem decisão de propriedade antes de receber filtros.

No acompanhamento do Agent, `GET /activities/realtime` também retorna `hostname`, mas a interface não o exibe nem oferece filtro por máquina enquanto a API entrega usuários e capturas sem escopo por gestor. Antes de apresentar esse identificador, o Backend deve autenticar o gestor e restringir tanto `/users/` quanto `/activities/realtime` aos vínculos autorizados; o Agent também precisa de identidade persistente associada. Filtros locais da interface não substituem esse controle.

- O servidor deriva manager_id dos claims validados do JWT, rejeita manager_id enviado pelo cliente e filtra toda leitura, escrita e exportação.
- Operações sobre IDs de Task, usuário ou registro verificam o vínculo no banco em cada requisição, inclusive relações aninhadas.
- JWT de gestor tem audiência de gestor. A credencial proposta do Agent tem audiência distinta e direitos mínimos para a identidade associada.
- Respostas propostas: 401 para token ausente/inválido/expirado; 403 para identidade autenticada sem função exigida; 404 para recurso fora do escopo, sem revelar existência; 422 para filtro/payload inválido.
- Exportações e filtros por username, task_id e data delimitam a consulta, mas nunca substituem autorização.
- O MVP de apresentação de 13/10 foi aprovado sem login; em 21/10, a issue #138 retomou a integração. O frontend agora envia Bearer e guarda páginas, mas nada disso muda a política do servidor. Esconder páginas ou filtrar tabelas localmente não protege a API.
- Backend precisa de relações Manager–User–Task–Activity, dependências de autorização nos routers, isolamento nas exportações, testes de acesso cruzado e decisão sobre `/config/` e categorias globais. O Agent precisa de identidade e autorização próprias para associação e atividade. A estratégia de sessão usada pela interface é `sessionStorage`; a liderança ainda pode decidir se esse armazenamento é temporário ou se há migração para cookie `HttpOnly`.

### I-06 — Registros diários e horas por Task

<a id="proposta-attendance"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: primeiro e último registro diário

**Necessidade e referências:** RF-13, RF-24, RF-27, CA-07, CA-10 e I-06/I-07. O painel precisa mostrar o primeiro e o último registro sem inferir jornada pelo realtime. I-06 já contém o endpoint ilustrativo e o schema-base; esta proposta detalha o rascunho, não confirma uma rota.

**Endpoint candidato:** GET /dashboard/attendance com date obrigatório em AAAA-MM-DD e username opcional.

```json
{
  "date": "2026-10-13",
  "timezone": "America/Sao_Paulo",
  "users": [
    {
      "username": "ana",
      "first_activity_at": "2026-10-13T11:15:00Z",
      "last_activity_at": "2026-10-13T19:42:00Z"
    },
    {
      "username": "bruno",
      "first_activity_at": null,
      "last_activity_at": null
    }
  ]
}
```

Os campos date, timezone, users, username, first_activity_at e last_activity_at são candidatos, não implementados. Timestamps representam o primeiro e o último captured_at efetivamente persistido no dia de negócio; não confirmam início/fim de jornada nem saída. O produto pode usar os rótulos “Primeiro registro” e “Último registro”; o último não deve ser apresentado como saída definitiva e um dia em andamento não é jornada encerrada.

- date é obrigatório e deve ser uma data real AAAA-MM-DD interpretada no timezone declarado pela resposta.
- username é opcional, mantém compatibilidade com os filtros atuais e só seleciona colaborador associado ao gestor.
- Timestamps são instantes RFC 3339/ISO 8601 em UTC. Sem registros, ambos são null; falha da consulta continua erro HTTP, nunca null.
- O servidor deriva a equipe do JWT e não recebe manager_id do cliente. Resposta 200 deve conter um item por colaborador no escopo consultado.
- Respostas propostas: 401 sem autenticação; 404 se o filtro apontar para usuário fora do escopo; 422 para data/filtro malformado; 5xx para indisponibilidade.
- O frontend deve distinguir timestamp nulo de erro, cancelar/repetir consultas conforme filtros mudem e impedir que a falha dessa fonte derrube resumo, usuários ou realtime.
- Backend precisa agregar min/max(captured_at), converter limites do dia corretamente, filtrar gestor e informar timezone. O Agent precisa de timestamps consistentes e sincronização sem duplicidades; idempotência segue pendente em B-06. A liderança confirma se a resposta inclui todos os colaboradores sem registro ou somente quem registrou e os rótulos funcionais. Eventos explícitos de entrada/saída não estão definidos.

<a id="proposta-task-hours"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: agregação de horas por Task

**Necessidade e referências:** RN-19, RF-24, RF-27 e I-06. A direção aprovada pela liderança é apresentar horas gastas por Task, sem rankings, notas ou comparações de desempenho. O resumo atual agrupa por categoria e não pode ser usado como tempo por Task.

**Endpoint candidato alinhado à issue #140 e à interface de demonstração:** GET /dashboard/tasks-summary com `date` obrigatório e `username`/`task_id` opcionais. A agregação por período de múltiplos dias segue em aberto e não deve ser presumida pela rota diária.

```json
{
  "date": "2026-10-13",
  "timezone": "America/Sao_Paulo",
  "tasks": [
    {
      "task_id": "6e7b94da-5651-46a0-bf28-fcb8f4f14c04",
      "title": "Relatório mensal",
      "total_seconds": 28800,
      "collaborators": [
        {
          "id": "d94a4d6c-8542-4c3e-889b-89db302ef4cc",
          "username": "ana",
          "full_name": "Ana Souza"
        }
      ]
    }
  ]
}
```

O endpoint, os parâmetros e todos os campos de resposta são candidatos, não implementados. A resposta inclui `date`, `timezone` e `tasks`; cada item identifica Task/título, `total_seconds` e colaboradores. `task_id: null` pode representar registros sem Task apenas se a regra de negócio aprovar essa categoria. O mock local retorna sempre `tasks: []` e serve para validar estados da interface, não a agregação nem dados de produção. `total_seconds` é duração agregada de atividade vinculada à Task; inclusão de períodos inativos ou fora do escopo ainda requer aprovação.

- `date` é uma data válida no fuso declarado; filtros por período e seus limites ainda precisam de definição para análises de vários dias.
- username e task_id são filtros opcionais limitados ao gestor autenticado; task_id é UUID.
- O Backend deve definir período máximo para limitar custo de uma futura consulta por período.
- Agregar somente registros com vínculo persistido com Task. Não deduzir task_id por categoria, aplicação, janela ativa ou estado realtime.
- Ordenação estável por título/identificador; nunca ordenar por duração para formar ranking. Não incluir pontuação nem comparar desempenho entre colaboradores.
- Consulta válida sem registros responde 200 com `tasks: []`. Respostas de erro propostas: 401 sem autenticação; 404 para filtro fora do escopo; 422 para data/UUID inválido; 5xx para indisponibilidade.
- O filtro desta interface afeta apenas o card de resumo por Task; não altera métricas gerais ou categorias. O Dashboard só pode mostrar horas reais por Task depois que cada registro estiver ligado à Task correta e a regra de duração aprovada.
- Backend precisa persistir vínculo entre Task e registros/períodos, implementar agregação autorizada e idempotência (B-06). Agent precisa enviar task_id correto após seleção, início/fim e ciência do colaborador. A liderança decide se horas incluem inatividade, aplicações fora do escopo e períodos sem atividade, e se Tasks sem registro entram com zero ou são omitidas.

### I-07 — Datas e fusos horários

<a id="proposta-timezone"></a>

#### PROPOSTA — NÃO IMPLEMENTADO: regras de datas e fusos horários

**Necessidade e referências:** RF-20, RF-24, RF-27 e I-07. Brasília, timezone IANA America/Sao_Paulo, foi definida pela liderança como referência para o dia de negócio. Existe intenção de permitir configuração regional futura; nome e mecanismo da variável de ambiente ainda não foram definidos. O timezone não tem uma rota exclusiva: consultas diárias e por período informam o timezone de agrupamento.

Exemplo de consulta e resposta candidatas:

```http
GET /dashboard/attendance?date=2026-10-13
```

```json
{
  "date": "2026-10-13",
  "timezone": "America/Sao_Paulo",
  "users": []
}
```

A resposta segue o schema candidato de registros diários acima; a mesma regra vale para a agregação de horas por Task.

- Datas de filtro são datas de calendário AAAA-MM-DD no timezone configurado pelo Backend, não datas UTC nem o dia local arbitrário do browser.
- Instantes são retornados com offset explícito, preferencialmente UTC com sufixo Z. O timezone declara agrupamento/formatação e não altera o instante.
- O Agent já envia captured_at em UTC quando presente. Proposta: Backend normaliza instantes com offset para UTC. Timestamp sem offset deve ser rejeitado com 422 ou interpretado por regra explícita aprovada. Quando captured_at é omitido, o Backend atual usa horário UTC de recebimento.
- Converter início do dia local ao instante UTC correspondente antes da consulta; usar limite final exclusivo no início do dia seguinte para evitar dupla contagem.
- Timezone não reconhecido ou data inválida resulta em 422. Dados fora do escopo seguem 404. Falha de consulta permanece 5xx, nunca data vazia.
- Frontend formata timestamps usando timezone declarado pela API; não reagrupar atividades nem compensar erro de cálculo do servidor. O dia inicial do Dashboard usa a mesma configuração de negócio depois que sua origem for confirmada.
- Backend precisa configurar timezone IANA e aplicá-lo em agregações, filtros, exportações e validações, além de expô-lo em respostas diárias. Agent mantém instantes com offset/UTC e evita relógio local sem zona. A liderança confirma nome da variável, configuração por instalação ou gestor/região, regra para timestamp sem offset e exibição de dias históricos em outros fusos.

### Dependências externas das propostas

| Responsável                          | Dependências                                                                                                                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend                              | Persistir Tasks, escopo, atribuições, vínculo gestor–colaborador e vínculo de atividades com Task; implementar schemas/rotas; proteger e filtrar por identidade; agregar dados diários e por Task; aplicar timezone; definir idempotência e erros.       |
| Agent                                | Consumir associação e credencial apropriada; listar Tasks autorizadas; exigir ciência antes do monitoramento; enviar task_id e timestamps consistentes; encerrar/trocar execução sem sobreposição. O payload atual de atividade ainda não envia task_id. |
| Liderança/produto                    | Decidir semântica, ciclo de vida, associação, duração agregada, política de longo prazo do armazenamento de sessão e configuração regional/global listadas abaixo; decisões já aprovadas permanecem preservadas.                                         |
| Frontend, após contratos disponíveis | Integrar somente endpoints e schemas confirmados, distinguindo estados de erro/vazio/carregamento. Esta proposta não adiciona chamadas nem altera a apresentação aprovada do MVP.                                                                        |

<a id="decisoes-pendentes-lideranca"></a>

### Decisões pendentes da liderança

As decisões aprovadas continuam válidas: Dashboard sem rankings, exibição de horas gastas por Task, Agent offline após mais de 15 minutos sem novo registro no banco da máquina e fuso de Brasília como referência. A decisão de adiar autenticação pertence ao MVP de 13/10; a issue #138 aberta em 21/10 e esta execução retomaram a sessão frontend. Associação gestor–colaborador continua dependente do Backend. As perguntas abaixo tratam dos detalhes ainda abertos e não reabrem essas decisões.

1. Quais campos definem uma Task e qual o limite da descrição? A Task padrão solicitada para a Sprint 2 será seed, configuração ou registro operacional? Como identificar aplicação do escopo (nome exato de processo, executável ou regra)? Como arquivar ou excluir Task com histórico?
2. Uma Task aceita vários colaboradores? O que acontece com execução ativa ao alterar escopo ou remover colaborador? O Agent recebe uma atualização pendente de ciência?
3. “Horas gastas por Task” inclui tempo inativo, aplicação fora do escopo e intervalos sem atividade? Tasks sem registro aparecem com zero? A lista em ordem estável por descrição/identificador atende à decisão aprovada de não usar rankings?
4. A consulta diária inclui todos os colaboradores associados sem registro, com timestamps nulos, ou apenas quem tem eventos? O produto quer primeiro/último registro ou eventos explícitos de entrada e saída?
5. O código de associação expira, é rotativo, reutilizável ou de uso único? Qual o limite de tentativas? username e hostname identificam o Agent de modo suficiente ou é necessário identificador persistente?
6. `sessionStorage` foi adotado para a issue #138. A liderança pretende mantê-lo como escolha de produto ou planejar migração para cookie `HttpOnly` com proteção CSRF? A configuração global e as categorias permanecem globais ou passam a pertencer a cada gestor?
7. O timezone America/Sao_Paulo vale por instalação ou gestor? Qual variável de ambiente será adotada? Como tratar captured_at sem offset?
8. Qual política de conflito/status deve ser usada para 403/404/409 nos endpoints aninhados?

### Referências e rastreabilidade

- [Pendência de associação gestor–colaborador (I-02)](#proposta-association-code), [Tasks (I-03)](#proposta-tasks-crud), [autorização (B-01)](#proposta-authorization), [jornada diária e relatórios (I-06)](#proposta-attendance), e [datas e fusos (I-07)](#proposta-timezone).
- [Contratos efetivamente existentes](CONTRATOS_API.md) permanecem separados destas propostas.
- Requisitos de Tasks e escopo: [RF/RN](../../requisitos/requisitos/rn_rf.md), [critérios CA-02 a CA-04](../../requisitos/requisitos/ca.md#ca-02--tasks-e-início-do-monitoramento), [Sprint 2](../../requisitos/sprints/sprint2.md).
- Associação e código: [RF-03 a RF-05](../../requisitos/requisitos/rn_rf.md#rf-03--disponibilizar-código-de-associação), [CA-01](../../requisitos/requisitos/ca.md#ca-01--identificação-acesso-e-associação), [RBAC, seção 6](../../requisitos/rbac.md#6-associação), Sprint 2 US-06/US-08, issues #113/#114.
- Autorização: [RN-15, RF-23](../../requisitos/requisitos/rn_rf.md#rn-15--controle-de-acesso-aos-dados), [CA-09](../../requisitos/requisitos/ca.md#ca-09--privacidade-e-segurança), [RBAC, seção 5](../../requisitos/rbac.md#5-escopo-de-acesso).
- Jornada e relatórios: RF-13, RF-19, RF-24, RF-27, CA-07 e CA-10. Datas e fuso: RF-20, RF-24 e RF-27.
- Direção da liderança sobre Dashboard: RN-19 e I-06; telas de referência e descrições mais amplas fora de FrontEnd devem ser alinhadas se divergirem dessa decisão.
- O arquivo complementar [Proposta de contratos do Backend](PROPOSTA_CONTRATOS_BACKEND.md) mantém um recorte específico para Backend; esta seção centraliza o conteúdo do arquivo de propostas migrado e as referências dos IDs.

<a id="proximos-passos"></a>

## Ordem de execução

1. Proteger dados e gravações (B-01/B-02), corrigir integridade, inicialização e estados realtime (B-03 a B-10).
2. Definir identidade/equipe e task/consentimento (I-01 a I-03).
3. Definir jornada, conexão, consultas completas e fuso (I-04 a I-07).
4. Integrar UI e validar serviço real (F-01/I-08), decidir PWA e matriz de suporte (F-02/F-03).
5. Atualizar o inventário técnico do requisito de responsividade (D-01) com os mantenedores de `requisitos/`.

<a id="auditoria-de-continuacao--21102026"></a>

## Auditoria de continuação — 21/10/2026

O checkout inicial estava limpo em `e14d831b973f9160c2ff3434b9c53578f90bc156`. A `main` oficial consultada pelo GitHub era `230fc7fac1374941dcb26b1d507494aa6450234f`; o compare oficial confirmou sete commits à frente e nenhum commit atrás. A PR #128 permanecia aberta e não recebeu alterações nesta execução. O diretório `requisitos/` não teve commits desde 22/09/2026. Nenhum fetch Git foi feito para não alterar `.git` fora do escopo.

### Evidências desta rodada

- `TaskForm` impede submit durante carga/falha de colaboradores, valida cada ID contra o catálogo concluído, permite remover uma associação que deixou de existir e associa alertas aos campos. O retry não fica preso dentro de um fieldset desabilitado.
- A criação limpa o rascunho após sucesso. Uma falha preserva valores. Na edição, uma resposta nova do mesmo ID sincroniza o formulário apenas enquanto ele está limpo; texto digitado é preservado. Cancelamento e remoção do catálogo limpam a edição/seleção correspondente.
- `useTasks` ignora listagens iniciadas antes de uma mutação concluída. O Dashboard cancela requisições anteriores, rejeita resumo de outra data, atualiza catálogo e resumo no ciclo de 30 segundos existente e limpa filtro de Task excluída; métricas gerais não dependem de `task_id`.
- As barras do resumo expõem proporção acessível e duração inválida não vira zero. Uma resposta com `task_id: null` aparece como “Sem Task / Atividades Gerais”. Os mocks não geram segundos.
- O login em andamento recebe `AbortSignal`; logout aborta a operação. Um token salvo que não tenha três segmentos JWT é descartado antes da consulta de identidade. `403` mantém a sessão, como já coberto na camada HTTP.
- MSW exige o Bearer da sessão demonstrativa nos recursos de dados e as rotas de Task usam `/tasks/`. O mock representa uma única identidade fixa; não simula isolamento multi-gestor nem `403` entre equipes e não comprova autorização do servidor.

### Situação oficial e técnica das issues relacionadas

| Issue                                                                                                                                                                                                                                                                                                  | Estado oficial em 21/10 | Estado técnico nesta rodada                       | Evidência frontend                                                                                                                                            | Dependência e próximo aceite                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [#129](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/129)                                                                                                                                                                                                                               | Aberta                  | Bloqueada                                         | Tela real desabilitada; demonstração de Tasks isolada.                                                                                                        | Backend #133 e Agent #135/#136 devem entregar persistência, equipe, associação e execução para a issue pai.       |
| [#133](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/133)                                                                                                                                                                                                                               | Aberta                  | Dependência externa                               | Router/modelo/schema de Tasks não existe no Backend inspecionado; issue define `/tasks/`.                                                                     | Backend: CRUD autenticado, atribuição a usuário do gestor, 401/403/404/422 e testes de escopo.                    |
| [#134](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/134)                                                                                                                                                                                                                               | Aberta                  | Parcial                                           | `TasksPage`, `TaskForm`, `TaskList`, `useTasks`; Vitest cobre create/update/delete, validação, retry, rascunho, mesmo ID, ID inválido e resposta concorrente. | Continua parcial até conectar a API persistente, obter colaboradores da equipe e homologar operações reais.       |
| [#98](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/98)                                                                                                                                                                                                                                 | Aberta                  | Parcial                                           | `DashboardFilters` e `DashboardPage` cobrem filtros combinados, catálogo indisponível e remoção de Task sem alterar indicadores gerais.                       | O catálogo real e o filtro de atividade exigem contrato/`task_id` do Backend e Agent.                             |
| [#140](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/140)                                                                                                                                                                                                                               | Aberta                  | UI demonstrativa parcial                          | `useTaskAnalytics` cobre cancelamento, ordem de resposta, data e atualização; `TaskSummaryCard` agrupa “Sem Task / Atividades Gerais”.                        | Backend precisa persistir `task_id`, escopar equipe e agregar segundos reais por data; ainda não está homologado. |
| [#137](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/137)                                                                                                                                                                                                                               | Aberta                  | Bloqueada por Backend                             | Bearer e guarda frontend não tornam protegidas as rotas do servidor.                                                                                          | Backend deve aplicar identidade/escopo a cada rota, separar token do Agent e provar isolamento entre gestores.    |
| [#138](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/138)                                                                                                                                                                                                                               | Aberta                  | Parcial                                           | Sessão do frontend e testes de JWT sintático, restauração, logout/401/403 e cancelamento de login.                                                            | Falta validação ponta a ponta com API autorizada; issue segue aberta e depende da autorização #137.               |
| [#112](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/112)                                                                                                                                                                                                                               | Fechada                 | Implementada no Frontend; API real não homologada | Cadastro/login, sessão de aba, restauração e logout cobertos por Vitest.                                                                                      | A issue oficial está fechada; a confirmação do backend fica separada da implementação local.                      |
| [#105](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/105), [#113](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/113), [#114](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/114), [#115](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/115) | Abertas                 | Bloqueadas por contrato/backend                   | O card não gera código e o frontend não chama rotas de associação presumidas.                                                                                 | Backend define geração/consulta, expiração, vínculo, autorização e erros; Agent precisa validar o fluxo.          |

### Critérios para retirar os bloqueios externos

1. Backend publica `GET/POST /tasks/` e rotas de item; testes comprovam propriedade da Task, colaborador da mesma equipe, 401 sem token e 403/404 fora do escopo.
2. Contrato define atualização, exclusão/arquivamento e política dos registros históricos; Frontend valida resposta, atribuições e mensagens com API de homologação.
3. Agent persiste e envia `task_id`; Backend agrega dados válidos por equipe e data, agrupa vínculos ausentes/excluídos sob “Sem Task / Atividades Gerais” e testa totais.
4. Backend protege rotas atuais de usuários, realtime, resumo, exportação e configuração com identidade do gestor; teste negativo comprova isolamento entre dois gestores.
5. Backend publica o código de associação e endpoint autenticado de consulta; testes cobrem seis dígitos como string, 401, expiração e associação válida/inválida.

As validações executadas nesta rodada e os resultados exatos de Vitest, cobertura, lint, formato, typecheck, build, E2E e API real estão em [Testes](TESTES.md) e [Relatório](RELATORIO_EXECUCAO_FRONTEND.md). Os dados mockados continuam sem persistência real.

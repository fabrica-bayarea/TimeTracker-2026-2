# Contratos da API usados pelo Frontend

Este documento descreve rotas encontradas no Backend e chamadas do cliente web em produção no commit **c47346a**. O HEAD **c05d282** contém a revisão documental. Para contratos de desenvolvimento que ainda não existem no Backend, consulte a seção [Demonstrações e propostas](#demonstrações-e-propostas).

## Convenções

- “Backend implementado” significa que a rota está declarada no código atual do checkout.
- “Consumido” indica que api.js chama essa rota em produção. Chamadas do cliente MSW não contam como integração de produção.
- O cliente valida formatos relevantes em validators.js e envia Bearer nas operações marcadas como autenticadas.
- As rotas privadas de gestores validam JWT/audiência e escopam usuários, atividades, resumo, exportações e Tasks pelo gestor. Isso foi implementado localmente pelo PR #148, mas não foi homologado contra ambiente real nesta auditoria.
- /config/* é uma exceção: o cliente envia Bearer, mas os routers atuais do Backend não exigem token nem escopam a configuração.

## Endpoints consumidos

| Método e caminho          | Autenticação no Backend            | Parâmetros/payload                                               | Resposta validada                                                     | Consumidor                                  | Estado                                                              |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| POST /auth/register       | Pública                            | JSON {email, password}                                           | ManagerOut: id, email, created_at                                     | AuthPage                                    | Backend implementado; consumido                                     |
| POST /auth/login          | Pública                            | JSON {email, password}                                           | Token: access_token, token_type, expires_in                           | AuthPage                                    | Backend implementado; consumido                                     |
| GET /auth/me              | Bearer de gestor                   | Sem parâmetros                                                   | Perfil do gestor, incluindo association_code de 6 dígitos             | ManagerSession, código de associação        | Backend implementado; consumido                                     |
| GET /users/               | Bearer de gestor                   | Sem parâmetros                                                   | Lista de UserOut; uso em Tasks exige UUID, username e full_name       | Dashboard, Colaboradores, Relatórios, Tasks | Backend implementado; gestor-escopado                               |
| GET /activities/realtime  | Bearer de gestor                   | Sem parâmetros                                                   | Lista de RealtimeEntry                                                | Dashboard, Colaboradores                    | Backend implementado; gestor-escopado                               |
| GET /dashboard/summary    | Bearer de gestor                   | date obrigatório; username opcional                              | DailySummaryResponse: date e usuários com total_seconds e by_category | Dashboard                                   | Backend implementado; gestor-escopado                               |
| GET /dashboard/export/csv | Bearer de gestor                   | date obrigatório; username opcional                              | CSV, MIME text/csv                                                    | Relatórios                                  | Backend implementado; gestor-escopado; conteúdo requer ajuste BE-08 |
| GET /dashboard/export/pdf | Bearer de gestor                   | date obrigatório; username opcional                              | PDF, MIME application/pdf                                             | Relatórios                                  | Backend implementado; gestor-escopado; título requer ajuste BE-08   |
| GET /config/              | Rota atual sem autenticação/escopo | Sem parâmetros                                                   | SystemSettingsOut                                                     | Configurações                               | Backend implementado globalmente; cliente envia Bearer              |
| PUT /config/              | Rota atual sem autenticação/escopo | JSON com capture_interval_seconds e idle_timeout_seconds         | SystemSettingsOut                                                     | Configurações                               | Backend implementado globalmente; cliente envia Bearer              |
| GET /tasks/               | Bearer de gestor                   | Sem parâmetros                                                   | Lista de TaskResponse                                                 | Tasks, filtro por Task no Dashboard         | Backend implementado; gestor-escopado                               |
| GET /tasks/{task_id}      | Bearer de gestor                   | UUID no caminho                                                  | TaskResponse                                                          | Cliente api.getTask                         | Backend implementado; gestor-escopado                               |
| POST /tasks/              | Bearer de gestor                   | TaskCreate: title, description opcional, collaborator_ids UUID[] | TaskResponse; HTTP 201                                                | Tela de Tasks                               | Backend implementado; gestor-escopado                               |
| PUT /tasks/{task_id}      | Bearer de gestor                   | TaskUpdate parcial: title, description, collaborator_ids         | TaskResponse                                                          | Tela de Tasks                               | Backend implementado; gestor-escopado                               |
| DELETE /tasks/{task_id}   | Bearer de gestor                   | UUID no caminho                                                  | HTTP 204 sem corpo                                                    | Tela de Tasks                               | Backend implementado; gestor-escopado                               |

## Payloads e respostas relevantes

### Autenticação do gestor

Cadastro e login recebem email e password em JSON. O Backend normaliza email; a senha de cadastro deve ter ao menos 8 caracteres e obedecer ao limite em bytes do schema. Cadastro retorna somente o perfil básico; não cria sessão no Frontend. Login retorna access_token, token_type e expires_in. O Frontend valida /auth/me antes de considerar a sessão pronta.

GET /auth/me exige JWT de gestor e inclui association_code como string de seis dígitos. A string preserva zeros à esquerda. Os tokens de gestor e Agent têm audiências diferentes; o Frontend web não usa token de Agent.

### Equipe e atividade

GET /users/ retorna colaboradores filtrados pela identidade do gestor. O Frontend valida os registros usados em Tasks por UUID; uma resposta inválida ou sem consulta autenticada bloqueia a seleção para evitar atribuições arbitrárias.

GET /activities/realtime não recebe filtros. RealtimeEntry contém username, hostname, process_name, window_title, category, is_idle, seconds_since_last_activity e status. A implementação emite online, ausente e offline; o comentário de schema não enumera offline. O valor representa atividade aproximada e não confirma conexão de máquina. Consulte [BE-10](PENDENCIAS_BACKEND.md#be-10--separar-inatividade-de-conexão-do-agent).

GET /dashboard/summary exige date no formato AAAA-MM-DD e aceita username opcional. A resposta contém total diário e categorias, não Task, jornada nem período arbitrário. A query atual agrupa por date(captured_at) sem declarar fuso de negócio; consulte [BE-07](PENDENCIAS_BACKEND.md#be-07--definir-captura-futura-e-fuso-do-dia-de-negócio).

### Tasks

TaskCreate usa title (máximo 200), description opcional/nula (máximo 5.000) e collaborator_ids (lista de UUIDs da equipe, até o limite do schema). Título é limpo e não pode ficar vazio; descrição em branco vira nula. TaskUpdate é parcial; collaborator_ids omitido preserva atribuições e lista vazia remove todas. A resposta inclui id, title, description, collaborators, created_at e updated_at.

As rotas ocultam Tasks de outros gestores. O Backend valida que cada colaborador pertença à equipe autenticada; se um UUID for inválido ou de outra equipe, a mutação inteira é recusada. DELETE retorna 204. O Frontend valida UUID, payload, resposta e corpo vazio do DELETE.

### Configurações e categorias

SystemSettingsOut contém capture_interval_seconds e idle_timeout_seconds. GET/PUT /config/ é global e não usa dependência de gestor no Backend atual. O cliente inclui Bearer, mas isso não torna a rota protegida. O limite salvo ainda não governa a classificação realtime (BE-05).

O Backend declara rotas /categories/*, mas o Frontend de produção não as consome. Sua política atual de autenticação/escopo está em [BE-13](PENDENCIAS_BACKEND.md#be-13--definir-acesso-a-configurações-e-categorias).

### Exportações

CSV devolve as colunas username, category e total_seconds; PDF apresenta total por usuário e categorias. Ambos reutilizam o resumo diário escopado pelo gestor. A UI verifica status, MIME e resposta não vazia. A neutralização de fórmulas em células CSV e o título do PDF seguem pendentes em [BE-08](PENDENCIAS_BACKEND.md#be-08--corrigir-segurança-e-semântica-das-exportações).

## Erros e validação no cliente

O cliente mapeia falhas HTTP comuns para mensagens seguras e preserva status/detalhes em ApiError sem exibir texto cru do servidor. 401 em chamada autenticada encerra sessão; 403 não é tratado como token expirado. 400/422 indicam entrada inválida; 404 recurso ausente ou não acessível; 409 conflito; 429 muitas requisições; 5xx indisponibilidade do serviço.

As respostas de JSON passam por validadores de formato. Chamadas têm timeout, AbortController e tratamento separado para cancelamento, timeout, falha de rede, JSON inválido e resposta incompatível. Exportações validam content-type e leem Blob. A validação de cliente não substitui teste de autorização ou persistência no servidor.

## Demonstrações e propostas

Os caminhos abaixo não são contratos do Backend nem são chamados pelo api.js de produção. Eles aparecem em dev-mocks/client.js e handlers.js sob o modo de desenvolvimento/MSW:

| Caminho candidato            | Uso de desenvolvimento                           | Situação do Backend                                          |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| GET /dashboard/tasks-summary | Retorna resumo simulado vazio; filtros validados | Não implementado; esperado pela issue #140, depende de BE-12 |
| GET /dashboard/attendance    | Exercita estados de presença com fixtures        | Não implementado                                             |
| GET /dashboard/task-hours    | Exercita schema de horas com lista vazia         | Não implementado                                             |
| GET /agents/status           | Demonstra estados fixos de Agent                 | Não implementado                                             |

Essas respostas exercitam estados da interface, não produtividade, presença, persistência nem integração real. O contrato de Task analytics, seu armazenamento e sua semântica precisam ser aprovados antes de marcar uma rota como oficial. Consulte [Pendências Backend](PENDENCIAS_BACKEND.md#be-12--persistir-taskid-e-fornecer-agregação-real-por-task).

### Formas candidatas preservadas

As formas abaixo foram propostas em revisões anteriores para discussão. Não são OpenAPI publicado, payload garantido nem integração disponível no cliente de produção.

- **GET /dashboard/attendance?date=AAAA-MM-DD&username=...**: sugestão de resposta com date, timezone, as_of e users com username, first_activity_at e last_activity_at. America/Sao_Paulo era a sugestão de fuso. Horários seriam primeiro/último registro capturado, não início/fim formal da jornada. Ver [BE-14](PENDENCIAS_BACKEND.md#be-14--fornecer-resumo-diário-de-primeiro-e-último-registro).
- **GET /dashboard/task-hours?start_date=...&end_date=...&username=...&task_id=...**: sugestão histórica de intervalo inclusivo, timezone e tasks com task_id, description e total_seconds; sem ordenação por produtividade ou ranking. O limite de datas, quais eventos contam como duração, Tasks sem registros e eventos sem task_id permanecem decisões de produto/Backend.
- **GET /agents/status?username=...**: sugestão de lista por máquina com username, hostname, last_record_at e connection_status. offline após mais de 900 segundos era uma hipótese da proposta, dependente de instante de recebimento do servidor; não é regra implementada.

As propostas antigas de CRUD autenticado e de associação foram substituídas pelos contratos atuais /tasks/* e POST /collaborators/associate. GET /auth/association-code e POST /associate/ não são rotas atuais do Backend.

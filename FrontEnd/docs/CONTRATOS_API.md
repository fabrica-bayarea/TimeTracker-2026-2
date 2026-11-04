# Contratos da API do Frontend

**Snapshot auditado:** 30/10/2026. **Checkout:** branch main, commit `eec089a976cd2678473ad2f992269538fd1a4a57`. Contratos descritos continuam limitados às rotas confirmadas no backend; o comportamento seguro de mensagens HTTP pertence ao frontend.

Este snapshot substitui as conclusões dos checkpoints históricos arquivados ao final deste arquivo. A fonte de verdade desta revisão é o código local em backend/app, agent/ e FrontEnd/src/shared/api. PRs #142, #145 e #146 estão incorporados na ancestralidade Git local pelos merges 5b72a3e, dffb107 e cccc5ac. PR #144 do Agent está incorporado em 189a7e9.

## Convenções e origem da API

VITE_API_URL configura a origem. Em desenvolvimento, o fallback é http://localhost:8000; sem valor em produção o frontend usa a mesma origem da página. As rotas que exigem gestor usam Authorization: Bearer com o token recebido em /auth/login. O frontend não decodifica o JWT para decidir autorização.

O envio de Bearer pelo frontend não torna uma rota protegida. As rotas marcadas como globais abaixo não validam o gestor nem filtram dados por equipe no backend consultado. Não use seu resultado para afirmar que os dados pertencem ao gestor autenticado.

## Autenticação de gestores

| Método e endpoint   | Autenticação              | Entrada                         | Resposta comprovada                                                | Erros relevantes                                                               |
| ------------------- | ------------------------- | ------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| POST /auth/register | Não                       | ManagerCreate: email e password | 201 ManagerOut: id UUID, email, created_at                         | 409 email já cadastrado; 422 validação; 503 indisponibilidade ao gerar código  |
| POST /auth/login    | Não                       | email e password                | 200 Token: access_token, token_type bearer, expires_in em segundos | 401 credenciais inválidas; 422 validação                                       |
| GET /auth/me        | JWT de gestor obrigatório | Sem corpo                       | 200 ManagerProfileOut: ManagerOut mais association_code            | 401 token ausente, inválido ou expirado; 503 indisponibilidade ao gerar código |

ManagerOut de cadastro não contém association_code. ManagerProfileOut de /auth/me exige association_code como string de exatamente seis dígitos. O frontend preserva zeros à esquerda, valida o perfil separadamente do cadastro e reutiliza o valor presente na sessão do gestor. Consulta de fallback usa a mesma rota protegida. O estado do código é escopado à identidade atual e descartado em troca de sessão/logout.

## CRUD de Tasks

Todas as rotas abaixo exigem JWT de gestor. O router verifica o escopo do gestor no servidor. Uma Task inexistente ou pertencente a outro gestor responde 404, evitando revelar a existência cruzada.

| Método e endpoint       | Entrada            | Resposta comprovada                             | Erros relevantes                                         |
| ----------------------- | ------------------ | ----------------------------------------------- | -------------------------------------------------------- |
| GET /tasks/             | Sem corpo          | 200 lista de TaskResponse do gestor autenticado | 401                                                      |
| POST /tasks/            | TaskCreate         | 201 TaskResponse                                | 401, 422 dados ou colaboradores inválidos/fora da equipe |
| GET /tasks/{task_id}    | UUID no caminho    | 200 TaskResponse                                | 401, 404                                                 |
| PUT /tasks/{task_id}    | TaskUpdate parcial | 200 TaskResponse                                | 401, 404, 422                                            |
| DELETE /tasks/{task_id} | UUID no caminho    | 204 sem corpo                                   | 401, 404                                                 |

TaskCreate aceita title obrigatório não vazio (máximo 200), description opcional/nula (máximo 5.000) e collaborator_ids opcional, lista de UUIDs, padrão vazio. TaskUpdate aceita campos omitidos para preservar valores; description nula limpa a descrição; collaborator_ids substitui a lista completa e [] remove todas as atribuições. Embora use PUT, a atualização é parcial no backend atual.

TaskResponse contém id, title, description nula ou string, collaborators, created_at e updated_at. Não contém manager_id nem collaborator_ids. Cada TaskCollaboratorOut contém id, username e full_name opcional/nulo. Uma Task sem colaboradores é válida. O frontend valida esses formatos, envia Bearer, valida UUIDs, impede mutações concorrentes, atualiza o estado apenas após resposta válida e trata DELETE 204 sem ler JSON. A ordenação padrão da tela acompanha `created_at` decrescente e, em empate, UUID decrescente, como `crud.list_tasks`.

O backend valida no momento de criar/atualizar que cada collaborator_id pertence à equipe do gestor e rejeita a operação inteira se um ID for inválido. Isso não fornece ao frontend uma consulta segura para montar a equipe.

## Associação de colaborador e consulta da equipe

| Método e endpoint             | Autenticação                                        | Entrada                                                            | Resposta e erros comprovados                                                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST /collaborators/associate | Sem JWT de gestor; rota usada pelo Agent com código | association_code (string de seis dígitos), username e machine_name | 200 AssociationOut: access_token do Agent, expires_in, collaborator_id, username, machine_name, manager_id e already_associated; 404 código inválido; 409 já associado a outro gestor; 422 validação; 429 limite excedido com Retry-After |

A rota associa o usuário ao gestor dono do código e emite token com audiência do Agent; não é uma rota de sessão web. GET /users/ não é autenticado nem isolado: retorna usuários globais. Por isso, o frontend não oferece seleção de membros usando essa rota e não filtra uma lista global no cliente como substituto de autorização. Não foi encontrado endpoint autenticado que liste somente a equipe do gestor.

O Agent local ainda usa outro caminho/payload: associate/ com code, username e hostname; o backend espera /collaborators/associate com association_code, username e machine_name. O frontend pode exibir o código correto, mas a associação ponta a ponta depende da adaptação do Agent.

A bandeja do Agent também solicita `GET /tasks/my-tasks`, rota que o backend não declara. O caminho é capturado como `/tasks/{task_id}` e falha na validação UUID com `422`; a lista `/tasks/` existente exige token de gestor e não aceita o token do Agent.

## Atividades, Dashboard, relatórios, configurações e categorias

As rotas seguintes existem no backend local, mas não exigem JWT e não aplicam isolamento por gestor. Embora a camada HTTP do frontend possa enviar o Bearer da sessão, isso não restringe os dados no servidor.

| Método e endpoint                      | Entrada                                                       | Saída comprovada                                     | Limite de autorização                                                           |
| -------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| POST /activities/                      | ActivityLogCreate, sem task_id                                | 201 ActivityLogOut                                   | Sem autenticação de Agent/gestor e sem vínculo com Task                         |
| GET /activities/realtime               | Nenhuma                                                       | lista RealtimeEntry                                  | Global, agrupada por usuário; idade baseada em captured_at enviado pelo cliente |
| GET /dashboard/summary                 | date obrigatório; username opcional                           | DailySummaryResponse com total_seconds e by_category | Global; username é filtro, não autorização                                      |
| GET /dashboard/export/csv              | mesmos filtros do sumário                                     | CSV                                                  | Global                                                                          |
| GET /dashboard/export/pdf              | mesmos filtros do sumário                                     | PDF                                                  | Global                                                                          |
| GET /config/                           | Nenhuma                                                       | SystemSettingsOut                                    | Sem autenticação                                                                |
| PUT /config/                           | capture_interval_seconds e idle_timeout_seconds inteiros >= 1 | SystemSettingsOut                                    | Sem autenticação                                                                |
| GET/POST /categories/                  | dados de categoria na criação                                 | lista ou CategoryOut; criação 201                    | Sem autenticação                                                                |
| GET/POST /categories/rules             | dados de regra na criação                                     | lista ou regra; criação 201                          | Sem autenticação                                                                |
| PUT/DELETE /categories/rules/{rule_id} | UUID e campos de atualização                                  | regra atualizada ou 204                              | Sem autenticação; PUT/404 ou DELETE/404 quando ausente                          |

Realtime.status e seconds_since_last_activity descrevem a regra atual de idade/inatividade da captura. Não provam conexão de rede do Agent, presença do usuário nem tempo trabalhado. O backend não oferece /dashboard/tasks-summary, /dashboard/attendance ou /dashboard/task-hours. ActivityLogCreate não recebe task_id; relatórios por Task e jornada real permanecem bloqueados, sem dados artificiais no bundle de produção.

## Evidências locais e propostas futuras

Contratos confirmados: backend/app/routers/auth.py, tasks.py, users.py, activities.py, dashboard.py, config.py e categories.py; backend/app/schemas.py, models.py, security.py e crud.py. Tipos e validações consumidos estão em FrontEnd/src/shared/api/contracts.js e validators.js.

Não são contratos implementados: rota segura para listar equipe do gestor, leitura de Tasks por token do Agent, associação alinhada ao cliente Agent, status por máquina, eventos idempotentes ligados a Task, resumo de horas por Task/jornada, escopo autenticado para dados globais e timezone do dia de negócio. As propostas e critérios estão em [PENDENCIAS.md](PENDENCIAS.md). Status e funcionamento de issues externas não foram confirmados nesta auditoria; referências a PR são limitadas aos merges locais comprovados.

## Histórico preservado

O conteúdo abaixo é a versão anterior, registrada em 22/10/2026. Seus estados e conclusões foram superados pelo snapshot acima e não devem ser usados como descrição do checkout atual. Foi preservado para rastreabilidade.
---

# Contratos da API do Frontend

Revalidado em **22/10/2026** no checkout local `main`, HEAD `b9d78e515d6e65fbf5076309ecee1a89e8bf9cf0`, com base nos arquivos de `backend/app/`, `agent/` e `FrontEnd/src/shared/api/`. As páginas GitHub das issues #132 e #140 não carregaram nesta sessão (`Cache miss`), então os status externos não foram atualizados. A existência de um contrato frontend ou mock não significa que o servidor o implemente ou proteja.

## Como interpretar os status

- **IMPLEMENTADO:** rota ou comportamento presente no Backend local.
- **DEMONSTRATIVO:** rota do MSW usada somente no ambiente local de desenvolvimento.
- **PROPOSTO:** candidato ainda sem implementação e confirmação do Backend.
- **PARCIAL:** parte da funcionalidade existe, mas os critérios de integração ou negócio não foram concluídos.
- **BLOQUEADO:** depende de contrato, implementação, decisão ou ambiente externo.
- **AGUARDANDO VALIDAÇÃO:** implementação existe, mas ainda não foi homologada contra serviço real.
- **HISTÓRICO:** estado registrado para o checkpoint indicado, mantido para rastreabilidade.
- **RESOLVIDO:** pendência específica concluída no escopo descrito. F-04 está resolvida somente para a rota demonstrativa do Frontend.

## Rotas usadas pelas telas do frontend

`VITE_API_URL` define a origem da API. Sem configuração, o cliente usa `http://localhost:8000` somente durante o desenvolvimento; em produção, usa a mesma origem do Frontend (por exemplo, com proxy reverso). Para uma API em outra origem, configure a URL no ambiente de build. Em páginas HTTPS, a origem configurada também precisa usar HTTPS. A sessão do gestor envia Bearer nas rotas de dados abaixo; o Backend local consultado ainda não exige esses tokens.

| Método e rota               | Parâmetros/corpo                                                                | Resposta                                                                                            | Bearer enviado pelo frontend | Consumidor                         |
| --------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------- |
| `GET /users/`               | Nenhum                                                                          | Array de `UserOut`                                                                                  | Sim                          | Painel, Colaboradores e Relatórios |
| `GET /activities/realtime`  | Nenhum                                                                          | Array de `RealtimeEntry`                                                                            | Sim                          | Painel e Colaboradores             |
| `GET /dashboard/summary`    | `date` obrigatório (`AAAA-MM-DD`); `username` opcional                          | `{ date, users: [{ username, total_seconds, by_category: [{ category, color, total_seconds }] }] }` | Sim                          | Painel                             |
| `GET /dashboard/export/csv` | Mesmos filtros do resumo                                                        | `text/csv`                                                                                          | Sim                          | Relatórios                         |
| `GET /dashboard/export/pdf` | Mesmos filtros do resumo                                                        | `application/pdf`                                                                                   | Sim                          | Relatórios                         |
| `GET /config/`              | Nenhum                                                                          | `{ capture_interval_seconds, idle_timeout_seconds, updated_at? }`                                   | Sim                          | Configurações                      |
| `PUT /config/`              | JSON com `capture_interval_seconds` e `idle_timeout_seconds` inteiros positivos | Objeto de configuração                                                                              | Sim                          | Configurações                      |

O cliente envia `Authorization: Bearer <JWT>` nas chamadas de dados da tabela. **O backend inspecionado não exige esse header nessas rotas**; envio do token pelo frontend não equivale a autenticação/isolamento. O parâmetro `username` filtra uma consulta, mas não impõe autorização no servidor.

`GET /dashboard/summary` e as exportações aplicam `date` e o filtro opcional `username` no Backend. A agregação atual usa a data de `captured_at` sem declarar `America/Sao_Paulo` nem outro fuso no schema da resposta; portanto, não confirma um dia de negócio em Brasília. Os campos `by_category` representam categorias de atividade recebida, não Task, escopo de aplicação ou jornada formal. CSV/PDF exportam esse mesmo resumo diário filtrado, não o relatório completo de RF-24/RF-25.

### Resposta realtime consumida pelo Dashboard e por Colaboradores

`GET /activities/realtime` retorna uma captura (a mais recente) por usuário com registro dentro da janela de até 24 horas; não retorna o status de cada máquina se houver múltiplos Agents por usuário. Os campos incluem `username`, `hostname`, `process_name`, `status` e `seconds_since_last_activity`; a resposta também contém `window_title`, `category` e `is_idle`. O tempo é calculado sobre `captured_at` da captura, não sobre uma confirmação de gravação/recebimento no servidor. Eventos antigos sincronizados posteriormente ou relógios divergentes podem, portanto, alterar a idade exibida.

O backend atual classifica `offline` quando `is_idle` é verdadeiro **ou** quando passaram mais de 900 segundos desde a captura; `ausente` usa o limite de 300 segundos. Portanto, `offline` não comprova desconexão, e a regra acordada de conexão por máquina ainda não é garantida. Não há campo de conexão, versão, fila local, pausa, última sincronização ou Task ativa, nem rota `/agents/status` implementada. Consulte B-10/I-05 em [Pendências](PENDENCIAS.md).

Na página de Colaboradores, o timestamp de atualização é local: marca quando o navegador recebeu uma resposta validada. `seconds_since_last_activity` continua sendo a idade da captura calculada pelo Backend. O frontend avança essa idade com tempo monotônico decorrido desde a resposta, sem inferir `captured_at`, horário de recebimento no servidor ou conexão do Agent. A resposta realtime não expõe o `captured_at` bruto.

Os validadores do frontend verificam o tipo de `is_idle`, `CategorySummary.color` e `SystemSettingsOut.updated_at` quando esses campos opcionais estão presentes; a ausência continua permitida onde o cliente não depende desses campos. As rotas, parâmetros e payloads consumidos não apresentaram divergência com os routers/schemas consultados. Isso não comprova comunicação com uma instância real; os cenários reais permanecem opt-in.

## Autenticação de gestor no backend e frontend

O backend implementa cadastro, login JWT e consulta do gestor; o frontend usa os contratos para iniciar e validar a sessão. As rotas do gestor aguardam uma identidade verificada antes de exibir conteúdo. A autorização das rotas de dados permanece uma dependência separada de backend descrita em B-01.

### `POST /auth/register`

Recebe `ManagerCreate`:

```json
{
  "email": "gestor@empresa.com",
  "password": "SenhaSegura123!"
}
```

O backend valida e normaliza o e-mail, exige e-mail único e senha com pelo menos 8 caracteres e no máximo 72 bytes em UTF-8. A senha é armazenada como hash bcrypt.

- `201`: cadastro concluído, resposta `ManagerOut`.
- `409`: e-mail já cadastrado.
- `422`: e-mail ou senha inválidos.

`ManagerOut` tem `id` (UUID), `email` e `created_at`. Não contém `association_code` nem hash da senha.

### `POST /auth/login`

Recebe o mesmo par `email` e `password`; e-mail inválido ou credenciais incorretas resultam em `422` ou `401`, respectivamente. O sucesso retorna o schema `Token`:

```json
{
  "access_token": "<JWT_EMITIDO_PELO_SERVIDOR>",
  "token_type": "bearer",
  "expires_in": 3600
}
```

`expires_in` é um inteiro positivo em segundos, calculado por `ACCESS_TOKEN_EXPIRE_MINUTES`; o padrão local é 60 minutos (3.600 segundos). O JWT HS256 contém `sub`, `aud`, `iat` e `exp`, com audiência `time-tracker:manager`. A validação de assinatura, audiência e expiração é feita no servidor; o frontend não decodifica o token para conceder acesso.

O contrato Backend de cadastro/login/JWT está **IMPLEMENTADO** no checkout. O fluxo de sessão no Frontend também está implementado, mas sua integração continua **AGUARDANDO VALIDAÇÃO** contra um serviço real autorizado. A API simulada de desenvolvimento não verifica senha real, não homologa o JWT do Backend e não altera o estado de autorização das rotas de dados; a issue #138 permanecia aberta na consulta de 21/10/2026.

### `GET /auth/me`

Exige `Authorization: Bearer <JWT_DO_GESTOR>` e retorna `ManagerOut`. Token ausente, inválido, expirado ou associado a gestor inexistente resulta em `401`. A rota está implementada e retorna a identidade do gestor; o schema não inclui código de associação.

### Métodos de autenticação na camada HTTP do frontend

`api.registerManager(credentials, signal)`, `api.loginManager(credentials, signal)` e `api.getCurrentManager(accessToken, signal)` chamam os contratos acima e validam as respostas. Antes do envio, cadastro/login exigem um objeto com e-mail e senha não vazios e enviam somente esses dois campos. A tela também valida formato de e-mail, mínimo de 8 caracteres e limite de 72 bytes UTF-8 no cadastro. `/auth/me` exige a forma compacta de JWT com três segmentos base64url, rejeitando espaços e caracteres de controle antes de compor `Authorization`. Essa verificação é apenas sintática: assinatura, validade e autorização continuam sob responsabilidade do servidor.

Os métodos reutilizam `ApiError`, timeout de 15 segundos e `AbortSignal`. Os erros dessas chamadas preservam status HTTP, inclusive `401`, `409` e `422`, mas omitem detalhes fornecidos pelo servidor para evitar refletir credenciais ou tokens em mensagens. Resposta incompatível é `invalid-response`. Os validadores aceitam somente os campos definidos pelos schemas atuais `ManagerOut` e `Token`; novas propriedades exigem atualização coordenada do contrato antes de serem consumidas.

`ManagerSessionProvider` controla cadastro, login e validação de identidade. Cadastro retorna `ManagerOut` e apresenta um link para entrar; não cria sessão. Login consulta `/auth/me` antes de armazenar o JWT em `sessionStorage`. A sessão é restaurada por outra chamada a `/auth/me`; logout remove o item da aba. O cliente injeta Bearer nas consultas privadas e emite evento coordenado após `401`; `403` preserva a sessão. Não há refresh token nem revogação no backend.

## Outras rotas presentes no backend, sem uso pelas telas

O backend também declara `GET /` (healthcheck), `POST /activities/`, `GET/POST /categories/`, `GET/POST /categories/rules`, `PUT/DELETE /categories/rules/{rule_id}`. A interface web atual não chama essas rotas.

## Catálogo de rotas declarado no Backend

Esta tabela foi confrontada com os routers e schemas presentes em backend/app/ no commit local analisado. “Sem autenticação na implementação atual” descreve o código, não uma recomendação de segurança. Apenas GET /auth/me injeta a dependência de gestor autenticado; a necessidade de proteger rotas de dados está em B-01/#137.

| Método e caminho declarado                     | Estado atual e entrada                                                              | Resposta/códigos observados                                                     | Autenticação atual e consumidor                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| GET /                                          | Implementado; sem parâmetros                                                        | Objeto de healthcheck                                                           | Sem autenticação; nenhuma tela chama                   |
| POST /auth/register                            | Implementado; email e password                                                      | 201 ManagerOut; 409 email duplicado; 422 schema inválido                        | Público; AuthPage                                      |
| POST /auth/login                               | Implementado; email e password                                                      | 200 Token; 401 credencial incorreta; 422 schema inválido                        | Público; AuthPage                                      |
| GET /auth/me                                   | Implementado; Bearer de gestor                                                      | 200 ManagerOut; 401 token ausente, inválido, expirado ou identidade inexistente | JWT de gestor obrigatório; ManagerSession              |
| GET /users/                                    | Implementado; sem parâmetros                                                        | 200 array de UserOut                                                            | Sem autenticação; Painel, Colaboradores, Relatórios    |
| POST /activities/                              | Implementado; ActivityLogCreate                                                     | 201 ActivityLogOut; 422 payload inválido                                        | Sem autenticação no router atual; Agent                |
| GET /activities/realtime                       | Implementado; sem parâmetros                                                        | 200 array de RealtimeEntry                                                      | Sem autenticação; Painel, Colaboradores                |
| GET /dashboard/summary                         | Implementado; date obrigatório e username opcional                                  | 200 DailySummaryResponse; 422 date inválida/ausente                             | Sem autenticação; Painel                               |
| GET /dashboard/export/csv                      | Implementado; mesmos filtros do resumo                                              | 200 text/csv; cabeçalho e linhas username/category/total_seconds                | Sem autenticação; Relatórios                           |
| GET /dashboard/export/pdf                      | Implementado; mesmos filtros do resumo                                              | 200 application/pdf                                                             | Sem autenticação; Relatórios                           |
| GET /categories/ e POST /categories/           | Implementados; POST recebe name e color                                             | GET retorna array; POST retorna CategoryOut com 201                             | Sem autenticação; sem consumidor nas telas atuais      |
| GET /categories/rules e POST /categories/rules | Implementados; escrita recebe category_id, keyword e match_field                    | GET retorna array; POST retorna CategorizationRuleOut com 201                   | Sem autenticação; sem consumidor nas telas atuais      |
| PUT /categories/rules/{rule_id}                | Implementado; campos de atualização opcionais                                       | 200 CategorizationRuleOut; 404 regra inexistente; 422 UUID/payload inválido     | Sem autenticação; sem consumidor nas telas atuais      |
| DELETE /categories/rules/{rule_id}             | Implementado; rule_id UUID                                                          | 204 sem corpo; 404 regra inexistente; 422 UUID inválido                         | Sem autenticação; sem consumidor nas telas atuais      |
| GET /config/ e PUT /config/                    | Implementados; PUT recebe capture_interval_seconds e idle_timeout_seconds positivos | 200 SystemSettingsOut; 422 valores inválidos                                    | Sem autenticação no router atual; SettingsPage e Agent |

Os schemas de atividade e respostas de realtime/summary estão detalhados acima. Nos demais contratos declarados, UserOut inclui id, username, full_name, department e created_at; CategoryOut inclui id, name e color; CategorizationRuleOut inclui id, category_id, keyword e match_field; SystemSettingsOut inclui os dois inteiros e updated_at opcional. A validação Pydantic rejeita corpos inválidos com 422. As respostas 404 das regras decorrem explicitamente da lógica do router.

### Grafia dos caminhos e diferença de barra final

Os caminhos do cliente real devem permanecer iguais aos métodos em src/shared/api/api.js: ele usa /users/, /activities/realtime, /dashboard/summary, /dashboard/export/{csv|pdf}, /config/ e as rotas de autenticação sem barra final. Os routers atuais declaram esses caminhos. Não há chamada de Tasks no cliente de produção.

No ambiente demonstrativo, `devApi.tasks()` e `devApi.createTask()` usam GET e POST `/tasks/`, como os handlers MSW. Atualização e exclusão usam `/tasks/{task_id}` sem barra terminal. A execução integrada de F-04 reproduziu o estado anterior: POST `/tasks` não casou com o handler `/tasks/` e caiu no handler curinga, que respondeu 501; não houve redirecionamento. A chamada do cliente foi corrigida para `/tasks/`, e o teste integrado agora confirma criação e listagem.

A proposta de CRUD em [Pendências — I-03](PENDENCIAS.md#propostas-de-contratos-de-integracao) adota `/tasks/` para operações da coleção e `/tasks/{task_id}` para um item, seguindo a issue #133. F-04 está resolvida no Frontend demonstrativo. Isso não aprova o contrato de produção nem implementa #133 (CRUD/autorizações no Backend) ou #134 (integração real da interface); ambas as issues permanecem abertas. A interface de produção não chama as rotas simuladas.

O mock GET /dashboard/tasks-summary recebe date, username e task_id opcionais/obrigatórios conforme o cliente, mas a resposta vazia { "date": "AAAA-MM-DD", "timezone": "America/Sao_Paulo", "tasks": [] } pertence só à demonstração. Não existe endpoint de Dashboard por Task, presença diária ou horas por Task no Backend atual. Os demais caminhos propostos ficam em [Propostas de contratos](PROPOSTA_CONTRATOS_BACKEND.md) e [Pendências](PENDENCIAS.md).

## Associação Agent–gestor: endpoints ainda não confirmados no backend

A PR #122 (`ed48ad7cfff9e724406ef9ffffeb6c0f132caf32`) foi integrada à `main` da organização em 12/10/2026 (merge `e43673b4dca212eaa991308d14c9dc25b6c64061`). O Agent implementa formulário de código numérico de seis dígitos, `POST /associate/`, armazenamento protegido por DPAPI do token obtido (`token` ou `access_token`), Bearer em chamadas posteriores e bloqueio do monitoramento até associação.

Payload enviado pelo Agent:

```json
{
  "code": "012345",
  "username": "colaborador",
  "hostname": "ESTACAO-01"
}
```

`code` é string para preservar zeros à esquerda. A implementação do cliente Agent e o merge da PR não demonstram que o backend tenha a rota correspondente. Na inspeção dos routers, modelos, schemas e CRUD deste checkout, não foram encontrados:

- `POST /associate/` ou outra rota de associação;
- campo/modelo `association_code`, geração ou consulta autenticada do código;
- persistência do vínculo colaborador–gestor ou consulta de colaboradores por gestor;
- política de validade, consumo único ou erros do código.

Logo, o endpoint e payload acima são o comportamento do cliente Agent, não contrato confirmado do servidor. As issues #113 e #114 descrevem gerar/consultar e exibir o código, mas não confirmam rota nem resposta. `GET /auth/me` é uma rota real para identidade do gestor, não uma consulta de código.

O JWT do gestor e o token do Agent são credenciais distintas. O frontend não reutiliza o token do Agent. `AssociationCodeCard` agora aparece no Dashboard somente quando `App` fornece a identidade autenticada do gestor. Como não existe contrato de consulta, o card mostra a dependência pendente e não exibe valor demonstrativo. `GET /auth/me` fornece apenas identidade; seu `ManagerOut` e o validador frontend não aceitam `association_code`. Não conectar esse payload ao card nem assumir uma rota. O Frontend mantém apenas um adapter opcional simulado nos testes; não há consulta de código no cliente HTTP de produção.

## Autorização e isolamento de dados

`get_current_manager` é aplicado em `GET /auth/me`, mas não está aplicado aos routers de `/users/`, `/activities/realtime`, `/dashboard/summary`, exportações nem `/config/`. Essas rotas dependem apenas de `get_db`; `PUT /config/` também não verifica gestor. As consultas de usuários, atividades, resumos e arquivos são globais no código atual, sem vínculo com `Manager`.

Assim, qualquer cliente que alcance a API pode consultar os dados expostos e alterar a configuração global, sujeito apenas à disponibilidade da API. A guarda de rota evita mostrar páginas do gestor sem `/auth/me` válido e os cabeçalhos Bearer estão preparados, mas as rotas acima ignoram autenticação e não filtram por gestor. Filtrar colaboradores na interface não é controle de acesso. Essa limitação e o risco permanecem em B-01/#137 de [Pendências](PENDENCIAS.md); autorização real depende do backend.

## Tasks e jornada diária

Não foi localizado modelo/schema/endpoint de consulta ou gravação persistente de Tasks nem dados confiáveis de primeiro/último registro diário. O `realtime` descreve a última atividade e não substitui a jornada. O Agent não envia `task_id`. O cliente HTTP de produção não chama rotas presumidas nem infere esses dados.

### Rotas de demonstração local — MSW, não contratos do Backend

Quando `import.meta.env.DEV` e `VITE_USE_MOCKS=true`, os handlers MSW oferecem as rotas abaixo para testar a interface. Elas não estão no Backend, não persistem e não devem ser usadas como evidência de integração real. As requisições de dados exigem o token fixo da identidade demonstrativa; o mock representa uma única identidade e não simula isolamento entre gestores nem `403` por escopo:

| Método/rota                                                      | Comportamento somente na demonstração local                                                                                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me`        | Cadastro/login aceitam credenciais sintaticamente válidas e retornam identidade/token fixos de demonstração; não verificam senha real nem criam conta no Backend.                      |
| `GET /users/`                                                    | Retorna catálogo fixo de colaboradores; não representa uma equipe autorizada no servidor.                                                                                              |
| `GET /tasks/`, `POST /tasks/`                                    | Lista/cria Tasks em memória. Criação recebe `title`, `description`, `collaborator_ids`; limita IDs ao catálogo fixo. GET responde 200, POST 201, sem sessão 401 e corpo inválido 422.  |
| `PUT /tasks/{task_id}`, `DELETE /tasks/{task_id}`                | Atualiza/remove item em memória; resposta 200. ID UUID inexistente responde 404; sem sessão 401; corpo inválido em PUT 422. Não há GET demonstrativo de item individual.               |
| `GET /dashboard/tasks-summary?date&username&task_id`             | `date` é obrigatório; o handler valida a data e o formato UUID de `task_id`, mas não filtra por `username`/`task_id`. Responde `{ date, timezone, tasks: [] }` e não calcula métricas. |
| `GET /dashboard/attendance?date&username`                        | Valida `date`, retorna horários ilustrativos fixos e filtra o catálogo por `username`; os horários não vêm de registros do Backend.                                                    |
| `GET /dashboard/task-hours?start_date&end_date&username&task_id` | Valida intervalo, datas e formato UUID de `task_id`; não agrega nem filtra registros e responde com `tasks: []`.                                                                       |
| `GET /agents/status?username`                                    | Retorna estados fixos de demonstração para dois Agents; o filtro por `username` é local ao mock e não atesta conexão real.                                                             |

Todas as rotas demonstrativas listadas são cobertas por handlers/testes locais, incluindo a integração `devApi.createTask()` + `setupServer` do MSW. Rotas que não têm handler caem no curinga de desenvolvimento e respondem 501 com indicação de que a chamada real foi bloqueada.

Em `attendance`, data inválida responde 422 e a resposta fixa inclui `date`, `timezone`, `as_of` e usuários com timestamps ou valores nulos; 401 representa ausência do Bearer demonstrativo. Em `task-hours`, datas inválidas, intervalo invertido ou `task_id` malformado respondem 422; a resposta válida contém intervalo, fuso e lista vazia. Essas respostas servem para testar validação e estados da tela, não para documentar jornada ou duração real.

Os formatos de Task são candidatos de interface, não schemas aceitos por um servidor. A rota demonstrativa `/tasks/` segue a grafia da coleção na issue #133. A issue #133 permanece aberta e descreve implementação persistente e autorizada no Backend; a issue #134 permanece aberta e pede integração da interface com essa API. A resolução local de F-04 cobre somente o caminho do POST demonstrativo. A interface de produção permanece desabilitada e não chama essas rotas. A proposta atual de CRUD, associação e resumo por Task está centralizada em [Pendências](PENDENCIAS.md#propostas-de-contratos-de-integracao), com a recapitulação em [Proposta de contratos do Backend](PROPOSTA_CONTRATOS_BACKEND.md).

O resumo por Task é independente dos indicadores gerais e do resumo por categoria. A interface não deriva tempo de categoria, janela ativa ou status realtime. Para implementar a rota real, Backend e Agent ainda precisam definir TaskId persistido, escopo/autorização, fuso e semântica da duração.

O candidato canônico para o resumo diário é `GET /dashboard/tasks-summary?date&username&task_id`, alinhado à issue #140 e detalhado em [Pendências — I-06](PENDENCIAS.md#proposta-task-hours). `GET /dashboard/task-hours?start_date&end_date&username&task_id` só existe no mock e em um recorte histórico de proposta por período; não foi aprovado como segunda rota de produção. A consulta por período requer decisão explícita antes de qualquer implementação.

Veja I-03 e I-04–I-07 em [Pendências](PENDENCIAS.md).

## Erros, validação e cancelamento

`api.js` produz `ApiError` com tipo, status, texto de status, detalhe quando seguro e causa. O timeout de 15 segundos inclui leitura do corpo; cada método aceita `AbortSignal`. O cancelamento interrompe a espera do cliente, sem reverter uma gravação já processada pelo servidor. Os validadores recusam respostas `2xx` incompatíveis. Exportações aceitam somente CSV/PDF e validam MIME.

Consulte [Arquitetura](ARQUITETURA.md) para o fluxo do cliente e a análise de armazenamento de sessão. Requisitos/issues descrevem necessidades; não bastam para criar endpoints.

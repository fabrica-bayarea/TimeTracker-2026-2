# Pendências do Backend que impactam o Frontend

Fonte canônica do trabalho ainda necessário no Backend e das decisões externas indispensáveis à sua implementação. Revisada em **07/11/2026**, com código no commit **c47346a** e documentação no HEAD **c05d282**. Backend, Agent e requisitos foram consultados somente para leitura; testes do Backend não foram executados nesta revisão.

“Pendente” descreve código/requisito ausente; “Parcialmente implementado” indica lacunas verificáveis; “Implementado, não homologado” indica código presente sem validação integrada; “Bloqueado” depende de decisão ou trabalho externo. A lista contém somente itens acionáveis. BE-01 e BE-02 da documentação anterior foram implementados no código local pelo PR #148 e saíram da lista ativa; o histórico está em [Alterações](ALTERACOES.md).

## Resumo

| ID    | Estado                    | Prioridade | Tema                                              |
| ----- | ------------------------- | ---------: | ------------------------------------------------- |
| BE-03 | Bloqueado                 |         P1 | CORS e deploy HTTPS                               |
| BE-04 | Pendente                  |         P1 | Seed de configuração com UUID                     |
| BE-05 | Pendente                  |         P2 | Aplicação do limite de inatividade                |
| BE-06 | Pendente                  |         P1 | Idempotência e desempate de eventos               |
| BE-07 | Pendente                  |         P1 | Capturas futuras e fuso de negócio                |
| BE-08 | Parcialmente implementado |         P2 | Segurança e semântica das exportações             |
| BE-09 | Pendente                  |         P2 | Unicidade e limites da configuração               |
| BE-10 | Bloqueado                 |         P2 | Conectividade do Agent separada de inatividade    |
| BE-11 | Pendente                  |         P1 | Consulta de Tasks pelo Agent                      |
| BE-12 | Bloqueado                 |         P1 | Vínculo e agregação real por Task                 |
| BE-13 | Bloqueado                 |         P1 | Política de acesso para configuração e categorias |
| BE-14 | Bloqueado                 |         P2 | Consulta diária de primeiro e último registro     |

### BE-03 — Configurar CORS e deploy HTTPS por ambiente

**Responsável:** Backend/DevOps. **Issues:** [#132](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/132), [#141](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/141). **Evidências:** [main.py](../../backend/app/main.py), [api.js](../src/shared/api/api.js), [teste opt-in da API real](../e2e/real-api.spec.js).

**Estado atual:** CORS local usa origem ampla e credenciais habilitadas. O Frontend aceita VITE_API_URL; o fallback de desenvolvimento é localhost e, em build sem configuração, usa a mesma origem. Não há evidência de ambiente publicado em HTTPS ou teste entre redes neste workspace.

**Trabalho restante:** configurar origens explícitas por ambiente, publicar API e Frontend sob HTTPS e validar preflight de Authorization. A configuração local não comprova a política nem a conectividade de produção.

**Impacto no Frontend:** login, chamadas autenticadas e uso pelo Agent fora da rede local não estão homologados.

**Critérios de aceite:** ambiente de homologação identificado; origem HTTPS permitida; origem não autorizada recusada; preflight e chamadas Bearer bem-sucedidos; fluxo do Agent testado de uma rede externa. Usar contas e dados descartáveis.

### BE-04 — Corrigir o seed de SystemSettings

**Status:** Pendente. **Prioridade:** P1. **Responsável:** Backend. **Issue:** não identificada. **Evidências:** [seed.py](../../backend/seed.py), [models.py](../../backend/app/models.py).

O modelo declara chave primária UUID, mas o seed consulta e cria a linha com id inteiro 1. A rotina não foi executada nesta auditoria; a incompatibilidade foi identificada por inspeção. Criar a configuração usando o gerador UUID e tornar o seed idempotente.

**Impacto:** a preparação de ambiente pode falhar antes de Configurações consultar os valores. **Aceite:** seed executado duas vezes em banco limpo sem erro, UUID válido e uma configuração acessível por GET /config/; incluir teste de seed/inicialização.

### BE-05 — Aplicar o limite salvo de inatividade ao realtime

**Status:** Pendente. **Prioridade:** P2. **Responsável:** Backend/produto. **Issue:** RF-21; a semântica do estado depende de decisão. **Evidências:** [crud.py](../../backend/app/crud.py), [config.py](../../backend/app/routers/config.py), [schemas.py](../../backend/app/schemas.py).

GET/PUT /config/ leem e gravam idle_timeout_seconds, mas a classificação realtime usa constantes de 300 e 900 segundos e não consulta a configuração salva. O Agent também consulta /config/ para o comportamento próprio.

**Trabalho restante:** definir qual parâmetro governa a inatividade exibida e se é global ou por gestor; separar essa regra da conectividade, tratada em BE-10. **Impacto:** salvar o limite mostrado pela tela não garante alteração dos estados recebidos em /activities/realtime. **Aceite:** regra/unidade documentadas, valor salvo aplicado e testes de limite, ausência de eventos, is_idle e status.

### BE-06 — Tornar a ingestão idempotente e o realtime determinístico

**Status:** Pendente. **Prioridade:** P1. **Responsável:** Backend e Agent. **Issue:** específica não confirmada. **Evidências:** [models.py](../../backend/app/models.py), [schemas.py](../../backend/app/schemas.py), [crud.py](../../backend/app/crud.py), [QueueSenderService.cs](../../agent/Services/QueueSenderService.cs).

ActivityLog e ActivityLogCreate não têm identificador externo do evento. Cada POST cria uma linha, então retry da fila pode duplicar duração. O realtime escolhe a maior captured_at por colaborador e pode devolver várias linhas se houver empate.

**Trabalho restante:** acordar chave de evento estável e regra de unicidade; definir desempate ou granularidade por máquina. **Impacto:** os indicadores podem refletir eventos duplicados; o Frontend rejeita resposta realtime com username repetido em vez de escolher uma linha arbitrariamente. **Aceite:** retry do mesmo evento não duplica duração; concorrência produz saída determinística; testar timeout e duas máquinas para o mesmo colaborador.

### BE-07 — Definir captura futura e fuso do dia de negócio

**Status:** Pendente. **Prioridade:** P1. **Responsável:** Backend/produto, com Agent. **Issues:** RF-27, RF-24, RF-25. **Evidências:** [schemas.py](../../backend/app/schemas.py), [crud.py](../../backend/app/crud.py), [models.py](../../backend/app/models.py).

captured_at pode ser informado sem limite futuro, a idade realtime pode ficar negativa e o sumário agrupa com date(captured_at) sem declarar fuso ou referência da data.

**Trabalho restante:** definir tolerância do relógio do Agent, normalização/armazenamento UTC e fuso da data de negócio, inclusive virada de dia. **Impacto:** o Frontend não pode afirmar que o resumo representa o dia de Brasília nem inferir entrada/saída pelo realtime. **Aceite:** clock skew limitado e testado; referência temporal documentada; testes de futuro, offset, meia-noite e banco suportado.

### BE-08 — Corrigir segurança e semântica das exportações

**Status:** Parcialmente implementado. **Prioridade:** P2. **Responsável:** Backend. **Issue:** RF-25/CA-07. **Evidências:** [dashboard.py](../../backend/app/routers/dashboard.py), [crud.py](../../backend/app/crud.py).

CSV e PDF já exigem JWT de gestor e usam o resumo escopado pela equipe, conforme PR #148. CSV usa csv.writer, mas não neutraliza explicitamente células que podem ser interpretadas como fórmulas. O título do PDF diz “Relatorio de Produtividade” embora o conteúdo liste duração por categoria.

**Trabalho restante:** definir/aplicar neutralização CSV e alinhar título/rótulos do PDF ao conteúdo exportado. **Impacto:** o Frontend baixa e valida MIME, mas não corrige a semântica do arquivo. **Aceite:** testes com conteúdo que começa por caracteres de fórmula, nomes Unicode/acentuados, título coerente e autorização cruzada negada.

### BE-09 — Garantir uma configuração única e limites operáveis

**Status:** Pendente. **Prioridade:** P2. **Responsável:** Backend. **Issue:** não identificada. **Evidências:** [models.py](../../backend/app/models.py), [crud.py](../../backend/app/crud.py), [schemas.py](../../backend/app/schemas.py).

SystemSettings usa UUID sem restrição de singleton; get_settings consulta a primeira linha e cria uma se não encontrar. Os schemas aceitam inteiros positivos sem máximo definido.

**Trabalho restante:** estabelecer estratégia transacional/constraint de singleton e limites máximos compatíveis com Agent e servidor. **Impacto:** duplicatas podem tornar leitura/gravação não determinísticas e valores extremos podem não ser operáveis. **Aceite:** inicializações concorrentes deixam uma linha canônica; mínimos/máximos testados no servidor.

### BE-10 — Separar inatividade de conexão do Agent

**Status:** Bloqueado por decisão de produto e sinal do Agent. **Prioridade:** P2. **Responsável:** Backend, Agent e produto. **Issue:** RF-16/#131. **Evidências:** [crud.py](../../backend/app/crud.py), [schemas.py](../../backend/app/schemas.py), [AgentOrchestrator.cs](../../agent/Services/AgentOrchestrator.cs).

O status realtime deriva de captured_at e is_idle. is_idle=true pode emitir offline com captura recente; não existe last_received_at por máquina. O comentário do schema lista online/ausente, enquanto a implementação também emite offline.

**Trabalho restante:** decidir se a interface precisa de presença/conexão; se sim, definir heartbeat ou instante de recebimento e identidade estável, separado de inatividade de uso. **Impacto:** os rótulos do Frontend descrevem atividade aproximada, não desconexão comprovada. **Aceite:** estados documentados no schema; usuário inativo com heartbeat recente não é marcado desconectado; limite aprovado testado por máquina.

### BE-11 — Disponibilizar Tasks atribuídas ao Agent autenticado

**Status:** Pendente. **Prioridade:** P1. **Responsável:** Backend e Agent. **Issue:** funcionalidade adicionada ao Agent pela PR #144; issue Backend específica não identificada. **Evidências:** [tasks.py](../../backend/app/routers/tasks.py), [AppConfig.cs](../../agent/Config/AppConfig.cs), [ApiClient.cs](../../agent/Services/ApiClient.cs).

O Agent chama GET /tasks/my-tasks com token de Agent. O Backend oferece GET /tasks/ para gestor e GET /tasks/{task_id}; não há lista para colaborador autenticado. O caminho my-tasks é interpretado como UUID pela rota de item.

**Trabalho restante:** definir resposta mínima e regra de atribuição; implementar listagem autenticada pelo token do Agent e alinhar o cliente ao caminho/schema aprovados. **Impacto:** o gestor cria e atribui Tasks, mas essa atribuição não chega à bandeja do Agent. **Aceite:** listar somente Tasks atribuídas ao colaborador do token; testar equipe cruzada, lista vazia, token ausente/expirado e token de gestor.

### BE-12 — Persistir TaskId e fornecer agregação real por Task

**Status:** Bloqueado por contrato de produto, Backend e Agent. **Prioridade:** P1. **Responsável:** Backend, Agent e produto. **Issues:** [#140](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/140), filha de [#132](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/132). **Evidências:** [models.py](../../backend/app/models.py), [schemas.py](../../backend/app/schemas.py), [dashboard.py](../../backend/app/routers/dashboard.py), [ApiDtos.cs](../../agent/Dtos/ApiDtos.cs), [taskAnalyticsSource.js](../src/features/dashboard/services/taskAnalyticsSource.js).

ActivityLog e ActivityLogCreate não contêm task_id. O Agent mantém seleção de Task local, mas ActivityLogCreateDto e QueueSenderService não enviam o vínculo. Não existe GET /dashboard/tasks-summary no Backend. O Frontend liga o resumo analítico ao cliente de demonstração em desenvolvimento; produção não chama a rota candidata nem inventa valores.

**Trabalho restante:** aprovar semântica de tempo registrado/produtivo, período, fuso, atividades sem Task e tarefas removidas; persistir vínculo na captura e fornecer agregação protegida e filtrada por gestor. A issue #140 descreve GET /dashboard/tasks-summary como esperado, mas ainda não é contrato implementado.

**Impacto:** resumo, produtividade e timeline não exibem analytics reais em produção. **Aceite:** segundos corretos; filtros aplicados no servidor; Task sem eventos e atividade sem Task tratados segundo regra aprovada; isolamento com duas equipes e testes após publicar contrato.

### BE-13 — Definir acesso a Configurações e Categorias

**Status:** Bloqueado por decisão de produto. **Prioridade:** P1. **Responsável:** Produto e Backend. **Issue:** limite identificado durante #131; requisito específico não confirmado. **Evidências:** [config.py](../../backend/app/routers/config.py), [categories.py](../../backend/app/routers/categories.py), [api.js](../src/shared/api/api.js).

As rotas /config/* e /categories/* não exigem token nem têm escopo de gestor. O cliente Frontend envia Bearer para /config/, mas o Backend não o exige. O Frontend não consome /categories/*.

**Trabalho restante:** decidir se configurações/categorias são globais ou por gestor. Se forem por gestor, definir autorização, migração e isolamento; se forem globais, registrar a decisão e manter contrato compatível. **Impacto:** Configurações altera valores globais consultados pelo Agent. **Aceite:** decisão aprovada; testes de acesso sem token e escopo/globalidade conforme política; Frontend e contrato alinhados.

### BE-14 — Fornecer resumo diário de primeiro e último registro

**Status:** Bloqueado por contrato de produto e Backend. **Prioridade:** P2. **Responsável:** Backend/produto. **Requisitos:** RF-27 e RF-24; Issue específica não identificada. **Evidências:** [dashboard.py](../../backend/app/routers/dashboard.py) não declara GET /dashboard/attendance; [AttendanceSummary.jsx](../src/features/dashboard/components/AttendanceSummary.jsx) mostra a fonte indisponível em produção; [handlers.js](../src/dev-mocks/handlers.js) atende somente a demonstração.

**Problema e estado atual:** o resumo existente retorna duração por categoria, não os registros inicial e final do dia. A interface contém a tabela de jornada, mas só a disponibiliza quando recebe devApi em desenvolvimento. Não há contrato real de jornada; o Frontend não deriva horários do realtime.

**Proposta histórica não aprovada:** GET /dashboard/attendance?date=AAAA-MM-DD&username=... retornaria date, timezone, as_of e users com username, first_activity_at e last_activity_at. A proposta de 21/10 sugeria timezone America/Sao_Paulo e nulos quando não há registro. Nenhuma dessas formas é contrato publicado.

**Trabalho restante:** confirmar se este dado é requerido pelo produto e qual o conjunto de pessoas retornado; definir timezone, datas futuras, horário de verão quando aplicável e tratamento de ausência de registros. Se aprovado, implementar endpoint autenticado e filtrado pela equipe do gestor.

**Impacto no Frontend:** a seção “Entrada e último registro” fica indisponível em produção; os dados de demonstração não comprovam jornada formal.

**Critérios de aceite:** timestamp representa primeiro/último registro persistido, não entrada/saída nem jornada cumprida; fuso e data civil são explícitos; erro de consulta não vira lista vazia; usuário sem registro e filtro por gestor têm regras testadas.

## Dependências externas que não são tarefas do Backend

| ID anterior                   | Responsável                 | Estado observado                                                                                                                                                                                                                               |
| ----------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AG-01 — associação do Agent   | Agent                       | O Agent chama /associate/ com code, username e hostname; o Backend implementa POST /collaborators/associate com association_code, username e machine_name. O Agent aceita access_token. A correção do cliente pertence ao Agent.               |
| I-02 — homologação real       | Frontend/Backend/Infra      | Não há ambiente e credenciais descartáveis configurados. A ação do Frontend está em [FE-01](PENDENCIAS_FRONTEND.md#fe-01--homologar-sessão-e-operações-de-equipe-com-api-real).                                                                |
| PWA — conflito nos requisitos | Produto/requisitos/Frontend | visao.md chama o Dashboard de PWA; responsividade.md afirma que não é instalável e não tem manifest/service worker. A decisão está em [FE-04](PENDENCIAS_FRONTEND.md#fe-04--resolver-o-requisito-conflitante-de-pwa); não é tarefa do Backend. |

## Mapeamento dos registros anteriores

- BE-01 e BE-02 anteriores: resolvidos no código local pelo PR #148; removidos da lista ativa. O PR #148 também fecha a Issue #137.
- BE-03 a BE-10: IDs preservados e status reavaliado no código atual.
- AG-02: consolidado em BE-11.
- AG-03 e I-01: consolidados em BE-06 (idempotência) e BE-12 (TaskId e analytics).
- ANALYTICS-140: consolidado em BE-12 e FE-02.
- DEPLOY-132: consolidado em BE-03.
- GLOBAL-01: preservado como BE-13.
- Proposta de jornada diária: preservada como BE-14, sem promover GET /dashboard/attendance a contrato oficial.
- Propostas GET /dashboard/task-hours e GET /agents/status: mantidas no catálogo candidato abaixo; não são tarefas de produção até aprovação de escopo/uso.

## Outras propostas contratuais não aprovadas

As propostas antigas são contexto para decisões futuras e não estão implementadas no Backend. Não devem ser chamadas pelo cliente de produção sem aprovação e publicação.

| Caminho candidato            | Parâmetros/forma sugerida no documento histórico                                                                          | Estado e decisões pendentes                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| GET /dashboard/attendance    | date obrigatório, username opcional; date, timezone, as_of e users com username, first_activity_at e last_activity_at     | BE-14; decidir inclusão de pessoas sem registros, dia futuro e semântica do primeiro/último registro                                    |
| GET /dashboard/task-hours    | start_date e end_date inclusivas, username e task_id opcionais; timezone e tasks com task_id, description e total_seconds | Não é consumido pela UI atual; decidir o que conta como duração, limite do intervalo, Tasks sem duração e atividade sem vínculo         |
| GET /agents/status           | username opcional; lista por máquina com username, hostname, last_record_at e connection_status                           | Relacionado a BE-10; last_record_at deveria refletir recebimento do servidor; regra/status e identidade por máquina dependem de decisão |
| GET /dashboard/tasks-summary | date, username e task_id opcionais no helper MSW; resposta simulada com lista tasks vazia                                 | Esperado pela issue #140, ainda sem schema aprovado nem rota Backend; trabalho principal em BE-12                                       |

Na proposta de GET /agents/status, offline após mais de 900 segundos e unknown sem registro foram valores candidatos, não comportamento vigente. Na proposta de jornada, first_activity_at/last_activity_at são registros capturados, não ponto formal. A duração por Task não deve ser ordenada como ranking nem inferida por categoria.

Os documentos de requisitos consultados definem CA-10, mas não foi encontrado CA-11 nem CA-12 em requisitos/requisitos/ca.md. As menções a esses IDs em registros antigos não foram usadas como aceite vigente; confirmar a fonte oficial se forem necessários.

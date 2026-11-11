# Pendências do Frontend

Fonte única para trabalho ainda necessário na aplicação web. Revisada em **07/11/2026**, com código no commit **c47346a** e documentação no HEAD **c05d282**. Testes com MSW/Playwright verificam cliente e telas; não comprovam autorização, persistência ou CORS de uma API implantada.

Na consulta ao repositório oficial em 07/11/2026, as issues pai [#131](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/131) e [#132](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/132), e a issue filha [#140](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/140), estavam abertas. O PR [#148](https://github.com/fabrica-bayarea/TimeTracker-2026-2/pull/148) estava integrado e declara fechamento da #137. Esse estado oficial não substitui a classificação técnica abaixo.

## Resumo

| ID    | Status                               | Prioridade | Trabalho restante                                                              |
| ----- | ------------------------------------ | ---------: | ------------------------------------------------------------------------------ |
| FE-01 | Bloqueado por ambiente externo       |         P1 | Homologar sessão, equipe e Tasks com API real autorizada                       |
| FE-02 | Bloqueado por contrato externo       |         P1 | Conectar jornada e analytics por Task quando os contratos do Backend existirem |
| FE-03 | Bloqueado por definição de escopo    |         P3 | Concluir validação humana de acessibilidade e navegadores alvo                 |
| FE-04 | Bloqueado por conflito de requisitos |         P2 | Confirmar se a aplicação deve ser PWA e o que isso exige                       |

## FE-01 — Homologar sessão e operações de equipe com API real

**Status:** Bloqueado por ambiente externo. **Prioridade:** P1. **Responsável:** Frontend com Backend/Infra. **Issues:** [#131](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/131), [#132](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/132). **Evidências:** [ManagerSession](../src/shared/auth/ManagerSession.jsx), [api.js](../src/shared/api/api.js), [teste de API real](../e2e/real-api.spec.js), [BE-03](PENDENCIAS_BACKEND.md#be-03--configurar-cors-e-deploy-https-por-ambiente).

**Estado atual:** login, validação via /auth/me, logout, Bearer, guardas de página, CRUD de Tasks e atribuição usando /users/ estão implementados e cobertos localmente. O E2E real é opt-in; seus dois cenários foram ignorados na última execução registrada por falta de ambiente/credenciais. A integração não está comprovada.

**Trabalho restante:** configurar API, banco e gestores de teste descartáveis; executar o E2E real e completar verificações de dois gestores, autorização cruzada, 401/403, CRUD, exportações e CORS. Testar o fluxo do Agent após o cliente desktop se alinhar ao contrato.

**Dependências externas:** URL HTTPS, CORS, banco de homologação e credenciais autorizadas. O alinhamento do Agent está descrito em [Dependências externas do Backend](PENDENCIAS_BACKEND.md#dependências-externas-que-não-são-tarefas-do-backend).

**Critérios de aceite:** registrar resultado real com commit, ambiente e escopo; confirmar isolamento entre gestores; não usar produção nem gravar fora de banco descartável.

## FE-02 — Conectar jornada e analytics reais do Dashboard

**Status:** Bloqueado por contrato externo. **Prioridade:** P1. **Responsável:** Frontend. **Issue:** [#140](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/140), ligada à [#132](https://github.com/fabrica-bayarea/TimeTracker-2026-2/issues/132). **Dependências:** [BE-12 — TaskId e agregação](PENDENCIAS_BACKEND.md#be-12--persistir-taskid-e-fornecer-agregação-real-por-task) e [BE-14 — primeiro e último registro](PENDENCIAS_BACKEND.md#be-14--fornecer-resumo-diário-de-primeiro-e-último-registro). **Evidências:** [taskAnalyticsSource.js](../src/features/dashboard/services/taskAnalyticsSource.js), [useTaskAnalytics.js](../src/features/dashboard/hooks/useTaskAnalytics.js), [AttendanceSummary.jsx](../src/features/dashboard/components/AttendanceSummary.jsx) e componentes de [dashboard](../src/features/dashboard/components).

**Estado atual:** catálogo de Tasks é real e autenticado. O resumo só se conecta ao cliente demonstrativo em desenvolvimento; produção não chama GET /dashboard/tasks-summary. A seção de primeiro/último registro também fica indisponível em produção e usa GET /dashboard/attendance somente no modo de demonstração. Componentes e validadores cobrem estados vazios, erro, duração, jornada e timeline, mas nenhuma dessas respostas é analytics real.

**Trabalho restante:** quando BE-12 e BE-14 publicarem schemas e filtros, adicionar os métodos ao cliente HTTP real, validar as respostas e ligar os componentes; remover a dependência de respostas demonstrativas nos cenários de produção e cobrir filtros, atividade sem Task, Task removida, ausência de registros, erro e vazios.

**Critérios de aceite:** Frontend não infere métrica nem jornada; horários de registro não são apresentados como entrada/saída; filtros enviados seguem os contratos aprovados; vazio, erro e demonstração são distinguidos; testes de cliente, hooks, componentes e E2E passam com os contratos publicados.

## FE-03 — Validar acessibilidade manual e navegadores alvo

**Status:** Bloqueado pela definição de escopo e dispositivos alvo. **Prioridade:** P3. **Responsável:** Frontend/produto. **Issue:** não confirmada. **Evidências:** [accessibility.spec.js](../e2e/accessibility.spec.js), [accessibility-auth.spec.js](../e2e/accessibility-auth.spec.js), [Testes](TESTES.md).

**Estado atual:** Playwright e axe-core cobrem os cenários automatizados documentados. Leitor de tela, zoom nativo e execução manual em dispositivos/navegadores não foram homologados nesta revisão. Não foi localizado aceite que exija PWA/offline.

**Trabalho restante:** aprovar navegadores, dispositivos, larguras e leitor de tela; executar o roteiro manual após a definição e registrar os resultados.

**Critérios de aceite:** matriz aprovada; leitor de tela, zoom nativo, teclado e navegadores alvo verificados; achados e correções registrados por data.

## FE-04 — Resolver o requisito conflitante de PWA

**Status:** Bloqueado por conflito entre documentos de requisitos. **Prioridade:** P2. **Responsável:** Produto/requisitos com Frontend. **Issue:** não confirmada. **Evidências:** [visao.md](../../requisitos/visao.md), que chama o Dashboard de PWA; [responsividade.md](../../requisitos/responsividade.md), que afirma que o Dashboard não tem manifest/service worker nem é instalável como PWA; o código também não contém esses recursos.

**Estado atual:** a aplicação não oferece instalação PWA nem política offline. Os dois documentos de requisito divergem entre uma descrição de produto PWA e a diretriz de responsividade que nega a instalação.

**Trabalho restante:** obter decisão dos responsáveis pelos requisitos. Se PWA fizer parte do escopo, definir critérios para instalação, cache, dados sensíveis, sessão e comportamento offline antes da implementação. Se não fizer, alinhar a descrição de produto sem alterar os requisitos nesta tarefa.

**Critérios de aceite:** uma decisão de produto registrada em fonte oficial; critérios observáveis para a implementação ou confirmação de que PWA/offline não faz parte do escopo atual.

## Itens concluídos retirados da lista ativa

- CRUD de Tasks autenticado e atribuição de colaboradores da equipe foram implementados; não resta trabalho de construção da tela. Homologação real permanece em FE-01.
- Exibição e cópia do código de associação na sessão do gestor estão implementadas. A associação ponta a ponta depende do cliente Agent e não é tarefa de implementação do Frontend.
- F-04 antigo, correção da rota POST demonstrativa de Task, foi encerrado em 21/10/2026 e vale somente para MSW de desenvolvimento.

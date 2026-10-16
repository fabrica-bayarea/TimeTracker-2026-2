# Alterações do frontend

Histórico de alterações por data, em ordem da mais recente para a mais antiga. Caminhos registrados em entradas antigas refletem a estrutura usada na época. Consulte [Arquitetura](ARQUITETURA.md) para a organização atual, [Testes](TESTES.md) para os resultados automatizados e [Pendências](PENDENCIAS.md) para bloqueios em aberto; detalhes de versões anteriores também estão no histórico do Git.

## 16/10/2026 — Atividade em tempo real, filtros do painel e busca de tarefas

- **Visualização:** a lista agora mostra o estado de atividade retornado pela API, o aplicativo mais recente e o tempo desde a captura. Essa idade não é apresentada como conexão ou sincronização confirmada.
- **Filtros:** adicionadas pesquisa por nome/usuário/departamento, filtros combináveis de estado e aplicativo, ordenação por nome/idade da captura, contagem de resultados e limpeza.
- **Atualização:** a ação manual reutiliza as chamadas já existentes para `/users/` e `/activities/realtime`; o hook mantém cancelamento e ignora respostas antigas. Não foi adicionado polling.
- **Arquitetura:** a normalização e o filtro exato de `process_name` foram movidos para `shared/lib` e são reutilizados por Dashboard e Colaboradores.
- **Privacidade:** `hostname` existe na resposta, mas não é exibido nem filtrável até o Backend aplicar autorização e escopo por gestor. `window_title` continua fora da interface.
- **Contratos externos:** `PENDENCIAS.md` já documenta as lacunas do status de conexão (B-10/I-05), associação (I-02), autorização (B-01) e interface desktop do Agent (A-01); esta revisão acrescenta o bloqueio explícito de exposição de máquina à pendência B-01.
- **Validação:** resultados desta revisão em [Testes](TESTES.md).
- **Dashboard:** adicionados seleção e contagem de aplicativos derivados do `process_name` realtime, combináveis com o usuário. O filtro atua somente na lista de última atividade; resumo diário e indicadores permanecem sem filtro de aplicativo. Nomes são formatados para leitura, mas o valor original continua sendo usado na filtragem.
- **Tasks:** a lista demonstrativa de desenvolvimento recebeu pesquisa por descrição com ação explícita para limpar, contagem que identifica a pesquisa ativa, ordenação por data/descrição e seleção local para consultar detalhes. A lista continua em memória mock; nenhum endpoint foi criado, e a seleção não inicia monitoramento.
- **Envios:** `useTasks` agora ignora novas chamadas de criação enquanto uma já está em andamento, evitando a criação duplicada por acionamentos rápidos.
- **Agent:** `PENDENCIAS.md` registra em A-01 o placeholder literal de usuário em `agent/UI/AssociationForm.cs:42` e recomenda correção e revisão visual pela equipe do Agent. Nenhum arquivo fora de `FrontEnd/` foi escrito.
- **Validação:** baseline e resultados finais constam em [Testes](TESTES.md). `npm.cmd run check:full` passou; nenhum contrato ou dependência de produção foi alterado.
- **Integração:** routers e schemas usados pelo frontend foram comparados em leitura. Os endpoints, métodos, parâmetros e payloads correspondem aos contratos atuais; não há ambiente real habilitado para uma chamada E2E autorizada. Validadores passaram a rejeitar tipos incorretos em `is_idle`, `CategorySummary.color` e `SystemSettingsOut.updated_at` quando presentes.
- **Colaboradores:** “Limpar filtros” restaura pesquisa, estado, aplicativo e ordenação por nome; alterar somente a ordenação também habilita a ação.
- **Aplicativos:** identificadores `process_name` seguem exatos para filtros. Espaços são normalizados só nos rótulos, e rótulos que colidem após a apresentação mostram o valor original para continuar distinguíveis; não foi encontrado catálogo confiável que justifique mapear processos a produtos.
- **Temporalidade:** o estado registra o momento em que cada resposta válida chegou ao navegador e distingue sucesso completo, parcial e falha. A idade da leitura realtime avança a cada minuto com relógio monotônico, sem nova requisição. A interface não apresenta esse horário como conexão do Agent.
- **Tasks:** nenhuma componentização adicional foi feita. A separação entre tela indisponível, demonstração em `TasksPage`, fluxo assíncrono em `useTasks` e filtro/ordenação em `taskList.js` já atende ao escopo; novas abstrações não trariam reuso neste momento.
- **Dependências externas:** B-10 em `PENDENCIAS.md` registra que status confiável de conexão depende de timestamp de recebimento e identidade de Agent/máquina no contrato autorizado do Backend.
- **Validação:** linha de base, resultados finais, cenários reais ignorados e limites do ambiente estão em [Testes](TESTES.md).

## 13/10/2026 — Atualização do frontend: autenticação, mocks e jornada simulada

- **Inicialização e isolamento:** MSW e cliente simulado só são importados em desenvolvimento quando `VITE_USE_MOCKS=true`. A aplicação aguarda o worker; falha apresenta alerta e não usa a API real. Rotas da API sem handler retornam `501`, e requests não tratados na origem da API são bloqueados pelo MSW. Ao desativar mocks em desenvolvimento, registros antigos do worker são removidos sem atingir outros Service Workers.
- **Produção:** ramificações de Tasks e jornada simuladas são removidas do build. O verificador do bundle também rejeita o marcador da interface mock, além dos handlers, worker e rotas simuladas.
- **Cliente e dados:** o cliente de desenvolvimento passou a reutilizar timeout de 15 segundos, `AbortSignal` e erros tipados do cliente compartilhado. Timestamps são construídos com o offset de São Paulo; schemas validam a data de negócio e a ordem dos registros. O filtro por colaborador também é aplicado ao status simulado do Agent.
- **Tasks e documentos:** a criação simulada é cancelada quando a página sai; os avisos continuam identificando os dados como temporários e sem integração no Backend. `FUNCIONALIDADES.md`, `PENDENCIAS.md` e `CONTRATOS_API.md` distinguem essa demonstração local dos contratos reais.
- **Validação:** resultados desta revisão estão em [Testes](TESTES.md).
- **Formatação:** os sete arquivos apontados pelo `format:check` foram formatados com Prettier. Nenhum comportamento ou lógica foi alterado nesses sete arquivos.
- **Contratos JWT:** `getCurrentManager` agora rejeita token ausente, vazio, malformado, com espaços ou caracteres de controle antes de criar o cabeçalho. A checagem valida somente a forma compacta de três segmentos; assinatura, expiração e autorização continuam no backend. Cadastro/login validam o tipo e presença de e-mail/senha, enviam apenas esses campos e não refletem credenciais em erros.
- **Validadores:** a resposta `Token` agora também precisa trazer token com forma compacta de JWT. Os schemas `ManagerOut` e `Token` continuam rejeitando propriedades extras; campos novos exigem revisão explícita do contrato.
- **Dependências:** Vite 6.4.3 foi atualizado para 6.4.4 com correções upstream no mesmo ramo; `source-map-js` 1.2.1 foi atualizado para 1.2.2 dentro das faixas existentes. O audit passou de 8 para 7 entradas. As pendências que exigem Tailwind 4 ou não têm versão corrigida estão em [Pendências](PENDENCIAS.md).
- **Validação executada:** `npm.cmd run check` e `npm.cmd run check:full` passaram. Vitest: 171 testes em 41 arquivos; cobertura 95,98% statements, 94,62% branches, 96,31% functions e 97,69% lines. E2E: 27 passaram, 2 ignorados por dependerem da API real. `git diff --check` passou; nenhum teste de integração real foi configurado.
- **MVP e escopo:** acesso sem login, `AuthPage` informativa, card de associação oculto, dashboard, navegação, status e contratos de relatórios foram preservados. Não houve alteração fora de `FrontEnd/`, commit, push, PR ou merge.
- **Estado das integrações:** registrada a incorporação da PR #122 do Agent (`ed48ad7cfff9e724406ef9ffffeb6c0f132caf32`, merge `e43673b4dca212eaa991308d14c9dc25b6c64061`) e da PR #123 de autenticação (`c5a053916747751a3894b93e45c1f4e2dafc34b6`, merge `0fc4e7b7333ceb4fdd120f7f1f753f9836163e30`).
- **Contratos:** `CONTRATOS_API.md` agora documenta `POST /auth/register`, `POST /auth/login` e `GET /auth/me`, separa operações de tela de contratos disponíveis e esclarece que `ManagerOut` não contém `association_code`.
- **Código:** adicionados à camada isolada da API os métodos `registerManager`, `loginManager` e `getCurrentManager`, validadores para `ManagerOut`/`Token` e testes de contrato, 409/401, resposta inválida, Bearer, cancelamento e não exposição de detalhes de autenticação.
- **Documentação e MVP:** atualizados README, arquitetura, funcionalidades e pendências. O Agent tem o cliente de associação integrado, mas os routers/modelos/schemas/CRUD locais ainda não implementam geração/consulta de código, `POST /associate/` ou persistência/isolamento do vínculo. Login continua adiado no MVP; nenhuma sessão ou proteção de rota foi ativada. Mantidos os registros históricos de 09/10 e anteriores.
- **Validação em 13/10:** `npm.cmd ci` concluiu após a primeira tentativa no sandbox receber `EPERM` para remover `node_modules/nwsapi/dist/lint.log`; o arquivo vazio foi restaurado. Lint, typecheck, Vitest/cobertura (168 testes em 41 arquivos), build e E2E (27 passaram, 2 cenários reais ignorados) passaram quando executados. `format:check` global aponta sete arquivos preexistentes e intocados; os 15 arquivos desta revisão passam na checagem explícita do Prettier. O npm informou 8 vulnerabilidades e script do `esbuild` pendente; nenhuma correção automática foi aplicada. `git diff --check` passou. Detalhes em [Testes](TESTES.md).
- **Permissões:** nenhuma alteração foi feita fora de `FrontEnd/`; não houve commit, push, PR ou merge.

## 09/10/2026 — Adequação documental à PR externa #122

- **Alterações locais:** esclarecido em `PENDENCIAS.md`, `CONTRATOS_API.md`, `ARQUITETURA.md`, `FUNCIONALIDADES.md`, `README.md` e `docs/README.md` que o card de associação é apenas visual, está oculto no MVP e depende de contratos de backend e sessão do gestor. Registrada a separação entre rotas consumidas pelo frontend, caminhos previstos, rota consumida pelo Agent e rotas localizadas no backend deste checkout.
- **Referência externa:** documentada a PR #122 (`ed48ad7cfff9e724406ef9ffffeb6c0f132caf32`, `agent/association`) como implementação do lado Agent fornecida para análise, ainda não integrada neste checkout. A documentação registra `POST /associate/`, payload string com código de seis dígitos, tolerância do Agent a `token`/`access_token`, DPAPI, Bearer e bloqueio de monitoramento sem associação, sem afirmar suporte correspondente do servidor.
- **Segurança e limites:** explicitada a diferença entre token do Agent e futura sessão do gestor, a necessidade de autorização/isolamento no backend e a interpretação ambígua de 401/403 na PR. Não foi adicionada chamada HTTP nem alterada lógica de status ou filtragem de dados.
- **Testes do card:** adicionada cobertura para códigos ausentes/malformados/não string e ausência da Clipboard API. A execução ficou impedida pela ausência dos binários de ESLint/Vitest; detalhes constam em `TESTES.md`.
- **Fora do FrontEnd:** nenhum arquivo foi alterado. Não houve commit, push, abertura/aprovação de PR ou merge.

## 07/10/2026 — Revisão dos contratos e validação do MVP

- Reinspecionados backend, Agent e requisitos atuais em modo somente leitura. Não foram encontrados contratos de jornada diária nem consulta/criação persistente de Tasks; o Agent continua sem `task_id` e sem controle de Task.
- Confirmado que as adequações do PR #121 já estão na branch: acesso sem login, link de cadastro oculto, cartão de associação fora do Dashboard e tela de Tasks sem persistência simulada.
- Atualizados `PENDENCIAS.md`, `CONTRATOS_API.md` e `TESTES.md` com o estado do MVP, dependências externas e resultados desta execução. Nenhum arquivo fora de `FrontEnd/` foi alterado.
- O merge da `main` já estava presente no checkout (`bf124d2`), sem conflitos pendentes. Na tentativa de validação consolidada em 07/10, `npm ci` falhou com `EPERM` ao tentar remover um `lint.log` em `node_modules`; a instalação offline subsequente não encontrou `typescript@5.9.3` no cache. Os executáveis do frontend não ficaram disponíveis, então lint, formatação, typecheck, cobertura, build e E2E não puderam ser executados. Consulte os detalhes em `TESTES.md`; os números anteriores a esta incorporação permanecem apenas como histórico.

## 05/10/2026

### Preparação para o MVP de 13/10

- Revisados os contratos atuais de backend, Agent e requisitos disponíveis no checkout.
- Não foram encontrados modelo/schema de Task, consulta/criação persistente de Tasks, endpoint/campos de primeiro e último registro diário, configuração coordenada do fuso de Brasília na agregação nem `task_id` no payload do Agent. Nenhuma chamada HTTP sem contrato foi adicionada.
- Ocultados do Dashboard o `AssociationCodeCard` indisponível e, da navegação, o link “Criar conta”. Rotas e módulos existentes foram preservados; o acesso sem login continua direto.
- Atualizados testes unitários e E2E para verificar acesso sem login, ocultação dos elementos indisponíveis e navegação à tela informativa de Tasks. Criação de Tasks e jornada permanecem bloqueadas por contratos externos.
- A integração real não foi executada por falta de ambiente autorizado/configurado.

### Padronização de final de linha e validação

- `.editorconfig` define LF e `.gitattributes` aplica `text=auto eol=lf` somente dentro de `FrontEnd/`. A política mantém arquivos binários fora da conversão automática e alinha checkout local, Git e CI.
- `README.md`, `docs/TESTES.md` e a instrução de teste real em `docs/PENDENCIAS.md` usam `npm run`. A documentação informa que PowerShell com política restritiva pode exigir `npm.cmd`; os registros históricos mantêm o comando que foi executado em cada época.
- `src/shared/lib/duration.test.js` cobre valores padrão, limites de hora/minuto, strings numéricas, valores negativos e valores não finitos. Os testes existentes de `ReportsPage` já cobrem falha/retry, cancelamento e resultado fora de ordem.
- Na primeira execução, lint, `format:check`, typecheck, cobertura com 150 testes em 41 arquivos e build passaram. O E2E inicialmente não iniciou porque o Chromium do Playwright não estava instalado.
- Após instalar Chromium 153.0.8010.12, foram identificadas duas falhas: contraste insuficiente de `.eyebrow` no menu mobile escuro e expectativa desatualizada de `Sem leitura recente` em vez de `15min atrás`.
- `.dark .eyebrow` passou a usar `text-indigo-300`, corrigindo o contraste no tema escuro.
- `e2e/app.spec.js` passou a esperar `15min atrás` para a leitura simulada de 901 segundos.
- Após as correções, 26 testes E2E passaram, 2 cenários reais foram ignorados por opt-in e não houve falhas. `lint`, `format:check`, `typecheck`, `test:coverage`, `build` e `check` passaram; Vitest executou 150 testes em 41 arquivos, com 95,68% statements, 94% branches, 96,13% functions e 97,59% lines.

## 02/10/2026

### Issue #114 — apresentação do código de associação no Dashboard

- `features/dashboard/components/AssociationCodeCard.jsx` adiciona um card acessível e responsivo com estados de carregamento, erro e indisponibilidade, validação de seis dígitos como string, cópia via Clipboard API e feedback de sucesso/falha.
- `DashboardPage.jsx` apresenta o card junto ao conteúdo principal, sem vinculá-lo às consultas dos filtros analíticos.
- O backend local não oferece campo ou endpoint de associação, e a autenticação do gestor ainda está bloqueada. O card não usa dados de produção simulados nem cria uma chamada sem contrato; a dependência existente I-02 foi atualizada em `PENDENCIAS.md`.
- Os testes de interface do card e do Dashboard cobrem código com zeros iniciais, cópia, falhas, carregamento, indisponibilidade e renderização.
- Validação executada: Vitest com 148 testes em 40 arquivos, ESLint, Prettier nos arquivos alterados, build de produção e `git diff --check` passaram. Não foi executado E2E nem teste contra API real.

### Alinhamentos da liderança registrados nas pendências

- I-06: Dashboard sem rankings; apresentar somente horas gastas por task. A integração aguarda registros e consulta agregada por tarefa.
- I-05/B-10: considerar o Agent offline após mais de 15 minutos sem novo registro no banco daquela máquina. A regra ainda depende de implementação no backend e deve distinguir conexão de inatividade (`is_idle`).
- I-07: usar o fuso de Brasília e alinhar configuração do backend via variável de ambiente, com intenção de permitir outras regiões. Nome e contrato da variável seguem em aberto.
- I-01: JWT será avaliado; ainda não há decisão sobre estratégia de sessão.
- I-03: será solicitada a Danyyel uma task padrão para a Sprint 2; criação e forma de disponibilização ainda não confirmadas.
- B-03/B-06: os possíveis bugs de seed e duplicidade/reenvio serão alinhados com Danyyel; não há confirmação de correção.

## 01/10/2026

### Organização do código e da documentação

- `shared/lib/dashboard.js` foi dividido por responsabilidade entre `date.js`, `duration.js` e `team.js`; soma de duração e totais por categoria passaram para `features/dashboard/lib/summary.js`. Imports e testes existentes foram atualizados para os novos caminhos.
- Colaboradores agora separa carregamento/cancelamento em `useCollaboratorsData` e a apresentação responsiva em `CollaboratorCard` e `CollaboratorsTable`.
- Configurações agora separa ciclo de leitura/edição/gravação e proteção de saída em `useSettings`; `SettingsForm` contém a interface do formulário.
- `docs/README.md` passou a indexar a documentação, e os detalhes de endpoints, validação e cliente HTTP foram separados em `docs/CONTRATOS_API.md`.
- `ReportsPage` delega carregamento, retry e cancelamento de usuários a `features/reports/hooks/useReportUsers.js`; o histórico antigo de auditoria foi resumido para evitar duplicação com os guias atuais.
- Não foram alteradas regras de negócio.

## 30/09/2026

### Compatibilidade com o realtime atualizado

- `validRealtime` e o contrato JSDoc agora aceitam `offline`; o validator continua rejeitando estados desconhecidos. Testes de API, Dashboard, Colaboradores e E2E cobrem o novo estado.
- `deriveTeam` preserva `offline` retornado pelo backend e usa `no-data` quando o usuário não aparece no realtime. A interface mostra “Offline (API)” e “Sem dados” como situações distintas.
- O Dashboard explica os estados como valores calculados pela API, sem tratar `offline` como falha de conexão do Agent. A tabela formata a última leitura em segundos, minutos e horas.
- `PENDENCIAS.md` registra o consumo periódico de `/config/` pelo Agent, mantém B-04 como parcialmente normalizada com trabalho pendente no backend, mantém I-05 bloqueada e deixa I-08 pendente do ambiente real.
- Arquitetura, funcionalidades e roteiros de teste documentam os estados `online`/`ausente`/`offline`, retenção de até 24 horas e ausência de heartbeat autenticado.
- Os detalhes do Dashboard e de Colaboradores não atribuem limites fixos ou desconexão ao estado `offline`; B-10 registra a classificação de inatividade como pendência do backend.
- O `ActivityStatusBadge` usa o estilo de indisponibilidade como fallback para estados desconhecidos; o teste cobre esse caso.

## 28/09/2026

### Garantias automatizadas adicionais

- ESLint passou a impedir imports e reexports relativos que violam as camadas `app`, `features` e `shared`, inclusive imports dinâmicos literais; a regra tem testes próprios.
- Colaboradores e leitura de usuários dos Relatórios agora combinam cancelamento com identificador de sequência. Testes simulam respostas tardias que ignoram `AbortSignal`.
- `PageHeader` e `IntegrationNotice` ganharam testes diretos de conteúdo e ações, sem verificar classes de estilo.
- JSDoc documenta contratos consumidos da API em `shared/api/contracts.js`. `npm run typecheck` usa TypeScript com `checkJs` nessa camada e integra o script `check`.
- Vitest exige cobertura agregada maior para API, biblioteca compartilhada e hooks de Painel/Relatórios. O E2E opt-in com FastAPI real também verifica status, MIME e bytes básicos de CSV/PDF.
- O teste E2E de saída de Configurações passou a aguardar a aceitação ou recusa do diálogo antes de concluir a interação, eliminando uma corrida do Playwright.

### Adicionado

- Os scripts `check` e `check:full` reúnem lint, formatação, cobertura, build e, no segundo caso, Playwright. O Vitest passou a exigir cobertura global mínima de 85% para statements, functions e lines e 80% para branches.
- Testes diretos para `useReportExport`, componentes de Relatórios, `routeLeaveGuard`, `activityStatus`, filtros, indicadores, mensagens de erro, validação de respostas e fluxos de Colaboradores. O E2E cobre larguras de 375/768/1366 px, foco entre rotas, MIME ausente e pausa do temporizador.
- Metadados e componentes das rotas em `src/app/routes.js`, com barreira de erro por página. Os estados de atividade receberam formatação compartilhada e badges.
- `TESTES.md` ganhou roteiros manuais reproduzíveis para saída de Configurações, falha parcial do Painel, exportação real e menu móvel, além de uma tabela de problemas comuns. `ARQUITETURA.md` reúne os motivos das principais decisões de rota, estado, contratos, validação e cancelamento.
- As referências a RF, RN, RNF e CA em `FUNCIONALIDADES.md` e `PENDENCIAS.md` agora apontam para as seções de origem em `requisitos/`; os demais guias identificam as fontes de sitemap, Dashboard e responsividade.

### Alterado

- Configurações indicam alterações pendentes, permitem restauração, evitam `PUT` sem mudanças e pedem confirmação ao sair com valores alterados, inclusive ao atualizar ou fechar a aba.
- `ReportsPage` foi dividido em filtros, estados, ações e `useReportExport`. O download inclui o usuário filtrado no nome; o toast de sucesso fecha após cinco segundos.
- O painel foi dividido em filtros, indicadores, atividade, categorias e avisos. Atividade e colaboradores usam cards em telas pequenas; barras de categoria decorativas não repetem valores para leitores de tela.
- Validação de respostas passou para `src/shared/api/validators.js`; mensagens de erro e feedback de requisição usam componentes e helper compartilhados. `AsyncFeedback.jsx` mantém os imports de hooks React no início do arquivo.
- `useAutoRefresh` e seu teste foram movidos para `src/features/dashboard/hooks/`; o painel usa o hook, pausa a atualização de 30 segundos quando a aba fica oculta e a retoma ao voltar. `useDashboardData` deixou de agendar atualizações em paralelo.
- Rotas comuns e de autenticação mantêm um `<main>` focalizável, e a troca de rota direciona o foco ao novo conteúdo. Tasks e acesso exibem estados informativos sem simular contratos ausentes.
- A API rejeita CSV/PDF com `Content-Type` ausente ou incorreto. Helpers existentes passaram a filtrar usuários e contar status no painel. Botões desabilitados mantêm contraste no tema claro e escuro.
- O registro histórico de 25/09 foi separado dos guias atuais, e o histórico de alterações foi agrupado por data. Pendências ganharam resumo, status e registro da divergência em [responsividade.md](../../requisitos/responsividade.md).
- `SettingsPage` compartilha a atualização dos campos com `setForm` funcional. Nomes locais no painel, em Configurações e na API ficaram mais explícitos; comentários curtos explicam o timeout e o foco do menu móvel.

### Removido

- `recharts` saiu de `package.json` e `package-lock.json` por não ter imports na aplicação.
- `src/legacy/` e seus testes isolados foram removidos após verificação de consumidores. Os helpers `formatDuration` e `formatDashboardReferenceDate` saíram do painel junto dos testes exclusivos.
- A prop `activeSection` saiu da `Sidebar`; o aplicativo e os testes usam `route`.

### Testes e validação

As rodadas de testes diretos, cobertura, lint, build, formatação e E2E estão registradas em [Testes](TESTES.md). O teste opt-in com API real exige `RUN_REAL_API` e ambiente disponível; a validação manual de leitor de tela e dispositivos reais continua em [Pendências](PENDENCIAS.md).

## 26/09/2026

### Revisão complementar

A revisão de 26/09 mantém os contratos e altera exclusivamente `FrontEnd`. O estado inicial estava limpo. Os resultados e inventário de 25/09 abaixo são históricos; os resultados mais recentes estão em [Testes](TESTES.md).

| Arquivos (relativos a FrontEnd)                                                    | Melhoria e justificativa                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/api.js`, `src/services/api.test.js`                                  | Não envia sinal já cancelado, descarta leitura após cancelamento, distingue timeout interno de motivo externo homônimo e confere MIME exato com parâmetros permitidos. Testes protegem esses limites.                                                                             |
| `src/utils/dashboard.js`, `src/utils/dashboard.test.js`                            | Compartilha validação real de data; valida campos de texto exibidos, identidades únicas e durações inteiras seguras. Rejeita realtime ambíguo/negativo sem inventar desempate ou normalizar dados defeituosos.                                                                    |
| `src/hooks/useDashboardData.js`, `src/hooks/useDashboardData.test.js`              | Exige que o usuário retornado corresponda ao filtro e limpa horário de atualização quando todas as fontes falham e os dados são removidos.                                                                                                                                        |
| `src/pages/DashboardPage.jsx`, `src/pages/DashboardPage.test.jsx`                  | Mantém visível o usuário selecionado se a lista ficar indisponível; evita aparência de filtro geral enquanto a consulta permanece individual.                                                                                                                                     |
| `src/pages/ReportsPage.jsx`, `src/pages/ReportsPage.test.jsx`                      | Bloqueio síncrono de envios duplicados, filtros desabilitados durante exportação, loading/vazio da lista, sucesso preciso de download iniciado, erros com contraste no tema escuro e limpeza de feedback ao alterar filtros. Preserva seleção ao perder a lista.                  |
| `src/pages/SettingsPage.jsx`, novo `src/pages/SettingsPage.test.jsx`               | Impede dois submits no mesmo evento antes do próximo render, libera bloqueio ao concluir, limpa erro ao editar e mantém fallback legível para rejeição sem objeto Error. Testa sucesso, falha e retry.                                                                            |
| `src/hooks/useTheme.js`, `src/hooks/useTheme.test.js`                              | Falha de leitura/escrita de localStorage deixa de interromper renderização e alternância do tema; permanece apenas preferência de apresentação em memória.                                                                                                                        |
| `src/components/Sidebar.jsx`                                                       | Rolagem vertical em menus de pouca altura e contraste da marca no tema escuro, confirmado por falha real de axe-core.                                                                                                                                                             |
| `e2e/app.spec.js`, `e2e/accessibility.spec.js`                                     | Confirma anúncio do download, acesso ao último link em orientação horizontal e contraste dos erros/retry de relatórios no tema escuro. Mantém os cenários existentes.                                                                                                             |
| `src/test/frontendRevision.test.jsx`                                               | Resposta simulada acompanha a data solicitada; remove dependência acidental do dia 25/09 sem afrouxar a validação de resposta divergente.                                                                                                                                         |
| `docs/PENDENCIAS.md`                                                               | Reorganiza todos os bloqueios em backend, integração e frontend futuro, com requisito, locais afetados, comportamento, impacto, alteração necessária, workaround, prioridade e motivo. Acrescenta captura futura/tempo negativo, exportação CSV/PDF e unicidade de configurações. |
| `docs/ARQUITETURA.md`, `docs/FUNCIONALIDADES.md`, `docs/TESTES.md`, este documento | Atualiza ciclos, testes, limites, resultados e inventário das mudanças.                                                                                                                                                                                                           |
| `README.md`, `src/index.css` e formatação dos documentos acima                     | Corrige falhas reais da checagem Prettier já presentes no checkout; sem alteração visual ou funcional no CSS. Nenhum arquivo foi excluído da checagem para fazê-la passar.                                                                                                        |

Não foram removidos componentes preservados pela auditoria anterior: não são importados pela aplicação ativa e vários possuem testes consumidores; não há economia de bundle ao excluí-los. Nenhum endpoint, campo, métrica, login ou task foi inventado. Mocks existem somente nos testes.

O healthcheck `GET http://localhost:8000/` não respondeu nesta revisão. Não foram iniciados backend, banco ou seeds. O E2E real permanece opt-in, e cancelamento de PUT no cliente não garante rollback de gravação processada pelo servidor.

### Refatoração da estrutura

Reorganizados 52 arquivos de código e testes por responsabilidade, preservando o comportamento e os contratos existentes:

| Destino         | Arquivos e responsabilidade                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`      | `App`, `ErrorBoundary`, `layout/Sidebar`, hooks de rota e tema e `styles/index.css`                                                 |
| `src/features/` | Páginas de acesso, colaboradores, painel, relatórios, configurações e tasks; hook `useDashboardData` junto do painel                |
| `src/shared/`   | `api/api.js`, componentes `MetricCard`, `PageHeader`, `IntegrationNotice` e funções de `lib/` usadas por diferentes funcionalidades |
| `src/legacy/`   | Componentes, hook `useAutoRefresh` e constantes preservados fora da aplicação ativa, com seus testes                                |
| `src/testing/`  | Setup do Vitest e teste transversal `frontendRevision.test.jsx`                                                                     |

Atualizados imports relativos, imports dinâmicos das páginas, mocks e configuração de setup/cobertura do Vitest. Os testes específicos acompanham o código; os padrões recursivos de Vite, Tailwind e ESLint continuam abrangendo a nova árvore. README, arquitetura, inventário dos testes e pendências documentaram os novos locais à época. Não foram adicionadas dependências ou arquivos de reexportação. Consulte [Testes](TESTES.md) para a validação desta refatoração.

## 25/09/2026

### Escopo

Esta revisão alterou somente `FrontEnd/`. `backend/` e `requisitos/` foram consultados; nenhuma alteração foi feita neles. Dependências externas e verificações que exigem serviços ausentes estão em [Pendências](PENDENCIAS.md).

### Alterações funcionais e técnicas

| Arquivos                                                                                                                                | Motivo e implementação                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`, `package-lock.json`, `eslint.config.js`                                                                                 | Instalados ESLint, `@eslint/js`, plugins React, Hooks e JSX a11y, `globals`, Prettier, Playwright e axe-core; criados `lint`, `format`, `format:check`, `test:e2e` e `test:e2e:real`. ESLint usa configuração plana. PropTypes, regra de estado em efeito e foco em contêiner não interativo foram ajustados às escolhas atuais do projeto, mantendo as demais regras recomendadas. |
| `.prettierrc.json`, `.prettierignore`                                                                                                   | Definido estilo consistente de código. Documentação e artefatos gerados ficam fora da formatação automática.                                                                                                                                                                                                                                                                        |
| `.gitignore`                                                                                                                            | Ignorados relatório e resultados do Playwright.                                                                                                                                                                                                                                                                                                                                     |
| `vite.config.js`, `vitest.config.js`, `package.json`                                                                                    | Vite usa `--configLoader runner` nos scripts para funcionar no Windows deste ambiente. Vitest inclui somente arquivos `src/**/*.test.{js,jsx}`, evitando recolher suites Playwright.                                                                                                                                                                                                |
| `playwright.config.js`, `e2e/run.mjs`                                                                                                   | Playwright usa Chrome/Chromium; o executor constrói o frontend, inicia o preview em `127.0.0.1:5173`, espera a porta, executa o navegador e encerra o servidor. E2E simulado fixa a origem da API em `localhost:8000`; com `RUN_REAL_API=1`, respeita `VITE_API_URL`. `PLAYWRIGHT_CHANNEL=chrome` permite o Chrome local.                                                           |
| `e2e/app.spec.js`                                                                                                                       | Testes de painel, filtros, navegação/404, erros 503 e de rede, retry, GET/PUT de configurações, downloads CSV/PDF, tema, menu móvel, larguras 375/390/768/1366/1920 px, outras telas em 390 px e ampliação CSS de 200%. A API é simulada na camada HTTP do navegador; os fluxos de download e layout usam Chrome real.                                                              |
| `e2e/accessibility.spec.js`                                                                                                             | axe-core verifica regras WCAG detectáveis em Painel, Colaboradores, Relatórios, Configurações e menu móvel no tema escuro. O teste também verifica foco inicial do diálogo.                                                                                                                                                                                                         |
| `e2e/real-api.spec.js`                                                                                                                  | Teste opt-in sem mocks, para leitura do painel e configurações com FastAPI real. Exige `RUN_REAL_API=1`, backend e banco em execução. Não grava configurações nem cria dados.                                                                                                                                                                                                       |
| `src/services/api.js`, `src/services/api.test.js`                                                                                       | Introduzido `ApiError` com `type`, `status`, `statusText`, `detail` e `cause`. Erros HTTP leem `detail` do FastAPI; timeout, cancelamento, rede, 4xx, 5xx e resposta inválida são diferenciados. Mantidos timeout durante leitura, validação de data e formato de exportação. Testes cobrem essas diferenças.                                                                       |
| `src/utils/requestFailure.js`, `src/hooks/useDashboardData.js`, `src/hooks/useDashboardData.test.js`, `src/pages/CollaboratorsPage.jsx` | Falhas parciais do painel e de Colaboradores passam a informar a fonte e o motivo, sem trocar lista vazia válida por erro nem perder dados ainda disponíveis. O helper reduz duplicação dos dois fluxos paralelos.                                                                                                                                                                  |
| `src/pages/ReportsPage.jsx`                                                                                                             | Falha na lista de usuários agora mostra motivo e botão de retry; exportação geral continua disponível. A consulta anterior é cancelada antes de nova tentativa.                                                                                                                                                                                                                     |
| `src/pages/DashboardPage.jsx`                                                                                                           | `min-w-0` no cartão da tabela mantém a rolagem dentro dele em 375/390 px, eliminando rolagem horizontal da página.                                                                                                                                                                                                                                                                  |
| `src/index.css`                                                                                                                         | Texto secundário mais escuro no tema claro e links com contraste maior no tema escuro; violações de contraste encontradas pelo axe-core foram eliminadas nos cenários cobertos.                                                                                                                                                                                                     |
| `src/components/Sidebar.jsx`                                                                                                            | Mantido fechamento por navegação/histórico; removido efeito redundante dependente de rota e marcado o fundo clicável do diálogo como apresentação para a regra JSX a11y.                                                                                                                                                                                                            |
| `README.md`, `docs/ARQUITETURA.md`, `docs/FUNCIONALIDADES.md`, `docs/TESTES.md`, `docs/PENDENCIAS.md`, este documento                   | Atualizados comandos, contratos de erro, resultados, limitações, pendências externas e decisões. Removida menção incorreta a ranking como recurso necessário.                                                                                                                                                                                                                       |

### Formatação de código

Prettier foi aplicado uma vez ao código existente para que `format:check` passe desde esta revisão. Além dos arquivos funcionais acima, foram modificados **somente na apresentação do código**:

- Raiz: `index.html`, `postcss.config.js`, `tailwind.config.js`, `vite.config.js`.
- Entrada e apoio: `src/App.jsx`, `src/App.test.jsx`, `src/main.jsx`, `src/constants/ui.js`, `src/test/setup.js`.
- Componentes e testes: `src/components/ActivityChart`, `Card`, `EmptyState`, `ErrorBoundary`, `Header`, `IntegrationNotice`, `MetricCard`, `PageHeader`, `PeopleCard`, `ReportsAndAgent`, `SectionHeading`, `Sidebar`, `TimelineCard` (arquivos `.jsx` e respectivos `.test.jsx` existentes). A mudança funcional de `Sidebar.jsx` está descrita acima.
- Hooks e testes: `src/hooks/useAutoRefresh`, `useHashRoute`, `useTheme` (arquivos `.js` e respectivos `.test.js`); `useDashboardData` também foi formatado, com mudança funcional descrita acima.
- Páginas e testes: `src/pages/AuthPage`, `DashboardPage`, `ReportsPage`, `TasksPage`, `CollaboratorsPage`, `SettingsPage` (arquivos `.jsx` e respectivos `.test.jsx` existentes), mais `src/test/frontendRevision.test.jsx`. As mudanças funcionais estão na tabela anterior.
- Serviço e utilitários: `src/services/api.js`, `src/services/api.test.js`, `src/utils/dashboard.js`, `src/utils/dashboard.test.js`; a alteração funcional do serviço está descrita acima.

Esta passagem de formatação amplia o diff, mas deixa os scripts de verificação utilizáveis para novas alterações.

### Verificação e limites

| Verificação                                            | Resultado                                                              |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `npm.cmd run lint`                                     | Passou                                                                 |
| `npm.cmd run format:check`                             | Passou                                                                 |
| `npm.cmd test`                                         | Passou na revisão histórica                                            |
| `npm.cmd run build`                                    | Passou                                                                 |
| `npm.cmd run test:e2e` com `PLAYWRIGHT_CHANNEL=chrome` | Passou; o teste de backend real opt-in foi ignorado sem `RUN_REAL_API` |

O endereço `http://localhost:8000/config/` não respondeu durante esta revisão. Por isso o teste sem mocks não foi executado; os E2E regulares interceptam respostas HTTP, e não comprovam CORS ou conteúdo do FastAPI. A ampliação de 200% usa CSS no Chrome e não equivale a zoom nativo. axe-core não substitui leitor de tela ou inspeção humana. Os componentes preservados fora da árvore ativa não foram removidos; a decisão permanece em [Pendências](PENDENCIAS.md).

### Referência da auditoria histórica — 25/09/2026

A revisão daquele ciclo cobriu a estrutura, os fluxos de interface, os contratos disponíveis, os testes e a documentação. Entre os problemas então corrigidos estavam limites de validação de respostas, cancelamento e estados de carregamento, rotas inválidas e telas que sugeriam integrações ainda inexistentes. As alterações e os caminhos usados na época estão resumidos nas entradas cronológicas acima; o histórico detalhado de versões permanece no Git.

Para entender o estado atual, consulte [Arquitetura](ARQUITETURA.md), [Contratos da API](CONTRATOS_API.md), [Funcionalidades](FUNCIONALIDADES.md), [Testes](TESTES.md) e [Pendências](PENDENCIAS.md). Requisitos e backend foram consultados somente para compreender contexto e contratos; nenhum contrato foi criado pela auditoria.

# Testes e validação do frontend

## Auditoria atual de qualidade — 30/10/2026

**Checkout analisado:** branch `main`, HEAD `eec089a976cd2678473ad2f992269538fd1a4a57`. A árvore inicial estava limpa; a linha de base anterior no mesmo checkout foi confirmada com 338 testes Vitest aprovados.

| Comando/verificação         | Resultado                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run lint`          | Aprovado.                                                                                                                  |
| `npm.cmd run format:check`  | Aprovado; todos os arquivos mantêm o estilo Prettier.                                                                      |
| `npm.cmd run typecheck`     | Aprovado.                                                                                                                  |
| `npm.cmd run test:coverage` | 61 arquivos e 348 testes aprovados. Statements 93,16%; branches 89,60%; funções 94,79%; linhas 95,60%.                     |
| `npm.cmd run build`         | Aprovado; o bundle de produção exclui handlers, worker e rotas de mocks.                                                   |
| `npm.cmd run test:bundle`   | 4 verificações aprovadas.                                                                                                  |
| `npm.cmd run test:e2e`      | 36 cenários: 34 aprovados, 0 falhas e 2 testes opt-in de API real ignorados por falta de ambiente/credenciais autorizados. |
| API real                    | Não executada. Os testes interceptados não comprovam CORS, persistência ou autorização no servidor.                        |

Os scans Axe passaram sem violações detectadas nas páginas de Painel, Tasks, Colaboradores, Relatórios, Configurações e login, além dos estados mobile escuro e de erro. Os scans cobrem WCAG 2.2 A/AA e versões anteriores; isso não substitui avaliação manual. A regressão de layout passou em 320, 375, 390, 768, 1024, 1366 e 1920 px, e a ampliação CSS de 200%. A largura de 320 px também verifica o reflow equivalente a 400% de uma viewport de 1280 px.

O primeiro ciclo da suíte após as mudanças revelou somente expectativas antigas de testes que ainda aguardavam o texto bruto do servidor; elas foram atualizadas para as mensagens HTTP seguras e a execução completa posterior passou.

O baseline E2E foi executado em uma cópia temporária de `FrontEnd/` no próprio HEAD `eec089a`: 32 cenários, 30 aprovados, 0 falhas e 2 testes de API real ignorados. Essa cópia foi removida após a execução. O baseline Vitest no checkout original também passou com 338 testes.

## Execução anterior registrada — 30/10/2026

**Checkout analisado:** branch `main`, HEAD `04a272798219dd56a424847e73fad02298a0b3e3`, referência desta auditoria.

**Escopo:** somente `FrontEnd/`. Nenhuma chamada à API real nem gravação em banco externo foi feita.

| Comando/verificação         | Resultado                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run check`         | Passou: lint, format:check, typecheck, cobertura, build e test:bundle.                                                                                  |
| Vitest/cobertura            | 60 arquivos e 338 testes passaram. Statements 93,17%; branches 89,62%; funções 94,80%; linhas 95,61%.                                                   |
| Build/test:bundle           | Build de produção passou; 4 verificações confirmaram que mocks, handlers e worker não entraram no bundle.                                               |
| `npm.cmd run test:e2e`      | 32 cenários: 30 passaram, 0 falharam e 2 testes opt-in de API real foram ignorados por falta de ambiente/credenciais configurados.                      |
| Homologação contra API real | Não executada. Não havia ambiente de teste autorizado configurado; os testes interceptados não comprovam CORS, persistência ou autorização no servidor. |

### Regressões exercitadas nesta rodada

- Listagem e criação pendentes são canceladas no logout; respostas resolvidas depois não aparecem após login de outro gestor.
- Criação, edição e exclusão pendentes têm testes de cancelamento do hook ao desmontar; o fluxo de logout integra listagem e criação.
- `401` em listagem, criação, edição ou exclusão de Tasks limpa o token, aborta a requisição e desmonta o conteúdo protegido.
- Tasks com o mesmo `created_at` seguem o desempate UUID decrescente do backend.
- A suíte existente preserva os testes de criação, edição, exclusão, erros, recargas e concorrência; E2E confirma que Tasks não chama a lista global de `/users/`.

## Execução anterior registrada — 30/10/2026

**Checkout analisado:** branch main, HEAD cccc5ac2bf6f7482fc65ba28cb7443bc02a633de.

| Comando                     | Resultado                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm ci                      | Concluído com cache direcionado a FrontEnd/.npm-cache; 487 pacotes instalados. A primeira tentativa no modo restrito falhou ao remover cache local bloqueado por EPERM. A tentativa autorizada seguinte concluiu. npm informou que scripts postinstall de esbuild e msw ainda não estão aprovados; build, testes e E2E executados depois passaram. |
| npm run check               | Aprovado: lint, format:check, typecheck, test:coverage, build e test:bundle.                                                                                                                                                                                                                                                                       |
| Vitest / cobertura          | 59 arquivos e 330 testes aprovados, 0 falhos. Statements 93,22%; branches 89,60%; funções 94,79%; linhas 95,61%.                                                                                                                                                                                                                                   |
| Build de produção           | Aprovado; verificador confirmou que handlers, worker e rotas demonstrativas não estão no bundle.                                                                                                                                                                                                                                                   |
| test:bundle                 | 4 verificações aprovadas, 0 falhas.                                                                                                                                                                                                                                                                                                                |
| npm run test:e2e            | 32 cenários: 30 aprovados, 0 falhos e 2 testes opt-in de API real ignorados por ausência de ambiente/credenciais configurados.                                                                                                                                                                                                                     |
| Acessibilidade E2E          | 6 cenários aprovados, incluindo axe-core, navegação/contraste e estados de erro.                                                                                                                                                                                                                                                                   |
| Homologação contra API real | Não executada. RUN_REAL_API, credenciais autorizadas e ambiente de teste descartável não estavam configurados.                                                                                                                                                                                                                                     |

### Cenários de integração cobertos

Vitest verifica cadastro com ManagerOut sem código, perfil /auth/me com association_code de seis dígitos preservando zeros à esquerda, código ausente/inválido, sessão/logout/troca de gestor, cancelamento e respostas assíncronas fora de ordem. A camada HTTP cobre Bearer, validação de UUID e payload, resposta inválida, erro de conexão, atualização parcial e DELETE 204 sem leitura de JSON.

A tela de Tasks é coberta para lista/criação/edição/exclusão, descrição nula ou opcional, zero colaboradores, substituição/remoção de atribuições no modo permitido por teste/mock, prevenção de mutações simultâneas e resposta fora de ordem. Em produção, a interface não oferece seleção da lista global de /users/. O E2E do navegador cria uma Task com JWT interceptado, confirma o payload sem descrição/colaboradores e verifica que entrar na tela Tasks não dispara outra chamada a /users/.

Os testes de Dashboard, colaboradores, filtros, relatórios, configurações, navegação, responsividade e acessibilidade continuam cobertos por cliente interceptado. Esses testes comprovam o frontend e os contratos de resposta simulados, não autorização, isolamento, persistência ou CORS de uma API implantada.

### Falhas observadas e resolução

- A primeira execução de npm run check revelou dois textos de teste ainda vinculados ao antigo estado do código de associação e erros de tipagem JSDoc nos novos payloads, no perfil e no leitor 204. As asserções foram alinhadas ao estado atual e os tipos explícitos foram corrigidos; a execução completa final passou.
- A primeira execução E2E do novo fluxo de Task revelou que a fixture incluía manager_id e collaborator_ids, campos que não existem em TaskResponse; a fixture foi alinhada ao schema real. O E2E de acessibilidade também usava perfil sem association_code e falhava na validação de sessão; a fixture recebeu o perfil válido. As suítes completas finais passaram.

### Não executado e limites

- Os dois cenários de e2e/real-api.spec.js foram ignorados pelo guard opt-in. Não há evidência de login, CORS, persistência, isolamento por gestor ou exportações contra o backend real.
- Testes do backend, Agent, banco e migrações não foram executados nem alterados nesta tarefa.
- A auditoria identificou que rotas de Dashboard, atividade, usuários, exportações, configuração e categorias não exigem JWT nem aplicam escopo de gestor. A homologação e o contrato seguro seguem pendentes; consulte [PENDENCIAS.md](PENDENCIAS.md).
- Nenhum teste foi alterado para ocultar incompatibilidade. As fixtures E2E foram atualizadas para corresponder ao contrato comprovado e asserções de UI desatualizadas foram corrigidas.

## Histórico de execuções anteriores

As seções abaixo preservam registros de checkpoints anteriores à incorporação local dos PRs #142, #145 e #146. Seus resultados continuam válidos para os commits e o código indicados em cada registro, mas não descrevem esta execução atual.
---

# Testes e validação do frontend

Este guia distingue verificação automatizada, build e verificações manuais ainda pendentes. Há validações registradas em **05/10/2026**, **07/10/2026**, **09/10/2026**, **13/10/2026**, **16/10/2026** e **22/10/2026**. Resultados anteriores permanecem identificados pela data e pelo estado do código em que foram obtidos. O inventário completo das alterações está em [Alterações](ALTERACOES.md).

## US-06.2 — Código de associação no Dashboard — 22/10/2026

- Base local: branch `main`, HEAD `d49e71febbc69482b5682af1f26832ea136f33c6`; árvore limpa antes da implementação. Todas as alterações desta rodada ficaram em `FrontEnd/`.
- Backend consultado somente para leitura: `GET /auth/me` responde o `ManagerOut` com `id`, `email` e `created_at`; não inclui `association_code`. Nenhum endpoint/modelo/schema de consulta do código foi encontrado. As issues #105, #113 e #114 retornaram `Cache miss`; a página do repositório abriu, mas o código local foi a fonte da implementação.
- O card foi integrado ao Dashboard autenticado; sem contrato, informa a pendência e não exibe código. Os testes simulam somente o adapter de UI, sem criar endpoint ou dado demonstrativo de produção.
- `npm.cmd run check`: passou (ESLint, Prettier, typecheck, build e verificação do bundle). Cobertura Vitest: **319 testes em 59 arquivos passaram**; 93,28% statements, 89,66% branches, 94,77% functions e 95,50% lines. Teste do bundle: **4 passaram**.
- `npm.cmd run test:e2e`: **30 passaram, 0 falharam e 2 testes de API real foram ignorados** porque dependem de serviço/credenciais. As verificações automatizadas de acessibilidade passaram. Um seletor E2E do status do filtro foi delimitado ao texto esperado porque o card acrescentou uma mensagem acessível ao Dashboard.
- Não houve chamada a API real nem homologação integrada. A cópia só fica habilitada quando um serviço futuro fornecer uma string válida de seis dígitos; consulta autenticada permanece pendente do contrato Backend.

### Revalidação do commit da US-06.2 — 22/10/2026

- Checkout verificado: branch `main`, HEAD `38c53581351d8c2038350cb1ed63eab44080f9ca` (`origin/main`); `git status --short` estava vazio antes das verificações.
- Contrato revalidado no Backend local: `GET /auth/me` exige JWT e retorna `ManagerOut` com `id`, `email` e `created_at`; não inclui `association_code`. Os routers, schemas, modelos, CRUD e testes de autenticação consultados não declaram rota de consulta do código.
- `npm.cmd run check`: passou (lint, format:check, typecheck, cobertura, build e test:bundle). Vitest: **319 testes em 59 arquivos passaram**; cobertura de 93,34% statements, 89,66% branches, 94,77% functions e 95,50% lines. Bundle: **4 verificações passaram**.
- `npm.cmd run test:e2e`: **30 passaram, 0 falharam e 2 foram ignorados** por dependerem de API real/credenciais; verificações E2E de acessibilidade e layouts móveis passaram.
- Os testes de código de associação continuam usando adapter simulado no Frontend; não houve chamada à API real. As issues #105, #113 e #114 não puderam ser consultadas nesta sessão (`Cache miss`).
- A orientação para compartilhar o código aparece somente quando a resposta contém uma string válida de seis dígitos; testes cobrem os estados válido, inválido e pendente.
- Resultado: frontend visual implementado e testado; homologação integrada depende do contrato de consulta autenticada do Backend.

## Continuação da US-16.1 — 22/10/2026

- Base local: branch `main`, HEAD `b9d78e515d6e65fbf5076309ecee1a89e8bf9cf0`; a árvore estava limpa antes desta rodada. A implementação e a documentação desta rodada estão limitadas a `FrontEnd/`.
- A revisão de leitura confirmou que `backend/app/routers/dashboard.py` não declara `/dashboard/tasks-summary`; `backend/app/schemas.py` não define resposta de agregação por Task e `ActivityLogCreate` não contém `task_id`. A proposta em [Pendências — agregação de horas por Task](PENDENCIAS.md#proposta-task-hours) continua sem implementação no contrato atual.
- O `TaskSummaryCard` agora aceita e apresenta um resumo recebido, distingue origem da API e demonstração, exibe colaboradores/atividade sem Task/tempo zero, e separa erro, carregamento e resposta vazia. O Dashboard de produção ainda não fornece esse resumo: o aviso de integração pendente continua visível quando não há dados.
- A resolução de `VITE_API_URL` agora usa `localhost:8000` somente em desenvolvimento; sem valor em produção, usa a mesma origem. Nenhuma rota ou formato de agregação foi adicionado ao cliente.
- `npm.cmd run test -- src/shared/api/api.test.js src/features/dashboard/components/TaskSummaryCard.test.jsx`: **2 arquivos e 42 testes passaram**.
- `npm.cmd run lint`, `npm.cmd run format:check` e `npm.cmd run typecheck`: passaram.
- `npm.cmd run test:coverage`: **301 testes em 58 arquivos passaram**. Cobertura V8: **93,32% statements, 89,63% branches, 95,07% functions e 95,50% lines**; os limites configurados passaram.
- `npm.cmd run build`: passou com Vite 6.4.4; o verificador confirmou que handlers, worker e rotas dos mocks não entraram no bundle de produção.
- O build sem `VITE_API_URL` foi inspecionado: `http://localhost:8000` não aparece nos arquivos JavaScript de `dist/`; o fallback local fica restrito ao desenvolvimento.
- `npm.cmd run test:bundle`: **4 verificações passaram** para exclusão de mocks e rotas demonstrativas no bundle.
- `npm.cmd run test:e2e`: **32 cenários, 30 passaram, 0 falharam e 2 testes de API real foram ignorados** porque exigem serviço/credenciais configurados. As verificações de acessibilidade automatizadas passaram.
- Não houve chamada à API real nem execução de testes de Backend/Agent. Autorização/isolamento, política para Tasks excluídas e conferência de totais no servidor permanecem sem homologação.
- As páginas GitHub das issues #132 e #140 não puderam ser carregadas nesta sessão (erro `Cache miss`); a página do repositório abriu. Status, comentários e alterações externas das issues não foram confirmados.

## Revalidação documental e completa — 21/10/2026

Execução no checkout local `main`, HEAD `fc3132ab5133b2ad9ea12da1e8ce1bbb987822eb`, inicialmente limpo. A primeira checagem confirmou falha de formatação somente em `docs/ARQUITETURA.md` e `docs/README.md`; ambos foram formatados com o Prettier configurado no Frontend, sem remover seções ou exemplos.

- `npm.cmd run format:check`: passou; todos os arquivos verificados seguem o Prettier.
- `npm.cmd run lint`: passou.
- `npm.cmd run typecheck`: passou.
- `npm.cmd run check:full`: passou, incluindo lint, format check, typecheck, cobertura, build, teste do bundle e E2E.
- Cobertura: **296 testes em 58 arquivos passaram**. Statements: **93,30%**; branches: **89,55%**; functions: **95,06%**; lines: **95,49%**.
- Build de produção passou com Vite 6.4.4; o verificador confirmou que handlers, worker e rotas dos mocks não entraram no bundle. As **4 verificações** do bundle passaram.
- Playwright executou **32 cenários: 30 passaram, 0 falharam e 2 cenários de API real foram ignorados**, pois não havia serviço/credenciais autorizados configurados.
- Os testes do Frontend cobrem a integração demonstrativa `devApi.createTask()` + `setupServer` do MSW, além dos caminhos `/tasks/`, códigos de erro e CRUD em memória. Não foram executados testes do Backend/Agent nem chamadas à API real.

## Validação funcional de F-04 — 21/10/2026

O checkout começou na branch `main`, baseado no HEAD `a20750c25bb24d1665ffb965e14aa80a73f590ae`, sem mudanças locais. A correção e os testes foram executados na árvore de trabalho e registrados no commit seguinte, `fc3132ab5133b2ad9ea12da1e8ce1bbb987822eb`. Foi usado `npm.cmd` porque a política do PowerShell bloqueia o wrapper `npm.ps1`.

- Linha de base antes de ampliar os testes: `npm.cmd run test -- src/dev-mocks/client.test.js src/dev-mocks/handlers.test.js` — 2 arquivos e 17 testes passaram.
- Reprodução antes da correção: o novo teste integrado chamou `devApi.createTask()` com o `setupServer` MSW ativo. O cliente enviou POST `/tasks`; o handler de fallback respondeu 501 e o teste falhou, confirmando a incompatibilidade do matcher.
- Após alinhar a rota: `npm.cmd run test -- src/dev-mocks/client.test.js src/dev-mocks/handlers.test.js` — **2 arquivos e 18 testes passaram**. O teste integrado cria via cliente e lê a Task pela lista no MSW real de testes.
- Cobertura adicional do POST: pathname literal `/tasks/`, método, Bearer demonstrativo, Content-Type JSON, corpo com título/descrição/IDs, resposta válida, resposta inválida e erro HTTP 422.
- Cobertura dos handlers: GET autenticado 200, POST válido 201, POST sem autenticação 401, POST inválido 422, persistência em memória, leitura após criação, PUT 200, DELETE 200, leitura após exclusão, reset dos dados e da sequência de IDs; PUT/DELETE de item ausente retornam 404.

- `npm.cmd run lint`: passou dentro do `check:full`.
- `npm.cmd run format:check`: não passou porque os documentos preexistentes e inalterados `docs/ARQUITETURA.md` e `docs/README.md` não seguem o formato Prettier atual. Os arquivos modificados nesta correção foram formatados; não foram feitas alterações de formatação nesses dois documentos alheios à F-04.
- `npm.cmd run typecheck`: passou.
- `npm.cmd run test:coverage`: **296 testes em 58 arquivos passaram**. Cobertura V8: **93,30% statements, 89,55% branches, 95,06% functions e 95,49% lines**; os limites configurados passaram.
- `npm.cmd run build`: passou com Vite 6.4.4; o verificador confirmou que MSW, handlers e rotas demonstrativas não foram incluídos no bundle de produção.
- `npm.cmd run test:bundle`: **4 verificações passaram**.
- `npm.cmd run test:e2e`: **32 cenários, 30 passaram, 0 falharam e 2 foram ignorados**, pois exercitam API real sem serviço/credenciais autorizados.
- `npm.cmd run check:full`: parou no `format:check` descrito acima e, por isso, não iniciou a cobertura, o build ou o E2E nesse comando. Esses passos foram executados separadamente e passaram, exceto a formatação global.

Nenhuma API real foi chamada ou gravada nesta execução.

## Nota da auditoria documental — 21/10/2026

O commit analisado nesta auditoria documental é f8556a1114a52ffc5064ab9ab8506a388778561b. Nenhum teste de código foi executado nesta rodada: os números abaixo são registros de execuções anteriores no mesmo histórico de 21/10, não resultados produzidos pela revisão dos documentos. A descrição da [PR #128](https://github.com/fabrica-bayarea/TimeTracker-2026-2/pull/128) informa 254 testes Vitest e 29 cenários E2E; o registro local mais recente abaixo informa 295 testes Vitest e 30 aprovados, com 2 casos de API real ignorados. Como os registros não usam a mesma contagem, cada um permanece ligado à sua origem até confirmação pelos mantenedores.

## Auditoria do formulário, Dashboard e sessão — 21/10/2026

- `npm.cmd run lint`: passou.
- `npm.cmd run format:check`: passou.
- `npm.cmd run typecheck`: passou; verifica os contratos JavaScript/TypeScript configurados, não todo JSX.
- `npm.cmd run test:coverage`: **295 testes em 58 arquivos passaram**. Cobertura V8: **93,24% statements, 89,48% branches, 95,06% functions e 95,49% lines**; todos os limites globais e críticos passaram.
- `npm.cmd run build`: passou com Vite 6.4.4; o verificador confirmou exclusão de MSW, worker e rotas demonstrativas do bundle de produção.
- `npm.cmd run check`: passou, incluindo lint, formatação, typecheck, cobertura, build e 4 verificações do bundle.
- `npm.cmd run check:full`: passou; repetiu `check` e executou **32 cenários Playwright: 30 passaram, 0 falharam e 2 testes de API real foram ignorados** porque não havia API/credenciais autorizadas configuradas.
- Vitest agrega testes unitários, de hooks, serviços e componentes; não há uma contagem separada por categoria. Playwright usou o ambiente de teste com mocks. Os dois testes reais e qualquer gravação em serviço real não foram executados.
- Nenhum teste de Backend ou compilação/execução do Agent foi executado. As métricas do resumo Tasks continuam simuladas e vazias; nenhuma validação de integração/homologação real foi declarada.

## Conclusão da interface Tasks e validação completa — 21/10/2026

- `npm.cmd run lint`, `npm.cmd run format:check` e `npm.cmd run typecheck`: passaram.
- `npm.cmd run test:coverage`: **282 testes em 58 arquivos passaram**. Cobertura: **93,83% statements, 89,47% branches, 94,13% functions e 95,93% lines**.
- `npm.cmd run build`: passou com Vite 6.4.4; o verificador confirmou que handlers, worker e rotas de mocks ficaram fora do bundle de produção.
- `npm.cmd run test:bundle`: **4 verificações passaram**.
- `npm.cmd run check` e `npm.cmd run check:full`: passaram. O segundo inclui a mesma suíte de qualidade, build e teste E2E.
- Playwright: **30 passaram, 0 falharam e 2 testes de API real foram ignorados** por exigirem serviço configurado. O E2E confirma que a prévia de Tasks em produção mantém as ações desabilitadas; os fluxos CRUD e analíticos são cobertos por Vitest com serviços simulados.
- A cobertura de browser não valida persistência, JWT assinado, autorização, isolamento do Backend ou associação Agent–Task. Não foram feitas chamadas de API real nem gravações externas.
- `npm.cmd audit --json --cache node_modules/.cache/npm-audit`: inconclusivo; o endpoint de advisories do registry npm falhou por indisponibilidade de rede.

## Autenticação real no frontend — 21/10/2026

- `npm.cmd run check` passou com ESLint, Prettier, typecheck, cobertura Vitest, build de produção e teste do verificador do bundle.
- `npm.cmd run check:full` passou na execução consolidada após as edições finais: inclui `check` e E2E do Playwright.
- Vitest: **265 testes em 56 arquivos passaram**. Cobertura: **93,58% statements, 90,06% branches, 94,35% functions e 95,38% lines**.
- Testes focados de auth/API/App/Sidebar: **60 passaram**. Cobrem cadastro sem auto-login, validação local, login, sessão restaurada, logout, 401/403, token inválido, proteção de rota, falha de rede e submissão duplicada.
- `npm.cmd run test:e2e` passou após corrigir um seletor ambíguo do teste de cadastro: **30 passaram, 0 falharam e 2 testes de API real foram ignorados**. O Playwright cobriu cadastro/login com API simulada, restauração da sessão, navegação protegida, telas principais e axe-core nas páginas existentes.
- O E2E usa endpoints simulados pelo navegador e valida o fluxo do cliente; não valida JWT assinado, persistência ou autorização no serviço real. `RUN_REAL_API`, `REAL_API_EMAIL` e `REAL_API_PASSWORD` não foram configurados. Nenhuma conta ou dado real foi usado.
- `npm.cmd audit --json --cache node_modules/.cache/npm-audit` falhou porque o ambiente não conseguiu acessar `https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`. A auditoria atual de vulnerabilidades ficou inconclusiva; o snapshot de 13/10 permanece apenas como referência histórica em [Pendências](PENDENCIAS.md).
- Backend e Agent foram examinados somente por leitura. Testes do Backend, execução/compilação do Agent e E2E real não foram executados.
- A execução final do `check:full` e a inspeção do diff/escopo estão registradas em [Relatório](RELATORIO_EXECUCAO_FRONTEND.md).

## Revisão complementar — 16/10/2026

- **Linha de base:** antes das alterações, `npm.cmd run check` passou. Vitest: 242 testes em 55 arquivos; cobertura de 94,77% statements, 90,20% branches, 95,36% functions e 96,82% lines. O E2E inicial teve 29 aprovados e 2 ignorados por dependerem da API real.
- **Resultado final:** `npm.cmd run check:full` passou com lint, Prettier, typecheck, cobertura, build de produção, 4 verificações do bundle e E2E.
- **Vitest/cobertura:** 254 testes em 55 arquivos passaram; cobertura de 95,23% statements, 90,84% branches, 96,11% functions e 97,13% lines.
- **E2E:** 29 passaram, 0 falharam e 2 testes de API real foram ignorados. axe-core não encontrou violações nos fluxos cobertos; viewport móvel, tema escuro e ampliação de 200% também passaram.
- A primeira execução E2E após incluir o anúncio acessível do horário encontrou dois seletores genéricos ambíguos/obsoletos; os testes passaram a distinguir o horário da consulta da contagem e a execução completa seguinte passou.
- Testes focados de API cobrem 400, 401, 403, 404 e 500, além de 422/503, resposta inválida, timeout e cancelamento. Os testes de Colaboradores cobrem resposta parcial, falha, cancelamento, resposta antiga, ordenação, duplicidade visual de nomes e envelhecimento da leitura sem nova requisição.
- `backend/.env` não existe e `RUN_REAL_API` não está habilitado. Nenhuma chamada real foi tentada; os dois E2E reais permaneceram ignorados e nenhum teste escreveu dados no Backend.
- `git diff --check` passou; `git diff --name-only` confirmou que todas as 21 alterações versionadas estão em `FrontEnd/`.

## Integração do Agent em Colaboradores — 16/10/2026

- `npm.cmd run check:full` passou: ESLint, Prettier, typecheck, cobertura Vitest, build de produção, 4 verificações do bundle e Playwright E2E.
- Vitest: **242 testes em 55 arquivos passaram**. Cobertura: **94,77% statements, 90,20% branches, 95,36% functions e 96,82% lines**.
- E2E: **29 passaram, 0 falharam e 2 foram ignorados** por dependerem de API real. O novo cenário de Colaboradores combina pesquisa, estado e aplicativo, verifica tempo de leitura, contagem, limpeza, atualização manual e ausência do hostname na interface.
- axe-core não detectou violações no fluxo de Colaboradores. A primeira tentativa E2E encontrou um seletor ambíguo preexistente no cenário de acessibilidade do Dashboard durante o carregamento; o teste foi ajustado para aguardar o texto específico da lista e a execução final passou.
- `RUN_REAL_API` não estava configurado, portanto os contratos reais do Backend não foram exercitados. O Agent desktop também não foi executado; sua análise foi somente de código e os achados estão em [Pendências](PENDENCIAS.md).
- `git diff --check` e auditoria do escopo final foram executados após a validação.

## Filtro realtime e demonstração de Tasks — 16/10/2026

- **Linha de base antes das alterações:** `npm.cmd run check` passou com lint, formatação, typecheck, build e bundle; Vitest: **216 testes em 51 arquivos**, cobertura de 94,68% statements, 91,74% branches, 95,95% functions e 96,82% lines. E2E: **27 passaram e 2 foram ignorados** por exigirem API real.
- **Resultado final:** `npm.cmd run check:full` passou. Incluiu ESLint, `format:check`, typecheck, cobertura, build, 4 testes do verificador de bundle e E2E.
- **Vitest/cobertura:** **226 testes em 53 arquivos passaram**; 94,85% statements, 91,20% branches, 95,58% functions e 96,86% lines.
- **E2E:** **28 passaram, 0 falharam e 2 foram ignorados**. O cenário novo combina os filtros de usuário e aplicativo, confirma que o filtro de aplicativo não muda o resumo e limpa a seleção. axe-core não detectou violações no Dashboard coberto.
- A seleção/consulta de Tasks foi verificada nos testes de componente e função no modo de desenvolvimento simulado; a suíte E2E de produção confirma que a tela continua sem criação quando os mocks não estão ativos.
- Os dois testes de API real foram ignorados porque `RUN_REAL_API` e um ambiente Backend autorizado não estavam configurados. A interface desktop do Agent não foi executada; a análise foi somente de código, conforme o escopo.
- `npm.cmd audit --json --cache node_modules/.cache/npm-audit` não obteve resultado: a requisição para `https://registry.npmjs.org/-/npm/v1/security/advisories/bulk` falhou por restrição de rede. A auditoria de dependências disponível continua sendo o snapshot de 13/10 registrado em [Pendências](PENDENCIAS.md), sem verificação upstream nesta execução.
- O verificador do build confirmou que handlers, worker e rotas mock não foram incluídos em `dist/`. Não foram adicionadas dependências.

## Revisão de robustez dos mocks — 13/10/2026

- `npm.cmd run check`: passou com lint, `format:check`, typecheck, cobertura, build de produção e teste do verificador de bundle.
- Vitest/cobertura: **216 testes em 51 arquivos passaram**. Cobertura: **94,68% statements, 91,74% branches, 95,95% functions e 96,82% lines**.
- Rotas da origem da API sem handler foram verificadas com `501`; não houve bypass para o Backend no modo de mocks.
- `npm.cmd run check:full`: passou e repetiu `check`; o E2E teve **27 aprovados, 0 falhas e 2 ignorados** por dependerem da API real.
- O build do Vite transformou 312 módulos; o verificador não encontrou handlers, worker, rotas nem marcador das interfaces simuladas em `dist/`. Os 4 testes unitários do verificador de bundle passaram.
- API real não foi configurada nem exercitada; os dois casos opt-in foram ignorados. Os testes de integração local usam MSW/fetch simulados e não comprovam persistência, autorização, CORS ou contratos ausentes do Backend.
- A tentativa de smoke test do Service Worker no navegador não chegou a abrir a aplicação: o servidor Vite/esbuild encerrou na pré-otimização com `Acesso negado` ao resolver `../../..` em `node_modules`, embora os arquivos do React/MSW existissem. Uma configuração temporária sem descoberta de dependências apresentou o mesmo bloqueio e foi removida; a ativação do worker em navegador permanece sem verificação manual.

## Linha de base desta execução — 13/10/2026

- `npm ci`: a primeira execução no sandbox falhou com `EPERM` ao remover `FrontEnd/node_modules/eslint-plugin-react/node_modules/resolve/test/resolver/other_path/root.js`; a repetição restrita à pasta `FrontEnd/` concluiu e instalou 438 pacotes. O npm reportou 7 vulnerabilidades no grafo (5 altas, 2 moderadas) e um script `postinstall` de `esbuild` aguardando aprovação.
- npm run check: a primeira execução passou pelo lint e parou na verificação de formatação, que apontou apenas o documento de propostas, agora consolidado em [Pendências](PENDENCIAS.md#propostas-de-contratos-de-integracao). O documento foi formatado com Prettier; a repetição completa passou por lint, formatação, typecheck, cobertura e build.
- `npm run test:coverage`: **171 testes em 41 arquivos passaram**. Cobertura: 95,98% statements, 94,62% branches, 96,31% functions e 97,69% lines.
- `npm run build`: passou com Vite 6.4.4.
- `npm run test:e2e`: **27 passaram, 0 falharam e 2 foram ignorados** por exigirem API real; Playwright/axe rodou em Chromium. `test:e2e:real` não foi executado, pois é opt-in e não havia ambiente configurado.
- `npm audit --json --cache .npm-cache` e `npm audit --omit=dev --cache .npm-cache`: não conseguiram acessar `https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`; o serviço respondeu erro de rede. O resultado de 7 vulnerabilidades somente de desenvolvimento registrado antes desta execução permanece como referência histórica, sem auditoria online atual.

## Resultado final pós-correções — 13/10/2026

- `npm.cmd run check`: passou; executou lint, `format:check`, typecheck, cobertura e build.
- `npm.cmd run check:full`: passou e repetiu a validação completa junto ao E2E.
- `npm.cmd run test:coverage`: **171 testes em 41 arquivos passaram**. Cobertura: 95,98% statements, 94,62% branches, 96,31% functions e 97,69% lines.
- `npm.cmd run build`: passou com Vite 6.4.4.
- `npm.cmd run test:e2e`: **27 passaram, 0 falharam e 2 foram ignorados** por exigirem API real; Playwright/axe rodou em Chromium.
- `npm.cmd audit --json --cache .npm-cache`: 7 entradas (5 altas, 2 moderadas), todas em dependências de desenvolvimento. `source-map-js` 1.2.1→1.2.2 removeu uma entrada alta. Tailwind 3.4.17 e sua árvore mantêm achados sem correção compatível sem migração major; Vite foi corrigido com base em advisories upstream que não constaram no relatório npm. Detalhes em [Pendências](PENDENCIAS.md).
- O pacote `esbuild@0.25.12` declara `postinstall: node install.js`; a configuração atual tem `ignore-scripts=false` e o binário Windows está instalado. Build e E2E passaram com o binário presente. As atualizações npm foram executadas com scripts desabilitados, portanto não provocaram nova execução de `postinstall`; uma instalação limpa ainda pode depender da política de aprovação de scripts do ambiente.
- Não foi configurado ambiente de API real nem executada chamada externa de integração. `git diff --check` passou e as alterações permanecem dentro de `FrontEnd/`.

## Tentativa inicial antes das correções — 13/10/2026

- `npm.cmd ci`: a primeira tentativa no sandbox falhou com `EPERM`/`unlink` em `FrontEnd/node_modules/nwsapi/dist/lint.log`. Após a permissão elevada autorizada, concluiu e instalou 438 pacotes; o arquivo vazio preexistente foi restaurado. O npm reportou 8 vulnerabilidades (2 moderadas, 6 altas) e script `postinstall` do `esbuild` pendente de aprovação; não apliquei correções automáticas.
- `npm.cmd run check`: lint passou; `format:check` global falhou somente em sete arquivos preexistentes e intocados (`e2e/app.spec.js`, `Sidebar.jsx`/teste, `DashboardPage.jsx`/teste e `TasksPage.jsx`/teste). Os 14 arquivos modificados passam em `prettier --check` explícito.
- `npm.cmd run typecheck`: passou.
- `npm.cmd run test:coverage`: **168 testes em 41 arquivos passaram**. Cobertura: 95,89% statements, 94,45% branches, 96,26% functions e 97,63% lines.
- `npm.cmd run build`: passou com Vite 6.4.3.
- `npm.cmd run test:e2e`: **27 passaram, 0 falharam e 2 foram ignorados** (cenários que exigem API real). Os testes Playwright/axe foram executados em Chromium.
- `node --check` nos arquivos JS da camada de API e testes, e `git diff --check`: concluídos sem erros. A API real e o fluxo Agent–backend não foram exercitados.

## Preparação e comandos

Execute na pasta `FrontEnd` com as dependências do `package-lock.json` instaladas:

```powershell
cd FrontEnd
npm ci
npm run check
$env:PLAYWRIGHT_CHANNEL = 'chrome' # se usar Chrome instalado em vez do Chromium do Playwright
npm run check:full
```

`npm run check` executa lint, verificação de formatação, checagem estática dos contratos, testes com cobertura e build em sequência. `npm run check:full` acrescenta o E2E; `npm run test:e2e` executa somente o E2E. Para desenvolvimento, `npm run test:watch` mantém Vitest em observação. `npm run typecheck` usa `checkJs` no cliente e nos contratos da API, sem exigir tipagem de todas as telas JSX. `npm run test:coverage` gera cobertura V8 em texto e HTML e exige mínimos globais de 85% para statements, functions e lines, e 80% para branches. Os diretórios `shared/api`, `shared/lib`, `features/dashboard/hooks` e `features/reports/hooks` exigem, cada um, 90% para statements, functions e lines e 85% para branches; os arquivos críticos já existentes também têm esses limites individualmente. `npm run format` aplica Prettier ao código e Markdown; lockfile e artefatos gerados estão em `.prettierignore`. `git diff --check` verifica whitespace e `git status --short` confirma o escopo. `npm run dev` inicia Vite na porta 5173; os comandos do Vite usam `--configLoader runner` para compatibilidade com o Windows deste ambiente. No PowerShell com política de execução que bloqueia `npm.ps1`, use `npm.cmd` no lugar de `npm`.

`vitest.config.js` usa `jsdom`, plugin React e `src/testing/setup.js` com `@testing-library/jest-dom`; só inclui `src/**/*.test.{js,jsx}`. A cobertura configura `src/**/*.{js,jsx}` e exclui `src/testing/**`. Playwright gera o build, sobe o preview, executa os testes no Chrome/Chromium e encerra o servidor. O executor fixa `VITE_API_URL=http://localhost:8000` nos E2E simulados; com `RUN_REAL_API=1`, respeita a origem configurada. Para instalar o Chromium gerenciado pelo Playwright, execute `npx playwright install chromium`; em máquina com Chrome instalado, defina `PLAYWRIGHT_CHANNEL=chrome`. `PLAYWRIGHT_CHANNEL` pode ser removida quando o Chromium gerenciado estiver disponível.

Para executar os testes com FastAPI real, inicie a API e o banco de dados separadamente, configure `VITE_API_URL` para a origem correta, defina `RUN_REAL_API=1` e rode `npm run test:e2e:real`. Os testes não enviam POST/PUT; GET /config/ pode inicializar configurações no servidor se ainda não existirem. Eles verificam painel, CORS observado no navegador, GET de configurações, erros de página e downloads CSV/PDF reais com status, MIME e assinatura/conteúdo básico. A comparação dos valores exportados com registros conhecidos continua manual.

## Tentativa de validação desta revisão — 09/10/2026

- `npm.cmd run check`: não iniciou os estágios; o primeiro comando, ESLint, falhou porque `eslint` não está disponível/reconhecido em `FrontEnd/node_modules`.
- `npm.cmd run check:full`: parou pelo mesmo motivo no estágio ESLint de `check`; nenhum E2E iniciou.
- `npm.cmd test -- src/features/dashboard/components/AssociationCodeCard.test.jsx`: não iniciou; `vitest` não está disponível/reconhecido.
- Por consequência, lint, formatação, typecheck, testes/cobertura, build e E2E não foram executados nesta revisão. A documentação não trata resultados históricos como validação das alterações atuais.
- Integração real com API e fluxo de associação: não executados; o contrato de backend de associação não foi localizado e `RUN_REAL_API` não foi habilitado.

## Resultado da tentativa após o merge — 07/10/2026

- `npm.cmd ci`: falhou com `EPERM` ao tentar remover `node_modules/nwsapi/dist/lint.log`; o arquivo foi preservado.
- `npm.cmd install --ignore-scripts --offline --no-audit --no-fund`: não concluiu; o cache local não contém o pacote `typescript@5.9.3` (`ENOTCACHED`).
- `npm.cmd run lint`, `format:check`, `typecheck`, `test:coverage` e `build`: não iniciaram porque os executáveis ESLint, Prettier, TypeScript, Vitest e Vite não estavam disponíveis em `node_modules`.
- `npm.cmd run test:e2e`: não iniciou; o executor não encontrou `node_modules/vite/bin/vite.js`. Nenhum cenário E2E foi executado ou ignorado.
- `npm.cmd run check` e `npm.cmd run check:full`: interrompidos no primeiro estágio, `lint`, pelo mesmo executável ausente.
- Testes, arquivos e percentuais de cobertura após o merge: não disponíveis. E2E aprovados/ignorados/falhos: 0/0/0 executados; a suíte não iniciou. Integração real: não executada.

## Resultado registrado antes da incorporação da `main` — 07/10/2026

- `npm.cmd run lint`: passou.
- `npm.cmd run format:check`: falhou; Prettier reportou 100 arquivos fora do formato. Não alterei esses arquivos sem relação com esta revisão.
- `npm.cmd run typecheck`: passou.
- `npm.cmd run test:coverage`: 148 testes em 40 arquivos passaram; statements 95,52%, branches 93,82%, functions 96,13% e lines 97,59%.
- `npm.cmd run build`: passou com Vite 6.4.3.
- `npm.cmd run test:e2e`: 27 passaram e 2 cenários de API real foram ignorados pelo opt-in. Os fluxos mockados cobrem acesso sem login, navegação, responsividade e acessibilidade; não comprovam integração real.
- `npm.cmd run check`: falhou no estágio `format:check`, antes de typecheck, cobertura e build; estes estágios foram executados separadamente e passaram.
- `npm.cmd run check:full`: falhou no mesmo estágio de formatação, antes do E2E; `test:e2e` foi executado separadamente e passou.
- Integração real: não executada; não havia ambiente real configurado/autorizado e `RUN_REAL_API` não foi habilitado.

## Resultado da revisão de 05/10/2026

- `npm run lint`: passou.
- `npm run format:check`: falhou no repositório, apontando 100 arquivos sem alteração nesta revisão; Prettier direcionado aos 13 arquivos alterados passou.
- `npm run typecheck`: passou.
- `npm run test:coverage`: 148 testes em 40 arquivos passaram; statements 95,52%, branches 93,82%, functions 96,13% e lines 97,59%.
- `npm run build`: passou.
- `npm run check`: falhou no estágio de formatação pelos mesmos arquivos preexistentes; os estágios posteriores foram executados individualmente e passaram.
- `npm run test:e2e`: 27 passaram e 2 testes reais ficaram sem execução pelo opt-in já existente. O E2E comprova acesso sem login, filtros e navegação até a página informativa de Tasks; criação real de Tasks e jornada não podem ser comprovadas sem os contratos do backend.
- `git diff --check`: passou. `git status --short` mostrou somente arquivos dentro de `FrontEnd/`.

## Problemas comuns

| Sintoma                                               | Verificação e ação                                                                                                                                                                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API não responde ou telas mostram dados indisponíveis | Confira `VITE_API_URL` em `.env` (vazio usa `http://localhost:8000` em desenvolvimento e a mesma origem no build de produção), inicie FastAPI e banco e reinicie o Vite após mudar `.env`. Confira a chamada com falha na aba Rede do navegador. |
| Erro de CORS no navegador                             | Confira se o backend permite a origem exata do frontend, incluindo protocolo e porta (`http://localhost:5173` no desenvolvimento; `http://127.0.0.1:5173` no preview dos E2E). A configuração é feita no backend.                                |
| Playwright não encontra o navegador                   | Execute `npx playwright install chromium`. Se usar Chrome já instalado, defina `$env:PLAYWRIGHT_CHANNEL = 'chrome'` antes do comando de teste.                                                                                                   |
| `test:e2e:real` aparece como ignorado                 | Inicie FastAPI e banco, configure `VITE_API_URL`, defina `$env:RUN_REAL_API = '1'` e execute `npm run test:e2e:real` novamente. Sem essa variável, o teste real é ignorado de propósito.                                                         |
| Preview E2E não inicia                                | Libere a porta `5173`: o executor usa `127.0.0.1:5173` com `--strictPort`.                                                                                                                                                                       |

Os E2E regulares interceptam as respostas HTTP; para conferir API e CORS reais, use o teste opt-in e os roteiros manuais abaixo.

## Resultado automatizado registrado

| Verificação                      | Resultado                                                                                                  | O que comprova                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `npm.cmd run lint`               | **Concluído** em 05/10/2026                                                                                | ESLint no frontend                                                     |
| `npm.cmd run format:check`       | **Concluído** em 05/10/2026                                                                                | Código e documentação sob Prettier consistentes                        |
| `npm.cmd run typecheck`          | **Concluído** em 05/10/2026                                                                                | JSDoc e `checkJs` na camada de contratos da API                        |
| `npm.cmd run test:coverage`      | **150 testes em 41 arquivos passaram**; 95,68% statements, 94% branches, 96,13% functions e 97,59% lines   | Cobertura V8 acima dos mínimos globais e dos limites críticos          |
| `npm.cmd run build`              | **Concluído** em 05/10/2026 pelo Vite 6.4.3                                                                | Build de produção                                                      |
| `npm.cmd run test:e2e`           | **26 não iniciaram; 2 testes reais ignorados**                                                             | Chromium headless do Playwright não está instalado neste ambiente      |
| `npm.cmd run check`              | **Concluído** em 30/09/2026                                                                                | Executa lint, formatação, typecheck, cobertura e build em sequência    |
| `npm.cmd run test:coverage`      | **141 testes em 38 arquivos passaram**; 95,69% statements, 93,98% branches, 95,97% functions e 97,5% lines | Cobertura V8 acima dos mínimos globais e dos limites críticos          |
| `npm.cmd run typecheck`          | **Concluído** em 30/09/2026                                                                                | JSDoc e `checkJs` na camada de contratos da API                        |
| `npm.cmd run lint`               | **Concluído** em 30/09/2026                                                                                | Regras JS, React, Hooks, JSX a11y e fronteiras de camadas              |
| `npm.cmd run format:check`       | **Concluído** em 30/09/2026                                                                                | Código e documentação sob Prettier consistentes                        |
| `npm.cmd run test:e2e` no Chrome | **26 passaram; 2 testes reais ignorados sem `RUN_REAL_API`**                                               | Fluxos no navegador, estados offline/sem dados, layouts e análise WCAG |
| `npm.cmd run build`              | **Concluído** em 30/09/2026 pelo Vite 6.4.3                                                                | Imports, JSX, CSS e geração dos chunks das páginas                     |
| `git diff --check`               | **Sem erros**                                                                                              | Ausência de erros de whitespace no diff                                |
| `git status --short`             | **Somente `FrontEnd/`**                                                                                    | Escopo das alterações registradas no Git                               |
| `npm.cmd test` (issue #114)      | **148 testes em 40 arquivos passaram** em 02/10/2026                                                       | Regressão completa e novos testes do card e do Dashboard               |
| `npm.cmd run lint` (issue #114)  | **Concluído** em 02/10/2026                                                                                | ESLint no frontend                                                     |
| `prettier --check` (issue #114)  | **Concluído** em 02/10/2026 nos arquivos alterados                                                         | Formatação dos componentes, testes e documentação atualizados          |
| `npm.cmd run build` (issue #114) | **Concluído** em 02/10/2026 pelo Vite 6.4.3                                                                | Build de produção após a integração visual                             |
| `git diff --check` (issue #114)  | **Sem erros** em 02/10/2026                                                                                | Whitespace do diff da implementação                                    |

Build bem sucedido não comprova disponibilidade da API, layout em navegador ou ausência de erro no console durante uso real.

Na tentativa anterior de 05/10/2026, a auditoria de contraste no menu mobile escuro falhou para `.eyebrow` (razão 2,99:1, abaixo do mínimo 4,5:1). Outro cenário esperava “Sem leitura recente”, mas a interface renderizou “15min atrás” para o registro simulado. O contraste foi corrigido com uma cor específica para tema escuro e a expectativa do teste foi alinhada ao comportamento descrito em Funcionalidades. Na execução posterior, ambos passaram; os dois cenários reais continuaram ignorados por dependerem de `RUN_REAL_API=1`.

### Validação após correções — 05/10/2026

- `npm.cmd run test:e2e`: 26 passaram, 0 falharam e 2 foram ignorados, usando Chromium gerenciado pelo Playwright 153.0.8010.12 no Windows. O teste Axe do menu mobile escuro passou sem violações.
- `lint`, `format:check`, `typecheck`, `test:coverage`, `build` e `check`: passaram. Vitest executou 150 testes em 41 arquivos; cobertura: 95,68% statements, 94% branches, 96,13% functions e 97,59% lines.
- `git diff --check` passou; `git status --short` mostrou apenas arquivos em `FrontEnd/`.

## Inventário dos testes existentes

Nesta revisão, `src/main.test.jsx` cobre falhas de importação/inicialização e o bloqueio do modo mock fora de desenvolvimento. Os testes em `src/dev-mocks/` cobrem limpeza seletiva de Service Workers, bloqueio `501` de rotas sem mock, timeout, cancelamento, erros de HTTP/rede/JSON, filtros de data/colaborador e respostas simuladas. `src/features/dashboard/lib/attendance.test.js` cobre a formatação e a virada de dia entre UTC e `America/Sao_Paulo`; `useTasks.test.js` cobre cancelamento de gravação e resposta atrasada.

Os caminhos abaixo refletem a estrutura atual. Os testes específicos continuam próximos do código testado.

| Arquivo(s)                                                                                                            | Comportamento protegido                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/App.test.jsx`                                                                                                | Entrada direta em rotas com tema salvo, fallback de carregamento, link de salto, foco após navegação, 404 e título                                                                    |
| `src/shared/api/api.test.js`                                                                                          | Codificação do usuário, `offline` realtime aceito, erro HTTP, cancelamento, timeout, exportação, data e MIME                                                                          |
| `src/shared/api/validators.test.js`                                                                                   | Estados realtime `online`/`ausente`/`offline` aceitos e desconhecido rejeitado; demais contratos válidos e inválidos                                                                  |
| `src/shared/api/errorMessage.test.js`, `src/shared/lib/requestFailure.test.js`                                        | Mensagens seguras para erros, cancelamento, falha de contrato e rejeição por fonte                                                                                                    |
| `src/features/dashboard/hooks/useDashboardData.test.js`                                                               | Três fontes, horário de atualização, dados mantidos no refresh, falha parcial e data divergente                                                                                       |
| `src/app/hooks/useHashRoute.test.js`                                                                                  | Hash desconhecido e reação a `hashchange`                                                                                                                                             |
| `src/app/hooks/useTheme.test.js`                                                                                      | Preferência do sistema, preferência salva, alternância, classe/documento e `localStorage`                                                                                             |
| `src/features/dashboard/hooks/useAutoRefresh.test.js`                                                                 | Intervalo, desativação, pausa na aba oculta e atualização ao retornar; usado pelo painel                                                                                              |
| `src/features/dashboard/pages/DashboardPage.test.jsx`                                                                 | Loading, indicadores com `offline`/sem dados, falha de realtime, filtro e contagem de cadastrados                                                                                     |
| `src/features/dashboard/components/AssociationCodeCard.test.jsx`                                                      | Código válido e zeros iniciais; ausência, valor não string e formatos inválidos; cópia com Clipboard API disponível/indisponível e sucesso/falha; loading, erro e anúncios acessíveis |
| `src/features/collaborators/pages/CollaboratorsPage.test.jsx`                                                         | Duas fontes de dados, `offline`, sem dados, falhas parciais, lista vazia, retry e cancelamento                                                                                        |
| `src/features/dashboard/components/DashboardFilters.test.jsx`, `LastActivityTable.test.jsx`                           | Filtros, status, tempo relativo em segundos/minutos/horas, carregamento, vazio e indisponibilidade                                                                                    |
| `src/features/dashboard/components/DashboardMetrics.test.jsx`, `DashboardStatusNotice.test.jsx`                       | Indicadores com dados disponíveis/indisponíveis e aviso sobre limites dos dados do agente                                                                                             |
| `src/testing/frontendRevision.test.jsx`                                                                               | Falha parcial, resposta antiga, resumo malformado, configuração indisponível/inválida, cancelamento de gravação e exportação, erro HTTP no download                                   |
| `src/features/reports/pages/ReportsPage.test.jsx`                                                                     | Loading/vazio/retry, envio duplicado, filtros bloqueados, download iniciado, liberação da URL de objeto e arquivo vazio                                                               |
| `src/features/settings/pages/SettingsPage.test.jsx`                                                                   | Alterações pendentes, restauração, proteção de saída, edição simultânea dos campos e salvamento sem envio duplicado                                                                   |
| `src/features/reports/components/ReportFilters.test.jsx`, `ReportUsersState.test.jsx`, `ExportActions.test.jsx`       | Atalhos de filtro, usuários indisponíveis, loading, retry e feedback das ações de exportação                                                                                          |
| `src/features/reports/hooks/useReportExport.test.js`                                                                  | Exportação, prevenção de envio simultâneo, URL de objeto, sucesso, falha, arquivo vazio e cancelamento ao desmontar                                                                   |
| `src/features/auth/pages/AuthPage.test.jsx`, `src/features/tasks/pages/TasksPage.test.jsx`                            | Cadastro/login e sessão do gestor; prévia Tasks em produção e CRUD de demonstração, validação, atribuições, busca, ordenação, confirmação de exclusão e erros.                        |
| `src/features/tasks/hooks/useTasks.test.js`, `src/features/tasks/lib/taskList.test.js`                                | Lista/colaboradores, operações CRUD, concorrência, falhas/cancelamento, busca por título/descrição e ordenação.                                                                       |
| `src/features/tasks/components/TaskForm.jsx`, `TaskList.jsx`                                                          | Componentes de formulário e lista exercitados pela suíte TasksPage: entradas acessíveis, seleção múltipla, estados e confirmação antes de excluir.                                    |
| `src/features/dashboard/hooks/useTaskAnalytics.test.js`, `src/features/dashboard/components/TaskSummaryCard.test.jsx` | Filtro de Task isolado dos indicadores, consulta demonstrativa, estados vazios/erro/carregamento e rótulo de colaborador.                                                             |
| `src/app/layout/Sidebar.test.jsx`                                                                                     | Navegação, rota ativa, diálogo móvel, Tab, Escape, foco, histórico, rolagem e mudança para desktop                                                                                    |
| `src/app/ErrorBoundary.test.jsx`                                                                                      | Mensagem segura após exceção e ausência de log de payload em produção                                                                                                                 |
| `src/app/PageErrorBoundary.test.jsx`                                                                                  | Isolamento da falha e nova tentativa na página                                                                                                                                        |
| `src/features/dashboard/components/CategorySummary.test.jsx`                                                          | Duração e percentual de categoria com dados do resumo                                                                                                                                 |
| `src/features/reports/lib/exportFilename.test.js`                                                                     | Nome seguro do download com filtro de usuário                                                                                                                                         |
| `src/shared/components/MetricCard.test.jsx`, `PageHeader.test.jsx`, `IntegrationNotice.test.jsx`                      | Indicadores, título/descrição/ações do cabeçalho e conteúdo dos avisos de integração                                                                                                  |
| `src/shared/components/AsyncFeedback.test.jsx`, `ActivityStatusBadge.test.jsx`                                        | Anúncios, retry, toast temporário, skeletons e rótulos de status                                                                                                                      |
| `src/shared/lib/team.test.js`, `src/features/dashboard/lib/summary.test.js`                                           | União e filtros da equipe, contagens de status e agregação de categorias                                                                                                              |
| `src/shared/lib/routeLeaveGuard.test.js`, `activityStatus.test.js`                                                    | Registro/remoção da proteção de saída e rótulos de status da atividade                                                                                                                |
| `src/testing/architecture.test.js`                                                                                    | Imports válidos e violações de camadas em imports, reexports e imports dinâmicos                                                                                                      |

Playwright cobre também a resposta realtime com `offline` e o usuário sem entrada (sem rejeição da API), além de retry de Colaboradores, Configurações, CSV/PDF, layouts responsivos, menu móvel e erros. Os dois testes de FastAPI real são opt-in e dependem do ambiente descrito em [Pendências](PENDENCIAS.md).

## Cenários críticos a manter em futuras mudanças

- Diferenciar **lista vazia válida** de falha/JSON inválido em cada fonte.
- Impedir que resposta de consulta anterior ou de outra data substitua o filtro atual.
- Impedir que uma falha de realtime apareça como zero de usuários online.
- Aceitar `online`, `ausente` e `offline` no realtime, rejeitar estados desconhecidos e distinguir `offline` informado pela API de usuário sem entrada realtime.
- Cancelar solicitações quando filtros mudam ou a página sai de cena; encerrar timeout e listeners.
- Validar inteiros positivos antes de gravar configurações e não anunciar sucesso quando a resposta for inválida.
- Não baixar HTML, arquivo vazio ou resposta HTTP de erro como CSV/PDF.
- Garantir navegação por teclado, foco no conteúdo após troca de rota, foco restaurado no menu móvel, rota 404 e tema na entrada direta.
- Continuar sem testes que pressupõem login ou tasks funcionais antes de existir contrato real.

## Validação manual pendente

Os itens abaixo **não foram comprovados** pelos testes automatizados. Executar em navegador com backend disponível e também com API indisponível. As áreas de jornada, relatórios e Dashboard se relacionam com [CA-06](../../requisitos/requisitos/ca.md#ca-06--jornada-e-inatividade), [CA-07](../../requisitos/requisitos/ca.md#ca-07--consulta-relatórios-e-exportação) e [CA-10](../../requisitos/requisitos/ca.md#ca-10--dashboard-analítico); teclado e telas menores são tratados em [Responsividade](../../requisitos/responsividade.md#6-critérios). Esses critérios descrevem o produto alvo e continuam sem aceite automático por causa dos contratos ausentes:

| Área                   | Verificação manual                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navegação              | Acesso direto por hash, voltar/avançar, 404, título da aba, carregamento de chunks e link de salto                                                            |
| Teclado/leitor de tela | Ordem de Tab, foco visível, Escape no menu, anúncio de erros/loading, leitura dos cabeçalhos e `caption` de tabelas                                           |
| Responsividade         | Inspecionar dispositivos reais e zoom nativo de 200%; Playwright já verificou 375×667, 390×844, 768×1024, 1366×768 e 1920×1080, além de ampliação CSS de 200% |
| Dados                  | Resumo com e sem registros, filtro de usuário, falha isolada de uma fonte, retry de Colaboradores, refresh do painel e mudança de data                        |
| Configurações          | Leitura, valores inválidos, salvamento, erro 4xx/5xx, queda de rede e saída durante operação                                                                  |
| Exportação             | CSV/PDF reais, nome e conteúdo do arquivo, falha/timeout, ausência de usuários e cancelamento ao sair                                                         |
| Console e rede         | Exceções de renderização, rejeições não tratadas, requests inesperados e mensagens de CORS                                                                    |

### Roteiros para fluxos críticos

Estes roteiros ainda **precisam ser executados manualmente** no ambiente alvo. Registre navegador, data, resultado e eventuais erros de Console/Rede ao executá-los. Use dados de teste e não altere configurações de produção.

#### Saída com alterações não salvas

**Pré-condições:** frontend e backend em execução; `GET /config/` responde com os dois valores globais.

1. Abra `#/configuracoes` e aguarde os campos aparecerem.
2. Altere **Intervalo de captura (segundos)** para outro inteiro positivo, sem salvar.
3. Confirme que aparece **Alterações não salvas** e clique em **Painel**.
4. Cancele o diálogo de saída; confirme que a página e o valor editado permanecem.
5. Clique novamente em **Painel** e confirme a saída.

**Resultado esperado:** o diálogo pergunta se deseja sair sem salvar; cancelar mantém Configurações e confirmar abre o Painel. Ao reabrir Configurações, o valor original continua salvo. Confira também **Restaurar**: ele deve repor o valor e remover o aviso sem gravar.

#### Falha isolada da atividade no Painel

**Pré-condições:** `GET /users/` e `GET /dashboard/summary` respondem; há pelo menos um usuário cadastrado. No navegador, bloqueie temporariamente apenas a requisição `/activities/realtime` pela ferramenta de rede.

1. Abra `#/painel` ou clique em **Atualizar** depois de ativar o bloqueio.
2. Aguarde o fim da consulta e observe o alerta, os indicadores e **Última atividade**.
3. Remova o bloqueio e clique em **Tentar novamente** no alerta, ou em **Atualizar**.

**Resultado esperado:** o alerta identifica a falha de **Atividade**; **Online**, **Ausentes** e **Offline (API)** mostram `—`, e a última atividade fica indisponível. **Usuários cadastrados** e **Tempo registrado** continuam usando suas fontes disponíveis. Após a nova consulta, os dados de atividade voltam se a API responder. Falha de realtime não deve aparecer como zero pessoas online.

#### Exportação com dados reais

**Pré-condições:** backend e banco em execução; data com registros conhecidos; navegador permite downloads. Este roteiro não é coberto pelo E2E simulado.

1. Abra `#/relatorios`, escolha a data conhecida e, se necessário, um usuário.
2. Clique em **Exportar CSV** e aguarde o aviso de download iniciado.
3. Abra o arquivo: confira nome, codificação, colunas `username,category,total_seconds` e valores contra a resposta real da API.
4. Clique em **Exportar PDF**; abra o arquivo e confira data, usuário, total e categorias contra a mesma fonte.
5. Na aba Rede, confira status 200 e tipos `text/csv` e `application/pdf` nas respectivas respostas.

**Resultado esperado:** cada ação produz um arquivo não vazio do formato escolhido, referente aos filtros selecionados. O aviso na tela significa apenas que o download começou; confirme o conteúdo no arquivo aberto.

#### Menu móvel por teclado e leitor de tela

**Pré-condições:** navegador em largura menor que `1024px`; leitor de tela disponível para a segunda parte.

1. Com Tab, foque **Abrir menu** e ative com Enter ou Espaço.
2. Percorra os links com Tab e Shift+Tab; use Escape para fechar.
3. Abra novamente, escolha **Relatórios** e observe o foco após a navegação.
4. Repita com leitor de tela, verificando nome do diálogo, rota ativa e anúncio dos títulos e erros.

**Resultado esperado:** o foco permanece no diálogo aberto; Escape devolve o foco a **Abrir menu**; a navegação fecha o menu e leva o foco ao conteúdo principal da nova página. O leitor de tela deve anunciar os controles e mensagens sem depender apenas de cor.

Vitest usa mocks de `fetch` e jsdom. Playwright usa Chrome com respostas HTTP simuladas e downloads reais do navegador, mas não valida banco, autorização, CORS de implantação nem conteúdo produzido pelo FastAPI. axe-core detecta apenas parte dos problemas de acessibilidade; leitor de tela e inspeção humana continuam necessários. O `typecheck` cobre a camada de contratos da API e seus imports, não todo o código JavaScript/JSX.

## Cobertura adicional confirmada em 26/09/2026

- `src/features/settings/pages/SettingsPage.test.jsx`: sucesso, dois submits no mesmo evento, bloqueio/liberação de campos, falha de rede, limpeza de erro e nova tentativa.
- `src/shared/api/api.test.js`: sinal já cancelado sem rede, cancelamento após leitura iniciada, distinção de timeout externo/interno e MIME com sufixo inválido.
- `src/shared/api/validators.test.js`: textos malformados, identidades duplicadas, duração negativa/fracionária, data inexistente e duração acima da precisão segura.
- `src/features/dashboard/hooks/useDashboardData.test.js`: resumo de outro usuário e horário sem dados após falha de todas as fontes.
- `src/features/dashboard/pages/DashboardPage.test.jsx`: usuário selecionado continua visível sem lista disponível.
- `src/app/hooks/useTheme.test.js`: leitura e gravação bloqueadas no localStorage não impedem a alternância.
- `e2e/app.spec.js` e `e2e/accessibility.spec.js`: anúncio do download, orientação horizontal de 667×320 px, menu/erros de exportação no escuro com axe-core sem violações detectadas.

O healthcheck da API em `http://localhost:8000/` não respondeu. O teste real permaneceu ignorado; nenhuma inicialização de backend, seed ou banco foi feita. Os dados simulados existem exclusivamente nas suites de teste. As falhas iniciais de data fixa, contraste e formatação foram corrigidas, sem remover as verificações.

## Validação da refatoração da estrutura — 26/09/2026

Após a reorganização em `app/`, `features/`, `shared/` e `testing/`:

- `npm.cmd test`: 103 testes passaram em 22 arquivos, incluindo os componentes preservados.
- `npm.cmd run lint` e `npm.cmd run format:check`: passaram.
- `npm.cmd run test:e2e` com `PLAYWRIGHT_CHANNEL=chrome`: build de produção concluído, 22 cenários passaram e 1 teste de API real foi ignorado sem `RUN_REAL_API`.
- `git diff --check`: sem erros; alterações restritas a `FrontEnd/`.

Os fluxos de navegação e imports dinâmicos, filtros, configurações, downloads, tema, menu móvel, responsividade e acessibilidade automatizada passaram com os novos caminhos. O teste opt-in com API real não foi executado nesta refatoração.

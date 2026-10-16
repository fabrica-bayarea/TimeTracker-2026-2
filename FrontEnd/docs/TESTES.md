# Testes e validação do frontend

Este guia distingue verificação automatizada, build e verificações manuais ainda pendentes. Há validações registradas em **05/10/2026**, **07/10/2026**, **09/10/2026**, **13/10/2026** e **16/10/2026**. Resultados anteriores permanecem identificados pela data e pelo estado do código em que foram obtidos. O inventário completo das alterações está em [Alterações](ALTERACOES.md).

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

| Sintoma                                               | Verificação e ação                                                                                                                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API não responde ou telas mostram dados indisponíveis | Confira `VITE_API_URL` em `.env` (padrão `http://localhost:8000`), inicie FastAPI e banco e reinicie o Vite após mudar `.env`. Confira a chamada com falha na aba Rede do navegador.                              |
| Erro de CORS no navegador                             | Confira se o backend permite a origem exata do frontend, incluindo protocolo e porta (`http://localhost:5173` no desenvolvimento; `http://127.0.0.1:5173` no preview dos E2E). A configuração é feita no backend. |
| Playwright não encontra o navegador                   | Execute `npx playwright install chromium`. Se usar Chrome já instalado, defina `$env:PLAYWRIGHT_CHANNEL = 'chrome'` antes do comando de teste.                                                                    |
| `test:e2e:real` aparece como ignorado                 | Inicie FastAPI e banco, configure `VITE_API_URL`, defina `$env:RUN_REAL_API = '1'` e execute `npm run test:e2e:real` novamente. Sem essa variável, o teste real é ignorado de propósito.                          |
| Preview E2E não inicia                                | Libere a porta `5173`: o executor usa `127.0.0.1:5173` com `--strictPort`.                                                                                                                                        |

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

| Arquivo(s)                                                                                                      | Comportamento protegido                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/App.test.jsx`                                                                                          | Entrada direta em rotas com tema salvo, fallback de carregamento, link de salto, foco após navegação, 404 e título                                                                    |
| `src/shared/api/api.test.js`                                                                                    | Codificação do usuário, `offline` realtime aceito, erro HTTP, cancelamento, timeout, exportação, data e MIME                                                                          |
| `src/shared/api/validators.test.js`                                                                             | Estados realtime `online`/`ausente`/`offline` aceitos e desconhecido rejeitado; demais contratos válidos e inválidos                                                                  |
| `src/shared/api/errorMessage.test.js`, `src/shared/lib/requestFailure.test.js`                                  | Mensagens seguras para erros, cancelamento, falha de contrato e rejeição por fonte                                                                                                    |
| `src/features/dashboard/hooks/useDashboardData.test.js`                                                         | Três fontes, horário de atualização, dados mantidos no refresh, falha parcial e data divergente                                                                                       |
| `src/app/hooks/useHashRoute.test.js`                                                                            | Hash desconhecido e reação a `hashchange`                                                                                                                                             |
| `src/app/hooks/useTheme.test.js`                                                                                | Preferência do sistema, preferência salva, alternância, classe/documento e `localStorage`                                                                                             |
| `src/features/dashboard/hooks/useAutoRefresh.test.js`                                                           | Intervalo, desativação, pausa na aba oculta e atualização ao retornar; usado pelo painel                                                                                              |
| `src/features/dashboard/pages/DashboardPage.test.jsx`                                                           | Loading, indicadores com `offline`/sem dados, falha de realtime, filtro e contagem de cadastrados                                                                                     |
| `src/features/dashboard/components/AssociationCodeCard.test.jsx`                                                | Código válido e zeros iniciais; ausência, valor não string e formatos inválidos; cópia com Clipboard API disponível/indisponível e sucesso/falha; loading, erro e anúncios acessíveis |
| `src/features/collaborators/pages/CollaboratorsPage.test.jsx`                                                   | Duas fontes de dados, `offline`, sem dados, falhas parciais, lista vazia, retry e cancelamento                                                                                        |
| `src/features/dashboard/components/DashboardFilters.test.jsx`, `LastActivityTable.test.jsx`                     | Filtros, status, tempo relativo em segundos/minutos/horas, carregamento, vazio e indisponibilidade                                                                                    |
| `src/features/dashboard/components/DashboardMetrics.test.jsx`, `DashboardStatusNotice.test.jsx`                 | Indicadores com dados disponíveis/indisponíveis e aviso sobre limites dos dados do agente                                                                                             |
| `src/testing/frontendRevision.test.jsx`                                                                         | Falha parcial, resposta antiga, resumo malformado, configuração indisponível/inválida, cancelamento de gravação e exportação, erro HTTP no download                                   |
| `src/features/reports/pages/ReportsPage.test.jsx`                                                               | Loading/vazio/retry, envio duplicado, filtros bloqueados, download iniciado, liberação da URL de objeto e arquivo vazio                                                               |
| `src/features/settings/pages/SettingsPage.test.jsx`                                                             | Alterações pendentes, restauração, proteção de saída, edição simultânea dos campos e salvamento sem envio duplicado                                                                   |
| `src/features/reports/components/ReportFilters.test.jsx`, `ReportUsersState.test.jsx`, `ExportActions.test.jsx` | Atalhos de filtro, usuários indisponíveis, loading, retry e feedback das ações de exportação                                                                                          |
| `src/features/reports/hooks/useReportExport.test.js`                                                            | Exportação, prevenção de envio simultâneo, URL de objeto, sucesso, falha, arquivo vazio e cancelamento ao desmontar                                                                   |
| `src/features/auth/pages/AuthPage.test.jsx`, `src/features/tasks/pages/TasksPage.test.jsx`                      | Auth permanece informativa; Tasks cobre indisponibilidade do Backend e demonstração simulada quando os mocks de desenvolvimento são fornecidos.                                       |
| `src/app/layout/Sidebar.test.jsx`                                                                               | Navegação, rota ativa, diálogo móvel, Tab, Escape, foco, histórico, rolagem e mudança para desktop                                                                                    |
| `src/app/ErrorBoundary.test.jsx`                                                                                | Mensagem segura após exceção e ausência de log de payload em produção                                                                                                                 |
| `src/app/PageErrorBoundary.test.jsx`                                                                            | Isolamento da falha e nova tentativa na página                                                                                                                                        |
| `src/features/dashboard/components/CategorySummary.test.jsx`                                                    | Duração e percentual de categoria com dados do resumo                                                                                                                                 |
| `src/features/reports/lib/exportFilename.test.js`                                                               | Nome seguro do download com filtro de usuário                                                                                                                                         |
| `src/shared/components/MetricCard.test.jsx`, `PageHeader.test.jsx`, `IntegrationNotice.test.jsx`                | Indicadores, título/descrição/ações do cabeçalho e conteúdo dos avisos de integração                                                                                                  |
| `src/shared/components/AsyncFeedback.test.jsx`, `ActivityStatusBadge.test.jsx`                                  | Anúncios, retry, toast temporário, skeletons e rótulos de status                                                                                                                      |
| `src/shared/lib/team.test.js`, `src/features/dashboard/lib/summary.test.js`                                     | União e filtros da equipe, contagens de status e agregação de categorias                                                                                                              |
| `src/shared/lib/routeLeaveGuard.test.js`, `activityStatus.test.js`                                              | Registro/remoção da proteção de saída e rótulos de status da atividade                                                                                                                |
| `src/testing/architecture.test.js`                                                                              | Imports válidos e violações de camadas em imports, reexports e imports dinâmicos                                                                                                      |

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

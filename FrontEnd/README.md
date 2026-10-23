# TimeTrack — Frontend

Frontend do **TimeTrack**, responsável pela interface web do dashboard. A aplicação consulta os dados disponíveis na API FastAPI e utiliza navegação por hash, sem React Router. Atualmente, não possui manifest nem service worker e não é instalável como PWA.

> **Estado em 22/10:** cadastro, login JWT, validação de sessão e proteção do Dashboard estão integrados. O card de associação aparece somente para o gestor autenticado e informa que a consulta está pendente; não apresenta código fictício. Este checkout do Backend não declara `association_code` em `GET /auth/me` nem rota de consulta autenticada. O Frontend não gera código e não chama uma rota presumida; a integração de produção aguarda contrato do Backend. `POST /associate/`, persistência e isolamento da associação também não foram encontrados. A consulta de entrada/último registro e a criação persistente de Tasks aguardam contratos reais. Consulte [Pendências](docs/PENDENCIAS.md).

O realtime apresenta os estados `online`, `ausente` e `offline` recebidos da API; usuários sem entrada realtime são identificados como “Sem dados”. Consulte [Arquitetura](docs/ARQUITETURA.md) e [Funcionalidades](docs/FUNCIONALIDADES.md) para a semântica e os limites desses estados.

## Tecnologias e recursos

### Runtime e aplicação

- **React 18.2.0** — biblioteca principal para construção da interface.
- **React DOM 18.2.0** — renderização da aplicação no navegador.
- **JavaScript + JSX** — linguagem e sintaxe dos componentes.
- **Vite 6.4.3** — servidor de desenvolvimento e processo de build.
- **Hash routing próprio** — navegação entre telas sem dependência de React Router.
- **React.lazy/Suspense** — carregamento sob demanda das páginas.

### Interface e visual

- **Tailwind CSS 3.4.17** — classes utilitárias e composição visual.
- **CSS global (`src/app/styles/index.css`)** — tokens de cor, componentes compartilhados, estados de foco, responsividade e suporte a movimento reduzido.
- **PostCSS 8.5.28** — processamento do CSS.
- **Autoprefixer 10.4.16** — compatibilidade de propriedades CSS.

### Recursos do navegador

- **Fetch API** — chamadas HTTP encapsuladas em `src/shared/api/api.js`.
- **AbortController** — cancelamento de consultas quando filtros mudam ou páginas são desmontadas.
- **URLSearchParams** — montagem segura de parâmetros da API.
- **localStorage e `prefers-color-scheme`** — persistência e detecção da preferência de tema.
- **Blob e URL de objeto** — download dos relatórios CSV e PDF devolvidos pela API.
- **Hash da URL (`location.hash`)** — navegação interna, implementada em `src/app/hooks/useHashRoute.js`.

Não há React Router, biblioteca de formulários, biblioteca de ícones ou gerenciador externo de estado. O estado das telas é mantido com os hooks do React; os ícones usados são SVG inline.

### Qualidade e testes

- **Vitest 4.1.11** — testes unitários e de componentes.
- **@vitest/coverage-v8 4.1.11** — geração de cobertura para Vitest usando V8.
- **React Testing Library 16.3.0** — renderização e testes de comportamento da interface.
- **@testing-library/jest-dom 6.8.0** — matchers para DOM.
- **@testing-library/user-event 14.6.1** — simulação de interações do usuário.
- **jsdom 26.1.0** — ambiente de navegador para os testes.
- **Playwright 1.63.0** — testes end-to-end.
- **@axe-core/playwright 4.13.0** — validações automatizadas de acessibilidade.
- **@vitejs/plugin-react 4.7.0** — integração de React e JSX com Vite.
- **ESLint 9.39.5** — análise estática do código.
- **TypeScript 5.9.3** — `checkJs` dos contratos da API, mantendo o código em JavaScript.
- **@eslint/js e globals** — regras base e globais de ambiente para a configuração flat do ESLint.
- **eslint-plugin-react, eslint-plugin-react-hooks e eslint-plugin-jsx-a11y** — regras específicas para React, hooks e acessibilidade.
- **Prettier 3.9.9** — formatação padronizada.

## Organização

A estrutura separa a composição da aplicação, as funcionalidades e os recursos compartilhados:

```text
FrontEnd/
├── docs/                 # Documentação específica do frontend
├── e2e/                  # Testes end-to-end
├── src/
│   ├── app/              # App, ErrorBoundary, navegação, tema e estilos
│   │   ├── hooks/
│   │   ├── layout/
│   │   └── styles/
│   ├── features/         # Páginas e lógica de cada funcionalidade
│   │   ├── auth/pages/
│   │   ├── collaborators/ # pages/, hooks/ e components/
│   │   ├── dashboard/    # pages/, hooks/, components/ e lib/ do painel
│   │   ├── reports/      # pages/, hooks/, components/ e lib/
│   │   ├── settings/     # pages/, hooks/ e components/
│   │   └── tasks/pages/
│   ├── shared/           # Recursos usados por diferentes funcionalidades
│   │   ├── api/
│   │   ├── components/
│   │   └── lib/
│   ├── testing/          # Setup e testes transversais
│   └── main.jsx          # Entrada do React
├── .env.example
├── index.html
├── package.json
├── package-lock.json     # Lockfile para instalação reproduzível com npm ci
├── vite.config.js
├── vitest.config.js
├── playwright.config.js
├── tailwind.config.js
├── postcss.config.js
└── eslint.config.js
```

Testes específicos de componentes permanecem próximos ao código que validam. O teste transversal de revisão do frontend fica em `src/testing/`. Arquivos gerados por build, cobertura e Playwright (`dist/`, `coverage/`, `test-output/` e `test-results/`) são saídas locais e estão no `.gitignore`; não fazem parte da árvore de código-fonte.

Uma nova tela entra em `features/<funcionalidade>/pages/`; hooks e componentes exclusivos ficam na mesma funcionalidade. Recursos reutilizados por várias telas entram em `shared/`. `app/routes.js` reúne os metadados e os componentes das rotas. A validação de respostas fica em `shared/api/validators.js`. Consulte [Arquitetura](docs/ARQUITETURA.md) para as regras de dependência.

## Executar

```powershell
cd FrontEnd
npm ci
Copy-Item .env.example .env
npm run dev
```

`VITE_API_URL` define a origem da API. Se estiver vazia, o desenvolvimento usa `http://localhost:8000` e o build de produção usa a mesma origem do Frontend, adequada a um proxy reverso. Quando a API estiver em outra origem, configure a URL no ambiente de build; em páginas HTTPS, essa origem também deve usar HTTPS. A API precisa permitir a origem do Frontend em CORS quando forem origens distintas.

## Validar

```powershell
npm run check
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run check:full
```

`check` executa lint, verificação de formatação, checagem estática dos contratos JavaScript, testes com os mínimos de cobertura e build. `check:full` também executa o E2E no navegador; ele pode ser usado antes de PR ou release. Para rodar só o E2E, use `npm run test:e2e`. No PowerShell com política de execução que bloqueia `npm.ps1`, use `npm.cmd` no lugar de `npm`.

Para usar o Chromium gerenciado pelo Playwright:

```powershell
npx playwright install chromium
```

Um teste separado consulta a API real. Inicie a API e o banco, defina `RUN_REAL_API=1` e execute `npm run test:e2e:real`. Consulte [Testes](docs/TESTES.md) para os detalhes.

## Documentação

- [Índice da documentação](docs/README.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Contratos da API](docs/CONTRATOS_API.md)
- [Funcionalidades](docs/FUNCIONALIDADES.md)
- [Testes](docs/TESTES.md)
- [Histórico de alterações](docs/ALTERACOES.md)
- [Pendências](docs/PENDENCIAS.md)

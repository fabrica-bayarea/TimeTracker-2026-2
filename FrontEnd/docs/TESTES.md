# Guia de Testes Automatizados — TimeTrack Frontend

Este documento descreve a arquitetura, convenções, execução e boas práticas para testes automatizados no frontend do TimeTrack.

---

## 1. Tecnologias e Configuração

O projeto adota uma pilha moderna e ultra rápida para testes:

| Ferramenta | Papel |
| --- | --- |
| **Vitest** (`3.2.x`) | Test runner nativo compatível com Vite e ESM. |
| **React Testing Library** (`16.x`) | Testes de integração de componentes focados em comportamento do usuário e acessibilidade. |
| **@testing-library/jest-dom** (`6.x`) | Matchers customizados para asserções no DOM (ex: `toBeInTheDocument`, `toBeDisabled`, `toHaveAttribute`). |
| **jsdom** (`26.x`) | Emulação do ambiente de navegador para execução rápida em linha de comando. |
| **@vitest/coverage-v8** | Cobertura nativa com relatório textual e HTML. |

O arquivo de configuração principal é [vitest.config.js](../vitest.config.js) e o setup global está em `src/test/setup.js`.

---

## 2. Como Executar os Testes

Execute os comandos a partir da raiz do frontend (`FrontEnd/`):

```powershell
# Execução única de todos os testes
npm.cmd test

# Modo contínuo (reexecuta automaticamente ao salvar arquivos)
npm.cmd run test:watch

# Análise de cobertura de código
npm.cmd run test:coverage
```

---

## 3. Estrutura e Localização dos Testes

Os arquivos de teste ficam posicionados **junto ao código de origem** (co-location), garantindo visibilidade imediata de quais módulos possuem testes:

```text
src/
├── components/
│   ├── Card.jsx
│   ├── Card.test.jsx           # Testes unitários do Card
│   ├── Header.jsx
│   ├── Header.test.jsx         # Testes de filtros, tema e status da API
│   ├── MetricCard.jsx
│   ├── MetricCard.test.jsx     # Testes de exibição de métricas
│   ├── PeopleCard.jsx
│   ├── PeopleCard.test.jsx     # Testes da tabela da equipe e estados vazios
│   ├── ReportsAndAgent.jsx
│   ├── ReportsAndAgent.test.jsx# Testes de exportação CSV/PDF e auto-refresh
│   ├── SectionHeading.jsx
│   ├── SectionHeading.test.jsx # Testes do cabeçalho de seção
│   ├── Sidebar.jsx
│   └── Sidebar.test.jsx        # Testes de navegação e seção ativa
├── hooks/
│   ├── useTheme.js
│   └── useTheme.test.js        # Testes de persistência e detecção de tema
├── services/
│   ├── api.js
│   └── api.test.js             # Testes de cálculo de datas e URLs de exportação
└── utils/
    ├── dashboard.js
    ├── dashboard.test.js       # Testes de formatação de duração e produtividade
    ├── report.js
    └── report.test.js          # Testes de escape e formatação CSV
```

---

## 4. Padrões e Boas Práticas

### A. Consultas Baseadas em Acessibilidade
Priorize seletores que simulam como o usuário real ou tecnologias assistivas interagem com a tela:
1. `screen.getByRole("button", { name: "..." })`
2. `screen.getByRole("heading", { level: 1, name: "..." })`
3. `screen.getByRole("combobox", { name: "..." })`
4. `screen.getByLabelText("...")`
5. `screen.getByText("...")`

Evite selecionar por seletores CSS frágeis como classes ou IDs de teste a menos que estritamente necessário.

### B. Mocks de Recursos do Navegador

- **`window.matchMedia`:** Emulado com `vi.fn()` para testar preferências de tema (`prefers-color-scheme`).
- **`localStorage`:** Limpo em `beforeEach(() => localStorage.clear())`.
- **`IntersectionObserver`:** Emulado caso teste componentes que dependem de visibilidade na viewport.
- **`URL.createObjectURL`:** Mockado para validar downloads no navegador sem gerar erros de navegação no jsdom.

### C. Testando Estados Vazios e Casos Limite
Sempre inclua testes para:
- Dados ausentes (`null`, `undefined`, listas vazias `[]`).
- Valores numéricos extremos (`0`, números negativos, tempos longos).
- Simulação de erros de conexão e modos de demonstração.


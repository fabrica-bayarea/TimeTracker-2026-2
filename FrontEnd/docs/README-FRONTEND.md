# TimeTracker Dashboard - Frontend

## Atualização do dashboard — setembro de 2026

O frontend foi aprimorado sem qualquer alteração no backend ou no contrato da API.

- A data inicial do filtro agora é o dia atual no fuso horário local, e datas futuras não podem ser selecionadas.
- Há atualização manual no cabeçalho e atualização automática, configurada inicialmente para cada 30 segundos.
- A atualização automática pode ser ativada ou desativada na seção **Atualização do painel**.
- Durante uma nova consulta, o último resultado da mesma data permanece visível. Se a API falhar após uma carga bem-sucedida, esse resultado é preservado e o painel informa a indisponibilidade.
- Para uma nova data, resultados de uma data anterior não são apresentados como se fossem atuais.
- A tabela de equipe e o gráfico de categorias passaram a exibir estados vazios quando a API responde sem registros; dados demonstrativos só são usados quando não há dados da API disponíveis.
- A exportação CSV usa a atividade exibida no painel e nomeia o arquivo com a data selecionada. A opção de PDF abre a impressão do navegador, que permite salvar o documento como PDF.
- O controle que simulava pausar o agente foi removido, pois o frontend não possui endpoint para controlar o agente. Ele foi substituído pelo controle real de atualização automática da interface.

O build de produção foi validado com `npm.cmd run build`.

Dashboard de rastreamento de tempo para equipes, construído com React e Tailwind CSS.

## 🚀 Quick Start

### Pré-requisitos
- Node.js 16+ ou superior
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── index.js        # Exports centralizados
│   ├── Card.jsx        # Wrapper para cards padrão
│   ├── SectionHeading.jsx
│   ├── Sidebar.jsx     # Barra de navegação lateral
│   ├── Header.jsx      # Cabeçalho com filtros
│   ├── MetricCard.jsx  # Cards de métricas
│   ├── ActivityChart.jsx
│   ├── CategoryChart.jsx
│   ├── AppsCard.jsx
│   ├── TimelineCard.jsx
│   ├── PeopleCard.jsx  # Tabela de colaboradores
│   └── ReportsAndAgent.jsx
├── data/
│   └── dashboardData.js # Dados centralizados
├── hooks/
│   └── useDashboard.js  # Hooks customizados
│   ├── useTheme()      # Gerencia tema escuro/claro
│   └── useActiveSection() # Rastreia seção visível
├── utils/
│   └── report.js        # Funções para exportação
├── App.jsx             # Componente principal
├── main.jsx            # Entry point
├── index.css           # Estilos globais
└── ../docs/STYLES.md   # Documentação de estilos
```

## 🎨 Temas e Estilos

### Sistema de Design

- **Framework CSS**: Tailwind CSS 3.4.17
- **Ícones**: Emojis/Unicode
- **Fonts**: DM Sans (corpo) + Manrope (títulos)
- **Cores**: Sistema de cores customizadas (ver `tailwind.config.js`)

### Tema Escuro

O aplicativo suporta tema claro/escuro:

```javascript
import { useTheme } from './hooks/useDashboard';

function MeuComponente() {
  const [dark, toggleTheme] = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {dark ? '☀' : '☾'}
    </button>
  );
}
```

A preferência é persistida no localStorage.

## 🔧 Configurações

### Vite (`vite.config.js`)

- Servidor dev na porta 5173
- Build otimizado com chunks separados
- Source maps desabilitados em produção
- Console removido em produção

### Tailwind (`tailwind.config.js`)

- Dark mode com classe e atributo `data-theme`
- Cores customizadas (ink, muted, line, brand)
- Animações personalizadas (fade-in, slide-in)
- Extensões de sombras (soft, medium, lg)

## 📊 Componentes Principais

### Card
Wrapper padrão com estilos pré-aplicados.

```jsx
<Card id="meu-card" className="lg:col-span-2">
  Conteúdo
</Card>
```

### SectionHeading
Título + descrição + ação para seções.

```jsx
<SectionHeading
  title="Título"
  description="Descrição"
  action={<button>Ação</button>}
/>
```

### MetricCard
Exibe uma métrica com ícone e valor.

```jsx
<MetricCard
  icon="◷"
  tone="bg-violet-100 text-violet-600"
  label="Tempo monitorado"
  value="6h 42min"
  detail="↑ 12% vs. ontem"
  positive
/>
```

### Gráficos
- **ActivityChart**: Gráfico de barras (Recharts)
- **CategoryChart**: Gráfico de pizza (Recharts)
- **TimelineCard**: Timeline visual
- **AppsCard**: Lista de apps com barras

### Dados
**PeopleCard** exibe tabela com colaboradores:

```javascript
[
  name,        // "Ana Carolina"
  initials,    // "AC"
  machine,     // "DESK-AC-01"
  app,         // "VS Code"
  window,      // "feature/dashboard.razor"
  category,    // "Desenvolvimento"
  status,      // "Online"
  time,        // "há 12s"
  avatar,      // "bg-rose-300"
]
```

## 🛠️ Hooks

### `useTheme()`
Gerencia tema escuro/claro com persistência.

```javascript
const [dark, toggleTheme] = useTheme();
```

### `useActiveSection()`
Rastreia qual seção está visível (usa Intersection Observer).

```javascript
const activeSection = useActiveSection();
```

## 📤 Exportação de Dados

### CSV
```javascript
import { createDailyReport, convertRowsToCsv, downloadTextFile } from './utils/report';

const report = createDailyReport(people);
const csv = convertRowsToCsv(report);
downloadTextFile(csv, 'relatorio.csv', 'text/csv;charset=utf-8');
```

### Funções Auxiliares
- `formatTime(minutes)` - Formata minutos para "Xh XXmin"
- `calculatePercentage(value, total)` - Calcula e formata %

## 🔄 State Management

O aplicativo usa apenas React Hooks para state local:
- `useState()` para state local
- `useEffect()` para side effects
- Custom hooks para lógica reutilizável

Para aplicações maiores, considere:
- **Zustand** - State management leve
- **TanStack Query** - Data fetching
- **Context API** - Props drilling profundo

## 🧪 Testes

Estrutura sugerida:

```bash
npm install --save-dev vitest @testing-library/react
```

Exemplo de teste:
```javascript
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

test('MetricCard exibe valor', () => {
  render(<MetricCard value="6h 42min" label="Tempo" />);
  expect(screen.getByText('6h 42min')).toBeInTheDocument();
});
```

## 📱 Responsividade

O projeto usa Tailwind breakpoints:
- `sm`: 640px
- `lg`: 1024px
- `xl`: 1280px

Layout adapta com classes `lg:grid-cols-2`, etc.

## ♿ Acessibilidade

- ✅ Elementos semânticos HTML
- ✅ ARIA labels onde apropriado
- ✅ Focus visível com outline
- ✅ Cores com contraste suficiente
- ✅ Suporte a `prefers-reduced-motion`

## 🔐 Segurança

- ✅ CSP headers no backend
- ✅ Escape de valores CSV
- ✅ Sem console logs em produção

## 📖 Documentação Adicional

- [STYLES.md](./STYLES.md) - Documentação completa de estilos CSS
- [INTEGRACAO-FRONTEND-BACKEND.md](./INTEGRACAO-FRONTEND-BACKEND.md) - Integração com a API e fluxo de dados
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)
- [Recharts Docs](https://recharts.org)

## 📦 Dependências

| Pacote | Versão | Uso |
|--------|--------|-----|
| React | 18.2.0 | Framework UI |
| React DOM | 18.2.0 | Renderização DOM |
| Recharts | 2.10.3 | Gráficos |
| Tailwind CSS | 3.4.17 | Estilos |
| Vite | 5.0.8 | Build tool |

## 🚧 TODO

- [x] Integração inicial com API backend
- [x] Integração do gráfico semanal usando resumos diários
- [ ] Integração da timeline e do ranking de aplicativos quando os endpoints existirem
- [ ] Testes unitários e E2E
- [ ] Tipos TypeScript
- [ ] Validação de formulários
- [ ] Cache de dados com TanStack Query
- [ ] PWA (Progressive Web App)
- [ ] i18n (Internacionalização)

## 🤝 Contribuição

1. Crie um branch para sua feature: `git checkout -b feature/minha-feature`
2. Commit suas mudanças: `git commit -m 'Add minha feature'`
3. Push para o branch: `git push origin feature/minha-feature`
4. Abra um Pull Request

## 📄 Licença

MIT - Fábrica Bay Area

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ para a Fábrica Bay Area

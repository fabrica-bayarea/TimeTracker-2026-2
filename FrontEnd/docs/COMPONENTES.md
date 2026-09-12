# Catálogo de Componentes — TimeTrack Frontend

Este documento descreve todos os componentes React disponíveis em `FrontEnd/src/components/`, suas propriedades, responsabilidades, comportamento com dados reais vs. demonstrativos e diretrizes de acessibilidade.

Todos os componentes são exportados centralizadamente através de `src/components/index.js`.

---

## Sumário

- [Componentes Base](#componentes-base)
  - [Card](#card)
  - [SectionHeading](#sectionheading)
  - [Sidebar](#sidebar)
- [Componentes de Cabeçalho e Ações](#componentes-de-cabeçalho-e-ações)
  - [Header](#header)
  - [ReportsAndAgent](#reportsandagent)
- [Componentes de Métricas e Gráficos](#componentes-de-métricas-e-gráficos)
  - [MetricCard](#metriccard)
  - [ActivityChart](#activitychart)
  - [CategoryChart](#categorychart)
- [Componentes de Listagem e Atividades](#componentes-de-listagem-e-atividades)
  - [AppsCard](#appscard)
  - [TimelineCard](#timelinecard)
  - [PeopleCard](#peoplecard)

---

## Componentes Base

### Card

Contêiner semântico retangular reutilizável (`<article>`) que padroniza bordas, sombras e fundo nos temas claro e escuro.

- **Arquivo:** `src/components/Card.jsx`
- **Tag HTML:** `<article>`

#### Propriedades (Props)

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` | `React.ReactNode` | — *(obrigatório)* | Conteúdo interno do card. |
| `className` | `string` | `""` | Classes adicionais do Tailwind para estilização específica (ex: grids, paddings). |
| `id` | `string` | `undefined` | Identificador HTML opcional para navegação por âncoras da sidebar. |

#### Exemplo de Uso

```jsx
import { Card } from "@/components";

<Card id="meu-card" className="p-6">
  <h2>Título</h2>
  <p>Conteúdo aqui</p>
</Card>
```

---

### SectionHeading

Cabeçalho de seção padronizado contendo título com tipagem de exibição, descrição explicativa e elemento de ação contextual à direita.

- **Arquivo:** `src/components/SectionHeading.jsx`

#### Propriedades (Props)

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` | `string` | — *(obrigatório)* | Título principal da seção. |
| `description` | `string` | — *(obrigatório)* | Texto de apoio e contexto da seção. |
| `action` | `React.ReactNode` | `undefined` | Elemento complementar à direita (botão, badge, link). |

#### Exemplo de Uso

```jsx
<SectionHeading
  title="Tempo por categoria"
  description="Classificação por palavras-chave"
  action={<span className="text-xs text-muted">Dados do período</span>}
/>
```

---

### Sidebar

Barra de navegação lateral fixa para visualização em desktop (`lg:` a partir de 1024px). Fornece navegação por âncoras com indicação visual da seção ativa e informações de usuário/configurações.

- **Arquivo:** `src/components/Sidebar.jsx`
- **Tag HTML:** `<aside>`

#### Propriedades (Props)

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `activeSection` | `string` | `"visao-geral"` | ID da seção correspondente à posição atual do scroll (gerenciado por `useActiveSection`). |
| `items` | `Array<[id, icon, label]>` | `navItems` | Lista opcional de itens de navegação. Por padrão consome a lista de `dashboardData.js`. |

#### Acessibilidade

- O item ativo recebe `aria-current="page"`.
- Possui foco acessível via teclado com anéis de foco (`focus-visible:ring-2 focus-visible:ring-brand`).
- É ocultado automaticamente durante impressão (`@media print`).

---

## Componentes de Cabeçalho e Ações

### Header

Cabeçalho principal do dashboard contendo data formatada por extenso, filtros interativos de data e colaborador, status em tempo real da conexão com a API e botões de ação rápida.

- **Arquivo:** `src/components/Header.jsx`
- **Tag HTML:** `<header>`

#### Propriedades (Props)

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `formattedDate` | `string` | — *(obrigatório)* | Data exibida no formato por extenso (ex: `"SEXTA-FEIRA, 11 DE SETEMBRO"`). |
| `dark` | `boolean` | — *(obrigatório)* | Indica se o tema escuro está ativado. |
| `toggleTheme` | `() => void` | — *(obrigatório)* | Função disparada ao clicar no botão de alternância de tema. |
| `selectedDate` | `string` | — *(obrigatório)* | Data atual do filtro no formato `AAAA-MM-DD`. |
| `setSelectedDate` | `(date: string) => void` | — *(obrigatório)* | Atualizador da data selecionada. |
| `apiStatus` | `"online" \| "offline" \| "loading"` | `"offline"` | Estado da API HTTP. |
| `selectedUsername` | `string` | `""` | Colaborador filtrado ou string vazia para todos. |
| `setSelectedUsername` | `(username: string) => void` | — *(obrigatório)* | Atualizador do colaborador selecionado. |
| `users` | `Array<{username: string, full_name?: string}>` | `[]` | Lista de colaboradores para o dropdown. |
| `refreshing` | `boolean` | `false` | Se uma consulta em segundo plano está em andamento. |
| `onRefresh` | `() => void` | `undefined` | Callback disparado para forçar atualização manual dos dados. |
| `updatedAt` | `Date \| null` | `null` | Horário da última sincronização bem-sucedida. |

---

### ReportsAndAgent

Seção de relatórios e preferências de atualização em segundo plano. Oferece links para download dos relatórios gerados pelo backend (CSV e PDF) e exportação instantânea no cliente com fallback resiliente.

- **Arquivo:** `src/components/ReportsAndAgent.jsx`
- **Tag HTML:** `<section>`

#### Propriedades (Props)

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `selectedDate` | `string` | — *(obrigatório)* | Data base para os relatórios (`AAAA-MM-DD`). |
| `selectedUsername` | `string` | `""` | Colaborador filtrado nos relatórios. |
| `autoRefresh` | `boolean` | `true` | Se a atualização a cada 30 segundos está ativa. |
| `setAutoRefresh` | `(enabled: boolean) => void` | — *(obrigatório)* | Callback para alternar a atualização automática. |
| `realtimePeople` | `Array<Object>` | `[]` | Lista de pessoas online para possibilitar geração instantânea do CSV pelo navegador caso a API esteja lenta. |

---

## Componentes de Métricas e Gráficos

### MetricCard

Cartão de indicador numérico resumido com ícone em tom destacado, valor principal, legenda e indicação contextual.

- **Arquivo:** `src/components/MetricCard.jsx`

#### Propriedades (Props)

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `icon` | `React.ReactNode` | — *(obrigatório)* | Ícone representativo ou símbolo textual. |
| `tone` | `string` | — *(obrigatório)* | Classes de cor de fundo e texto do ícone (ex: `"bg-violet-100 text-violet-600"`). |
| `label` | `string` | — *(obrigatório)* | Nome do indicador (ex: `"Tempo monitorado"`). |
| `value` | `React.ReactNode` | — *(obrigatório)* | Valor numérico ou formatado (ex: `"7h 20min"`). |
| `detail` | `string` | — *(obrigatório)* | Informação complementar abaixo do valor. |
| `positive` | `boolean` | `false` | Destaca a cor do detalhe em verde positivo se verdadeiro. |

---

### ActivityChart

Gráfico de barras duplas comparando o tempo total monitorado versus tempo produtivo ao longo dos últimos sete dias.

- **Arquivo:** `src/components/ActivityChart.jsx`
- **Dependência:** Recharts (`BarChart`, `Bar`, `ResponsiveContainer`, `Tooltip`)

#### Propriedades (Props)

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `weeklySummaries` | `Array<Object>` | `[]` | Resumos dos últimos 7 dias retornados pela API. |
| `useDemoData` | `boolean` | `true` | Se deve exibir os dados semanais de demonstração caso `weeklySummaries` esteja vazio. |

---

### CategoryChart

Gráfico de rosca (*donut*) exibindo a distribuição do tempo monitorado por categorias de atividade (Desenvolvimento, Comunicação, Design, Social, Outros).

- **Arquivo:** `src/components/CategoryChart.jsx`
- **Dependência:** Recharts (`PieChart`, `Pie`, `Cell`, `Tooltip`)

#### Propriedades (Props)

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `summaryUsers` | `Array<Object>` | `[]` | Lista de usuários com seus respectivos arrays `by_category`. |
| `useDemoData` | `boolean` | `true` | Se deve utilizar as categorias de demonstração se não houver dados reais. |

---

## Componentes de Listagem e Atividades

### AppsCard

Ranking visual dos softwares mais utilizados no dia com barras proporcionais de utilização.

- **Arquivo:** `src/components/AppsCard.jsx`

#### Propriedades (Props)

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `useDemoData` | `boolean` | `true` | Exibe os dados demonstrativos enquanto a API não disponibilizar o endpoint de ranking. |

---

### TimelineCard

Visualização cronológica das faixas de atividade ao longo do horário comercial (08:00 às 18:00).

- **Arquivo:** `src/components/TimelineCard.jsx`

#### Propriedades (Props)

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `useDemoData` | `boolean` | `true` | Exibe os intervalos da demonstração enquanto o endpoint de timeline não estiver disponível no backend. |

---

### PeopleCard

Tabela detalhada de acompanhamento em tempo real dos colaboradores da equipe: avatar com iniciais, máquina, software, título da janela ativa, categoria, status de presença e tempo decorrido desde a última atividade.

- **Arquivo:** `src/components/PeopleCard.jsx`

#### Propriedades (Props)

| Propriedade | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `realtimePeople` | `Array<RealtimePerson>` | `[]` | Dados de `/activities/realtime`. |
| `useDemoData` | `boolean` | `true` | Se deve exibir a equipe de demonstração caso a API esteja indisponível. Quando a API responde com sucesso mas lista vazia, exibe mensagem clara de estado vazio. |

#### Acessibilidade

- Contém rolagem horizontal com suporte a foco via teclado (`tabIndex={0}`).
- Cabeçalhos de coluna semânticos com `<th>`.
- Status com indicador visual (`status-dot`) e texto para leitores de tela.


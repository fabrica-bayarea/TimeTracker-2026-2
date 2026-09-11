# Documentação de Estilos CSS

## Visão Geral

Este projeto utiliza **Tailwind CSS** como framework principal de estilos, com componentes customizados definidos em `src/index.css`.

## Variáveis CSS

### Cores Personalizadas

As cores personalizadas são definidas no `tailwind.config.js` e aplicadas como Tailwind utilities:

- **`ink`**: `#20233b` - Cor principal de texto
- **`muted`**: `#7b8098` - Cor de texto secundário/desativado
- **`line`**: `#e9eaf2` - Cor de bordas
- **`brand`**: `#6956e9` - Cor primária da marca (roxo)
- **`page`**: `#f7f8fc` - Cor de fundo da página

### Tema Escuro

O tema escuro é ativado com o atributo `data-theme="dark"` no elemento raiz e pode ser gerenciado com o hook `useTheme()`.

## Componentes CSS (@layer components)

Todos os componentes reutilizáveis estão definidos em `src/index.css` usando `@layer components` do Tailwind:

### Botões

| Classe | Uso | Exemplo |
|--------|-----|---------|
| `.control` | Botão padrão com dropdown | Filtro "Últimos 7 dias" |
| `.icon-control` | Botão quadrado com ícone | Botão de notificações |
| `.primary-button` | Botão CTA (Call-To-Action) | "Gerar PDF", "Pausar acompanhamento" |
| `.secondary-button` | Botão alternativo | "Gerar CSV" |

### Indicadores e Badges

| Classe | Uso |
|--------|-----|
| `.eyebrow` | Rótulo pequeno sobre títulos |
| `.legend-dot` | Ponto de cor em legendas de gráficos |
| `.status-dot` | Indicador de status (online/offline) |
| `.notification-dot` | Ponto vermelho de notificação |
| `.avatar` | Círculo com iniciais do usuário |
| `.pill` | Badge/pílula de categoria |
| `.pill.communication` | Variante para categoria "Comunicação" |
| `.pill.design` | Variante para categoria "Design" |
| `.online-badge` | Badge de status "Online" |

### Outros Componentes

| Classe | Uso |
|--------|-----|
| `.chart-tooltip` | Tooltip que aparece ao passar sobre gráficos |

## Fontes

As fontes são carregadas do Google Fonts e configuradas no `tailwind.config.js`:

- **`font-sans`**: DM Sans (corpo de texto)
- **`font-display`**: Manrope (títulos e headings)
- **`font-mono`**: Fira Code (código/monoespacado)

## Animações

Animações personalizadas estão definidas em `tailwind.config.js`:

- **`animate-fade-in`**: Desvanecimento suave (0.3s)
- **`animate-slide-in`**: Deslize horizontal suave (0.3s)

Uso:
```html
<div class="animate-fade-in">Conteúdo</div>
```

## Dark Mode

Alternar tema:
```javascript
const [dark, toggleTheme] = useTheme();
toggleTheme(); // Alterna entre claro/escuro
```

Usar classes específicas para dark mode:
```html
<!-- Tailwind dark: -->
<div class="text-ink dark:text-white">Texto</div>

<!-- CSS customizado: -->
[data-theme='dark'] .minha-classe {
  /* estilos para dark mode */
}
```

## Média Queries

### Print (@media print)

Elementos ocultados ao imprimir:
- `aside` (sidebar)
- `header` (cabeçalho)
- Todos os botões
- Controles de interface

Tabelas recebem `page-break-inside: avoid` para evitar quebras no meio delas.

### Prefers Reduced Motion

Para usuários que preferem reduzir movimento, todas as animações são desabilitadas:
```css
@media (prefers-reduced-motion: reduce) {
  /* Sem animações */
}
```

## Exemplo de Criação de Novo Componente CSS

```css
@layer components {
  .meu-botao {
    @apply px-4 py-2 rounded-lg font-semibold transition-colors;
    @apply bg-brand text-white hover:bg-indigo-700;
    @apply dark:hover:bg-indigo-800;
  }
}
```

## Classes do Tailwind Mais Usadas

### Espaçamento
- `p-5` = padding 1.25rem
- `px-4` = padding horizontal 1rem
- `gap-3` = espaço entre flex/grid

### Grid/Flex
- `grid gap-4` = grid com espaço de 1rem
- `flex items-center justify-between` = flexbox com centralização

### Cores
- `text-ink` = cor de texto principal
- `bg-brand` = fundo roxo marca
- `border-line` = borda padrão

### Dark Mode
- `dark:bg-slate-900` = fundo escuro
- `dark:text-white` = texto branco em dark mode

## Acessibilidade

### Focus Visible
Elementos focados via teclado recebem outline automático:
```css
:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
```

### Semantic HTML
Use elementos semânticos apropriados:
- `<article>` para cards
- `<aside>` para sidebar
- `<main>` para conteúdo principal
- `<section>` para seções
- `<table>` para dados tabulares

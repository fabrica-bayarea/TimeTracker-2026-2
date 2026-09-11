# Estilos e interface

## Organização

O projeto usa utilitários Tailwind diretamente no JSX. `src/index.css` complementa-os com reset, variáveis CSS, componentes reutilizáveis, impressão e acessibilidade. Evite criar estilos globais para uma única tela; prefira classes Tailwind no componente ou uma classe reutilizável em `@layer components`.

## Tema

`useTheme()` grava `timetracker-theme` no `localStorage` e aplica `data-theme="dark"` ao elemento `<html>`. As variantes `dark:` são ativadas por esse atributo.

| Token Tailwind | Valor | Uso |
| --- | --- | --- |
| `ink` | `#20233b` | Texto principal. |
| `muted` | `#7b8098` | Texto secundário. |
| `line` | `#e9eaf2` | Bordas. |
| `brand` | `#6956e9` | Ação e identidade visual. |
| `page` | `#f7f8fc` | Fundo claro. |

## Classes compartilhadas

| Classe | Finalidade |
| --- | --- |
| `control`, `icon-control` | Filtros e botões compactos do cabeçalho. |
| `primary-button`, `secondary-button` | Ações principais e alternativas. |
| `eyebrow`, `legend-dot`, `status-dot` | Rótulos e indicadores pequenos. |
| `avatar`, `pill` | Pessoa e categoria; `pill.communication` e `pill.design` são variantes. |
| `chart-tooltip` | Conteúdo de tooltip do Recharts. |

## Layout e responsividade

- A barra lateral fica oculta abaixo de `lg` (1024 px).
- Os cards usam uma coluna em telas estreitas, duas em `sm`/`lg` quando aplicável e quatro métricas em `xl`.
- Tabelas têm rolagem horizontal, preservando a legibilidade em telas pequenas.
- `body` tem largura mínima de 320 px.

## Acessibilidade e impressão

- Use elementos semânticos (`main`, `header`, `section`, `article`, `table`) antes de adicionar ARIA.
- Todo botão que possui somente ícone precisa de `aria-label` e `title`.
- O foco de teclado usa contorno definido em `:focus-visible`; não o remova.
- `prefers-reduced-motion` reduz animações e transições.
- Em impressão, sidebar, cabeçalho e controles são ocultados para priorizar o conteúdo.

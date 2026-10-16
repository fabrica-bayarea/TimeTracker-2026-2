> **Documento de Requisitos — fabrica-bayarea/TimeTracker-2026-2**
</br>
> **responsáveis:** Patricia Pereira Martins e Marley Eduardo Rocha Guedes
> (Time de requisitos e testes)
</br>
>**Figma:** https://www.figma.com/design/gu4VzuZMFzqcryfTEjlGsW/timeTracker?node-id=28-1260&p=f&t=AoZugVmEY6kE1QpQ-0
</br>
> **Data:** 21/setembro/2026
</br>
> **Versão:** 1.2

# Responsividade — Time Tracker

**Projeto:** Time Tracker Open Source  
**Figma:** https://www.figma.com/design/gu4VzuZMFzqcryfTEjlGsW/timeTracker?node-id=28-1260&p=f&t=AoZugVmEY6kE1QpQ-0  
**Versão:** 1.1.0  
**Status:** Implementado  
**Data:** Outubro de 2026

---

## 1. Objetivo

Este documento define as diretrizes de responsividade do **Dashboard web** do Time Tracker.

O Agente Desktop não faz parte deste escopo. O Dashboard não possui manifest nem service worker e não é instalável como PWA.

---

## 2. Diretriz geral

O Dashboard se adapta a diferentes larguras de tela sem comprometer:

- leitura das informações;
- acesso às funcionalidades;
- navegação;
- gráficos e barras;
- tabelas;
- formulários.

Não deve existir transbordamento horizontal desnecessário na página.

---

## 3. Breakpoints

A interface usa os breakpoints padrão do Tailwind CSS. O layout estrutural alterna em `sm` (640 px), `lg` (1024 px) e `xl` (1280 px). O CSS global complementa com media queries em `max-width: 639px` e `max-width: 1023px`.

| Faixa | Largura | Comportamento esperado |
| --- | --- | --- |
| Tela pequena | abaixo de 640 px | Conteúdo empilhado, tabelas viram cards e navegação em diálogo |
| Tela média | 640 px a 1023 px | Grades em 2 colunas, tabelas visíveis, navegação em diálogo |
| Tela grande | 1024 px a 1279 px | Menu lateral fixo, conteúdo deslocado a partir de 1024 px |
| Tela extra-grande | 1280 px e acima | Grades em 4 e 6 colunas, seções do painel em 2 colunas |

A largura mínima suportada é **320 px**, garantida por `min-width: 320px` no `body`. Abaixo disso a página pode rolar horizontalmente.

---

## 4. Componentes principais

### Painel

Cards de métricas e informações reorganizam-se conforme o espaço disponível.

- Métricas: `grid gap-4 sm:grid-cols-2 xl:grid-cols-6`.
- Seções inferiores (tempo por categoria, jornada, última atividade): `grid gap-5 xl:grid-cols-2`.
- Abaixo de 640 px, cada card ocupa a largura total, empilhado.

```text
Tela extra-grande (>= 1280px)

[ Card ][ Card ][ Card ][ Card ][ Card ][ Card ]


Tela pequena (< 640px)

[ Card ]
[ Card ]
[ Card ]
[ Card ]
```

---

### Tabelas

Tabelas com muitas informações mantêm acesso ao conteúdo em telas menores.

- Última atividade e colaboradores: abaixo de 640 px renderizam como **cards** (bloco `sm:hidden`); a partir de 640 px, como **tabela** com rolagem horizontal (`hidden overflow-x-auto sm:block`, `min-w-[580px]`).
- Jornada diária: mantém tabela com rolagem horizontal (`overflow-x-auto`, `min-w-[28rem]`) e `tabIndex="0"` para acesso por teclado.
- A rolagem ocorre dentro do componente; a página não rola horizontalmente.

---

### Gráficos

Não há biblioteca de gráficos. A distribuição de tempo por categoria é desenhada com barras CSS que ocupam a largura disponível, com duração e percentual exibidos em texto ao lado. A legibilidade não depende do tamanho da barra.

---

### Formulários

Formulários de:

- colaboradores;
- tasks;
- jornada;
- configurações;

reorganizam campos em duas colunas a partir de 640 px (`grid gap-4 sm:grid-cols-2`).

---

### Relatórios

Filtros e ações permanecem acessíveis em diferentes larguras.

- Filtros: `grid gap-4 sm:grid-cols-2`.
- O botão de exportação CSV/PDF permanece disponível em qualquer largura.

---

## 5. Navegação

A navegação dá acesso às principais áreas:

```text
Painel
Colaboradores
Tasks
Relatórios
Configurações
```

- A partir de 1024 px, o menu lateral é fixo (`w-64`, `lg:flex`) e o conteúdo é deslocado (`lg:ml-64`, `lg:w-[calc(100%_-_16rem)]`).
- Abaixo de 1024 px, um botão (`lg:hidden`) abre um diálogo (`role="dialog"`, `w-72`, `max-w-[90vw]`) com foco inicial, ciclo de Tab, fechamento por Escape ou clique externo, bloqueio da rolagem do fundo e restauração do foco.

---

## 6. Critérios

A interface responsiva garante:

- conteúdo legível;
- ações acessíveis;
- ausência de sobreposição entre componentes;
- adaptação de cards, tabelas, gráficos e formulários;
- manutenção das funcionalidades disponíveis;
- navegação utilizável por teclado;
- ausência de rolagem horizontal da página nas larguras de 375, 390, 768, 1366 e 1920 px;
- uso pleno com ampliação CSS de 200%.

---

## 7. Tecnologias

O Dashboard utiliza:

- React 18.2.0 — biblioteca principal de interface.
- JavaScript + JSX.
- Vite 6.4.4 — servidor de desenvolvimento e processo de build.
- Tailwind CSS 3.4.17 — estilização principal e breakpoints.
- CSS global — `src/app/styles/index.css` reúne tokens, componentes compartilhados e media queries.
- PostCSS 8.5.28 + Autoprefixer 10.4.16 — processamento e compatibilidade de CSS.
- Vitest 4.1.11 — testes automatizados.
- React Testing Library 16.3.0 (jest-dom 6.8.0, user-event 14.6.1) — testes de componentes e interação.
- jsdom 26.1.0 — simulação de navegador durante os testes.
- Playwright 1.63.0 + @axe-core/playwright 4.13.0 — E2E, larguras de tela e acessibilidade.

Não há React Router nem biblioteca de gráficos. A responsividade usa os recursos do próprio Tailwind e do CSS global.

---

## 8. Pendências

Ainda precisam ser definidos:

- navegadores suportados oficialmente.

As referências visuais por tamanho de tela estão no Figma, com os frames correspondentes a `sm` (640 px), `lg` (1024 px) e `xl` (1280 px).

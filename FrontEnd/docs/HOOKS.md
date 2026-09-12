# Documentação de Hooks Customizados — TimeTrack Frontend

Este documento descreve os custom hooks desenvolvidos no projeto React do TimeTrack, localizados em `FrontEnd/src/hooks/`.

Os hooks foram organizados em módulos individuais e são exportados centralizadamente através de `src/hooks/index.js` (com retrocompatibilidade garantida em `src/hooks/useDashboard.js`).

---

## Sumário

1. [useDashboardData](#usedashboarddata)
2. [useTheme](#usetheme)
3. [useActiveSection](#useactivesection)
4. [Boas Práticas e Ciclo de Vida](#boas-práticas-e-ciclo-de-vida)

---

## useDashboardData

Orquestrador de busca, cache transitório em memória e atualização periódica dos dados do painel.

- **Arquivo:** `src/hooks/useDashboardData.js`
- **Importação recomendada:**
  ```javascript
  import { useDashboardData } from "@/hooks";
  ```

### Assinatura

```typescript
function useDashboardData(
  selectedDate: string,
  selectedUsername?: string,
  autoRefresh?: boolean
): {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  updatedAt: Date | null;
  dataDate: string | null;
  refresh: () => void;
}
```

### Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `selectedDate` | `string` | — *(obrigatório)* | Data da consulta no formato `AAAA-MM-DD`. |
| `selectedUsername` | `string` | `""` | Nome do colaborador filtrado ou string vazia para consultar toda a equipe. |
| `autoRefresh` | `boolean` | `true` | Habilita ou desabilita o intervalo automático de atualização de 30 segundos. |

### Retorno

| Propriedade | Tipo | Descrição |
| --- | --- | --- |
| `data` | `Object \| null` | Contém `summary`, `realtime`, `users` e `weeklySummaries`. É `null` antes da primeira resposta válida para o filtro. |
| `loading` | `boolean` | `true` quando está buscando dados pela primeira vez para uma nova combinação de data/colaborador. |
| `refreshing` | `boolean` | `true` quando está recarregando dados para o **mesmo** filtro ativo, mantendo a tela preenchida sem piscar (*stale-while-revalidate*). |
| `error` | `Error \| null` | Registra o último erro de rede ou HTTP retornado pela API (erros do tipo `AbortError` são ignorados). |
| `updatedAt` | `Date \| null` | Objeto `Date` local indicando o momento exato em que a última resposta válida foi processada. |
| `refresh` | `() => void` | Função disparável manualmente pelo usuário para forçar nova consulta imediata. |

### Ciclo de Vida e Resiliência

1. **Cancelamento de Requisição (`AbortController`):** Cada nova mudança de filtro ou disparo de recarga cancela a requisição anterior em trânsito via `controller.abort()`, evitando condições de corrida (*race conditions*).
2. **Page Visibility API:** Quando o usuário minimiza a janela ou muda de aba (`document.hidden`), o temporizador de 30s é pausado para economizar recursos e requisições no servidor. Ao retornar à aba, o painel atualiza imediatamente e retoma o temporizador.

---

## useTheme

Gerencia a preferência de tema visual (claro / escuro), persistindo a escolha no `localStorage` do navegador e aplicando o atributo `data-theme="dark"` no elemento raiz `<html>`.

- **Arquivo:** `src/hooks/useTheme.js`
- **Importação recomendada:**
  ```javascript
  import { useTheme } from "@/hooks";
  ```

### Assinatura

```typescript
function useTheme(): [isDark: boolean, toggleTheme: () => void]
```

### Comportamento

1. **Inicialização:**
   - Verifica `localStorage.getItem("timetracker-theme")`.
   - Caso não exista preferência salva, consulta a preferência do sistema operacional via `window.matchMedia("(prefers-color-scheme: dark)")`.
   - Se nenhuma preferência for encontrada ou em ambiente SSR, assume `false` (tema claro).
2. **Sincronização:**
   - Ao alterar `dark`, atualiza `document.documentElement.dataset.theme = "dark" | "light"`.
   - Salva a preferência em `localStorage`.
   - Possui blocos `try/catch` defensivos contra ambientes com `localStorage` restrito (ex: iframes com cookies bloqueados).

---

## useActiveSection

Rastreia qual seção da página está visível no centro da viewport utilizando a API de alto desempenho `IntersectionObserver`.

- **Arquivo:** `src/hooks/useActiveSection.js`
- **Importação recomendada:**
  ```javascript
  import { useActiveSection } from "@/hooks";
  ```

### Assinatura

```typescript
function useActiveSection(defaultSection?: string): string
```

### Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `defaultSection` | `string` | `"visao-geral"` | ID inicial da seção enquanto a página carrega ou antes da primeira interseção. |

### Retorno

- Retorna a `string` com o ID da seção mais visível (ex: `"visao-geral"`, `"atividade"`, `"equipe"`, `"relatorios"`).

### Configuração do Observador

- **`rootMargin`:** `"-20% 0px -65% 0px"` — prioriza a seção que ocupa o terço superior/central da tela, proporcionando uma transição de menu natural ao rolar.
- **`threshold`:** `[0, 0.25, 0.75]` — recalcula dinamicamente a seção vencedora com base na maior razão de interseção (`intersectionRatio`).

---

## Boas Práticas e Ciclo de Vida

- **Imutabilidade:** Os hooks não modificam diretamente o DOM fora de efeitos explicitamente designados (`data-theme`).
- **Limpeza de Efeitos (*Cleanup*):** Todos os `useEffect` que registram listeners de eventos (`visibilitychange`), temporizadores (`setInterval`) ou observadores (`IntersectionObserver`) desconectam-se adequadamente na função de cleanup.


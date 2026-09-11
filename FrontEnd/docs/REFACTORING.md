# Organização atual e histórico de refatoração

## Decisões em vigor

- React/Vite é a interface ativa; Blazor está arquivado em `legacy/`.
- Hooks customizados são modulares (`src/hooks/useDashboardData.js`, `useTheme.js`, `useActiveSection.js`) e centralizados via barrel `src/hooks/index.js`, com retrocompatibilidade em `useDashboard.js`.
- Constantes de interface (paletas de cores de avatares, rótulos de API e mapeamento de status) são centralizadas em `src/constants/ui.js`.
- O estado é local ao `App`; não há store global porque o escopo atual não exige um.
- Componentes recebem dados por propriedades tipadas com JSDoc e não se acoplam à infraestrutura de transporte HTTP.
- Dados demonstrativos são isolados em `src/data/dashboardData.js` para manter clareza sobre o que é real vs. mock.
- A suíte de testes automatizados cobre utilitários, serviços, custom hooks e componentes com Vitest e Testing Library.

## Melhorias Realizadas

- [x] Modularização dos custom hooks com responsabilidade única e barrel exports.
- [x] Criação de testes unitários para componentes estruturais (`Card`, `SectionHeading`, `Sidebar`, `Header`, `PeopleCard`, `ReportsAndAgent`).
- [x] Criação de testes unitários para o hook `useTheme` (persistência em `localStorage` e preferência do SO).
- [x] Extração de constantes de UI para evitar repetições mágicas de strings e arrays de estilos.
- [x] Elaboração do catálogo detalhado de componentes ([COMPONENTES.md](COMPONENTES.md)).
- [x] Elaboração da documentação técnica dos custom hooks ([HOOKS.md](HOOKS.md)).
- [x] Elaboração do guia prático de testes automatizados ([TESTES.md](TESTES.md)).
- [x] Correção de inconsistências documentais sobre suíte de testes em `CONTRIBUTING.md` e `FUNCIONALIDADES.md`.

## Pendências priorizadas

1. Definir contrato oficial com o time de backend para os endpoints pendentes (ranking de aplicativos, intervalos da timeline e regras oficiais de produtividade).
2. Validar acessibilidade profunda com leitor de tela (NVDA/JAWS) e revisão de contraste de cores nos modos claro e escuro.
3. Substituir caracteres textuais decorativos por uma biblioteca de ícones SVG acessíveis (ex: Lucide React).
4. Avaliar biblioteca de gerenciamento de cache de servidor (como TanStack Query) caso surjam rotas adicionais ou requisitos avançados de mutação.

## Critério para novas refatorações

Uma refatoração deve preservar o comportamento documentado em `FUNCIONALIDADES.md`, manter a centralização do cliente HTTP e ser validada com a suíte de testes (`npm.cmd test`) e build (`npm.cmd run build`). Se alterar interface, fluxo ou contrato, atualize o documento correspondente antes de concluir a mudança.

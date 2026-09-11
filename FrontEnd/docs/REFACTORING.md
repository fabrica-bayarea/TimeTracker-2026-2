# Organização atual e pendências técnicas

## Decisões em vigor

- React/Vite é a interface ativa; Blazor está arquivado em `legacy/`.
- Dados de dashboard são carregados por um único hook e o HTTP é centralizado em um único serviço.
- O estado é local ao `App`; não há store global porque o escopo atual não exige um.
- Componentes recebem dados por propriedades e não devem acoplar-se à forma de transporte da API.
- Dados demonstrativos são isolados em `src/data/dashboardData.js` para deixar claro o que ainda não é real.

## Pendências priorizadas

1. Adicionar testes de utilitários, hook de dados e componentes críticos.
2. Definir contrato oficial para produtividade, aplicativos, timeline e controle do agente.
3. Validar acessibilidade com leitor de tela e contraste em todos os estados.
4. Substituir os caracteres decorativos por ícones acessíveis, se o design evoluir.
5. Avaliar cache de servidor (por exemplo, TanStack Query) somente se consultas e invalidação se tornarem mais complexas.

## Critério para novas refatorações

Uma refatoração deve preservar o comportamento documentado em `FUNCIONALIDADES.md`, manter a centralização do cliente HTTP e ser acompanhada de build. Se alterar interface, fluxo ou contrato, atualize o documento correspondente antes de concluir a mudança.

# Contribuindo no frontend

## Ambiente e validação

```powershell
cd FrontEnd
npm.cmd install
npm.cmd run dev
npm.cmd test
npm.cmd run build
```

Toda alteração deve passar pelos testes automatizados (`npm.cmd test`), pelo build de produção (`npm.cmd run build`) e por uma verificação manual no navegador nos temas claro/escuro e em diferentes larguras de tela (mobile e desktop).

## Convenções

- Componentes visuais ficam em `src/components/`, com export nomeado e responsabilidade única.
- Todo novo componente ou hook deve ser acompanhado de seus respectivos testes unitários (`.test.jsx` ou `.test.js`).
- Lógica de requisição, temporizador ou navegador deve ficar em hooks/serviços, não espalhada em cards.
- A API só deve ser acessada por `src/services/api.js`.
- Regras de cálculo e formatação devem ficar em `src/utils/` quando forem reutilizáveis.
- Use `camelCase` para JavaScript, `PascalCase` para componentes e nomes descritivos para propriedades.
- Adicione JSDoc descritivo com `@param` e `@returns` para funções e componentes públicos.
- Mantenha `dark:` ao introduzir cores de superfície ou texto e teste o foco via teclado.

## Quando atualizar documentação

| Mudança | Documento a atualizar |
| --- | --- |
| Tela, filtro, métrica ou estado | `FUNCIONALIDADES.md` |
| Componente visual ou propriedades | `COMPONENTES.md` |
| Custom hook ou fluxo de estado | `HOOKS.md` |
| Estrutura geral, camadas ou build | `ARQUITETURA.md` |
| Endpoint, resposta ou variável de ambiente | `INTEGRACAO-FRONTEND-BACKEND.md` |
| Testes, ferramentas ou novos padrões de teste | `TESTES.md` |
| Token, classe compartilhada ou comportamento visual | `STYLES.md` |
| Decisão de organização ou pendência importante | `REFACTORING.md` |

## Checklist para pull request

- [ ] `npm.cmd test` executa com sucesso e todos os testes passam.
- [ ] `npm.cmd run build` conclui sem erro de compilação ou resolução.
- [ ] Novos componentes ou hooks possuem testes unitários correspondentes.
- [ ] Fluxo alterado foi exercitado no navegador.
- [ ] Data, filtros e estados de API indisponível foram considerados quando relevantes.
- [ ] Tema escuro, responsividade e navegação por teclado foram revisados.
- [ ] A documentação correspondente em `docs/` foi atualizada.
- [ ] Não foram incluídos segredos, dados pessoais reais ou arquivos gerados em `dist/`.

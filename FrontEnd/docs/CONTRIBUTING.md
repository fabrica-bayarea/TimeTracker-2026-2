# Contribuindo no frontend

## Ambiente e validação

```powershell
cd FrontEnd
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

Não existe suíte de testes configurada. Portanto, toda alteração deve ao menos passar pelo build e por uma verificação manual no navegador, nos temas claro/escuro e em viewport estreito.

## Convenções

- Componentes visuais ficam em `src/components/`, com export nomeado e responsabilidade única.
- Lógica de requisição, temporizador ou navegador deve ficar em hooks/serviços, não espalhada em cards.
- A API só deve ser acessada por `src/services/api.js`.
- Regras de cálculo e formatação devem ficar em `src/utils/` quando forem reutilizáveis.
- Use `camelCase` para JavaScript, `PascalCase` para componentes e nomes descritivos para propriedades.
- Mantenha `dark:` ao introduzir cores de superfície ou texto e teste o foco via teclado.

## Quando atualizar documentação

| Mudança | Documento a atualizar |
| --- | --- |
| Tela, filtro, métrica ou estado | `FUNCIONALIDADES.md` |
| Componente, hook, serviço ou build | `ARQUITETURA.md` |
| Endpoint, resposta ou variável de ambiente | `INTEGRACAO-FRONTEND-BACKEND.md` |
| Token, classe compartilhada ou comportamento visual | `STYLES.md` |
| Decisão de organização ou pendência importante | `REFACTORING.md` |

## Checklist para pull request

- [ ] `npm.cmd run build` conclui sem erro.
- [ ] Fluxo alterado foi exercitado no navegador.
- [ ] Data, filtros e estados de API indisponível foram considerados quando relevantes.
- [ ] Tema escuro, responsividade e navegação por teclado foram revisados.
- [ ] A documentação correspondente foi atualizada.
- [ ] Não foram incluídos segredos, dados pessoais reais ou arquivos gerados em `dist/`.

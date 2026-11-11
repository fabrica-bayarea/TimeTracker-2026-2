# Testes e validação do Frontend

Este guia reúne a estratégia e o resultado funcional mais recente registrado. Histórico de execuções anteriores fica em [Alterações](ALTERACOES.md), na data e no commit correspondente.

## Suítes e comandos

| Comando               | Escopo                                                                       |
| --------------------- | ---------------------------------------------------------------------------- |
| npm run lint          | ESLint no código e nas regras locais de arquitetura                          |
| npm run format:check  | Prettier nos arquivos do Frontend                                            |
| npm run typecheck     | Verificação dos contratos JavaScript documentados em JSDoc                   |
| npm run test:coverage | Vitest, React Testing Library e limites mínimos de cobertura                 |
| npm run build         | Build Vite de produção e verificação de exclusão dos mocks                   |
| npm run test:bundle   | Verificações do conteúdo do bundle de produção                               |
| npm run test:e2e      | Playwright no navegador, com respostas interceptadas                         |
| npm run test:e2e:real | E2E opt-in contra API real; exige RUN_REAL_API=1, URL e credenciais de teste |
| npm run check:full    | lint, formatação, typecheck, cobertura, build, bundle e E2E                  |

Os testes Vitest ficam próximos ao código em src/; src/testing/ contém cobertura transversal. Playwright fica em e2e/. No PowerShell com política que bloqueia npm.ps1, use npm.cmd.

## Última execução registrada

**Data:** 07/11/2026. **Código:** c47346a (fix(frontend): align task assignments with manager scope). **Registro:** execução feita antes do commit documental c05d282; esta auditoria documental não reexecutou testes de aplicação.

| Verificação            | Resultado                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| npm.cmd run check:full | Passou: ESLint, Prettier, typecheck, 372 testes Vitest em 64 arquivos, build e 4 verificações de bundle |
| Cobertura Vitest       | 93,99% statements; 90,85% branches; 95,17% functions; 96,39% lines                                      |
| Playwright             | 36 cenários; 34 passaram, 0 falharam e 2 opt-in de API real foram ignorados                             |
| API real               | Não executada; ambiente e credenciais não estavam configurados                                          |

O E2E interceptado confirma que o navegador envia Bearer a /users/ e POST /tasks/, valida UUIDs de colaboradores e protege fluxos de sessão. Ele não comprova autorização, persistência, CORS ou isolamento no servidor. Backend, Agent e banco não foram executados na última validação do Frontend.

## O que cada teste comprova

- **Unitário/componente:** funções, validadores, hooks e interação da interface com respostas controladas.
- **MSW/desenvolvimento:** cliente e handlers de demonstração; Tasks são mantidas em memória e analytics candidatos podem responder vazio ou fixtures.
- **Playwright interceptado:** fluxo no navegador e integração do Frontend com respostas HTTP simuladas.
- **API real:** somente quando ambiente de teste autorizado e credenciais estão configurados. O teste atual cobre login/sessão, navegação em Configurações e download CSV/PDF, mas não comprova sozinho isolamento entre dois gestores ou fluxos do Agent.
- **Backend:** há testes em backend/tests, inclusive segurança, equipe e Tasks. Eles não foram executados nesta revisão documental.
- **Validação manual:** leitor de tela, zoom nativo, CORS/HTTPS externo, uso em redes distintas e navegadores/dispositivos reais dependem de homologação; acompanhe [Pendências Frontend](PENDENCIAS_FRONTEND.md) e [Pendências Backend](PENDENCIAS_BACKEND.md).

## Limites e critérios de registro

Testes simulados não comprovam contrato ou integração real. Testes do Frontend não validam migração, banco ou regras de autorização do Backend. Teste de status 200/MIME de exportação não verifica segurança contra fórmulas nem a correção do título do PDF.

Ao registrar uma nova execução, indique data, commit, comando, ambiente, resultados e cenários ignorados. Marque explicitamente se a resposta foi simulada ou veio da API real. Não reaproveite números de um commit para descrever outro.

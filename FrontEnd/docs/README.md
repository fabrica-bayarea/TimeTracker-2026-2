# Documentação do Frontend

Use este índice para localizar informações sobre o estado atual, a arquitetura e a manutenção do frontend.

## Estado atual

- [Funcionalidades](FUNCIONALIDADES.md): telas, comportamentos disponíveis e relação com os requisitos.
- [Pendências](PENDENCIAS.md): bloqueios organizados por área, impacto, prioridade e workaround.
- [Plano de execução](PLANO_EXECUCAO_FRONTEND.md): auditoria inicial, dependências, prioridades e validações desta revisão.
- [Matriz de issues](MATRIZ_ISSUES_FRONTEND.md): inventário oficial e classificação técnica das 38 issues consultadas.
- [Relatório da execução](RELATORIO_EXECUCAO_FRONTEND.md): mudanças, resultados reais dos testes, limites e próximos passos.

O frontend integra cadastro/login JWT, restauração em `sessionStorage`, logout e guarda de páginas após validar `/auth/me`. As rotas de dados do backend ainda não exigem JWT nem isolam equipes; consulte B-01 e [Pendências](PENDENCIAS.md). Tasks têm uma interface completa de demonstração local, com mocks voláteis; produção mantém a prévia desabilitada até a implementação do CRUD e da agregação no backend. A PR #122 do Agent foi integrada, mas o backend deste checkout ainda não apresenta geração/consulta de código, `POST /associate/` ou persistência do vínculo. O card agora aparece no Dashboard autenticado e comunica a dependência; consulta e cópia permanecem desabilitadas até existir contrato real.

## Arquitetura e contratos

- [Arquitetura](ARQUITETURA.md): estrutura do código, camadas, fluxo da aplicação, estado e decisões arquiteturais.
- [Contratos da API](CONTRATOS_API.md): endpoints consumidos, parâmetros, respostas, validação e comportamento do cliente HTTP.
- [Pendências](PENDENCIAS.md#propostas-de-contratos-de-integracao): fonte canônica para o status por ID e contratos candidatos ainda não implementados, incluindo CRUD/horas por Task, associação, jornada, autorização e fusos.

## Testes e histórico

- [Testes](TESTES.md): verificações automatizadas, evidências e roteiros manuais.
- [Alterações](ALTERACOES.md): histórico cronológico e resumo das revisões.

Atualize o documento correspondente quando mudar uma tela, uma decisão técnica, um contrato ou o resultado de uma verificação. Este índice serve como entrada e não duplica o conteúdo desses documentos.

## Público e ordem de leitura

Este acervo atende a quem desenvolve o Frontend, integra o Backend ou o Agent, revisa requisitos e verifica a entrega. Para uma leitura inicial, siga esta ordem:

1. [Funcionalidades](FUNCIONALIDADES.md) para entender o que a interface faz hoje e o que ainda é demonstração.
2. [Arquitetura](ARQUITETURA.md) para localizar os componentes, hooks, serviços e fluxos de dados.
3. [Contratos da API](CONTRATOS_API.md) para separar endpoints existentes das chamadas de demonstração.
4. [Propostas de contratos do Backend](PROPOSTA_CONTRATOS_BACKEND.md) para revisar decisões sugeridas e riscos de integração.
5. [Pendências](PENDENCIAS.md) para encontrar bloqueios, evidências, critérios de aceite e condições de desbloqueio.
6. [Matriz de issues](MATRIZ_ISSUES_FRONTEND.md) para navegar de uma issue oficial à sua situação técnica.
7. [Testes](TESTES.md) para entender cobertura, resultados registrados e verificações ainda manuais.
8. [Plano de execução](PLANO_EXECUCAO_FRONTEND.md), [Relatório](RELATORIO_EXECUCAO_FRONTEND.md) e [Alterações](ALTERACOES.md) para consultar contexto e histórico.

## Índice do acervo

| Documento                                                     | Finalidade principal                                                       |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [README](README.md)                                           | Entrada, ordem de leitura e regras de manutenção do acervo.                |
| [FUNCIONALIDADES](FUNCIONALIDADES.md)                         | Comportamento atual por tela, estados, requisitos, código e testes.        |
| [ARQUITETURA](ARQUITETURA.md)                                 | Estrutura React/Vite, dependências entre camadas e fluxos executados.      |
| [CONTRATOS_API](CONTRATOS_API.md)                             | Rotas implementadas no Backend e comportamento observado do cliente HTTP.  |
| [PROPOSTA_CONTRATOS_BACKEND](PROPOSTA_CONTRATOS_BACKEND.md)   | Alternativas técnicas ainda não aprovadas para os contratos ausentes.      |
| [PENDENCIAS](PENDENCIAS.md)                                   | Fonte principal de bloqueios por ID, evidência, impacto, solução e aceite. |
| [MATRIZ_ISSUES_FRONTEND](MATRIZ_ISSUES_FRONTEND.md)           | Estado oficial e classificação técnica das issues, com rastreabilidade.    |
| [TESTES](TESTES.md)                                           | Scripts, inventário, resultados datados, limites e roteiros de validação.  |
| [PLANO_EXECUCAO_FRONTEND](PLANO_EXECUCAO_FRONTEND.md)         | Diagnóstico, dependências, prioridades, execução e próximos marcos.        |
| [RELATORIO_EXECUCAO_FRONTEND](RELATORIO_EXECUCAO_FRONTEND.md) | Registro verificável das auditorias e mudanças realizadas.                 |
| [ALTERACOES](ALTERACOES.md)                                   | Histórico cronológico preservado das mudanças do Frontend.                 |

## Navegação por assunto

- **Login e sessão:** [Funcionalidades — Login e cadastro](FUNCIONALIDADES.md), [Arquitetura — Autenticação](ARQUITETURA.md), [Contratos — autenticação](CONTRATOS_API.md), issues #104, #112 e #138, e pendências I-01/B-01.
- **Tasks e vínculo de atividades:** [Funcionalidades — Tasks](FUNCIONALIDADES.md), [Contratos — Tasks e jornada](CONTRATOS_API.md), issues #129–#140 e propostas I-03/I-06.
- **Dashboard e colaboradores:** [Funcionalidades](FUNCIONALIDADES.md), [Arquitetura — fluxos do Painel](ARQUITETURA.md), issues #94–#109 e pendências I-05–I-07.
- **Associação do Agent:** [Contratos — associação](CONTRATOS_API.md), issues #105, #106 e #113–#116, e proposta I-02.
- **Relatórios e datas:** [Contratos da API](CONTRATOS_API.md), requisitos RF-24/RF-25, CA-07 e pendências I-06/I-07.
- **Qualidade:** [Testes](TESTES.md) e [Relatório](RELATORIO_EXECUCAO_FRONTEND.md).

## Como interpretar o estado das informações

Use as classificações no sentido abaixo ao ler ou acrescentar evidências:

- **IMPLEMENTADO:** o comportamento está presente no código consultado.
- **PARCIAL:** há implementação, mas o fluxo ou os critérios ainda não estão completos.
- **DEMONSTRATIVO:** depende de mocks/fixtures e não comprova persistência ou integração real.
- **PROPOSTO:** contrato ou comportamento candidato sem implementação/aceite confirmado.
- **BLOQUEADO:** depende de outro componente, decisão ou ambiente.
- **AGUARDANDO VALIDAÇÃO:** implementação existe, mas integração real ainda não foi comprovada.
- **HISTÓRICO:** registro válido para o commit e contexto indicados, não necessariamente para o checkout atual.
- **RESOLVIDO:** pendência encerrada dentro do escopo registrado; isso não altera o estado oficial de issues relacionadas. F-04 está resolvida somente para a rota demonstrativa local.

O estado oficial no GitHub e a conclusão técnica são dimensões diferentes. Uma issue fechada não comprova integração; uma issue aberta não significa que nada foi implementado. Consulte a [matriz](MATRIZ_ISSUES_FRONTEND.md) para ambas.

## Como manter a documentação rastreável

Ao alterar uma funcionalidade, atualize o documento que contém seu detalhe principal e conecte as referências pertinentes seguindo:

**Issue → requisito → funcionalidade → arquivo de código → contrato → teste → pendência.**

Registre caminhos relativos reais do checkout, links oficiais para issues/PRs e a data/commit em que a evidência foi consultada. Em resultado de teste, registre comando, ambiente, commit e resultado; mantenha tentativas históricas com suas datas em vez de substituí-las por resultados de outra versão.

Para uma dependência externa, abra ou atualize um item identificado em [Pendências](PENDENCIAS.md), com responsável, evidência, efeito, solução esperada, critérios verificáveis e condição de desbloqueio. Para atualizar a [matriz de issues](MATRIZ_ISSUES_FRONTEND.md), confira o GitHub e o código separadamente e preserve ambos os estados. Para um contrato novo, atualize [Contratos da API](CONTRATOS_API.md) somente após confirmar sua implementação; enquanto candidato, mantenha a marca **PROPOSTO** e a justificativa em [Propostas](PROPOSTA_CONTRATOS_BACKEND.md) e [Pendências](PENDENCIAS.md).

## Limite das fontes

O código de FrontEnd, Backend e Agent pode ser consultado para documentar o estado observado. Os documentos em [requisitos](../../requisitos/README.md) descrevem necessidades do produto e não provam que uma funcionalidade está entregue. Os resultados históricos em Testes/Relatório também não devem ser apresentados como uma execução atual. Esta revisão documental não altera contratos, issues, PRs nem código externo ao Frontend.

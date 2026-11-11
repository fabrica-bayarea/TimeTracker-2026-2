# Documentação do Frontend

Este índice organiza a documentação técnica do Frontend do TimeTracker. Revisão documental realizada em **07/11/2026**, no HEAD **c05d282**. O código funcional mais recente usado como evidência está no commit **c47346a**; o commit seguinte registra documentação e não altera código.

## Estado geral

Login JWT do gestor, sessão, rotas protegidas, CRUD de Tasks e seleção de colaboradores da equipe estão implementados no Frontend e nos contratos locais. A última execução registrada em 07/11/2026 aprovou 372 testes Vitest e 34 cenários E2E; dois cenários opt-in de API real foram ignorados. Não há homologação da API real, implantação HTTPS nem métricas reais por Task. A seleção de Tasks no Agent e o envio de task_id ainda não estão integrados. Configurações e categorias continuam globais no Backend observado. Os documentos de requisitos divergem sobre PWA; essa decisão está em FE-04.

## Índice

| Documento                                     | Fonte principal para                                             |
| --------------------------------------------- | ---------------------------------------------------------------- |
| [Pendências Backend](PENDENCIAS_BACKEND.md)   | Trabalho do Backend e decisões externas que bloqueiam o Frontend |
| [Pendências Frontend](PENDENCIAS_FRONTEND.md) | Trabalho, integração ou validação atribuídos ao Frontend         |
| [Alterações](ALTERACOES.md)                   | Histórico único e cronológico do projeto                         |
| [Arquitetura](ARQUITETURA.md)                 | Camadas, fluxos e limites técnicos vigentes                      |
| [Contratos da API](CONTRATOS_API.md)          | Endpoints consumidos, payloads, respostas e status               |
| [Funcionalidades](FUNCIONALIDADES.md)         | Inventário do comportamento visível por módulo                   |
| [Testes](TESTES.md)                           | Suítes, comandos, último resultado e limites de validação        |

Para entender o comportamento atual, consulte primeiro [Funcionalidades](FUNCIONALIDADES.md), depois [Arquitetura](ARQUITETURA.md) e [Contratos da API](CONTRATOS_API.md). Use as duas listas de pendências para trabalho aberto e [Alterações](ALTERACOES.md) para decisões e estados históricos.

## Convenções de estado

- **Pendente:** requisito necessário ainda sem implementação.
- **Parcialmente implementado:** parte do comportamento está presente, com lacunas verificáveis.
- **Implementado, não homologado:** código e testes locais existem, mas integração real não foi comprovada.
- **Bloqueado:** depende de contrato, decisão ou ambiente externo identificado.
- **Resolvido:** requisitos do item foram comprovados; sai da lista ativa e, quando relevante, vai para Alterações.
- **Demonstração:** comportamento sustentado por fixtures/MSW, sem prova de persistência ou API real.
- **Histórico:** estado válido para a data e o commit indicados, não necessariamente para o checkout atual.

O estado oficial de uma Issue no GitHub não equivale ao estado técnico. Uma implementação local não fecha a Issue por si só, e testes interceptados não comprovam comportamento do servidor.

## Manutenção

1. Registre novas dependências do Backend apenas em [Pendências Backend](PENDENCIAS_BACKEND.md) e trabalho exclusivo da aplicação em [Pendências Frontend](PENDENCIAS_FRONTEND.md).
2. Registre mudanças efetivas em [Alterações](ALTERACOES.md), adicionando-as à seção da data existente.
3. Mantenha contratos, arquitetura e funcionalidades em seus documentos principais.
4. Atualize em [Testes](TESTES.md) somente estratégia e resultados realmente executados, com commit e ambiente.
5. Retire da lista ativa itens comprovadamente concluídos; preserve decisões relevantes no histórico.
6. Não declare funcionalidade concluída sem evidência adequada e diferencie código, testes, homologação e dependências externas.

## Fontes e escopo

O código atual e seus testes têm precedência para descrever implementação; requisitos definem comportamento esperado. Backend, Agent e requisitos podem ser consultados para auditoria, mas esta documentação não altera arquivos desses diretórios. Consulte a pasta [requisitos](../../requisitos/README.md) para os documentos de origem.

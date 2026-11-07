# Funcionalidades do Frontend

Inventário do comportamento observável no código funcional do commit **c47346a**. O HEAD **c05d282** registra apenas documentação. “Implementado” descreve comportamento presente no Frontend; não significa aceite completo de um requisito nem homologação contra uma API implantada.

## Login e sessão

**Estado:** implementado no Frontend; homologação real pendente.

Cadastro e login consultam a API. Após login, o Frontend valida a identidade do gestor em /auth/me, armazena o JWT em sessionStorage e protege as páginas. Logout remove a sessão. Resposta 401 limpa a sessão; 403 mostra falta de permissão sem expirar o gestor. O perfil validado fornece o código de associação de seis dígitos, preservando zeros à esquerda.

O código pode ser exibido e copiado pelo gestor. A associação ponta a ponta ainda depende do Agent chamar o contrato atual do Backend. O token de gestor não substitui o token de Agent. Veja [FE-01](PENDENCIAS_FRONTEND.md#fe-01--homologar-sessão-e-operações-de-equipe-com-api-real) e a tabela de dependências em [Pendências Backend](PENDENCIAS_BACKEND.md#dependências-externas-que-não-são-tarefas-do-backend).

## Dashboard

**Estado:** dados diários e realtime disponíveis; analytics por Task indisponível em produção.

O Painel consulta resumo diário, equipe, estado de atividade e código do gestor. Filtros de data e colaborador afetam as fontes compatíveis. Aplicativo filtra a lista realtime no cliente. O catálogo de Tasks pode ser consultado pela API autenticada, mas a produção não tem endpoint de agregação por Task. A seção “Entrada e último registro” também fica indisponível em produção; a resposta simulada de jornada só é usada em desenvolvimento.

Cards de resumo, produtividade e timeline por Task distinguem carregamento, falha, vazio e valores válidos. Em produção permanecem indisponíveis até existir contrato real; MSW pode mostrar apenas demonstração. O Frontend não converte atividade por categoria em produtividade por Task nem estima duração a partir de snapshots realtime. As dependências estão em [BE-12](PENDENCIAS_BACKEND.md#be-12--persistir-taskid-e-fornecer-agregação-real-por-task), [BE-14](PENDENCIAS_BACKEND.md#be-14--fornecer-resumo-diário-de-primeiro-e-último-registro) e [FE-02](PENDENCIAS_FRONTEND.md#fe-02--conectar-jornada-e-analytics-reais-do-dashboard).

## Colaboradores

**Estado:** lista da equipe do gestor e última atividade aproximada integradas.

A tela combina /users/ autenticado com /activities/realtime, permite filtrar pessoas e aplicações e apresenta tabela ou cards conforme a largura. Falha parcial mantém a informação disponível e identifica a fonte indisponível.

online, ausente e offline são rótulos calculados pelo Backend a partir de atividade; não comprovam conexão da máquina ou do Agent. Pessoa sem leitura recente aparece como “Sem dados”. Consulte [BE-10](PENDENCIAS_BACKEND.md#be-10--separar-inatividade-de-conexão-do-agent) e [BE-14](PENDENCIAS_BACKEND.md#be-14--fornecer-resumo-diário-de-primeiro-e-último-registro).

## Tasks

**Estado:** CRUD autenticado e atribuição da equipe implementados; monitoramento pelo Agent e analytics reais não integrados.

A tela lista, cria, edita e remove Tasks pelo CRUD do Backend. O formulário consulta /users/ com Bearer e valida UUIDs antes de oferecer atribuições; o Backend confirma a equipe ao salvar. Busca e ordenação são locais à lista. Atribuição não inicia captura nem garante que o Agent receba a Task.

Com VITE_USE_MOCKS=true em desenvolvimento, o CRUD demonstrativo persiste apenas em memória. Tarefas e analytics do MSW não são dados da API real. A consulta de Tasks pelo Agent ainda depende de Backend/Agent (BE-11), e a associação entre atividade e Task depende de BE-12.

## Configurações

**Estado:** leitura e edição de valores globais do sistema.

A tela lê e grava intervalo de captura e limite de inatividade em /config/. Exige valores inteiros positivos, sinaliza alteração não salva, permite restaurar valores e cancela consultas ao sair. O Backend observado não exige JWT nem aplica escopo de gestor para esse endpoint. O realtime ainda usa limites próprios, de modo que salvar idle_timeout_seconds não garante mudança do status recebido.

Escopo global ou por gestor aguarda decisão, e a integração do limite com o realtime continua pendente: [BE-05](PENDENCIAS_BACKEND.md#be-05--aplicar-o-limite-salvo-de-inatividade-ao-realtime) e [BE-13](PENDENCIAS_BACKEND.md#be-13--definir-acesso-a-configurações-e-categorias).

## Relatórios

**Estado:** exportação diária de resumo por categoria; requisitos de relatório completo permanecem parciais.

A página filtra por data e, quando /users/ responde, por colaborador. Exporta CSV ou PDF via endpoints de resumo diário e verifica status, MIME e conteúdo não vazio antes de iniciar o download.

O CSV contém username, category e total_seconds; o PDF contém data, total por colaborador e duração por categoria. Não são relatórios por intervalo, Task, aplicação, jornada ou hora extra. Segurança de conteúdo CSV e título do PDF dependem de BE-08.

## Acessibilidade e responsividade

**Estado:** cobertura automatizada documentada; validação humana pendente.

O layout suporta menu móvel, navegação por teclado, foco visível, labels, estados anunciáveis, tabelas adaptáveis e movimento reduzido. axe-core e Playwright cobrem cenários listados em [Testes](TESTES.md). Leitor de tela, zoom nativo e matriz de navegadores/dispositivos ainda não foram homologados: [FE-03](PENDENCIAS_FRONTEND.md#fe-03--validar-acessibilidade-manual-e-navegadores-alvo).

A aplicação não tem manifest ou service worker de produto. A visão chama o Dashboard de PWA, enquanto a diretriz de responsividade diz que ele não é instalável. A divergência está em [FE-04](PENDENCIAS_FRONTEND.md#fe-04--resolver-o-requisito-conflitante-de-pwa).

## Requisitos relacionados

| Área                      | Requisitos relacionados                         | Estado técnico observado                                                                               |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Autenticação e associação | RF-02, RF-03; CA-01                             | Sessão do gestor e código no perfil implementados; associação do Agent não homologada                  |
| Colaboradores             | RF-05, RF-16                                    | Lista escopada por gestor; conexão real do Agent não comprovada                                        |
| Tasks                     | RF-06, RF-07, RF-08, RF-09, RF-11               | CRUD e atribuições implementados; seleção pelo Agent e registro de Task nas atividades ausentes        |
| Configurações             | RF-20, RF-21                                    | Valores globais; configuração de jornada não disponível e limite não governa realtime                  |
| Dashboard e relatórios    | RF-22, RF-24, RF-25, RF-27, RF-28; CA-07, CA-10 | Resumo/exportação diária parciais; agregação por Task, jornada, timeline e períodos completos ausentes |

Os documentos de [requisitos](../../requisitos/README.md) descrevem o esperado, não comprovam que o critério foi atendido. Contratos efetivamente consumidos estão em [Contratos da API](CONTRATOS_API.md).

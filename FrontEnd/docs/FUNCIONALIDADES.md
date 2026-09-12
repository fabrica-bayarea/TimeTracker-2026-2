# Como o painel funciona

O TimeTrack é uma página única de acompanhamento de tempo de uma equipe. O componente `App.jsx` mantém os filtros e entrega dados aos cards, gráficos, tabela e área de relatórios.

## Jornada de uso

1. Ao abrir a página, a data selecionada é o dia local do navegador.
2. O dashboard busca dados da API e mostra o estado “Conectando à API”.
3. Após a resposta, o usuário pode filtrar por data e por colaborador, alternar o tema e atualizar manualmente.
4. A atualização automática vem ativada e refaz a consulta a cada 30 segundos; ela pode ser desligada na seção “Atualização do painel”.
5. Os links CSV e PDF baixam o relatório do backend já respeitando os filtros em uso.

## O que cada área mostra

| Área | Comportamento atual | Origem |
| --- | --- | --- |
| Cabeçalho | Data, colaborador, tema, status da API, atualização e horário da última resposta. | Estado local, `/users/` e `useDashboardData`. |
| Tempo monitorado | Soma `total_seconds` de todos os usuários no resumo selecionado. | `/dashboard/summary`. |
| Tempo produtivo | Soma as categorias, exceto `Social` e `Outros`. É regra provisória do frontend. | `/dashboard/summary`. |
| Em atividade agora | Conta registros cujo `status` é `online`; ao filtrar pessoa, respeita o filtro. | `/activities/realtime`. |
| Software mais usado | Ainda não há dado real; informa que o endpoint não está disponível. | Placeholder. |
| Atividade da equipe | Compara horas monitoradas e produtivas dos últimos sete dias, terminando na data escolhida. | Sete consultas a `/dashboard/summary`. |
| Tempo por categoria | Agrupa categorias de todos os usuários e apresenta o total. | `/dashboard/summary`. |
| Aplicativos mais usados | Exibe amostra enquanto não existe endpoint de ranking. | `src/data/dashboardData.js`. |
| Timeline | Exibe amostra enquanto não existe endpoint de intervalos. | `src/data/dashboardData.js`. |
| Equipe em atividade | Exibe última leitura por pessoa, aplicativo, janela, categoria e status. | `/activities/realtime`. |
| Relatórios | Oferece download CSV e PDF da API para data e pessoa atuais. | `/dashboard/export/*`. |

## Carregamento, falha e ausência de dados

- **Carregando:** a primeira consulta do filtro limpa dados de outro filtro e informa que está consultando a API.
- **Atualizando:** quando já há dados para o mesmo filtro, eles continuam visíveis enquanto a nova consulta ocorre.
- **Falha:** uma mensagem informa que a API está indisponível. Componentes que possuem amostra usam conteúdo demonstrativo para o protótipo continuar navegável.
- **Resposta vazia:** quando a API respondeu, mas não há atividades, o componente mostra um estado vazio; não deve simular dados reais.
- **Troca rápida de filtros:** a consulta anterior é cancelada para impedir que uma resposta atrasada sobrescreva o filtro atual.

## O que não funciona ainda

- Não é possível pausar ou retomar o agente: isso exigiria endpoint específico.
- Ranking real de aplicativos e timeline real dependem de endpoints ainda inexistentes.
- A seção Configurações é apenas visual.
- Não há autenticação, autorização ou testes automatizados neste frontend.

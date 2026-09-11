# Integracao entre Frontend e Backend

## Atualizacao do dashboard (setembro de 2026)

Esta etapa alterou somente o frontend. Nenhum endpoint, modelo, regra de negócio ou arquivo do backend foi modificado.

Os aprimoramentos usam exclusivamente os endpoints já documentados nesta página:

- a data selecionada inicia no dia atual local e é enviada para o resumo diário;
- o painel oferece atualização manual e atualização automática a cada 30 segundos, que pode ser desativada pelo usuário;
- o hook preserva o último resultado válido ao atualizar a mesma data e o mantém visível se uma consulta posterior falhar;
- ao trocar de data, o resultado anterior é descartado até a resposta da nova consulta, evitando dados inconsistentes;
- respostas vazias da API são representadas como estados vazios na interface, sem substituir silenciosamente por conteúdo demonstrativo;
- o CSV e o PDF agora sao solicitados diretamente aos endpoints de exportacao do backend, respeitando data e colaborador selecionados.

O controle de “pausar acompanhamento” foi substituído por um controle de atualização automática. Pausar ou retomar o agente exigiria um endpoint próprio e, por isso, não é uma ação disponibilizada pelo frontend.

## Resumo executivo

Foi realizada a primeira integracao do dashboard React com a API FastAPI existente. O frontend deixou de depender exclusivamente dos dados demonstrativos para as informacoes de equipe, atividade em tempo real, categorias e tempo monitorado.

Nenhum arquivo do backend foi alterado. A implementacao usa os endpoints que ja estavam disponiveis e apenas adiciona no frontend a camada de comunicacao, o carregamento dos dados e a adaptacao das respostas para os componentes visuais.

## Objetivo

Permitir que o dashboard consulte informacoes reais armazenadas no banco de dados por meio da API, mantendo a interface utilizavel mesmo quando a API estiver fora do ar.

O fluxo atual e:

```mermaid
flowchart LR
  A[Agente desktop] -->|envia atividades| B[API FastAPI]
  B -->|consulta| C[(PostgreSQL)]
  D[Dashboard React] -->|GET resumo diario| B
  D -->|GET atividade em tempo real| B
  B -->|JSON| D
```

## O que foi implementado

### 1. Cliente HTTP no frontend

Foi criado [src/services/api.js](../src/services/api.js).

Responsabilidades:

- definir a URL base da API;
- realizar requisicoes com `fetch`;
- verificar respostas HTTP malsucedidas;
- buscar usuarios, resumo diario, atividade em tempo real e os sete resumos usados no grafico semanal;
- montar URLs para exportacoes CSV e PDF com os filtros atuais.

A URL padrao e:

```text
http://localhost:8000
```

Ela pode ser substituida pela variavel de ambiente `VITE_API_URL`.

### 2. Carregamento controlado dos dados

Foi criado o hook `useDashboardData` em [src/hooks/useDashboard.js](../src/hooks/useDashboard.js).

Esse hook:

- inicia a consulta com a data atual do ambiente do usuário;
- expõe `refresh` para atualização manual e pode atualizar automaticamente a cada 30 segundos;
- diferencia o carregamento inicial (`loading`) de uma atualização com dados visíveis (`refreshing`);
- registra `updatedAt`, usado para informar ao usuário quando os dados foram atualizados;
- mantém dados apenas enquanto eles correspondem à data selecionada;
- recebe a data e o colaborador selecionados no dashboard;
- dispara as consultas da API em paralelo;
- controla os estados `loading`, `data` e `error`;
- cancela a requisicao anterior quando a data muda ou o componente e desmontado;
- evita atualizar a tela com uma requisicao cancelada.

As consultas sao:

```text
GET /dashboard/summary?date=AAAA-MM-DD
GET /dashboard/summary?date=AAAA-MM-DD&username=colaborador
GET /activities/realtime
GET /users/
GET /dashboard/export/csv?date=AAAA-MM-DD&username=colaborador
GET /dashboard/export/pdf?date=AAAA-MM-DD&username=colaborador
```

### 3. Integracao no componente principal

Em [src/App.jsx](../src/App.jsx), o dashboard passou a:

- chamar `useDashboardData`;
- enviar a data selecionada para a API;
- somar o tempo total retornado para o indicador de tempo monitorado;
- contar pessoas com status `online`;
- passar o resumo para o grafico de categorias;
- passar a atividade em tempo real para a tabela da equipe;
- mostrar estados de carregamento e indisponibilidade;
- informar no cabecalho se a API esta conectando, online ou offline.

### 4. Adaptacao dos componentes

O componente [src/components/CategoryChart.jsx](../src/components/CategoryChart.jsx) agora transforma `users[].by_category` da API em uma lista agregada por categoria. Assim, categorias repetidas entre colaboradores sao somadas antes de serem exibidas no grafico.

O componente [src/components/PeopleCard.jsx](../src/components/PeopleCard.jsx) transforma cada registro de `/activities/realtime` no formato visual esperado pela tabela:

| Resposta da API | Exibicao no frontend |
|---|---|
| `username` | Colaborador |
| `hostname` | Maquina |
| `process_name` | Aplicativo |
| `window_title` | Janela |
| `category` | Categoria |
| `status` | Status |
| `seconds_since_last_activity` | Ultima atividade |

## Endpoints utilizados

### Resumo diario

```http
GET /dashboard/summary?date=2026-09-06
```

Usado para obter:

- total de segundos por colaborador;
- distribuicao do tempo por categoria;
- cor configurada para cada categoria.

Quando o filtro de colaborador esta preenchido, o parametro `username` e enviado ao backend.

### Atividade em tempo real

```http
GET /activities/realtime
```

Usado para obter:

- colaborador;
- maquina;
- processo ativo;
- titulo da janela;
- categoria classificada;
- status online ou ausente;
- tempo desde a ultima atividade.

### Usuarios

```http
GET /users/
```

Alimenta o seletor de colaboradores do dashboard.

### Exportacoes

Os botoes CSV e PDF usam diretamente:

```http
GET /dashboard/export/csv?date=AAAA-MM-DD
GET /dashboard/export/pdf?date=AAAA-MM-DD
```

O filtro `username` e acrescentado quando um colaborador e selecionado.

## Exemplo de resposta esperada

Resumo diario:

```json
{
  "date": "2026-09-06",
  "users": [
    {
      "username": "ana",
      "total_seconds": 24120,
      "by_category": [
        {
          "category": "Desenvolvimento",
          "color": "#6551e1",
          "total_seconds": 18000
        }
      ]
    }
  ]
}
```

Atividade em tempo real:

```json
[
  {
    "username": "ana",
    "hostname": "DESK-AC-01",
    "process_name": "Code.exe",
    "window_title": "feature/dashboard.jsx",
    "category": "Desenvolvimento",
    "is_idle": false,
    "seconds_since_last_activity": 12,
    "status": "online"
  }
]
```

## Tratamento de indisponibilidade

Quando a API nao responde ou retorna erro HTTP:

- o erro e armazenado pelo hook;
- o cabecalho mostra `API offline`;
- o dashboard mostra uma mensagem de indisponibilidade;
- os componentes usam os dados demonstrativos existentes como fallback.

Esse comportamento permite apresentar e navegar pelo prototipo sem banco ou backend ativos, mas deixa visivel que os dados nao sao reais naquele momento.

## O que foi implementado no frontend

- filtro por colaborador;
- filtro por data;
- atualizacao manual e automatica a cada 30 segundos;
- indicador de estado da API;
- tratamento de carregamento, erro e resposta vazia;
- tabela de equipe com dados de `/activities/realtime`;
- categorias agregadas a partir do resumo diario;
- tempo monitorado calculado a partir dos segundos retornados pela API;
- tempo produtivo derivado das categorias, considerando `Social` e `Outros` como nao produtivas;
- grafico semanal obtido por sete consultas de resumo diario;
- exportacao CSV e PDF usando os endpoints do backend;
- preservacao do fallback demonstrativo somente quando a API esta indisponivel.

## O que ainda falta

Ainda existem dependencias que nao podem ser resolvidas somente no frontend:

- ranking de aplicativos por tempo de uso: falta endpoint com agrupamento por processo e duracao;
- timeline do expediente: falta endpoint com intervalos de atividade, inicio, fim e duracao;
- informacoes fixas do agente na secao de status.

O grafico semanal ja foi integrado usando sete chamadas ao endpoint de resumo diario. O tempo produtivo e uma metrica derivada no frontend; para uma regra oficial, o backend ou o contrato do produto deve definir quais categorias sao produtivas.

Pendencias proprias do frontend:

- adicionar testes unitarios e de componentes;
- testar a experiencia com API indisponivel e respostas vazias;
- revisar acessibilidade do seletor e dos links de download;
- substituir a regra provisoria de produtividade por uma regra aprovada pelo produto;
- integrar ranking e timeline quando os endpoints forem disponibilizados.

## Como executar

Com a API disponivel em `http://localhost:8000`:

```powershell
cd FrontEnd
npm.cmd install
npm.cmd run dev
```

Para usar outra URL:

```powershell
$env:VITE_API_URL="http://servidor-da-api:8000"
npm.cmd run dev
```

A aplicacao pode ser acessada normalmente em `http://localhost:5173`.

## Validacao realizada

O build de producao foi executado com sucesso:

```text
npm.cmd run build
vite build
built successfully
```

Tambem foi feita verificacao de erros nos arquivos alterados do frontend, sem erros encontrados.

## Mensagem para apresentacao a lideranca

> O frontend foi conectado aos endpoints existentes do backend sem alterar a API. O dashboard agora consulta usuarios, resumos diarios, atividade em tempo real e os sete dias usados no grafico semanal. Tambem envia filtros, calcula indicadores derivados, e direciona CSV e PDF para os endpoints oficiais. Permanecem pendentes apenas os dados que a API ainda nao fornece, como ranking de aplicativos por duracao e timeline detalhada do expediente.

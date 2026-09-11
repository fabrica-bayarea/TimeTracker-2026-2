# Integração frontend–backend

## Configuração

O cliente HTTP está em `src/services/api.js`. A URL é `VITE_API_URL`, sem barra final; quando ausente, vale `http://localhost:8000`.

```powershell
$env:VITE_API_URL = "http://localhost:8000"
npm.cmd run dev
```

O backend deve liberar a origem do Vite durante desenvolvimento quando estiver em host/porta diferentes.

## Requisições feitas pelo painel

| Método e rota | Parâmetros | Consumidor |
| --- | --- | --- |
| `GET /dashboard/summary` | `date` obrigatório; `username` opcional | Métricas e categorias. |
| `GET /activities/realtime` | — | Pessoas online e tabela. |
| `GET /users/` | — | Seletor de colaborador. |
| `GET /dashboard/export/csv` | `date`; `username` opcional | Download CSV. |
| `GET /dashboard/export/pdf` | `date`; `username` opcional | Download PDF. |

Para o gráfico semanal, o cliente faz sete chamadas ao resumo: seis dias antes da data escolhida e a própria data. Todas as chamadas do ciclo são paralelas.

## Formatos esperados

### Resumo diário

```json
{
  "date": "2026-09-11",
  "users": [{
    "username": "ana",
    "total_seconds": 24120,
    "by_category": [{
      "category": "Desenvolvimento",
      "color": "#6551e1",
      "total_seconds": 18000
    }]
  }]
}
```

### Atividade em tempo real

```json
[{"username":"ana","hostname":"DESK-01","process_name":"Code.exe","window_title":"App.jsx","category":"Desenvolvimento","status":"online","seconds_since_last_activity":12}]
```

### Usuário

O seletor espera itens com `username` e, opcionalmente, `full_name`. Se `full_name` não vier, exibe o próprio `username`.

## Regras e tratamento de erros

- Qualquer status HTTP fora da faixa de sucesso gera erro no cliente.
- O parâmetro `username` é codificado com `encodeURIComponent` e só é incluído quando preenchido.
- Um `AbortError` é esperado ao trocar filtros e não é exibido como falha.
- Dados de um filtro anterior não são mostrados para outro filtro.
- As exportações são links diretos; a autenticação, cabeçalhos e formato de arquivo devem ser definidos pelo backend.

## Endpoints ainda necessários

| Necessidade visual | Contrato mínimo sugerido |
| --- | --- |
| Ranking de aplicativos | Período/filtro e lista de processo, duração e percentual. |
| Timeline | Período/filtro e intervalos com início, fim, duração e categoria. |
| Controle do agente | Estado atual e comandos autenticados para pausar/retomar. |
| Produtividade oficial | Total calculado ou definição versionada das categorias produtivas. |

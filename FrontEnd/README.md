# TimeTracker.Web

Frontend atual do Time Tracker. Este projeto contém o dashboard web usado para validar a experiência de acompanhamento de tempo, presença da equipe e relatórios gerenciais.

Para conhecer o produto completo, o escopo do MVP e o contexto acadêmico, consulte o [README da raiz](../README.md). Este documento permanece focado no funcionamento técnico desta aplicação.

## Estado atual

O frontend é um protótipo navegável com **dados demonstrativos**. Ele não se conecta a uma API, banco de dados ou agente de monitoramento nesta etapa.

## Como executar

### Pré-requisitos

- [Node.js 20 ou superior](https://nodejs.org/);
- navegador moderno com JavaScript habilitado;
- PowerShell, Prompt de Comando ou terminal integrado do VS Code.

Confirme as versões instaladas:

```powershell
node --version
npm.cmd --version
```

### Desenvolvimento

Na raiz do repositório, instale as dependências e inicie o servidor Vite:

```powershell
cd TimeTracker.Web
npm.cmd install
npm.cmd run dev
```

Abra [http://localhost:5173](http://localhost:5173) no navegador. O servidor atualiza a página automaticamente quando os arquivos em `src/` são alterados. Para encerrá-lo, pressione `Ctrl+C`.

O uso de `npm.cmd` evita o erro de política de execução do PowerShell relacionado ao arquivo `npm.ps1`. No Prompt de Comando, `npm` também pode ser usado normalmente.

### Build e preview de produção

```powershell
cd TimeTracker.Web
npm.cmd run build
npm.cmd run preview
```

Abra a URL exibida no terminal, normalmente [http://localhost:4173](http://localhost:4173). O build gera os arquivos de produção na pasta `dist/`.

Não existem testes automatizados configurados nesta etapa. A validação atual é feita pelo build e pela inspeção manual das páginas nos modos desktop e mobile.

## Estrutura do projeto

```text
TimeTracker.Web/
├── src/
│   ├── App.jsx              # Composição principal do dashboard
│   ├── data/                # Dados demonstrativos da interface
│   ├── hooks/               # Estado de tema e navegação
│   └── utils/               # Exportação e transformação de relatórios
├── docs/                    # Documentação técnica e screenshots
├── legacy/blazor/           # Implementação Razor/.NET mantida para transição
├── index.html               # Documento base do Vite
├── package.json              # Scripts e dependências do Vite
├── vite.config.js           # Configuração do Vite
└── tailwind.config.js       # Configuração do Tailwind CSS
```

React é a implementação principal do dashboard. Os arquivos Razor/.NET e os recursos em `legacy/blazor/` permanecem no repositório apenas como legado de transição e não são usados pelo servidor Vite.

## Fluxo previsto com a API

```text
Agente Windows
  └─ envia processo, título, usuário, máquina e timestamp
       ▼
API FastAPI + PostgreSQL
  ├─ categoriza por regras
  ├─ calcula indicadores
  └─ entrega dados autenticados
       ▼
Dashboard web
  ├─ visão em tempo real
  ├─ sumário diário
  └─ relatórios CSV/PDF
```

Quando a API for integrada, os dados fictícios de `src/data/dashboardData.js` deverão ser substituídos por serviços tipados, estados de carregamento, tratamento de erro e atualização periódica. A tela não deve expor dados sensíveis além dos campos autorizados no SRS.

## Próximas etapas técnicas

1. Definir o contrato OpenAPI dos endpoints de visão em tempo real, sumário diário e configurações.
2. Criar um cliente HTTP tipado e estados de carregamento, vazio e erro no frontend.
3. Integrar autenticação e autorização para o perfil de gestor.
4. Substituir os dados demonstrativos por respostas da API.
5. Adicionar testes de componentes e testes de acessibilidade/responsividade.
6. Conectar exportações aos dados filtrados pelo período e colaborador selecionados.

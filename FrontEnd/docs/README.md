# Documentação do frontend

Este diretório descreve a implementação React que está em `FrontEnd/src/`. Ele é o ponto de entrada para quem usa, mantém ou integra o painel TimeTrack.

| Documento | Quando consultar |
| --- | --- |
| [Como o painel funciona](FUNCIONALIDADES.md) | Para entender cada tela, filtro, métrica e estado visual. |
| [Catálogo de Componentes](COMPONENTES.md) | Para consultar propriedades (props), acessibilidade e comportamento de cada componente. |
| [Hooks Customizados](HOOKS.md) | Para entender assinaturas, ciclos de vida e regras dos custom hooks (`useDashboardData`, `useTheme`, `useActiveSection`). |
| [Arquitetura](ARQUITETURA.md) | Para localizar responsabilidades, fluxo de dados e decisões técnicas. |
| [Guia de Testes Automatizados](TESTES.md) | Para executar, criar e entender os testes com Vitest e Testing Library. |
| [Integração frontend–backend](INTEGRACAO-FRONTEND-BACKEND.md) | Para implementar, testar ou alterar a API consumida pelo painel. |
| [Estilos e interface](STYLES.md) | Para criar ou alterar componentes visuais sem quebrar o tema. |
| [Contribuição](CONTRIBUTING.md) | Para preparar uma mudança e validá-la com o checklist de PR. |
| [Histórico de refatoração](REFACTORING.md) | Para entender a organização atual e o que já foi melhorado. |
| [Backend e implementação legada](BACKEND.md) | Para diferenciar a API externa do protótipo Blazor arquivado. |

## Início rápido

```powershell
cd FrontEnd
npm.cmd install
npm.cmd run dev
```

O painel abre normalmente em `http://localhost:5173`. Ele consulta `http://localhost:8000` por padrão; defina `VITE_API_URL` antes de iniciar o Vite para apontar para outro servidor:

```powershell
$env:VITE_API_URL = "http://servidor-da-api:8000"
npm.cmd run dev
```

### Validação

```powershell
# Execução da suíte de testes
npm.cmd test

# Build de produção
npm.cmd run build
```

O resumo de instalação e as dependências também estão no [README principal do frontend](../README.md).

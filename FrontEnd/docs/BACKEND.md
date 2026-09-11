# Backend, API e código legado

## Limite de responsabilidade

O frontend ativo é React/Vite e está em `FrontEnd/src/`. A API de produção é um serviço externo consumido por HTTP; este repositório não contém sua implementação ativa nesta pasta. O contrato usado pelo frontend está em [Integração frontend–backend](INTEGRACAO-FRONTEND-BACKEND.md).

## Implementação Blazor legada

`FrontEnd/legacy/blazor/` é um protótipo anterior, separado do build atual. Ele contém um projeto .NET 10 com uma única página e dados visuais estáticos.

- `Program.cs` registra Razor Components e renderização interativa no servidor.
- `Components/Pages/Home.razor` contém o dashboard de demonstração.
- `Components/Layout/MainLayout.razor` contém a navegação lateral.
- `wwwroot/` contém CSS e JavaScript próprios.

Ele não fornece os endpoints que o dashboard React consome, não participa de `npm.cmd run dev` e não deve ser tratado como backend da aplicação atual.

Se for necessário executar o protótipo apenas para consulta visual:

```powershell
cd FrontEnd/legacy/blazor
dotnet run
```

Mudanças no legado só devem ser feitas quando houver uma decisão explícita de mantê-lo ou migrá-lo; novas funcionalidades pertencem ao React ativo.

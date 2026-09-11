using TimeTracker.Web.Components;

/**
 * Aplicação TimeTracker Dashboard
 * 
 * Dashboard de rastreamento de tempo para equipes com:
 * - Interface Blazor com renderização Server-Side
 * - Componentes interativos
 * - Suporte a temas (claro/escuro)
 * - Exportação de relatórios
 */

// ============================================================================
// CONFIGURAÇÃO DO BUILDER E SERVIÇOS
// ============================================================================

var builder = WebApplication.CreateBuilder(args);

// Adiciona serviços necessários para a aplicação
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// Pode-se adicionar aqui outros serviços conforme necessário:
// builder.Services.AddScoped<IDataService, DataService>();
// builder.Services.AddHttpClient();
// builder.Services.AddCors(options => { ... });

var app = builder.Build();

// ============================================================================
// CONFIGURAÇÃO DO PIPELINE HTTP
// ============================================================================

// Configurações diferentes para desenvolvimento e produção
if (!app.Environment.IsDevelopment())
{
    // Em produção, exibe uma página de erro genérica (não expõe detalhes)
    // sem criar novo scope para erros
    app.UseExceptionHandler("/Error", createScopeForErrors: false);
    
    // Força HTTPS em produção para segurança
    app.UseHsts();
}

// Middleware de segurança e funcionalidades
app.UseHttpsRedirection();      // Redireciona HTTP para HTTPS
app.UseStaticFiles();           // Serve arquivos estáticos (CSS, JS, imagens)
app.UseAntiforgery();           // Proteção contra CSRF

// ============================================================================
// ROTAS E COMPONENTES
// ============================================================================

// Mapeia componentes Razor e habilita renderização Server-Side interativa
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

// Pode-se adicionar rotas customizadas aqui:
// app.MapGet("/api/data", async () => { ... });
// app.MapPost("/api/save", async () => { ... });

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

// Inicia o servidor web
app.Run();

# TimeTracker Backend - Documentação

Aplicação ASP.NET Core com Blazor Server Side, construída com .NET 10.0.

## 🚀 Setup Inicial

### Pré-requisitos
- .NET 10.0 SDK ou superior
- Visual Studio 2022 ou VS Code

### Instalação

```bash
# Executar os comandos a partir da pasta do backend legado
cd legacy/blazor

# Restaurar dependências
dotnet restore

# Compilar projeto
dotnet build

# Executar aplicação
dotnet run

# Em desenvolvimento com watch
dotnet watch
```

## 📁 Estrutura do Projeto

```
legacy/blazor/
├── Components/              # Componentes Razor
│   ├── App.razor           # Componente raiz
│   ├── Routes.razor        # Configuração de rotas
│   ├── Layout/
│   │   └── MainLayout.razor # Layout principal
│   └── Pages/
│       └── Home.razor      # Página inicial
├── wwwroot/                # Arquivos estáticos
│   ├── app.css
│   └── app.js
├── Program.cs              # Configuração principal
└── TimeTracker.Web.csproj  # Configuração do projeto

Frontend (Vite + React), na raiz de `TimeTracker.Web/`:
├── src/                    # Código React
├── index.html
├── vite.config.js
└── tailwind.config.js
```

## 🔧 Configuração (Program.cs)

### Serviços Registrados

```csharp
// Componentes Razor com suporte a interatividade Server-Side
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();
```

### Exemplo de Adição de Novos Serviços

```csharp
// Banco de dados
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Injeção de dependência
builder.Services.AddScoped<IDataService, DataService>();

// HTTP Client
builder.Services.AddHttpClient();

// CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", builder =>
        builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});
```

## 🔐 Segurança

### Configurações em Produção

- **HTTPS Redirection**: Força conexão segura
- **HSTS (HTTP Strict Transport Security)**: Protege contra downgrade
- **Antiforgery**: Proteção contra CSRF
- **Exception Handler**: Oculta detalhes sensíveis

### Melhorias Recomendadas

```csharp
// Adicionar middleware de segurança
app.UseMiddleware<SecurityHeadersMiddleware>();

// Validação de entrada
app.UseInputSanitizer();

// Rate limiting
builder.Services.AddRateLimiting(options => {
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        httpContext => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.Identity?.Name ?? httpContext.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions 
            { 
                PermitLimit = 100, 
                Window = TimeSpan.FromMinutes(1) 
            }));
});
```

## 🌐 API Endpoints

### Adicionar Endpoints

```csharp
// Mapear endpoint GET
app.MapGet("/api/data", async (HttpContext context) =>
{
    return Results.Ok(new { message = "Hello from API" });
})
.WithName("GetData")
.WithOpenApi();

// Mapear endpoint POST
app.MapPost("/api/save", async (HttpContext context, SaveRequest request) =>
{
    // Processar dados
    return Results.Created("/api/save", new { id = 1 });
})
.WithName("SaveData")
.WithOpenApi();
```

## 📊 Estrutura de Dados Recomendada

### Modelo de Colaborador

```csharp
public class Collaborator
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Initials { get; set; }
    public string Machine { get; set; }
    public string CurrentApp { get; set; }
    public string CurrentWindow { get; set; }
    public ActivityCategory Category { get; set; }
    public OnlineStatus Status { get; set; }
    public DateTime LastUpdate { get; set; }
}

public enum ActivityCategory
{
    Development,
    Communication,
    Design,
    Social,
    Other
}

public enum OnlineStatus
{
    Online,
    Idle,
    Offline
}
```

### Modelo de Relatório

```csharp
public class DailyReport
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int CollaboratorId { get; set; }
    public TimeSpan MonitoredTime { get; set; }
    public TimeSpan ProductiveTime { get; set; }
    public List<ActivityLog> Activities { get; set; }
}

public class ActivityLog
{
    public int Id { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public ActivityCategory Category { get; set; }
    public string ApplicationName { get; set; }
    public string WindowTitle { get; set; }
}
```

## 🗄️ Banco de Dados

### Configurar Entity Framework Core

```bash
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
```

```csharp
public class AppDbContext : DbContext
{
    public DbSet<Collaborator> Collaborators { get; set; }
    public DbSet<DailyReport> Reports { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) 
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configurar índices
        modelBuilder.Entity<Collaborator>()
            .HasIndex(c => c.Email)
            .IsUnique();

        modelBuilder.Entity<DailyReport>()
            .HasIndex(r => new { r.Date, r.CollaboratorId })
            .IsUnique();
    }
}
```

### Migrations

```bash
# Criar migration
dotnet ef migrations add InitialCreate

# Aplicar migrations
dotnet ef database update
```

## 🔄 Autenticação e Autorização

### Adicionar Autenticação

```csharp
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.LoginPath = "/login";
        options.LogoutPath = "/logout";
    });

builder.Services.AddAuthorization();

// No pipeline
app.UseAuthentication();
app.UseAuthorization();
```

## 📝 Logging

### Configurar Serilog (Recomendado)

```bash
dotnet add package Serilog.AspNetCore
```

```csharp
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/app-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("Iniciando aplicação");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Aplicação finalizou inesperadamente");
}
finally
{
    Log.CloseAndFlush();
}
```

## 🧪 Testes

### Estrutura de Testes

```bash
dotnet new xunit -n TimeTracker.Tests
cd TimeTracker.Tests
dotnet add reference ../legacy/blazor/TimeTracker.Web.csproj
dotnet add package Moq
dotnet add package FluentAssertions
```

### Exemplo de Teste

```csharp
public class CollaboratorServiceTests
{
    private readonly ICollaboratorService _service;
    private readonly Mock<IRepository> _mockRepository;

    public CollaboratorServiceTests()
    {
        _mockRepository = new Mock<IRepository>();
        _service = new CollaboratorService(_mockRepository.Object);
    }

    [Fact]
    public async Task GetCollaborator_WithValidId_ReturnsCollaborator()
    {
        // Arrange
        var id = 1;
        var collaborator = new Collaborator { Id = id, Name = "John Doe" };
        _mockRepository.Setup(r => r.GetAsync(id))
            .ReturnsAsync(collaborator);

        // Act
        var result = await _service.GetCollaboratorAsync(id);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("John Doe");
    }
}
```

## 📈 Performance

### Otimizações

1. **Caching**
```csharp
builder.Services.AddMemoryCache();
app.UseResponseCaching();
```

2. **Compression**
```csharp
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});
app.UseResponseCompression();
```

3. **Database Queries**
```csharp
// Usar AsNoTracking para consultas somente leitura
var collaborators = await _context.Collaborators
    .AsNoTracking()
    .Include(c => c.Reports)
    .ToListAsync();
```

## 🚀 Deploy

### Publicar Aplicação

```bash
dotnet publish -c Release -o ./publish
```

### Docker

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=builder /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "TimeTracker.Web.dll"]
```

## 📚 Recursos Úteis

- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core)
- [Blazor Documentation](https://docs.microsoft.com/en-us/aspnet/core/blazor)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core)
- [Best Practices ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/best-practices)

## 🤝 Contribuição

1. Crie um branch: `git checkout -b feature/minha-feature`
2. Commit: `git commit -m 'Add minha feature'`
3. Push: `git push origin feature/minha-feature`
4. Abra um Pull Request

## 📄 Licença

MIT - Fábrica Bay Area

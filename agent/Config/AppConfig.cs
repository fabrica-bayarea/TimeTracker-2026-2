using System.Text.Json;

namespace TimeTracker.Agent.Config;

public class ApiEndpointsConfig
{
    public string SendActivity { get; set; } = "activities/";
    public string GetSettings { get; set; } = "config/";
    public string Associate { get; set; } = "associate/";
}

public class ApiConfig
{
    public string BaseUrl { get; set; } = "http://localhost:8000/";
    // Trocar para true em prod (false agora pois o padrão do FastAPI é HTTP)
    public bool RequireHttps { get; set; } = false;
    public ApiEndpointsConfig Endpoints { get; set; } = new();
    public int TimeoutSeconds { get; set; } = 15;
}

public class AgentDefaultsConfig
{
    // Usado somente até a primeira consulta bem-sucedida a GET /config/.
    public int FallbackCaptureIntervalSeconds { get; set; } = 10;
    public int FallbackIdleTimeoutSeconds { get; set; } = 300;
    // Intervalo de repolling de GET /config/
    public int SettingsPollingIntervalMs { get; set; } = 60000;
}

public class QueueConfig
{
    public int SendIntervalMs { get; set; } = 5000;
    public int InitialBackoffMs { get; set; } = 5000;
    public int MaxBackoffMs { get; set; } = 300000;
}

// Configuração raiz do agente. Carregada uma única vez
public class AppConfig
{
    public ApiConfig Api { get; set; } = new();
    public AgentDefaultsConfig Agent { get; set; } = new();
    public QueueConfig Queue { get; set; } = new();

    private static AppConfig? _instance;
    public static AppConfig Instance => _instance ??= Load();

    private static AppConfig Load()
    {
        string path = Path.Combine(
            AppContext.BaseDirectory, "appsettings.json"
        );

        if (!File.Exists(path)) return new AppConfig();

        string json = File.ReadAllText(path);
        AppConfig? config = JsonSerializer.Deserialize<AppConfig>(
            json, new JsonSerializerOptions { // warning CA1869
                PropertyNameCaseInsensitive = true
            }
        );

        return config ?? new AppConfig();
    }
}

using TimeTracker.Agent.Config;
using TimeTracker.Agent.Models;

namespace TimeTracker.Agent.Services;

public class SettingsPollingService : IDisposable
{
    private readonly IApiClient _api;
    private System.Threading.Timer? _timer;

    public AgentSettings CurrentSettings { get; private set; }

    // Disparado sempre que capture_interval_seconds
    // ou idle_timeout_seconds mudam
    public event Action<AgentSettings>? SettingsChanged;

    public SettingsPollingService(IApiClient api)
    {
        _api = api;
        AgentDefaultsConfig fallback = AppConfig.Instance.Agent;
        CurrentSettings = new AgentSettings
        {
            CaptureIntervalSeconds = fallback.FallbackCaptureIntervalSeconds,
            IdleTimeoutSeconds = fallback.FallbackIdleTimeoutSeconds
        };
    }

    public void Start()
    {
        int interval = AppConfig.Instance.Agent.SettingsPollingIntervalMs;
        _timer = (
            new System
                .Threading
                .Timer(async _ => await PollAsync(), null, 0, interval)
        );
    }

    private async Task PollAsync()
    {
        try
        {
            Dtos.SystemSettingsDto? dto = await _api.GetSettingsAsync();
            if (dto == null) return;

            AgentSettings updated = new()
            {
                CaptureIntervalSeconds = dto.CaptureIntervalSeconds,
                IdleTimeoutSeconds = dto.IdleTimeoutSeconds
            };

            if ((updated.CaptureIntervalSeconds
                != CurrentSettings.CaptureIntervalSeconds) ||
                (updated.IdleTimeoutSeconds
                != CurrentSettings.IdleTimeoutSeconds))
            {
                CurrentSettings = updated;
                SettingsChanged?.Invoke(updated);
            }
        }
        catch
        {
            // Falha ao consultar configurações: mantém os valores atuais
            // (ou o fallback, se ainda não houve nenhuma
            // consulta bem-sucedida) e tenta novamente no próximo ciclo.
        }
    }

    public void Dispose() => _timer?.Dispose(); // warning: CA1816
}

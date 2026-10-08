using TimeTracker.Agent.Data;
using TimeTracker.Agent.Models;

namespace TimeTracker.Agent.Services;

// A cada config.capture_interval_seconds, registra uma
// leitura da janela ativa, com duration_seconds igual
// ao intervalo de captura (amostragem periódica).
/// Tempo de idle obtido via GetLastInputInfo
public class CaptureService : IDisposable
{
    private readonly LocalQueue _queue;
    private readonly SettingsPollingService _settings;
    private readonly string _username;
    private readonly string _hostname;

    private System.Threading.Timer? _timer;
    private volatile bool _paused;

    public bool IsPaused => _paused;
    public ActiveWindowInfo? LastCapturedWindow { get; private set; }
    public bool LastCapturedIsIdle { get; private set; }
    public DateTime? LastCaptureAtUtc { get; private set; }

    public CaptureService(
        LocalQueue queue, SettingsPollingService settings,
        string username, string hostname
    )
    {
        _queue = queue;
        _settings = settings;
        _username = username;
        _hostname = hostname;
        _settings.SettingsChanged += OnSettingsChanged;
    }

    public void Start()
    {
        int intervalMs = (
            _settings.CurrentSettings.CaptureIntervalSeconds * 1000
        );
        _timer = new(OnTick, null, 0, intervalMs);
    }

    public void Pause() => _paused = true;
    public void Resume() => _paused = false;

    private void OnSettingsChanged(AgentSettings settings)
    {
        _timer?.Change(0, settings.CaptureIntervalSeconds * 1000);
    }

    private void OnTick(object? state)
    {
        try
        {
            if (_paused) return;

            ActiveWindowInfo? window = (
                ActiveWindowTracker.GetActiveWindowInfo()
            );
            double idleSeconds = IdleDetector.GetIdleSeconds();
            bool isIdle = (
                idleSeconds >= _settings.CurrentSettings.IdleTimeoutSeconds
            );

            LastCapturedWindow = window;
            LastCapturedIsIdle = isIdle;
            LastCaptureAtUtc = DateTime.UtcNow;

            ActivitySample sample = new()
            {
                Username = _username,
                Hostname = _hostname,
                ProcessName = window?.ProcessName ?? "Desconhecido",
                WindowTitle = window?.WindowTitle,
                DurationSeconds = (
                    _settings.CurrentSettings.CaptureIntervalSeconds
                ),
                IsIdle = isIdle,
                CapturedAtUtc = LastCaptureAtUtc.Value
            };

            _queue.Enqueue(sample);
        }
        catch
        {
            // Nunca deixar uma falha pontual
            // interromper o ciclo de captura seguinte.
        }
    }

    public void Dispose() // warning: CA1816
    {
        _settings.SettingsChanged -= OnSettingsChanged;
        _timer?.Dispose();
    }
}

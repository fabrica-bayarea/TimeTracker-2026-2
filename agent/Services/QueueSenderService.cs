using TimeTracker.Agent.Config;
using TimeTracker.Agent.Data;
using TimeTracker.Agent.Dtos;
using TimeTracker.Agent.Models;

namespace TimeTracker.Agent.Services;

// Envio periódico dos itens pendentes da fila local para POST /activities/
public class QueueSenderService : IDisposable
{
    private const int BatchSize = 20;

    private readonly IApiClient _api;
    private readonly LocalQueue _queue;
    private readonly QueueConfig _config;

    private System.Threading.Timer? _timer;
    private int _currentBackoffMs;
    private bool _sending;

    public event Action<bool>? SendAttempted;

    public QueueSenderService(IApiClient api, LocalQueue queue)
    {
        _api = api;
        _queue = queue;
        _config = AppConfig.Instance.Queue;
        _currentBackoffMs = _config.SendIntervalMs;
    }

    public void Start()
    {
        _timer = new System.Threading.Timer(async _ => await RunCycleAsync(), null, 0, _config.SendIntervalMs);
    }

    private async Task RunCycleAsync()
    {
        if (_sending) return;
        _sending = true;

        try
        {
            List<(long Id, ActivitySample Sample)> pending = (
                _queue.GetPending(BatchSize)
            );

            if (pending.Count == 0)
            {
                _currentBackoffMs = _config.SendIntervalMs;
                return;
            }

            foreach ((long id, ActivitySample sample) in pending)
            {
                try
                {
                    await _api.SendActivityAsync(ToDto(sample));
                    _queue.Remove(id); // só remove após HTTP 201
                }
                catch
                {
                    // Mantém este e os demais itens na fila;
                    // interrompe o lote atual
                    // e tenta novamente no próximo ciclo,
                    // com backoff crescente
                    _currentBackoffMs = (
                        Math.Min(_currentBackoffMs * 2, _config.MaxBackoffMs)
                    );

                    SendAttempted?.Invoke(false);
                    _timer?.Change(_currentBackoffMs, _config.SendIntervalMs);

                    return;
                }
            }

            _currentBackoffMs = _config.SendIntervalMs;
            SendAttempted?.Invoke(true);
        }
        finally
        {
            _sending = false;
        }
    }

    private static ActivityLogCreateDto ToDto(ActivitySample s) => new()
    {
        Username = s.Username,
        Hostname = s.Hostname,
        ProcessName = s.ProcessName,
        WindowTitle = s.WindowTitle,
        DurationSeconds = s.DurationSeconds,
        IsIdle = s.IsIdle,
        CapturedAt = DateTime.SpecifyKind(s.CapturedAtUtc, DateTimeKind.Utc)
    };

    public void Dispose() => _timer?.Dispose(); // warning: CA1816
}

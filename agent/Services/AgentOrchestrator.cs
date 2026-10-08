using TimeTracker.Agent.Config;
using TimeTracker.Agent.Data;
using TimeTracker.Agent.Models;

namespace TimeTracker.Agent.Services;

public class AgentOrchestrator : IDisposable
{
    public string Username { get; }
    public string Hostname { get; }

    public IApiClient Api { get; }
    public LocalQueue Queue { get; }
    public SettingsPollingService Settings { get; }
    public CaptureService Capture { get; }
    public QueueSenderService Sender { get; }

    // true = último envio ao backend teve sucesso
    public bool IsOnline { get; private set; } = true;
    private bool _started;

    // o monitoramento só é liberado depois que o agente está associado
    public bool IsAssociated => AgentConfig.Instance.IsAssociated;
    public event Action<bool>? OnlineStatusChanged;

    public AgentOrchestrator()
    {
        Username = MachineIdentityService.GetWindowsUsername();
        Hostname = MachineIdentityService.GetMachineName();

        Api = new HttpApiClient();

        if (AgentConfig.Instance.IsAssociated)
            Api.SetAuthToken(AgentConfig.Instance.AuthToken);

        Queue = new LocalQueue();
        Queue.Initialize();

        Settings = new SettingsPollingService(Api);
        Capture = new CaptureService(Queue, Settings, Username, Hostname);
        Sender = new QueueSenderService(Api, Queue);
        Sender.SendAttempted += success =>
        {
            if (success == IsOnline) return;

            IsOnline = success;
            OnlineStatusChanged?.Invoke(success);
        };
    }

    public void Start()
    {
        // idempotente; exige associação prévia
        if (_started || !IsAssociated) return;
        _started = true;

        Settings.Start();
        Capture.Start();
        Sender.Start();
    }

    // associa esta máquina ao gestor e guarda o token localmente
    public async Task<AssociationResult> AssociateAsync(
        string code, CancellationToken ct = default
    )
    {
        var result = await Api.AssociateAsync(code, Username, Hostname, ct);
        if (
            result.Outcome != AssociationOutcome.Success ||
            result.Token is null
        ) return result;

        try
        {
            AgentConfig.Instance.SaveAssociation(result.Token);
        }
        catch
        {
            return new AssociationResult(
                AssociationOutcome.ServerError,
                "A associação foi aceita, mas não foi possível " +
                "salvar o token neste computador. Tente novamente."
            );
        }

        Api.SetAuthToken(result.Token);

        return result;
    }

    public int PendingCount() => Queue.CountPending();

    public void Dispose() // warning: CA1816
    {
        Capture.Dispose();
        Settings.Dispose();
        Sender.Dispose();
    }
}

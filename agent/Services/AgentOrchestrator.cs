using System.Net;
using TimeTracker.Agent.Config;
using TimeTracker.Agent.Data;
using TimeTracker.Agent.Dtos;
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

    // Estado mantido só em memória: ao reiniciar o agente volta a
    // "Aguardando task". Todas as chamadas partem da thread de UI.
    public TaskDto? ActiveTask { get; private set; }
    public IReadOnlyList<TaskDto> AvailableTasks { get; private set; } = [];
    // true após a primeira consulta bem-sucedida de /tasks/my-tasks
    public bool TasksLoaded { get; private set; }
    // mensagem amigável da última consulta que falhou (null = sem falha)
    public string? TasksLoadError { get; private set; }

    // Disparado ao iniciar, trocar ou encerrar a task (null = sem task)
    public event Action<TaskDto?>? ActiveTaskChanged;
    // A task ativa deixou de ser atribuída ao colaborador (já encerrada)
    public event Action<TaskDto>? ActiveTaskUnassigned;

    private int _refreshingTasks;

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

    // Consulta as tasks atribuídas. Nunca lança por falha de rede/HTTP;
    // em falha mantém a última lista conhecida e preenche TasksLoadError.
    // Retorna true se a consulta foi bem-sucedida.
    public async Task<bool> RefreshTasksAsync(CancellationToken ct = default)
    {
        if (!IsAssociated) return false;

        // evita consultas concorrentes (timer + abertura do menu)
        if (Interlocked.CompareExchange(ref _refreshingTasks, 1, 0) != 0)
            return false;

        try
        {
            IReadOnlyList<TaskDto> tasks = await Api.GetMyTasksAsync(ct);

            AvailableTasks = tasks;
            TasksLoaded = true;
            TasksLoadError = null;

            ReconcileActiveTask(tasks);

            return true;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (HttpRequestException ex)
            when (ex.StatusCode == HttpStatusCode.Unauthorized)
        {
            TasksLoadError = (
                "Sessão expirada ou revogada. " +
                "Associe o agente novamente."
            );

            return false;
        }
        catch
        {
            TasksLoadError = "Não foi possível carregar as tasks.";

            return false;
        }
        finally
        {
            Interlocked.Exchange(ref _refreshingTasks, 0);
        }
    }

    // Mantém a task ativa coerente com a lista atribuída mais recente
    private void ReconcileActiveTask(IReadOnlyList<TaskDto> tasks)
    {
        if (ActiveTask is null) return;

        TaskDto? current = tasks.FirstOrDefault(t => t.Id == ActiveTask.Id);

        if (current is null)
        {
            TaskDto removed = ActiveTask;

            ActiveTask = null;

            ActiveTaskUnassigned?.Invoke(removed);
            ActiveTaskChanged?.Invoke(null);

            return;
        }

        bool changed = current.Title != ActiveTask.Title;

        ActiveTask = current;

        if (changed) ActiveTaskChanged?.Invoke(current);
    }

    // Define a task ativa (início ou troca). Só aceita tasks atribuídas
    // ao colaborador; devolve false se a task não está na lista atual.
    public bool SelectTask(TaskDto task)
    {
        if (!IsAssociated) return false;

        TaskDto? match = AvailableTasks.FirstOrDefault(t => t.Id == task.Id);

        if (match is null) return false;
        if (ActiveTask?.Id == match.Id) return true;

        ActiveTask = match;

        ActiveTaskChanged?.Invoke(match);

        return true;
    }

    // Encerra a task atual: o agente volta a "Aguardando task"
    public void EndTask()
    {
        if (ActiveTask is null) return;

        ActiveTask = null;

        ActiveTaskChanged?.Invoke(null);
    }

    public int PendingCount() => Queue.CountPending();

    public void Dispose() // warning: CA1816
    {
        Capture.Dispose();
        Settings.Dispose();
        Sender.Dispose();
    }
}

using TimeTracker.Agent.Config;
using TimeTracker.Agent.Dtos;
using TimeTracker.Agent.Services;

namespace TimeTracker.Agent.UI;

// Ícone na System Tray
public class TrayApplicationContext : ApplicationContext
{
    private readonly AgentOrchestrator _orchestrator;
    private readonly NotifyIcon _trayIcon;
    private readonly ToolStripMenuItem _pauseResumeItem;
    private readonly ToolStripMenuItem _associateItem;
    private readonly ToolStripMenuItem _tasksItem;
    private readonly System.Windows.Forms.Timer _tasksTimer;

    private const int MaxTaskMenuTextLength = 60;

    private static readonly string NoticeAckPath = Path.Combine(
        Environment.GetFolderPath(
            Environment.SpecialFolder.LocalApplicationData
        ),
        "TimeTrackerAgent", "notice_ack.flag"
    );

    public TrayApplicationContext(AgentOrchestrator orchestrator)
    {
        _orchestrator = orchestrator;
        _orchestrator.OnlineStatusChanged += OnOnlineStatusChanged;
        _orchestrator.ActiveTaskChanged += _ => RebuildTasksMenu();
        _orchestrator.ActiveTaskUnassigned += OnActiveTaskUnassigned;

        ContextMenuStrip menu = new();
        ToolStripMenuItem statusItem = new(
            "Status", null, (_, _) => ShowStatus()
        );
        _pauseResumeItem = new ToolStripMenuItem(
            "Pausar monitoramento", null, (_, _) => TogglePause()
        );
        _associateItem = new ToolStripMenuItem(
            "Associar ao gestor...", null, (_, _) => ShowAssociation()
        );
        _tasksItem = new ToolStripMenuItem("Tasks") { Visible = false };
        ToolStripMenuItem exitItem = new(
            "Sair", null, (_, _) => ExitApplication()
        );

        menu.Items.Add(statusItem);
        menu.Items.Add(_tasksItem);
        menu.Items.Add(_associateItem);
        menu.Items.Add(_pauseResumeItem);
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(exitItem);

        _trayIcon = new()
        {
            Icon = SystemIcons.Application, // substituir por ícone próprio
            Text = "Time Tracker Agent",
            ContextMenuStrip = menu,
            Visible = true
        };
        _trayIcon.DoubleClick += (_, _) => ShowStatus();

        // Atualiza a lista sempre que o menu é aberto e periodicamente
        menu.Opening += async (_, _) => await RefreshTasksAsync();

        _tasksTimer = new System.Windows.Forms.Timer
        {
            Interval = Math.Max(
                5000, AppConfig.Instance.Agent.TasksPollingIntervalMs
            )
        };
        _tasksTimer.Tick += async (_, _) => await RefreshTasksAsync();

        RebuildTasksMenu();

        ShowFirstRunNoticeIfNeeded();

        // Sem associação não há monitoramento
        // Abre o formulário já na inicialização
        if (!_orchestrator.IsAssociated)
            ShowAssociation();
        else
            ApplyAssociationState();

        if (!_orchestrator.IsAssociated)
            _trayIcon.ShowBalloonTip(
                5000, "Time Tracker",
                "Este computador ainda não está associado. " +
                "Use \"Associar ao gestor...\" no menu da bandeja " +
                "para iniciar o monitoramento.",
                ToolTipIcon.Warning
            );
    }

    private void ShowAssociation()
    {
        using AssociationForm form = new(_orchestrator);

        form.ShowDialog();
        ApplyAssociationState();
    }

    // Atualiza o menu e libera o monitoramento quando o agente está associado
    private void ApplyAssociationState()
    {
        bool associated = _orchestrator.IsAssociated;
        _associateItem.Visible = !associated;
        _pauseResumeItem.Visible = associated;
        _tasksItem.Visible = associated;

        if (!associated) return;

        _orchestrator.Start(); // idempotente
        _tasksTimer.Start();   // idempotente
        _ = RefreshTasksAsync();
        _trayIcon.ShowBalloonTip(
            3000, "Time Tracker",
            "Agente associado e monitorando.",
            ToolTipIcon.Info
        );
    }

    // ---- Tasks ----

    private async Task RefreshTasksAsync()
    {
        if (!_orchestrator.IsAssociated) return;

        // não lança: falhas ficam em _orchestrator.TasksLoadError
        await _orchestrator.RefreshTasksAsync();

        RebuildTasksMenu();
    }

    // Reconstrói o submenu "Tasks" a partir do estado do orquestrador
    private void RebuildTasksMenu()
    {
        _tasksItem.DropDownItems.Clear();

        TaskDto? active = _orchestrator.ActiveTask;

        foreach (TaskDto task in _orchestrator.AvailableTasks)
        {
            TaskDto captured = task;
            ToolStripMenuItem item = new(
                TaskMenuText(task.Title), null,
                (_, _) => OnTaskClicked(captured)
            )
            {
                Checked = active is not null && active.Id == task.Id,
                ToolTipText = (
                    string.IsNullOrWhiteSpace(task.Description) ?
                        task.Title
                        : $"{task.Title}\n{task.Description}"
                )
            };

            _tasksItem.DropDownItems.Add(item);
        }

        if (_orchestrator.AvailableTasks.Count == 0)
        {
            string placeholder = (
                _orchestrator.TasksLoadError
                ?? (
                    _orchestrator.TasksLoaded ?
                        "Nenhuma task atribuída"
                        : "Carregando tasks..."
                )
            );

            _tasksItem.DropDownItems.Add(
                new ToolStripMenuItem(placeholder) { Enabled = false }
            );
        }
        else if (_orchestrator.TasksLoadError is { } error)
        {
            // mantém a última lista conhecida, avisando que pode estar velha
            _tasksItem.DropDownItems.Add(new ToolStripSeparator());
            _tasksItem.DropDownItems.Add(
                new ToolStripMenuItem(
                    $"{error} (lista pode estar desatualizada)"
                )
                {
                    Enabled = false
                }
            );
        }

        _tasksItem.DropDownItems.Add(new ToolStripSeparator());
        _tasksItem.DropDownItems.Add(
            new ToolStripMenuItem(
                "Encerrar task atual", null, (_, _) => OnEndTaskClicked()
            )
            {
                Enabled = active is not null
            }
        );
    }

    private void OnTaskClicked(TaskDto task)
    {
        TaskDto? previous = _orchestrator.ActiveTask;

        if (previous is not null && previous.Id == task.Id) return;

        if (!_orchestrator.SelectTask(task))
        {
            _trayIcon.ShowBalloonTip(
                3000, "Time Tracker",
                "Esta task não está mais disponível para você.",
                ToolTipIcon.Warning
            );
            _ = RefreshTasksAsync();

            return;
        }

        _trayIcon.ShowBalloonTip(
            3000, "Time Tracker",
            previous is null ?
                $"Task iniciada: {task.Title}"
                : $"Task alterada para: {task.Title}",
            ToolTipIcon.Info
        );
    }

    private void OnEndTaskClicked()
    {
        TaskDto? ended = _orchestrator.ActiveTask;

        if (ended is null) return;

        _orchestrator.EndTask();

        _trayIcon.ShowBalloonTip(
            3000, "Time Tracker",
            $"Task encerrada: {ended.Title}. Aguardando task.",
            ToolTipIcon.Info
        );
    }

    private void OnActiveTaskUnassigned(TaskDto task)
    {
        _trayIcon.ShowBalloonTip(
            5000, "Time Tracker",
            $"A task \"{task.Title}\" não está mais atribuída a você. " +
            "Aguardando task.",
            ToolTipIcon.Warning
        );
    }

    // Uma linha, truncada e com "&" escapado (senão vira atalho de teclado)
    private static string TaskMenuText(string title)
    {
        string text = title.Replace('\r', ' ').Replace('\n', ' ').Trim();

        if (text.Length > MaxTaskMenuTextLength)
            text = text[..(MaxTaskMenuTextLength - 1)] + "…";

        return text.Replace("&", "&&");
    }

    private static void ShowFirstRunNoticeIfNeeded()
    {
        try
        {
            if (File.Exists(NoticeAckPath)) return;

            using FirstRunNoticeForm notice = new();

            notice.ShowDialog();

            Directory.CreateDirectory(Path.GetDirectoryName(NoticeAckPath)!);
            File.WriteAllText(NoticeAckPath, DateTime.UtcNow.ToString("O"));
        }
        catch
        {
            // Falha ao gravar o marcador não deve impedir o agente de iniciar;
            // na pior hipótese, o aviso reaparece na próxima execução.
        }
    }

    private void ShowStatus()
    {
        using StatusForm statusForm = new(_orchestrator);

        statusForm.ShowDialog();
    }

    private void TogglePause()
    {
        if (_orchestrator.Capture.IsPaused)
        {
            _orchestrator.Capture.Resume();

            _pauseResumeItem.Text = "Pausar monitoramento";

            _trayIcon.ShowBalloonTip(
                2000, "Time Tracker",
                "Monitoramento retomado.", ToolTipIcon.Info
            );
        }
        else
        {
            _orchestrator.Capture.Pause();

            _pauseResumeItem.Text = "Retomar monitoramento";

            _trayIcon.ShowBalloonTip(
                2000, "Time Tracker",
                "Monitoramento pausado.", ToolTipIcon.Warning
            );
        }
    }

    private void OnOnlineStatusChanged(bool isOnline)
    {
        _trayIcon.Text = (
            isOnline ?
            "Time Tracker Agent - conectado"
            : "Time Tracker Agent - falha de conexão"
        );

        if (!isOnline)
            _trayIcon.ShowBalloonTip(
                4000, "Time Tracker",
                "Falha ao enviar dados ao servidor. " +
                "Os registros continuam sendo salvos localmente.",
                ToolTipIcon.Warning
            );
    }

    private void ExitApplication()
    {
        _tasksTimer.Stop();
        _tasksTimer.Dispose();

        _orchestrator.Dispose();

        _trayIcon.Visible = false;

        Application.Exit();
    }
}

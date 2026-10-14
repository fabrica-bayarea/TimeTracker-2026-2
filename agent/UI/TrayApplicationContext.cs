using TimeTracker.Agent.Services;

namespace TimeTracker.Agent.UI;

// Ícone na System Tray
public class TrayApplicationContext : ApplicationContext
{
    private readonly AgentOrchestrator _orchestrator;
    private readonly NotifyIcon _trayIcon;
    private readonly ToolStripMenuItem _pauseResumeItem;
    private readonly ToolStripMenuItem _associateItem;
    private readonly ToolStripMenuItem _tasksSubMenu;

    private static readonly string NoticeAckPath = Path.Combine(
        Environment.GetFolderPath(
            Environment.SpecialFolder.LocalApplicationData
        ),
        "TimeTrackerAgent", "notice_ack.flag"
    );

    private AssociationForm? _associationForm;
    private StatusForm? _statusForm;

    public TrayApplicationContext(AgentOrchestrator orchestrator)
    {
        _orchestrator = orchestrator;
        _orchestrator.OnlineStatusChanged += OnOnlineStatusChanged;
        _orchestrator.AssociationRevoked += OnAssociationRevoked;

        ContextMenuStrip menu = new();
        ToolStripMenuItem statusItem = new(
            "Status", null, (_, _) => ShowStatus()
        );
        _tasksSubMenu = new ToolStripMenuItem("Tarefas");
        _tasksSubMenu.DropDownOpening += async (_, _) => await RefreshTasksMenuAsync();

        _pauseResumeItem = new ToolStripMenuItem(
            "Pausar monitoramento", null, (_, _) => TogglePause()
        );
        _associateItem = new ToolStripMenuItem(
            "Associar ao gestor...", null, (_, _) => ShowAssociation()
        );
        ToolStripMenuItem exitItem = new(
            "Sair", null, (_, _) => ExitApplication()
        );

        menu.Items.Add(statusItem);
        menu.Items.Add(_tasksSubMenu);
        menu.Items.Add(_associateItem);
        menu.Items.Add(_pauseResumeItem);
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(exitItem);

        _trayIcon = new()
        {
            Icon = CreateDefaultTrayIcon(),
            Text = "Time Tracker Agent",
            ContextMenuStrip = menu,
            Visible = true
        };
        _trayIcon.DoubleClick += (_, _) => ShowStatus();

        Application.Idle += OnFirstIdle;
    }

    private static Icon CreateDefaultTrayIcon()
    {
        try
        {
            Icon? appIcon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            if (appIcon != null) return appIcon;
        }
        catch { }

        using Bitmap bmp = new(32, 32);
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
            using Brush brush = new SolidBrush(Color.FromArgb(37, 99, 235));
            g.FillEllipse(brush, 1, 1, 30, 30);
            using Font font = new("Arial", 16, FontStyle.Bold, GraphicsUnit.Pixel);
            using Brush textBrush = new SolidBrush(Color.White);
            g.DrawString("T", font, textBrush, new PointF(8, 6));
        }
        return Icon.FromHandle(bmp.GetHicon());
    }

    private void OnFirstIdle(object? sender, EventArgs e)
    {
        Application.Idle -= OnFirstIdle;
        InitializeStartupFlow();
    }

    private void InitializeStartupFlow()
    {
        ShowFirstRunNoticeIfNeeded();

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
        if (_associationForm != null && !_associationForm.IsDisposed)
        {
            _associationForm.BringToFront();
            _associationForm.Activate();
            return;
        }

        _associationForm = new AssociationForm(_orchestrator);
        _associationForm.FormClosed += (_, _) =>
        {
            ApplyAssociationState();
            _associationForm = null;
        };
        _associationForm.Show();
    }

    private void OnAssociationRevoked()
    {
        _trayIcon.ShowBalloonTip(
            5000, "Time Tracker",
            "A associação com o gestor expirou ou foi revogada. Por favor, vincule novamente com o código.",
            ToolTipIcon.Warning
        );
        ApplyAssociationState();
        ShowAssociation();
    }

    private async Task RefreshTasksMenuAsync()
    {
        _tasksSubMenu.DropDownItems.Clear();

        ToolStripMenuItem loadingItem = new("Carregando tarefas...") { Enabled = false };
        _tasksSubMenu.DropDownItems.Add(loadingItem);

        List<Dtos.TaskDto> tasks = [];
        try
        {
            tasks = await _orchestrator.GetMyTasksAsync();
        }
        catch (HttpRequestException hex) when (hex.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            OnAssociationRevoked();
            return;
        }
        catch
        {
            // ignora falha de rede temporária
        }

        _tasksSubMenu.DropDownItems.Clear();

        ToolStripMenuItem noneItem = new("Nenhuma (Pausar tarefas)")
        {
            Checked = _orchestrator.Capture.ActiveTaskId == null
        };
        noneItem.Click += (_, _) =>
        {
            _orchestrator.Capture.SetActiveTask(null, null);
            _trayIcon.ShowBalloonTip(2000, "Time Tracker", "Nenhuma tarefa selecionada. Monitoramento em espera.", ToolTipIcon.Info);
        };
        _tasksSubMenu.DropDownItems.Add(noneItem);
        _tasksSubMenu.DropDownItems.Add(new ToolStripSeparator());

        if (tasks.Count == 0)
        {
            ToolStripMenuItem emptyItem = new("(Nenhuma tarefa atribuída)") { Enabled = false };
            _tasksSubMenu.DropDownItems.Add(emptyItem);
        }
        else
        {
            foreach (var task in tasks)
            {
                var currentTask = task;
                bool isSelected = _orchestrator.Capture.ActiveTaskId == currentTask.Id;
                ToolStripMenuItem taskItem = new(currentTask.Title)
                {
                    Checked = isSelected
                };
                taskItem.Click += (_, _) =>
                {
                    _orchestrator.Capture.SetActiveTask(currentTask.Id, currentTask.Title);
                    _trayIcon.ShowBalloonTip(2000, "Time Tracker", $"Tarefa ativa: {currentTask.Title}", ToolTipIcon.Info);
                };
                _tasksSubMenu.DropDownItems.Add(taskItem);
            }
        }
    }

    // Atualiza o menu e libera o monitoramento quando o agente está associado
    private void ApplyAssociationState()
    {
        bool associated = _orchestrator.IsAssociated;
        _associateItem.Visible = !associated;
        _pauseResumeItem.Visible = associated;
        _tasksSubMenu.Visible = associated;

        if (!associated) return;

        _orchestrator.Start(); // idempotente
        _trayIcon.ShowBalloonTip(
            3000, "Time Tracker",
            "Agente associado e pronto. Selecione uma tarefa no menu Tarefas para monitorar.",
            ToolTipIcon.Info
        );
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
        if (_statusForm != null && !_statusForm.IsDisposed)
        {
            _statusForm.BringToFront();
            _statusForm.Activate();
            return;
        }

        _statusForm = new StatusForm(_orchestrator);
        _statusForm.FormClosed += (_, _) => _statusForm = null;
        _statusForm.Show();
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
        _orchestrator.Dispose();

        _trayIcon.Visible = false;
        _trayIcon.Dispose();

        ExitThread();
    }
}

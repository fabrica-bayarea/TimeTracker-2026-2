using TimeTracker.Agent.Services;

namespace TimeTracker.Agent.UI;

// Ícone na System Tray
public class TrayApplicationContext : ApplicationContext
{
    private readonly AgentOrchestrator _orchestrator;
    private readonly NotifyIcon _trayIcon;
    private readonly ToolStripMenuItem _pauseResumeItem;
    private readonly ToolStripMenuItem _associateItem;

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
        ToolStripMenuItem exitItem = new(
            "Sair", null, (_, _) => ExitApplication()
        );

        menu.Items.Add(statusItem);
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

        if (!associated) return;

        _orchestrator.Start(); // idempotente
        _trayIcon.ShowBalloonTip(
            3000, "Time Tracker",
            "Agente associado e monitorando.",
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
        _orchestrator.Dispose();

        _trayIcon.Visible = false;

        Application.Exit();
    }
}

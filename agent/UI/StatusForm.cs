using TimeTracker.Agent.Services;
using TimeTracker.Agent.Models;

namespace TimeTracker.Agent.UI;

// Mostra ao colaborador o que está sendo capturado no momento
public class StatusForm : Form
{
    private readonly AgentOrchestrator _orchestrator;
    private readonly Label _identityLabel;
    private readonly Label _windowLabel;
    private readonly Label _idleLabel;
    private readonly Label _intervalLabel;
    private readonly Label _queueLabel;
    private readonly Label _onlineLabel;
    private readonly Label _associationLabel;
    private readonly System.Windows.Forms.Timer _refreshTimer;

    public StatusForm(AgentOrchestrator orchestrator)
    {
        _orchestrator = orchestrator;

        Text = "Time Tracker - Status";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterScreen;
        MaximizeBox = false;
        MinimizeBox = false;
        ClientSize = new(420, 260);

        Label titleLabel = new()
        {
            Text = "Estado atual do agente",
            AutoSize = true,
            Location = new(15, 15),
            Font = new Font(Font, FontStyle.Bold)
        };
        _identityLabel = new()
        {
            AutoSize = true,
            Location = new(15, 45)
        };
        _windowLabel = new()
        {
            AutoSize = false,
            Size = new Size(390, 40),
            Location = new(15, 75)
        };
        _idleLabel = new()
        {
            AutoSize = true,
            Location = new(15, 120)
        };
        _intervalLabel = new Label
        {
            AutoSize = true,
            Location = new(15, 145)
        };
        _queueLabel = new Label
        {
            AutoSize = true,
            Location = new(15, 170)
        };
        _onlineLabel = new Label
        {
            AutoSize = true,
            Location = new(15, 195),
            Font = new Font(Font, FontStyle.Bold)
        };
        _associationLabel = new()
        {
            AutoSize = true,
            Location = new(15, 220),
            Font = new(Font, FontStyle.Bold)
        };

        Button closeButton = new()
        {
            Text = "Fechar",
            Location = new(315, 225),
            Size = new(90, 28),
            DialogResult = DialogResult.OK
        };

        Controls.Add(titleLabel);
        Controls.Add(_identityLabel);
        Controls.Add(_windowLabel);
        Controls.Add(_idleLabel);
        Controls.Add(_intervalLabel);
        Controls.Add(_queueLabel);
        Controls.Add(_onlineLabel);
        Controls.Add(_associationLabel);
        Controls.Add(closeButton);

        _refreshTimer = new System.Windows.Forms.Timer { Interval = 1000 };

        _refreshTimer.Tick += (_, _) => RefreshLabels();

        _refreshTimer.Start();

        FormClosed += (_, _) => _refreshTimer.Stop();

        RefreshLabels();
    }

    private void RefreshLabels()
    {
        _identityLabel.Text = (
            $"Usuário: {_orchestrator.Username} " +
            $"| Estação: {_orchestrator.Hostname}"
        );

        ActiveWindowInfo? window = _orchestrator.Capture.LastCapturedWindow;
        _windowLabel.Text = (window != null)?
            ($"Última captura: {window.ProcessName}\n" +
            $"Título: {window.WindowTitle ?? "(sem título)"}")
            : "Última captura: aguardando primeiro ciclo...";

        _idleLabel.Text = (
            $"Atividade: {(
                _orchestrator.Capture.LastCapturedIsIdle ?
                    "Inativo" : "Ativo"
            )}"
        );

        AgentSettings settings = _orchestrator.Settings.CurrentSettings;
        _intervalLabel.Text = (
            $"Intervalo de captura: {settings.CaptureIntervalSeconds}s " +
            $"| Limite de inatividade: {settings.IdleTimeoutSeconds}s"
        );

        _queueLabel.Text = (
            $"Registros pendentes de envio: {_orchestrator.PendingCount()}"
        );

        _onlineLabel.Text = (
            $"Conexão com o servidor: {(
                _orchestrator.IsOnline ? "OK" : "Falha (retentando...)"
            )}"
        );
        _onlineLabel.ForeColor = (
            _orchestrator.IsOnline ? Color.DarkGreen : Color.DarkRed
        );

        bool associated = _orchestrator.IsAssociated;

        _associationLabel.Text = (
            $"Associação: {(associated ? "Associado" : "Não associado")}"
        );
        _associationLabel.ForeColor = (
            associated ? Color.DarkGreen : Color.DarkRed
        );

        if (_orchestrator.Capture.IsPaused)
            _idleLabel.Text += " (monitoramento pausado)";
    }
}

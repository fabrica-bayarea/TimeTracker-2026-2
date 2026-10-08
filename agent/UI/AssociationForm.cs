using TimeTracker.Agent.Models;
using TimeTracker.Agent.Services;

namespace TimeTracker.Agent.UI;

// O colaborador digita o código de 6 dígitos do gestor para associar a
// máquina e liberar o monitoramento
// O campo aceita somente 6 caracteres numéricos (digitação e colar)
// "Conectar" só habilita com 6 dígitos e fica desabilitado
// durante a requisição
// Código inválido mostra alerta e mantém a janela aberta para nova tentativa
public class AssociationForm : Form
{
    private const int CodeLength = 6;

    private readonly AgentOrchestrator _orchestrator;
    private readonly TextBox _codeInput;
    private readonly Button _connectButton;
    private readonly Label _statusLabel;
    private readonly CancellationTokenSource _cts = new();

    private bool _busy;
    private bool _sanitizing;

    public bool Associated { get; private set; }

    public AssociationForm(AgentOrchestrator orchestrator)
    {
        _orchestrator = orchestrator;

        Text = "Time Tracker — Associar ao gestor";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterScreen;
        MaximizeBox = false;
        MinimizeBox = false;
        ClientSize = new(380, 230);

        Label infoLabel = new()
        {
            Text = (
                $"Estação: {orchestrator.Hostname}\n" +
                "Usuário: {orchestrator.Username}\n\n" +
                "Digite o código de 6 dígitos fornecido pelo seu gestor:"
            ),
            AutoSize = false,
            Size = new(340, 75),
            Location = new(20, 15)
        };

        _codeInput = new()
        {
            Location = new(20, 98),
            Size = new(160, 32),
            MaxLength = CodeLength,
            Font = new("Consolas", 16),
            TextAlign = HorizontalAlignment.Center
        };
        _codeInput.KeyPress += OnCodeKeyPress;
        _codeInput.TextChanged += OnCodeTextChanged;

        _connectButton = new()
        {
            Text = "Conectar",
            Location = new(200, 97),
            Size = new(160, 34),
            Enabled = false
        };
        _connectButton.Click += async (_, _) => await OnConnectAsync();

        _statusLabel = new Label
        {
            Location = new(20, 150),
            Size = new(340, 60),
            Font = new(Font, FontStyle.Bold)
        };

        // Enter também envia
        AcceptButton = _connectButton;

        Controls.Add(infoLabel);
        Controls.Add(_codeInput);
        Controls.Add(_connectButton);
        Controls.Add(_statusLabel);

        FormClosing += (_, _) => _cts.Cancel();
    }

    private void OnCodeKeyPress(object? sender, KeyPressEventArgs e)
    {
        // Bloqueia qualquer caractere que não seja dígito
        // (teclas de controle, como Backspace, passam).
        if (!char.IsControl(e.KeyChar) && !char.IsDigit(e.KeyChar))
            e.Handled = true;
    }

    private void OnCodeTextChanged(object? sender, EventArgs e)
    {
        if (_sanitizing) return;

        // Cobre "colar": remove não dígitos e limita a 6 caracteres.
        string digitsOnly = new(
            [.. _codeInput.Text.Where(char.IsDigit).Take(CodeLength)]
        );

        if (digitsOnly != _codeInput.Text)
        {
            _sanitizing = true;

            _codeInput.Text = digitsOnly;
            _codeInput.SelectionStart = digitsOnly.Length;

            _sanitizing = false;
        }

        UpdateControlState();
    }

    private void UpdateControlState()
    {
        _codeInput.ReadOnly = _busy;
        _connectButton.Enabled = (
            !_busy && _codeInput.Text.Length == CodeLength
        );
    }

    private async Task OnConnectAsync()
    {
        // evita envio duplicado
        if (_busy || _codeInput.Text.Length != CodeLength) return;

        _busy = true;

        UpdateControlState();

        _statusLabel.ForeColor = Color.DimGray;
        _statusLabel.Text = "Conectando...";

        AssociationResult result;

        try
        {
            result = await _orchestrator.AssociateAsync(
                _codeInput.Text, _cts.Token
            );
        }
        catch (OperationCanceledException)
        {
            return; // janela foi fechada durante a requisição
        }

        if (IsDisposed) return;

        _busy = false;

        if (result.Outcome == AssociationOutcome.Success)
        {
            Associated = true;
            _codeInput.ReadOnly = true;
            _connectButton.Enabled = false;
            _statusLabel.ForeColor = Color.DarkGreen;
            _statusLabel.Text = result.Message; // "Associado com sucesso!"

            try
            {
                // dá tempo de ler a confirmação
                await Task.Delay(1500, _cts.Token);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            DialogResult = DialogResult.OK;

            Close();

            return;
        }

        // Falha: a janela permanece aberta para o colaborador digitar de novo
        _statusLabel.ForeColor = Color.DarkRed;
        _statusLabel.Text = result.Message;

        UpdateControlState();
        _codeInput.Focus();
        _codeInput.SelectAll();
    }
}

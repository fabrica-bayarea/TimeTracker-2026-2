namespace TimeTracker.Agent.UI;

// Aviso de transparência exibido uma única vez na primeira execução
// a captura começa automaticamente assim que o agente inicia
public class FirstRunNoticeForm : Form
{
    public FirstRunNoticeForm()
    {
        Text = "Time Tracker - Aviso de Monitoramento";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterScreen;
        MaximizeBox = false;
        MinimizeBox = false;
        ClientSize = new(440, 300);

        string text =
            "Este computador possui o Time Tracker Agent em execução.\n\n" +
            "Enquanto o agente estiver ativo, " +
            "são registrados periodicamente:\n" +
            "- Nome do processo/aplicativo em uso\n" +
            "- Título da janela em primeiro plano\n" +
            "- Se houve interação recente de " +
            "mouse/teclado (Ativo/Inativo)\n\n" +
            "O conteúdo digitado, clicado ou exibido " +
            "na tela NÃO é coletado,\n" +
            "apenas o nome do processo e o texto " +
            "da barra de título da janela.\n\n" +
            "O intervalo de captura e " +
            "o tempo de inatividade são definidos\n" +
            "centralmente e podem ser consultados " +
            "a qualquer momento pelo\n" +
            "menu \"Status\" na bandeja do sistema.";

        TextBox infoBox = new()
        {
            Multiline = true,
            ReadOnly = true,
            ScrollBars = ScrollBars.Vertical,
            Location = new(15, 15),
            Size = new(410, 220),
            Text = text
        };

        Button okButton = new()
        {
            Text = "Entendi",
            Location = new(340, 245),
            Size = new(85, 32),
            DialogResult = DialogResult.OK
        };

        AcceptButton = okButton;

        Controls.Add(infoBox);
        Controls.Add(okButton);
    }
}

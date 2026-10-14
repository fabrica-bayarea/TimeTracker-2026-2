using TimeTracker.Agent.Services;
using TimeTracker.Agent.UI;

namespace TimeTracker.Agent;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        try
        {
            ApplicationConfiguration.Initialize();

            // Garante instância única
            using Mutex singleInstanceMutex = new(
                true, "Local\\TimeTracker.Agent.SingleInstance",
                out bool isNewInstance
            );

            if (!isNewInstance)
            {
                MessageBox.Show(
                    "O Time Tracker Agent já está em execução.", "Time Tracker",
                    MessageBoxButtons.OK, MessageBoxIcon.Information
                );
                return;
            }

            AgentOrchestrator orchestrator = new();

            Application.Run(new TrayApplicationContext(orchestrator));
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Erro inesperado ao iniciar o agente: {ex.Message}", "Time Tracker",
                MessageBoxButtons.OK, MessageBoxIcon.Error
            );
        }
    }
}

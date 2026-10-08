using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace TimeTracker.Agent.Services;

// Snapshot da janela em primeiro plano em um dado instante
public record ActiveWindowInfo(string ProcessName, string? WindowTitle);

// Identifica a janela em primeiro plano (processo e título da janela)
public static class ActiveWindowTracker
{
    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow(); // warning: SYSLIB1054

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint GetWindowThreadProcessId( // warning: SYSLIB1054
        IntPtr hWnd, out uint lpdwProcessId
    );

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowTextLength(IntPtr hWnd); // warning: SYSLIB1054

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(
        IntPtr hWnd, StringBuilder lpString, int nMaxCount
    );

    public static ActiveWindowInfo? GetActiveWindowInfo()
    {
        try
        {
            nint hWnd = GetForegroundWindow();
            if (hWnd == IntPtr.Zero) return null;

            GetWindowThreadProcessId(hWnd, out uint pid);
            if (pid == 0) return null;

            string processName;
            using (Process process = Process.GetProcessById((int)pid))
            {
                processName = process.ProcessName;
            }

            string? title = GetWindowTitle(hWnd);

            return new ActiveWindowInfo(processName, title);
        }
        catch
        {
            // Processos do sistema/elevados podem negar acesso
            // tratado como "sem informação" em vez de propagar exceção
            // e parar a captura.
            return null;
        }
    }

    private static string? GetWindowTitle(IntPtr hWnd)
    {
        int length = GetWindowTextLength(hWnd);
        if (length <= 0) return null;

        StringBuilder builder = new(length + 1);

        GetWindowText(hWnd, builder, builder.Capacity); // warning: CA1806

        string title = builder.ToString();

        return string.IsNullOrWhiteSpace(title) ? null : title;
    }
}

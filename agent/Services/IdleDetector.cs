using System.Runtime.InteropServices;

namespace TimeTracker.Agent.Services;

// Detecção por mouse/teclado de idle
public static class IdleDetector
{
    [StructLayout(LayoutKind.Sequential)]
    private struct LASTINPUTINFO
    {
        public uint cbSize;
        public uint dwTime;
    }

    [DllImport("user32.dll")]
    private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

    public static double GetIdleSeconds()
    {
        LASTINPUTINFO lastInput = new();
        lastInput.cbSize = (uint)Marshal.SizeOf(lastInput);

        // Se a chamada falhar por qualquer motivo, assume-se atividade
        if (!GetLastInputInfo(ref lastInput))
            return 0;

        uint idleTicks = (uint)Environment.TickCount - lastInput.dwTime;

        return idleTicks / 1000.0;
    }
}

using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TimeTracker.Agent.Config;

// Estado local do agente (se está associado a um gestor e o token de
// autorização recebido)
// Persistido em %LOCALAPPDATA%\TimeTrackerAgent\agent-config.json
// Token protegido com DPAPI (escopo do usuário Windows atual), então só a
// mesma conta Windows consegue lê-lo
// Não confundir com AppConfig (appsettings.json), que guarda
// configurações estáticas
public class AgentConfig
{
    private static readonly string FilePath = Path.Combine(
        Environment.GetFolderPath(
            Environment.SpecialFolder.LocalApplicationData
        ),
        "TimeTrackerAgent", "agent-config.json"
    );

    private static readonly object FileLock = new();
    private static AgentConfig? _instance;

    public static AgentConfig Instance => _instance ??= Load();

    public bool IsAssociated => !string.IsNullOrWhiteSpace(AuthToken);
    public string? AuthToken { get; private set; }
    public DateTime? AssociatedAtUtc { get; private set; }

    // Grava a associação e o token
    // Lança exceção se não for possível persistir
    public void SaveAssociation(string token)
    {
        DateTime associatedAt = DateTime.UtcNow;

        PersistedState persisted = new()
        {
            ProtectedToken = Convert.ToBase64String(
                ProtectedData.Protect(
                    Encoding.UTF8.GetBytes(token),
                    null,
                    DataProtectionScope.CurrentUser
                )
            ),
            AssociatedAtUtc = associatedAt
        };

        lock (FileLock)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(FilePath)!);

            // Escrita atômica: grava num temp e substitui o definitivo
            string tempPath = FilePath + ".tmp";

            File.WriteAllText(
                tempPath,
                JsonSerializer.Serialize(persisted),
                Encoding.UTF8
            );
            File.Move(tempPath, FilePath, overwrite: true);
        }

        AuthToken = token;
        AssociatedAtUtc = associatedAt;
    }

    private static AgentConfig Load()
    {
        AgentConfig config = new();

        try
        {
            lock (FileLock)
            {
                if (!File.Exists(FilePath)) return config;

                PersistedState? persisted = (
                    JsonSerializer.Deserialize<PersistedState>(
                        File.ReadAllText(FilePath, Encoding.UTF8)
                    )
                );

                if (persisted?.ProtectedToken is not { Length: > 0 })
                    return config;

                byte[] bytes = ProtectedData.Unprotect(
                    Convert.FromBase64String(persisted.ProtectedToken),
                    null,
                    DataProtectionScope.CurrentUser
                );

                config.AuthToken = Encoding.UTF8.GetString(bytes);
                config.AssociatedAtUtc = persisted.AssociatedAtUtc;
            }
        }
        catch
        {
            // Arquivo corrompido ou token ilegível (ex.: outro usuário)
            // Trata como "não associado" e o colaborador'
            // associa de novo.
            config.AuthToken = null;
            config.AssociatedAtUtc = null;
        }

        return config;
    }

    private class PersistedState
    {
        public string? ProtectedToken { get; set; }
        public DateTime? AssociatedAtUtc { get; set; }
    }
}

using Microsoft.Data.Sqlite;
using TimeTracker.Agent.Models;

namespace TimeTracker.Agent.Data;

// Fila local de capturas pendentes de envio.
public class LocalQueue
{
    private readonly string _connectionString;

    public LocalQueue()
    {
        string localAppData = Environment.GetFolderPath(
            Environment.SpecialFolder.LocalApplicationData
        );
        string dataDir = Path.Combine(localAppData, "TimeTrackerAgent");

        Directory.CreateDirectory(dataDir);

        string dbPath = Path.Combine(dataDir, "agent-queue.db");

        _connectionString = $"Data Source={dbPath}";
    }

    public void Initialize()
    {
        using SqliteConnection conn = Open();

        SqliteCommand cmd = conn.CreateCommand();

        cmd.CommandText = """
            CREATE TABLE IF NOT EXISTS PendingActivities (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Username TEXT NOT NULL,
                Hostname TEXT NOT NULL,
                ProcessName TEXT NOT NULL,
                WindowTitle TEXT,
                DurationSeconds INTEGER NOT NULL,
                IsIdle INTEGER NOT NULL,
                CapturedAtUtc TEXT NOT NULL,
                TaskId TEXT
            );
        """;

        cmd.ExecuteNonQuery();

        try
        {
            using SqliteCommand alterCmd = conn.CreateCommand();
            alterCmd.CommandText = "ALTER TABLE PendingActivities ADD COLUMN TaskId TEXT;";
            alterCmd.ExecuteNonQuery();
        }
        catch
        {
            // Coluna já existe em bancos existentes, ignora
        }
    }

    private SqliteConnection Open()
    {
        SqliteConnection conn = new(_connectionString);

        conn.Open();

        return conn;
    }

    public void Enqueue(ActivitySample sample)
    {
        using SqliteConnection conn = Open();

        SqliteCommand cmd = conn.CreateCommand();

        cmd.CommandText = """
            INSERT INTO PendingActivities
                (Username, Hostname, ProcessName,
                WindowTitle, DurationSeconds, IsIdle, CapturedAtUtc, TaskId)
            VALUES
                ($username, $hostname, $process,
                $title, $duration, $idle, $capturedAt, $taskId);
        """;

        cmd.Parameters.AddWithValue("$username", sample.Username);
        cmd.Parameters.AddWithValue("$hostname", sample.Hostname);
        cmd.Parameters.AddWithValue("$process", sample.ProcessName);
        cmd.Parameters.AddWithValue(
            "$title", (object?)sample.WindowTitle ?? DBNull.Value
        );
        cmd.Parameters.AddWithValue("$duration", sample.DurationSeconds);
        cmd.Parameters.AddWithValue("$idle", sample.IsIdle ? 1 : 0);
        cmd.Parameters.AddWithValue(
            "$capturedAt", sample.CapturedAtUtc.ToString("O")
        );
        cmd.Parameters.AddWithValue(
            "$taskId", (object?)sample.TaskId?.ToString() ?? DBNull.Value
        );

        cmd.ExecuteNonQuery();
    }

    // Os itens mais antigos primeiro,
    // para preservar a ordem cronológica no envio
    public List<(long Id, ActivitySample Sample)> GetPending(int maxBatchSize)
    {
        using SqliteConnection conn = Open();

        SqliteCommand cmd = conn.CreateCommand();

        cmd.CommandText = (
            "SELECT * FROM PendingActivities "
            + "ORDER BY Id ASC LIMIT $limit;"
        );

        cmd.Parameters.AddWithValue("$limit", maxBatchSize);

        using SqliteDataReader reader = cmd.ExecuteReader();

        List<(long, ActivitySample)> result = [];

        while (reader.Read())
        {
            long id = reader.GetInt64(reader.GetOrdinal("Id"));

            int taskIdOrdinal = -1;
            try { taskIdOrdinal = reader.GetOrdinal("TaskId"); } catch { }

            string? taskIdStr = (taskIdOrdinal >= 0 && !reader.IsDBNull(taskIdOrdinal))
                ? reader.GetString(taskIdOrdinal)
                : null;

            ActivitySample sample = new()
            {
                Username = reader.GetString(reader.GetOrdinal("Username")),
                Hostname = reader.GetString(reader.GetOrdinal("Hostname")),
                ProcessName = (
                    reader.GetString(reader.GetOrdinal("ProcessName"))
                ),
                WindowTitle = (
                    reader.IsDBNull(reader.GetOrdinal("WindowTitle")) ?
                    null : reader.GetString(reader.GetOrdinal("WindowTitle"))
                ),
                DurationSeconds = (
                    reader.GetInt32(reader.GetOrdinal("DurationSeconds"))
                ),
                IsIdle = reader.GetInt64(reader.GetOrdinal("IsIdle")) == 1,
                CapturedAtUtc = DateTime.Parse(
                    reader.GetString(reader.GetOrdinal("CapturedAtUtc")),
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.RoundtripKind
                ),
                TaskId = !string.IsNullOrEmpty(taskIdStr) && Guid.TryParse(taskIdStr, out Guid parsedId)
                    ? parsedId
                    : null
            };

            result.Add((id, sample));
        }

        return result;
    }

    public void Remove(long id)
    {
        using SqliteConnection conn = Open();

        SqliteCommand cmd = conn.CreateCommand();

        cmd.CommandText = "DELETE FROM PendingActivities WHERE Id = $id;";

        cmd.Parameters.AddWithValue("$id", id);

        cmd.ExecuteNonQuery();
    }

    public int CountPending()
    {
        using SqliteConnection conn = Open();

        SqliteCommand cmd = conn.CreateCommand();

        cmd.CommandText = "SELECT COUNT(*) FROM PendingActivities;";

        return Convert.ToInt32(cmd.ExecuteScalar());
    }
}

namespace TimeTracker.Agent.Dtos;

// POST /activities/ — corresponde a schemas.ActivityLogCreate
public class ActivityLogCreateDto
{
    public string Username { get; set; } = "";
    public string Hostname { get; set; } = "";
    public string ProcessName { get; set; } = "";
    public string? WindowTitle { get; set; }
    public int DurationSeconds { get; set; }
    public bool IsIdle { get; set; }
    // enviado como UTC (Kind=Utc) -> serializa com sufixo "Z"
    public DateTime? CapturedAt { get; set; }
}

// GET /config/ — corresponde a schemas.SystemSettingsOut
public class SystemSettingsDto
{
    public int CaptureIntervalSeconds { get; set; } = 10;
    public int IdleTimeoutSeconds { get; set; } = 300;
    public DateTime? UpdatedAt { get; set; }
}

// POST /associate/
public class AssociateRequestDto
{
    public string Code { get; set; } = "";
    public string Username { get; set; } = "";
    public string Hostname { get; set; } = "";
}

public class AssociateResponseDto
{
    public string? Token { get; set; }
    public string? AccessToken { get; set; } // tolerância a "access_token"
}

namespace TreeIdentifier.Api.Services;

/// <summary>
/// Bound from the "Maintenance" config section (or env var Maintenance__Enabled).
/// When Enabled is true, the API serves a 503 for identify requests and the
/// frontend shows a maintenance screen.
/// </summary>
public class MaintenanceSettings
{
    public bool Enabled { get; set; }

    public string Message { get; set; } =
        "The app is under maintenance. Please check back in a little while. 🌱";
}

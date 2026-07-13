using System.Text.Json;
using Microsoft.Extensions.Options;
using TreeIdentifier.Api.Services;

namespace TreeIdentifier.Api.Middleware;

/// <summary>
/// When maintenance mode is enabled, short-circuits API requests with 503,
/// except /api/health (which the frontend needs to read the maintenance flag).
/// </summary>
public class MaintenanceMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IOptionsMonitor<MaintenanceSettings> _settings;

    public MaintenanceMiddleware(RequestDelegate next, IOptionsMonitor<MaintenanceSettings> settings)
    {
        _next = next;
        _settings = settings;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var maintenance = _settings.CurrentValue;
        var path = context.Request.Path.Value ?? string.Empty;

        // Health endpoint must stay reachable so the frontend can detect maintenance.
        var isHealth = path.StartsWith("/api/health", StringComparison.OrdinalIgnoreCase);

        if (maintenance.Enabled && !isHealth && path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.ContentType = "application/json";
            context.Response.Headers.RetryAfter = "120";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                status = "maintenance",
                maintenance = true,
                message = maintenance.Message
            }));
            return;
        }

        await _next(context);
    }
}

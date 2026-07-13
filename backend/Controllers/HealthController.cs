using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TreeIdentifier.Api.Services;

namespace TreeIdentifier.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly MaintenanceSettings _maintenance;

    public HealthController(IOptions<MaintenanceSettings> maintenance)
    {
        _maintenance = maintenance.Value;
    }

    /// <summary>
    /// GET /api/health — lightweight liveness + maintenance flag.
    /// The frontend polls this on load to decide whether to show the app
    /// or the maintenance screen.
    /// </summary>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = _maintenance.Enabled ? "maintenance" : "ok",
            maintenance = _maintenance.Enabled,
            message = _maintenance.Enabled ? _maintenance.Message : null
        });
    }
}

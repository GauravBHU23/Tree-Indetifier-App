using Microsoft.AspNetCore.Mvc;
using TreeIdentifier.Api.Models;
using TreeIdentifier.Api.Services;

namespace TreeIdentifier.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IdentifyController : ControllerBase
{
    private const long MaxImageBytes = 10 * 1024 * 1024; // 10 MB

    private readonly IPlantIdService _plantId;
    private readonly IPlantDetailService _detail;
    private readonly ILogger<IdentifyController> _logger;

    public IdentifyController(
        IPlantIdService plantId,
        IPlantDetailService detail,
        ILogger<IdentifyController> logger)
    {
        _plantId = plantId;
        _detail = detail;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/identify — accepts a captured photo, identifies the plant,
    /// enriches it with detailed botanical info, and returns a TreeDetailDto.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(MaxImageBytes)]
    public async Task<ActionResult<TreeDetailDto>> Post(IFormFile image, CancellationToken ct)
    {
        if (image is null || image.Length == 0)
            return BadRequest("No image uploaded. Send a file in the 'image' field.");

        if (image.Length > MaxImageBytes)
            return BadRequest("Image too large (max 10 MB).");

        if (!image.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Uploaded file is not an image.");

        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await image.CopyToAsync(ms, ct);
            bytes = ms.ToArray();
        }

        // Step 1 — identify the plant (top matches, best first) via PlantNet.
        IReadOnlyList<PlantIdResult> matches;
        try
        {
            matches = await _plantId.IdentifyAsync(bytes, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Identification failed");
            return StatusCode(502, "Plant identification service failed.");
        }

        if (matches.Count == 0)
            return NotFound("Could not identify any plant in this image. Try a clearer photo.");

        // Step 2 — enrich the best match with botanical details from Wikipedia.
        var result = await _detail.EnrichAsync(matches[0], ct);

        // Attach the remaining candidates as alternatives.
        result.Alternatives = matches.Skip(1).Select(m => new AlternativeMatch
        {
            CommonName = m.CommonName,
            ScientificName = m.ScientificName,
            ConfidenceScore = m.Probability
        }).ToList();

        return Ok(result);
    }
}

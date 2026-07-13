using TreeIdentifier.Api.Models;

namespace TreeIdentifier.Api.Services;

public interface IPlantIdService
{
    /// <summary>
    /// Identifies a plant from raw image bytes using the PlantNet API (free).
    /// Returns the top matches (name + confidence), best first, or an empty list
    /// if nothing recognized.
    /// </summary>
    Task<IReadOnlyList<PlantIdResult>> IdentifyAsync(byte[] imageBytes, CancellationToken ct = default);
}

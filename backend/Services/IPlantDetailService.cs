using TreeIdentifier.Api.Models;

namespace TreeIdentifier.Api.Services;

public interface IPlantDetailService
{
    /// <summary>
    /// Enriches an identified plant with detailed botanical info
    /// (leaf, flower, fruit, bark, habit, branch, bud, seed, habitat, uses)
    /// using the Claude API. Mutates and returns the passed DTO.
    /// </summary>
    Task<TreeDetailDto> EnrichAsync(PlantIdResult identified, CancellationToken ct = default);
}

namespace TreeIdentifier.Api.Models;

/// <summary>
/// Minimal result from the identification step (PlantNet): name + confidence.
/// </summary>
public class PlantIdResult
{
    public string CommonName { get; set; } = string.Empty;
    public string ScientificName { get; set; } = string.Empty;
    public double Probability { get; set; }
    public string? ImageUrl { get; set; }
}

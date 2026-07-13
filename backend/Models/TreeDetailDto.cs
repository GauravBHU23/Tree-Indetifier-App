namespace TreeIdentifier.Api.Models;

/// <summary>
/// Full botanical breakdown returned to the frontend after identification + enrichment.
/// </summary>
public class TreeDetailDto
{
    public string CommonName { get; set; } = string.Empty;
    public string ScientificName { get; set; } = string.Empty;

    // Botanical parts
    public string Leaf { get; set; } = string.Empty;
    public string Flower { get; set; } = string.Empty;
    public string Fruit { get; set; } = string.Empty;
    public string Bark { get; set; } = string.Empty;
    public string Habit { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Bud { get; set; } = string.Empty;
    public string Seed { get; set; } = string.Empty;

    // Context
    public string Habitat { get; set; } = string.Empty;
    public string Uses { get; set; } = string.Empty;

    /// <summary>General description / summary (from Wikipedia).</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Identification confidence from PlantNet, 0..1.</summary>
    public double ConfidenceScore { get; set; }

    /// <summary>Reference image URL (Wikipedia thumbnail), if any.</summary>
    public string? ImageUrl { get; set; }

    /// <summary>Link to the Wikipedia article, if found.</summary>
    public string? WikipediaUrl { get; set; }

    /// <summary>Other possible matches (name + confidence), best first, excluding the top one.</summary>
    public List<AlternativeMatch> Alternatives { get; set; } = new();
}

/// <summary>A lower-ranked identification candidate shown as an alternative.</summary>
public class AlternativeMatch
{
    public string CommonName { get; set; } = string.Empty;
    public string ScientificName { get; set; } = string.Empty;
    public double ConfidenceScore { get; set; }
}

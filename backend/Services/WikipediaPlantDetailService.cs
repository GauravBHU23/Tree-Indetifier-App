using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using TreeIdentifier.Api.Models;

namespace TreeIdentifier.Api.Services;

/// <summary>
/// Enriches an identified plant with details from Wikipedia (free, no API key).
/// Fetches the article summary and keyword-scans it to fill botanical parts
/// (leaf, flower, fruit, bark, etc.) where the text mentions them.
/// </summary>
public class WikipediaPlantDetailService : IPlantDetailService
{
    private readonly HttpClient _http;
    private readonly WikipediaSettings _settings;
    private readonly ILogger<WikipediaPlantDetailService> _logger;

    // Keyword → which DTO field a sentence should fill if it mentions the keyword.
    private static readonly (string Keyword, string Field)[] PartKeywords =
    {
        ("leaf", nameof(TreeDetailDto.Leaf)),
        ("leaves", nameof(TreeDetailDto.Leaf)),
        ("foliage", nameof(TreeDetailDto.Leaf)),
        ("flower", nameof(TreeDetailDto.Flower)),
        ("blossom", nameof(TreeDetailDto.Flower)),
        ("bloom", nameof(TreeDetailDto.Flower)),
        ("fruit", nameof(TreeDetailDto.Fruit)),
        ("berry", nameof(TreeDetailDto.Fruit)),
        ("berries", nameof(TreeDetailDto.Fruit)),
        ("bark", nameof(TreeDetailDto.Bark)),
        ("branch", nameof(TreeDetailDto.Branch)),
        ("twig", nameof(TreeDetailDto.Branch)),
        ("bud", nameof(TreeDetailDto.Bud)),
        ("seed", nameof(TreeDetailDto.Seed)),
        ("native to", nameof(TreeDetailDto.Habitat)),
        ("grows in", nameof(TreeDetailDto.Habitat)),
        ("habitat", nameof(TreeDetailDto.Habitat)),
        ("found in", nameof(TreeDetailDto.Habitat)),
        ("used", nameof(TreeDetailDto.Uses)),
        ("cultivated", nameof(TreeDetailDto.Uses)),
        ("medicinal", nameof(TreeDetailDto.Uses)),
        ("timber", nameof(TreeDetailDto.Uses)),
    };

    public WikipediaPlantDetailService(HttpClient http, IOptions<ApiSettings> options, ILogger<WikipediaPlantDetailService> logger)
    {
        _http = http;
        _settings = options.Value.Wikipedia;
        _logger = logger;
    }

    public async Task<TreeDetailDto> EnrichAsync(PlantIdResult identified, CancellationToken ct = default)
    {
        var dto = new TreeDetailDto
        {
            CommonName = identified.CommonName,
            ScientificName = identified.ScientificName,
            ConfidenceScore = identified.Probability
        };

        // Prefer the scientific name for the Wikipedia lookup; fall back to common name.
        var extract = await FetchSummaryAsync(identified.ScientificName, dto, ct)
                   ?? await FetchSummaryAsync(identified.CommonName, dto, ct);

        if (string.IsNullOrWhiteSpace(extract))
        {
            _logger.LogInformation("No Wikipedia article for {Name}", identified.ScientificName);
            return dto;
        }

        dto.Description = extract;
        FillPartsFromText(dto, extract);
        return dto;
    }

    /// <summary>Calls the Wikipedia REST summary endpoint; returns the extract text or null.</summary>
    private async Task<string?> FetchSummaryAsync(string title, TreeDetailDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(title))
            return null;

        var url = $"{_settings.BaseUrl}/page/summary/{Uri.EscapeDataString(title)}?redirect=true";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        // Wikipedia requires a descriptive User-Agent.
        request.Headers.UserAgent.ParseAdd("TreeIdentifier/1.0 (educational project)");

        var response = await _http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
            return null;

        var body = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        if (root.TryGetProperty("thumbnail", out var thumb) &&
            thumb.TryGetProperty("source", out var src))
        {
            dto.ImageUrl = src.GetString();
        }

        if (root.TryGetProperty("content_urls", out var urls) &&
            urls.TryGetProperty("desktop", out var desktop) &&
            desktop.TryGetProperty("page", out var page))
        {
            dto.WikipediaUrl = page.GetString();
        }

        if (root.TryGetProperty("extract", out var extractEl))
            return extractEl.GetString();

        return null;
    }

    /// <summary>Splits the summary into sentences and assigns each to a botanical field by keyword.</summary>
    private static void FillPartsFromText(TreeDetailDto dto, string text)
    {
        var sentences = Regex.Split(text, @"(?<=[.!?])\s+");

        foreach (var sentence in sentences)
        {
            var lower = sentence.ToLowerInvariant();
            foreach (var (keyword, field) in PartKeywords)
            {
                if (!lower.Contains(keyword)) continue;

                // Only fill a field once (first matching sentence wins).
                switch (field)
                {
                    case nameof(TreeDetailDto.Leaf) when dto.Leaf == "": dto.Leaf = sentence.Trim(); break;
                    case nameof(TreeDetailDto.Flower) when dto.Flower == "": dto.Flower = sentence.Trim(); break;
                    case nameof(TreeDetailDto.Fruit) when dto.Fruit == "": dto.Fruit = sentence.Trim(); break;
                    case nameof(TreeDetailDto.Bark) when dto.Bark == "": dto.Bark = sentence.Trim(); break;
                    case nameof(TreeDetailDto.Branch) when dto.Branch == "": dto.Branch = sentence.Trim(); break;
                    case nameof(TreeDetailDto.Bud) when dto.Bud == "": dto.Bud = sentence.Trim(); break;
                    case nameof(TreeDetailDto.Seed) when dto.Seed == "": dto.Seed = sentence.Trim(); break;
                    case nameof(TreeDetailDto.Habitat) when dto.Habitat == "": dto.Habitat = sentence.Trim(); break;
                    case nameof(TreeDetailDto.Uses) when dto.Uses == "": dto.Uses = sentence.Trim(); break;
                }
            }
        }
    }
}

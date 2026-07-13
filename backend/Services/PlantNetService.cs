using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TreeIdentifier.Api.Models;

namespace TreeIdentifier.Api.Services;

/// <summary>
/// Calls the free PlantNet identification API.
/// Docs: https://my.plantnet.org/  — POST an image, get ranked species back.
/// </summary>
public class PlantNetService : IPlantIdService
{
    private readonly HttpClient _http;
    private readonly PlantNetSettings _settings;
    private readonly ILogger<PlantNetService> _logger;

    public PlantNetService(HttpClient http, IOptions<ApiSettings> options, ILogger<PlantNetService> logger)
    {
        _http = http;
        _settings = options.Value.PlantNet;
        _logger = logger;
    }

    public async Task<IReadOnlyList<PlantIdResult>> IdentifyAsync(byte[] imageBytes, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
            throw new InvalidOperationException("PlantNet API key is not configured. Set Api:PlantNet:ApiKey.");

        // PlantNet expects multipart/form-data: one or more "images" files + matching "organs".
        using var content = new MultipartFormDataContent();

        var imageContent = new ByteArrayContent(imageBytes);
        imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        content.Add(imageContent, "images", "capture.jpg");
        // "auto" lets PlantNet decide the organ (leaf/flower/fruit/bark) itself.
        content.Add(new StringContent("auto"), "organs");

        var url = $"{_settings.BaseUrl}/identify/{_settings.Project}?api-key={_settings.ApiKey}";

        var response = await _http.PostAsync(url, content, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            // 404 from PlantNet means "no species matched" rather than a hard error.
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogInformation("PlantNet found no match.");
                return [];
            }

            _logger.LogError("PlantNet error {Status}: {Body}", response.StatusCode, body);
            throw new HttpRequestException($"PlantNet API returned {(int)response.StatusCode}.");
        }

        return ParseTopResults(body, max: 4);
    }

    private static IReadOnlyList<PlantIdResult> ParseTopResults(string json, int max)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (!root.TryGetProperty("results", out var results) ||
            results.ValueKind != JsonValueKind.Array ||
            results.GetArrayLength() == 0)
        {
            return [];
        }

        var list = new List<PlantIdResult>();
        foreach (var item in results.EnumerateArray())
        {
            if (list.Count >= max) break;

            double score = item.TryGetProperty("score", out var scoreEl) ? scoreEl.GetDouble() : 0;

            string scientificName = string.Empty;
            string commonName = string.Empty;

            if (item.TryGetProperty("species", out var species))
            {
                if (species.TryGetProperty("scientificNameWithoutAuthor", out var sciEl))
                    scientificName = sciEl.GetString() ?? string.Empty;

                if (species.TryGetProperty("commonNames", out var commonNames) &&
                    commonNames.ValueKind == JsonValueKind.Array &&
                    commonNames.GetArrayLength() > 0)
                {
                    commonName = commonNames[0].GetString() ?? string.Empty;
                }
            }

            if (string.IsNullOrEmpty(scientificName)) continue;
            if (string.IsNullOrEmpty(commonName)) commonName = scientificName;

            list.Add(new PlantIdResult
            {
                CommonName = commonName,
                ScientificName = scientificName,
                Probability = score
            });
        }

        return list;
    }
}

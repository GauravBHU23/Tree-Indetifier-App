namespace TreeIdentifier.Api.Services;

/// <summary>Bound from configuration (appsettings.json / environment variables).</summary>
public class ApiSettings
{
    public PlantNetSettings PlantNet { get; set; } = new();
    public WikipediaSettings Wikipedia { get; set; } = new();
}

public class PlantNetSettings
{
    /// <summary>Free API key from https://my.plantnet.org/ (My account → Settings → API key).</summary>
    public string ApiKey { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://my-api.plantnet.org/v2";

    /// <summary>Project/flora to search. "all" covers the global flora.</summary>
    public string Project { get; set; } = "all";
}

public class WikipediaSettings
{
    /// <summary>REST summary endpoint base (no key needed).</summary>
    public string BaseUrl { get; set; } = "https://en.wikipedia.org/api/rest_v1";
}

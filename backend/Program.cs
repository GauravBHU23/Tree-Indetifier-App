using TreeIdentifier.Api.Middleware;
using TreeIdentifier.Api.Services;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicy = "AllowFrontend";

// Bind API settings (PlantNet key) from configuration / environment.
builder.Services.Configure<ApiSettings>(builder.Configuration.GetSection("Api"));

// Maintenance flag (env var: Maintenance__Enabled=true).
builder.Services.Configure<MaintenanceSettings>(builder.Configuration.GetSection("Maintenance"));

// Allowed frontend origins: dev servers + any configured via "Cors:AllowedOrigins"
// (set in Azure App Service → Configuration as Cors__AllowedOrigins__0, __1, ...).
var allowedOrigins = new List<string> { "http://localhost:5173", "http://127.0.0.1:5173" };
allowedOrigins.AddRange(
    builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? []);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Both services call HTTP APIs (PlantNet for identification, Wikipedia for details).
builder.Services.AddHttpClient<IPlantIdService, PlantNetService>();
builder.Services.AddHttpClient<IPlantDetailService, WikipediaPlantDetailService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicy);

// Short-circuit API calls with 503 when maintenance mode is on (health stays up).
app.UseMiddleware<MaintenanceMiddleware>();

app.UseAuthorization();
app.MapControllers();

app.Run();

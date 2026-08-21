using Microsoft.EntityFrameworkCore;
using Data;
using Backend.Repositories;
using Backend.Services;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
Environment.SetEnvironmentVariable("DOTNET_USE_POLLING_FILE_WATCHER", "true");

// Sanitizar ASPNETCORE_URLS si viene con formato markdown accidental de la UI de Render
var rawUrls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? Environment.GetEnvironmentVariable("URLS");
if (!string.IsNullOrWhiteSpace(rawUrls))
{
    var cleanUrls = SanitizeUrl(rawUrls);
    Environment.SetEnvironmentVariable("ASPNETCORE_URLS", cleanUrls);
}

var builder = WebApplication.CreateBuilder(args);

// 1. CONEXIÓN A POSTGRESQL (RENDER)
var rawConn = builder.Configuration.GetConnectionString("PostgresConnection") 
              ?? Environment.GetEnvironmentVariable("DATABASE_URL")
              ?? Environment.GetEnvironmentVariable("PostgresConnection");

var connectionString = SanitizeConnectionString(rawConn);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null
        );
    }));

// 2. CONFIGURACIÓN COMPLETA DE CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 3. REGISTRO DE CONTROLADORES
builder.Services.AddControllers();

// 4. INYECCIÓN DE DEPENDENCIAS
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IProyectoRepository, ProyectoRepository>();
builder.Services.AddScoped<IPresupuestoRepository, PresupuestoRepository>();
builder.Services.AddScoped<ITareaRepository, TareaRepository>();
builder.Services.AddScoped<IConceptoRepository, ConceptoRepository>();

builder.Services.AddScoped<ClienteService>();
builder.Services.AddScoped<ProyectoService>();
builder.Services.AddScoped<PresupuestoService>();
builder.Services.AddScoped<TareaService>();
builder.Services.AddScoped<ConceptoService>();
builder.Services.AddScoped<SequenceResetService>();

var app = builder.Build();

// 5. APLICAR CORS DE INMEDIATO EN EL PIPELINE (ANTES DE CUALQUIER OTRA COSA)
app.UseCors("AllowAll");
app.UseRouting();
app.UseAuthorization();

// 6. ACTUALIZACIÓN AUTOMÁTICA DE ESQUEMA EN POSTGRESQL
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync("DROP TABLE IF EXISTS \"Cotizaciones\" CASCADE;");
        await dbContext.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS \"Roles\" (\"Id\" text PRIMARY KEY, \"Label\" text NOT NULL);");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Usuarios\" DROP COLUMN IF EXISTS \"Email\";");
        
        // Columnas faltantes detectadas en los logs
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Clientes\" ADD COLUMN IF NOT EXISTS \"Ciudad\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Clientes\" ADD COLUMN IF NOT EXISTS \"NombreComercial\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Clientes\" ADD COLUMN IF NOT EXISTS \"ApoderadoLegal\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Clientes\" ADD COLUMN IF NOT EXISTS \"Rfc\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Clientes\" ADD COLUMN IF NOT EXISTS \"DireccionFiscal\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Clientes\" ADD COLUMN IF NOT EXISTS \"Responsable\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Clientes\" ADD COLUMN IF NOT EXISTS \"Contacto\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Clientes\" ADD COLUMN IF NOT EXISTS \"Email\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Clientes\" ADD COLUMN IF NOT EXISTS \"Telefono\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Clientes\" ADD COLUMN IF NOT EXISTS \"Estatus\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Clientes\" ADD COLUMN IF NOT EXISTS \"Tipo\" text;");

        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"Estimacion\" numeric;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"UsoPrincipal\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"UsoComplementario\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"ImpactoPrincipal\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"UsosComplementariosJson\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"ZonaPrimaria\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"DireccionPrincipal\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"DireccionesComplementariasJson\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"VialidadPrincipal\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"VialidadComplementaria\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"AreaCompatibilidad\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"ZonaCompatibilidadEspecifica\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"Alcance\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"Descripcion\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"Responsable\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"TareasDiarias\" ADD COLUMN IF NOT EXISTS \"ProyectoId\" integer;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"TareasDiarias\" ADD COLUMN IF NOT EXISTS \"Etapa\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"TareasDiarias\" ADD COLUMN IF NOT EXISTS \"PresupuestoId\" integer;");
        
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Conceptos\" ADD COLUMN IF NOT EXISTS \"Nombre\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Conceptos\" ADD COLUMN IF NOT EXISTS \"Unidad\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Conceptos\" ADD COLUMN IF NOT EXISTS \"Cantidad\" double precision;");

        Console.WriteLine("[Startup] Esquema PostgreSQL actualizado correctamente.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Startup] Error al actualizar esquema: {ex.Message}");
    }

    try
    {
        SeedData.Initialize(services);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error al sembrar datos: {ex.Message}");
    }

    try
    {
        var seqService = services.GetRequiredService<SequenceResetService>();
        await seqService.ResetAllSequencesAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Startup] Error al reajustar secuencias: {ex.Message}");
    }
}

app.MapControllers();
app.Run();

static string SanitizeUrl(string raw)
{
    var trimmed = raw.Trim();
    if (trimmed.StartsWith("[") && trimmed.Contains("](") && trimmed.EndsWith(")"))
    {
        var startIndex = trimmed.IndexOf("](") + 2;
        trimmed = trimmed.Substring(startIndex, trimmed.Length - startIndex - 1).Trim();
    }
    else if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
    {
        trimmed = trimmed.Trim('[', ']');
    }
    return trimmed;
}

static string SanitizeConnectionString(string? raw)
{
    if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
    var trimmed = raw.Trim();

    // Limpiar sintaxis de enlace markdown si fue pegado accidentalmente: [texto](url)
    if (trimmed.StartsWith("[") && trimmed.Contains("](") && trimmed.EndsWith(")"))
    {
        var startIndex = trimmed.IndexOf("](") + 2;
        trimmed = trimmed.Substring(startIndex, trimmed.Length - startIndex - 1).Trim();
    }
    else if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
    {
        trimmed = trimmed.Trim('[', ']');
    }

    // Convertir formato URI (postgres:// o postgresql://) a formato estándar de Npgsql
    if (trimmed.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        trimmed.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            var uri = new Uri(trimmed);
            var userInfo = uri.UserInfo.Split(':');
            var username = userInfo.Length > 0 ? userInfo[0] : "";
            var password = userInfo.Length > 1 ? userInfo[1] : "";
            var database = uri.AbsolutePath.TrimStart('/');
            var port = uri.Port > 0 ? uri.Port : 5432;

            return $"Host={uri.Host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;Keepalive=30;Timeout=30;";
        }
        catch
        {
            // En caso de fallo de parsing URI, retornar string original
        }
    }

    return trimmed;
}
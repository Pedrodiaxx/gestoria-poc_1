using Microsoft.EntityFrameworkCore;
using Data;
using Backend.Repositories;
using Backend.Services;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
Environment.SetEnvironmentVariable("DOTNET_USE_POLLING_FILE_WATCHER", "true");

var builder = WebApplication.CreateBuilder(args);

// 1. CONEXIÓN A POSTGRESQL (RENDER)
var connectionString = builder.Configuration.GetConnectionString("PostgresConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null
        );
    }));

// 2. CONFIGURACIÓN COMPLETA DE CORS (Soporte para Vercel y Localhost)
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

// Inicializar y sembrar base de datos si está vacía
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync("DROP TABLE IF EXISTS \"Cotizaciones\" CASCADE;");
        await dbContext.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS \"Roles\" (\"Id\" text PRIMARY KEY, \"Label\" text NOT NULL);");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Usuarios\" DROP COLUMN IF EXISTS \"Email\";");
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
        Console.WriteLine("[Startup] Esquema PostgreSQL actualizado.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Startup] Error al actualizar esquema PostgreSQL: {ex.Message}");
    }

    try
    {
        SeedData.Initialize(services);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error al sembrar la base de datos: {ex.Message}");
    }

    try
    {
        var seqService = services.GetRequiredService<SequenceResetService>();
        await seqService.ResetAllSequencesAsync();
        Console.WriteLine("[Startup] Secuencias de PostgreSQL reajustadas correctamente.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Startup] Error al reajustar secuencias: {ex.Message}");
    }
}

// PIPELINE DE RED EN PRODUCTION (RENDER)
app.UseRouting();

// Habilitar CORS explícito antes de controladores y SIN UseHttpsRedirection
app.UseCors("AllowAll");

app.UseAuthorization();
app.MapControllers();

app.Run();
using Microsoft.EntityFrameworkCore;
using Data;
using Backend.Repositories;
using Backend.Services;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
Environment.SetEnvironmentVariable("DOTNET_USE_POLLING_FILE_WATCHER", "true");

var builder = WebApplication.CreateBuilder(args);

// 1. CONEXIÓN A POSTGRESQL EN RENDER (INTOCABLE)
var connectionString = builder.Configuration.GetConnectionString("PostgresConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. CORS PARA REACT FRONTEND (INTOCABLE)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// 3. REGISTRO DE CONTROLADORES
builder.Services.AddControllers();

// 4. INYECCIÓN DE DEPENDENCIAS — REPOSITORIOS (Capa de Datos)
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IProyectoRepository, ProyectoRepository>();
builder.Services.AddScoped<IPresupuestoRepository, PresupuestoRepository>();
builder.Services.AddScoped<ITareaRepository, TareaRepository>();
builder.Services.AddScoped<IConceptoRepository, ConceptoRepository>();

// 5. INYECCIÓN DE DEPENDENCIAS — SERVICIOS (Lógica de Negocio)
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

    // Asegurar esquema en PostgreSQL (Crear tabla Roles y remover columna Email de Usuarios)
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.ExecuteSqlRawAsync("DROP TABLE IF EXISTS \"Cotizaciones\" CASCADE;");
        await dbContext.Database.ExecuteSqlRawAsync("CREATE TABLE IF NOT EXISTS \"Roles\" (\"Id\" text PRIMARY KEY, \"Label\" text NOT NULL);");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Usuarios\" DROP COLUMN IF EXISTS \"Email\";");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"UsoPrincipal\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"UsoComplementario\" text;");
        await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Proyectos\" ADD COLUMN IF NOT EXISTS \"ImpactoPrincipal\" text;");
        Console.WriteLine("[Startup] Esquema PostgreSQL actualizado (Roles asegurado, Email removido, UsoPrincipal, UsoComplementario e ImpactoPrincipal asegurados).");
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

    // Reajustar secuencias de PostgreSQL al MAX(Id) actual de cada tabla
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

app.UseHttpsRedirection();
app.UseCors(); // Activar la política de CORS

// 6. MAPEAR CONTROLADORES (reemplaza todas las Minimal APIs)
app.MapControllers();

app.Run();
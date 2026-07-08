using Microsoft.EntityFrameworkCore;
using Data;

var builder = WebApplication.CreateBuilder(args);

// 1. CONEXIÓN A POSTGRESQL EN RENDER
var connectionString = builder.Configuration.GetConnectionString("PostgresConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Habilitar CORS para que tu React de Frontend pueda leer la API sin bloqueos
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors(); // Activar la política de CORS

// 2. ENDPOINT PARA CONSULTAR TODAS LAS COTIZACIONES (GET /api/cotizaciones)
app.MapGet("/api/cotizaciones", async (ApplicationDbContext db) =>
{
    var cotizaciones = await db.Cotizaciones.ToListAsync();
    return Results.Ok(cotizaciones);
});

// 3. ENDPOINT PARA CREAR UNA NUEVA COTIZACIÓN (POST /api/cotizaciones)
app.MapPost("/api/cotizaciones", async (Cotizacion nuevaCotizacion, ApplicationDbContext db) =>
{
    db.Cotizaciones.Add(nuevaCotizacion);
    await db.SaveChangesAsync();
    return Results.Created($"/api/cotizaciones/{nuevaCotizacion.Id}", nuevaCotizacion);
});

// Ruta por defecto para verificar salud de la API
app.MapGet("/weatherforecast", () =>
{
    return new[] { "Conexión Exitosa con Minimal APIs y Postgres" };
});

app.Run();
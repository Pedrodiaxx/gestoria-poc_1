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

// -- ENDPOINTS PARA CLIENTES --
app.MapGet("/api/clientes", async (ApplicationDbContext db) =>
{
    var clientes = await db.Clientes.ToListAsync();
    return Results.Ok(clientes);
});

app.MapPost("/api/clientes", async (Cliente nuevoCliente, ApplicationDbContext db) =>
{
    db.Clientes.Add(nuevoCliente);
    await db.SaveChangesAsync();
    return Results.Created($"/api/clientes/{nuevoCliente.Id}", nuevoCliente);
});

// -- ENDPOINTS PARA PROYECTOS --
app.MapGet("/api/proyectos", async (ApplicationDbContext db) =>
{
    var proyectos = await db.Proyectos.ToListAsync();
    return Results.Ok(proyectos);
});

app.MapPost("/api/proyectos", async (Proyecto nuevoProyecto, ApplicationDbContext db) =>
{
    db.Proyectos.Add(nuevoProyecto);
    await db.SaveChangesAsync();
    return Results.Created($"/api/proyectos/{nuevoProyecto.Id}", nuevoProyecto);
});

// -- ENDPOINTS PARA PRESUPUESTOS --
app.MapGet("/api/presupuestos", async (ApplicationDbContext db) =>
{
    var presupuestos = await db.Presupuestos.ToListAsync();
    return Results.Ok(presupuestos);
});

app.MapPost("/api/presupuestos", async (Presupuesto nuevoPresupuesto, ApplicationDbContext db) =>
{
    db.Presupuestos.Add(nuevoPresupuesto);
    await db.SaveChangesAsync();
    return Results.Created($"/api/presupuestos/{nuevoPresupuesto.Id}", nuevoPresupuesto);
});

// -- ENDPOINTS PARA TAREAS --
app.MapGet("/api/tareas", async (ApplicationDbContext db) =>
{
    var tareas = await db.TareasDiarias.ToListAsync();
    return Results.Ok(tareas);
});

app.MapPost("/api/tareas", async (TareaDiaria nuevaTarea, ApplicationDbContext db) =>
{
    db.TareasDiarias.Add(nuevaTarea);
    await db.SaveChangesAsync();
    return Results.Created($"/api/tareas/{nuevaTarea.Id}", nuevaTarea);
});

// Ruta por defecto para verificar salud de la API
app.MapGet("/weatherforecast", () =>
{
    return new[] { "Conexión Exitosa con Minimal APIs y Postgres" };
});

app.Run();
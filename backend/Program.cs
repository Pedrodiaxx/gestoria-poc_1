using Microsoft.EntityFrameworkCore;
using Data;
using Backend.Repositories;
using Backend.Services;

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
builder.Services.AddScoped<ICotizacionRepository, CotizacionRepository>();
builder.Services.AddScoped<IProyectoRepository, ProyectoRepository>();
builder.Services.AddScoped<IPresupuestoRepository, PresupuestoRepository>();
builder.Services.AddScoped<ITareaRepository, TareaRepository>();
builder.Services.AddScoped<IConceptoRepository, ConceptoRepository>();

// 5. INYECCIÓN DE DEPENDENCIAS — SERVICIOS (Lógica de Negocio)
builder.Services.AddScoped<ClienteService>();
builder.Services.AddScoped<CotizacionService>();
builder.Services.AddScoped<ProyectoService>();
builder.Services.AddScoped<PresupuestoService>();
builder.Services.AddScoped<TareaService>();
builder.Services.AddScoped<ConceptoService>();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors(); // Activar la política de CORS

// 6. MAPEAR CONTROLADORES (reemplaza todas las Minimal APIs)
app.MapControllers();

app.Run();
using Microsoft.EntityFrameworkCore;
using Data;
using Data.DTOs;
using System.Text.Json;

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

// 2. ENDPOINT PARA CONSULTAR COTIZACIONES CON DTOs CALCULADOS (GET /api/cotizaciones)
// Parámetros opcionales: ?clienteId=5&rol=cliente → filtra por seguridad directo en EF Core
app.MapGet("/api/cotizaciones", async (ApplicationDbContext db, int? clienteId, string? rol) =>
{
    var query = db.Cotizaciones.AsQueryable();

    // REGLA DE ORO DE SEGURIDAD: Filtrado directo en EF Core hacia la base de datos si es rol cliente
    if (rol == "cliente" && clienteId.HasValue)
    {
        var nombreCliente = await db.Clientes
            .Where(cl => cl.Id == clienteId.Value)
            .Select(cl => cl.Nombre)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrEmpty(nombreCliente))
        {
            query = query.Where(c => c.Cliente.ToLower() == nombreCliente.ToLower());
        }
    }

    var cotizaciones = await query.ToListAsync();
    var clientes = await db.Clientes.ToListAsync();

    var resultado = cotizaciones.Select(c =>
    {
        var cli = clientes.FirstOrDefault(cl =>
            cl.Nombre.Equals(c.Cliente, StringComparison.OrdinalIgnoreCase));

        double total = c.Total;
        double abonado = 0;
        double saldo = total - abonado;

        string estatus, badge, label;
        if (saldo <= 0)
        {
            estatus = "liquidada"; badge = "badge-green"; label = "Liquidada";
        }
        else if (abonado > 0)
        {
            estatus = "parcial"; badge = "badge-amber"; label = "Parcial";
        }
        else
        {
            estatus = "pendiente"; badge = "badge-red"; label = "Sin abono";
        }

        var conceptos = new List<Data.DTOs.ConceptoLineaDTO>();
        if (!string.IsNullOrEmpty(c.ConceptosJson))
        {
            try
            {
                var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                conceptos = JsonSerializer.Deserialize<List<Data.DTOs.ConceptoLineaDTO>>(c.ConceptosJson, jsonOpts)
                    ?? new List<Data.DTOs.ConceptoLineaDTO>();
            }
            catch { /* JSON inválido */ }
        }

        return new Data.DTOs.CotizacionDTO
        {
            Id = $"COT-{c.Id.ToString().PadLeft(3, '0')}",
            IdNumerico = c.Id,
            ClienteId = cli?.Id ?? 0,
            ClienteNombre = cli?.Nombre ?? c.Cliente,
            ClienteContacto = cli?.Contacto ?? "",
            Fecha = c.Fecha.ToString("yyyy-MM-dd"),
            Total = total,
            Abonado = abonado,
            Saldo = saldo,
            Estatus = estatus,
            EstatusBadge = badge,
            EstatusLabel = label,
            Conceptos = conceptos
        };
    }).ToList();

    return Results.Ok(resultado);
});

// 3. ENDPOINT PARA CREAR UNA NUEVA COTIZACIÓN (POST /api/cotizaciones)
app.MapPost("/api/cotizaciones", async (Cotizacion nuevaCotizacion, ApplicationDbContext db) =>
{
    db.Cotizaciones.Add(nuevaCotizacion);
    await db.SaveChangesAsync();

    // Resolver cliente para el DTO
    var cli = await db.Clientes.FirstOrDefaultAsync(cl =>
        cl.Nombre.Equals(nuevaCotizacion.Cliente, StringComparison.OrdinalIgnoreCase));

    double total = nuevaCotizacion.Total;
    double abonado = 0;
    double saldo = total - abonado;

    string estatus, badge, label;
    if (saldo <= 0)
    {
        estatus = "liquidada"; badge = "badge-green"; label = "Liquidada";
    }
    else if (abonado > 0)
    {
        estatus = "parcial"; badge = "badge-amber"; label = "Parcial";
    }
    else
    {
        estatus = "pendiente"; badge = "badge-red"; label = "Sin abono";
    }

    var conceptos = new List<Data.DTOs.ConceptoLineaDTO>();
    if (!string.IsNullOrEmpty(nuevaCotizacion.ConceptosJson))
    {
        try
        {
            var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            conceptos = JsonSerializer.Deserialize<List<Data.DTOs.ConceptoLineaDTO>>(nuevaCotizacion.ConceptosJson, jsonOpts)
                ?? new List<Data.DTOs.ConceptoLineaDTO>();
        }
        catch { /* JSON inválido */ }
    }

    var dto = new Data.DTOs.CotizacionDTO
    {
        Id = $"COT-{nuevaCotizacion.Id.ToString().PadLeft(3, '0')}",
        IdNumerico = nuevaCotizacion.Id,
        ClienteId = cli?.Id ?? 0,
        ClienteNombre = cli?.Nombre ?? nuevaCotizacion.Cliente,
        ClienteContacto = cli?.Contacto ?? "",
        Fecha = nuevaCotizacion.Fecha.ToString("yyyy-MM-dd"),
        Total = total,
        Abonado = abonado,
        Saldo = saldo,
        Estatus = estatus,
        EstatusBadge = badge,
        EstatusLabel = label,
        Conceptos = conceptos
    };

    return Results.Created($"/api/cotizaciones/{nuevaCotizacion.Id}", dto);
});

// -- ENDPOINTS PARA CLIENTES (DTO con badge/label de estatus) --
app.MapGet("/api/clientes", async (ApplicationDbContext db) =>
{
    var clientes = await db.Clientes.ToListAsync();

    var resultado = clientes.Select(c =>
    {
        string badge, label;
        var est = (c.Estatus ?? "activo").ToLowerInvariant();
        switch (est)
        {
            case "inactivo": badge = "badge-gray"; label = "Inactivo"; break;
            case "prospecto": badge = "badge-amber"; label = "Prospecto"; break;
            default: badge = "badge-green"; label = "Activo"; break;
        }

        return new ClienteDTO
        {
            Id = c.Id,
            Nombre = c.Nombre ?? "",
            Contacto = c.Contacto ?? "",
            Email = c.Email ?? "",
            Telefono = c.Telefono ?? "",
            Estatus = est,
            Tipo = c.Tipo ?? "empresa",
            EstatusBadge = badge,
            EstatusLabel = label
        };
    }).ToList();

    return Results.Ok(resultado);
});

app.MapPost("/api/clientes", async (Cliente nuevoCliente, ApplicationDbContext db) =>
{
    db.Clientes.Add(nuevoCliente);
    await db.SaveChangesAsync();

    string badge, label;
    var est = (nuevoCliente.Estatus ?? "activo").ToLowerInvariant();
    switch (est)
    {
        case "inactivo": badge = "badge-gray"; label = "Inactivo"; break;
        case "prospecto": badge = "badge-amber"; label = "Prospecto"; break;
        default: badge = "badge-green"; label = "Activo"; break;
    }

    var dto = new ClienteDTO
    {
        Id = nuevoCliente.Id,
        Nombre = nuevoCliente.Nombre ?? "",
        Contacto = nuevoCliente.Contacto ?? "",
        Email = nuevoCliente.Email ?? "",
        Telefono = nuevoCliente.Telefono ?? "",
        Estatus = est,
        Tipo = nuevoCliente.Tipo ?? "empresa",
        EstatusBadge = badge,
        EstatusLabel = label
    };

    return Results.Created($"/api/clientes/{nuevoCliente.Id}", dto);
});

// -- ENDPOINTS PARA PROYECTOS (DTO con cliente resuelto, monto y seguridad) --
app.MapGet("/api/proyectos", async (ApplicationDbContext db, int? clienteId, string? rol) =>
{
    var query = db.Proyectos.AsQueryable();

    // REGLA DE ORO DE SEGURIDAD: Filtrado directo en EF Core hacia la base de datos si es rol cliente
    if (rol == "cliente" && clienteId.HasValue)
    {
        query = query.Where(p => p.ClienteId == clienteId.Value);
    }

    var proyectos = await query.ToListAsync();
    var clientes = await db.Clientes.ToListAsync();
    var presupuestos = await db.Presupuestos.ToListAsync();

    var resultado = proyectos.Select(p =>
    {
        var cli = clientes.FirstOrDefault(c => c.Id == p.ClienteId);

        // Calcular badge y label de estatus
        string badge, label;
        switch (p.Estatus?.ToLowerInvariant())
        {
            case "en-proceso": badge = "badge-blue"; label = "En Proceso"; break;
            case "completado": badge = "badge-green"; label = "Completado"; break;
            case "pausado": badge = "badge-gray"; label = "Pausado"; break;
            default: badge = "badge-amber"; label = "Pendiente"; break;
        }

        // Calcular monto total de presupuestos asociados
        var presAsociados = presupuestos.Where(b =>
            b.ProyectoId == $"PRY-{p.Id.ToString().PadLeft(3, '0')}").ToList();
        double monto = presAsociados.Sum(b => b.TotalDirecto + b.TotalIndirecto);

        return new ProyectoDTO
        {
            Id = $"PRY-{p.Id.ToString().PadLeft(3, '0')}",
            IdNumerico = p.Id,
            Nombre = p.Nombre ?? "",
            ClienteId = p.ClienteId,
            ClienteNombre = cli?.Nombre ?? "",
            Estatus = p.Estatus ?? "pendiente",
            EstatusBadge = badge,
            EstatusLabel = label,
            Prioridad = p.Prioridad ?? "media",
            Avance = p.Avance,
            FechaInicio = p.FechaInicio.ToString("yyyy-MM-dd"),
            Tipo = "licencia_construccion",
            Descripcion = "",
            Responsable = "usr-admin-1",
            Monto = monto,
            TotalPresupuestos = presAsociados.Count
        };
    }).ToList();

    return Results.Ok(resultado);
});

app.MapPost("/api/proyectos", async (Proyecto nuevoProyecto, ApplicationDbContext db) =>
{
    db.Proyectos.Add(nuevoProyecto);
    await db.SaveChangesAsync();

    var cli = await db.Clientes.FirstOrDefaultAsync(cl => cl.Id == nuevoProyecto.ClienteId);

    string badge, label;
    switch (nuevoProyecto.Estatus?.ToLowerInvariant())
    {
        case "en-proceso": badge = "badge-blue"; label = "En Proceso"; break;
        case "completado": badge = "badge-green"; label = "Completado"; break;
        case "pausado": badge = "badge-gray"; label = "Pausado"; break;
        default: badge = "badge-amber"; label = "Pendiente"; break;
    }

    var dto = new ProyectoDTO
    {
        Id = $"PRY-{nuevoProyecto.Id.ToString().PadLeft(3, '0')}",
        IdNumerico = nuevoProyecto.Id,
        Nombre = nuevoProyecto.Nombre ?? "",
        ClienteId = nuevoProyecto.ClienteId,
        ClienteNombre = cli?.Nombre ?? "",
        Estatus = nuevoProyecto.Estatus ?? "pendiente",
        EstatusBadge = badge,
        EstatusLabel = label,
        Prioridad = nuevoProyecto.Prioridad ?? "media",
        Avance = nuevoProyecto.Avance,
        FechaInicio = nuevoProyecto.FechaInicio.ToString("yyyy-MM-dd"),
        Tipo = "licencia_construccion",
        Descripcion = "",
        Responsable = "usr-admin-1",
        Monto = 0,
        TotalPresupuestos = 0
    };

    return Results.Created($"/api/proyectos/{nuevoProyecto.Id}", dto);
});

// -- ENDPOINTS PARA PRESUPUESTOS (DTO con totales calculados y conceptos deserializados) --
app.MapGet("/api/presupuestos", async (ApplicationDbContext db, int? clienteId, string? rol) =>
{
    var query = db.Presupuestos.AsQueryable();

    // REGLA DE ORO DE SEGURIDAD: Filtrado directo en EF Core hacia la base de datos si es rol cliente
    if (rol == "cliente" && clienteId.HasValue)
    {
        var proyIdsNum = await db.Proyectos
            .Where(pr => pr.ClienteId == clienteId.Value)
            .Select(pr => pr.Id)
            .ToListAsync();

        var proyIdsStr = proyIdsNum.Select(id => $"PRY-{id.ToString().PadLeft(3, '0')}").Concat(proyIdsNum.Select(id => id.ToString())).ToList();
        query = query.Where(p => proyIdsStr.Contains(p.ProyectoId));
    }

    var presupuestos = await query.ToListAsync();
    var proyectos = await db.Proyectos.ToListAsync();

    var resultado = presupuestos.Select(p =>
    {
        // Resolver nombre del proyecto
        var proy = proyectos.FirstOrDefault(pr =>
            $"PRY-{pr.Id.ToString().PadLeft(3, '0')}" == p.ProyectoId ||
            pr.Id.ToString() == p.ProyectoId);

        // Calcular badge y label de estado
        string badge, label;
        switch (p.Estado?.ToLowerInvariant())
        {
            case "aprobado": badge = "badge-green"; label = "Aprobado"; break;
            case "en-revision": badge = "badge-blue"; label = "En Revisión"; break;
            case "rechazado": badge = "badge-red"; label = "Rechazado"; break;
            default: badge = "badge-amber"; label = "Borrador"; break;
        }

        // Deserializar conceptos desde JSON
        var conceptos = new List<ConceptoPresupuestoDTO>();
        if (!string.IsNullOrEmpty(p.ConceptosJson))
        {
            try
            {
                var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                conceptos = JsonSerializer.Deserialize<List<ConceptoPresupuestoDTO>>(p.ConceptosJson, jsonOpts)
                    ?? new List<ConceptoPresupuestoDTO>();
            }
            catch { /* JSON inválido, devolver lista vacía */ }
        }

        double directo = p.TotalDirecto;
        double indirecto = p.TotalIndirecto;
        double subtotal = directo + indirecto;
        double contingencia = 0; // Se expandirá cuando exista el campo
        double totalGeneral = subtotal + contingencia;

        return new PresupuestoDTO
        {
            Id = $"PRES-{p.Id.ToString().PadLeft(4, '0')}",
            IdNumerico = p.Id,
            ProyectoId = p.ProyectoId ?? "",
            ProyectoNombre = proy?.Nombre ?? "",
            Titulo = p.Titulo ?? "",
            Estado = p.Estado ?? "borrador",
            EstadoBadge = badge,
            EstadoLabel = label,
            Version = p.Version ?? "V1.0",
            Fecha = p.Fecha.ToString("yyyy-MM-dd"),
            TotalDirecto = directo,
            TotalIndirecto = indirecto,
            Subtotal = subtotal,
            Contingencia = contingencia,
            TotalGeneral = totalGeneral,
            Conceptos = conceptos
        };
    }).ToList();

    return Results.Ok(resultado);
});

app.MapPost("/api/presupuestos", async (Presupuesto nuevoPresupuesto, ApplicationDbContext db) =>
{
    db.Presupuestos.Add(nuevoPresupuesto);
    await db.SaveChangesAsync();

    var proy = await db.Proyectos.FirstOrDefaultAsync(pr =>
        $"PRY-{pr.Id.ToString().PadLeft(3, '0')}" == nuevoPresupuesto.ProyectoId ||
        pr.Id.ToString() == nuevoPresupuesto.ProyectoId);

    string badge, label;
    switch (nuevoPresupuesto.Estado?.ToLowerInvariant())
    {
        case "aprobado": badge = "badge-green"; label = "Aprobado"; break;
        case "en-revision": badge = "badge-blue"; label = "En Revisión"; break;
        case "rechazado": badge = "badge-red"; label = "Rechazado"; break;
        default: badge = "badge-amber"; label = "Borrador"; break;
    }

    var conceptos = new List<ConceptoPresupuestoDTO>();
    if (!string.IsNullOrEmpty(nuevoPresupuesto.ConceptosJson))
    {
        try
        {
            var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            conceptos = JsonSerializer.Deserialize<List<ConceptoPresupuestoDTO>>(nuevoPresupuesto.ConceptosJson, jsonOpts)
                ?? new List<ConceptoPresupuestoDTO>();
        }
        catch { /* JSON inválido */ }
    }

    double directo = nuevoPresupuesto.TotalDirecto;
    double indirecto = nuevoPresupuesto.TotalIndirecto;
    double subtotal = directo + indirecto;

    var dto = new PresupuestoDTO
    {
        Id = $"PRES-{nuevoPresupuesto.Id.ToString().PadLeft(4, '0')}",
        IdNumerico = nuevoPresupuesto.Id,
        ProyectoId = nuevoPresupuesto.ProyectoId ?? "",
        ProyectoNombre = proy?.Nombre ?? "",
        Titulo = nuevoPresupuesto.Titulo ?? "",
        Estado = nuevoPresupuesto.Estado ?? "borrador",
        EstadoBadge = badge,
        EstadoLabel = label,
        Version = nuevoPresupuesto.Version ?? "V1.0",
        Fecha = nuevoPresupuesto.Fecha.ToString("yyyy-MM-dd"),
        TotalDirecto = directo,
        TotalIndirecto = indirecto,
        Subtotal = subtotal,
        Contingencia = 0,
        TotalGeneral = subtotal,
        Conceptos = conceptos
    };

    return Results.Created($"/api/presupuestos/{nuevoPresupuesto.Id}", dto);
});

// -- ENDPOINTS PARA TAREAS (DTO con prioridad badge/label y columna pre-calculada) --
app.MapGet("/api/tareas", async (ApplicationDbContext db) =>
{
    var tareas = await db.TareasDiarias.ToListAsync();
    var hoy = DateTime.UtcNow.Date;

    var resultado = tareas.Select(t =>
    {
        // Calcular badge y label de prioridad
        string prBadge, prLabel;
        switch (t.Prioridad?.ToLowerInvariant())
        {
            case "alta": prBadge = "badge-red"; prLabel = "Alta"; break;
            case "baja": prBadge = "badge-blue"; prLabel = "Baja"; break;
            default: prBadge = "badge-amber"; prLabel = "Media"; break;
        }

        // Calcular columna: hoy, completada o atrasada
        string columna;
        if (t.Hecho)
        {
            columna = "completada";
        }
        else if (t.Fecha.Date == hoy)
        {
            columna = "hoy";
        }
        else if (t.Fecha.Date < hoy)
        {
            columna = "atrasada";
        }
        else
        {
            columna = "hoy"; // Tareas futuras van a "hoy" por ahora
        }

        return new TareaDiariaDTO
        {
            Id = t.Id,
            Titulo = t.Titulo ?? "",
            Prioridad = t.Prioridad ?? "media",
            PrioridadBadge = prBadge,
            PrioridadLabel = prLabel,
            Completada = t.Hecho,
            Fecha = t.Fecha.ToString("yyyy-MM-dd"),
            AsignadoA = t.AsignadoA ?? "u1",
            Columna = columna
        };
    }).ToList();

    return Results.Ok(resultado);
});

app.MapPost("/api/tareas", async (TareaDiaria nuevaTarea, ApplicationDbContext db) =>
{
    db.TareasDiarias.Add(nuevaTarea);
    await db.SaveChangesAsync();

    var hoy = DateTime.UtcNow.Date;

    string prBadge, prLabel;
    switch (nuevaTarea.Prioridad?.ToLowerInvariant())
    {
        case "alta": prBadge = "badge-red"; prLabel = "Alta"; break;
        case "baja": prBadge = "badge-blue"; prLabel = "Baja"; break;
        default: prBadge = "badge-amber"; prLabel = "Media"; break;
    }

    string columna;
    if (nuevaTarea.Hecho)
    {
        columna = "completada";
    }
    else if (nuevaTarea.Fecha.Date == hoy)
    {
        columna = "hoy";
    }
    else if (nuevaTarea.Fecha.Date < hoy)
    {
        columna = "atrasada";
    }
    else
    {
        columna = "hoy";
    }

    var dto = new TareaDiariaDTO
    {
        Id = nuevaTarea.Id,
        Titulo = nuevaTarea.Titulo ?? "",
        Prioridad = nuevaTarea.Prioridad ?? "media",
        PrioridadBadge = prBadge,
        PrioridadLabel = prLabel,
        Completada = nuevaTarea.Hecho,
        Fecha = nuevaTarea.Fecha.ToString("yyyy-MM-dd"),
        AsignadoA = nuevaTarea.AsignadoA ?? "u1",
        Columna = columna
    };

    return Results.Created($"/api/tareas/{nuevaTarea.Id}", dto);
});

// -- ENDPOINTS PARA CONCEPTOS (CATÁLOGO) --
app.MapGet("/api/conceptos", async (ApplicationDbContext db) =>
{
    var conceptos = await db.Conceptos.ToListAsync();

    var resultado = conceptos.Select(c => new ConceptoDTO
    {
        Id = c.Id,
        Clave = c.Clave ?? "",
        Descripcion = c.Descripcion ?? "",
        Precio = c.Precio
    }).ToList();

    return Results.Ok(resultado);
});

app.MapPost("/api/conceptos", async (Concepto nuevoConcepto, ApplicationDbContext db) =>
{
    db.Conceptos.Add(nuevoConcepto);
    await db.SaveChangesAsync();
    return Results.Created($"/api/conceptos/{nuevoConcepto.Id}", nuevoConcepto);
});

// Ruta por defecto para verificar salud de la API
app.MapGet("/weatherforecast", () =>
{
    return new[] { "Conexión Exitosa con Minimal APIs y Postgres" };
});

app.Run();
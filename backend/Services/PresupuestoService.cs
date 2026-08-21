using Data;
using Data.DTOs;
using Backend.Repositories;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class PresupuestoService
    {
        private readonly IPresupuestoRepository _presupuestoRepo;
        private readonly IProyectoRepository _proyectoRepo;
        private readonly IClienteRepository _clienteRepo;
        private readonly ApplicationDbContext _db;

        public PresupuestoService(
            IPresupuestoRepository presupuestoRepo,
            IProyectoRepository proyectoRepo,
            IClienteRepository clienteRepo,
            ApplicationDbContext db)
        {
            _presupuestoRepo = presupuestoRepo;
            _proyectoRepo = proyectoRepo;
            _clienteRepo = clienteRepo;
            _db = db;
        }

        /// <summary>
        /// Obtiene todos los presupuestos con seguridad por rol.
        /// REGLA DE NEGOCIO: Si clienteId está presente o rol == "cliente",
        /// filtra únicamente los presupuestos que pertenezcan a proyectos del cliente.
        /// </summary>
        public async Task<List<PresupuestoDTO>> GetAllAsync(int? clienteId, string? rol)
        {
            List<string>? filtroProyectoIds = null;
            bool isCliente = string.Equals(rol, "cliente", StringComparison.OrdinalIgnoreCase) || clienteId.HasValue;

            if (isCliente && clienteId.HasValue)
            {
                // Obtener los IDs numéricos de proyectos del cliente
                var proyectosCliente = await _proyectoRepo.GetAllAsync(clienteId.Value);
                filtroProyectoIds = proyectosCliente
                    .SelectMany(pr => new[]
                    {
                        $"PRY-{pr.Id.ToString().PadLeft(3, '0')}",
                        pr.Id.ToString()
                    })
                    .ToList();
            }

            var presupuestos = await _presupuestoRepo.GetAllAsync(filtroProyectoIds);
            var proyectos = await _proyectoRepo.GetAllAsync();

            return presupuestos.Select(p => MapToDTO(p, proyectos)).ToList();
        }

        /// <summary>
        /// Obtiene un presupuesto por ID validando que pertenezca al cliente si el rol es 'cliente'.
        /// </summary>
        public async Task<PresupuestoDTO?> GetByIdAsync(int id, int? clienteId, string? rol)
        {
            var p = await _presupuestoRepo.GetByIdAsync(id);
            if (p == null) return null;

            bool isCliente = string.Equals(rol, "cliente", StringComparison.OrdinalIgnoreCase);
            if (isCliente && clienteId.HasValue)
            {
                var proyectosCliente = await _proyectoRepo.GetAllAsync(clienteId.Value);
                var proyectoIdsPermitidos = proyectosCliente
                    .SelectMany(pr => new[] { $"PRY-{pr.Id.ToString().PadLeft(3, '0')}", pr.Id.ToString() })
                    .ToList();

                if (string.IsNullOrEmpty(p.ProyectoId) || !proyectoIdsPermitidos.Contains(p.ProyectoId))
                {
                    return null; // Acceso denegado: el presupuesto no pertenece a los proyectos del cliente
                }
            }

            var proyectos = await _proyectoRepo.GetAllAsync();
            return MapToDTO(p, proyectos);
        }

        /// <summary>
        /// Crea un nuevo presupuesto y devuelve el DTO calculado.
        /// Si el estado es "aprobado", genera automáticamente las tareas operativas.
        /// </summary>
        public async Task<PresupuestoDTO> CreateAsync(Presupuesto nuevoPresupuesto)
        {
            var conceptos = DeserializeConceptos(nuevoPresupuesto.ConceptosJson);
            double subtotalHonorarios = conceptos.Sum(c => c.Honorarios);
            double ivaHonorarios = subtotalHonorarios * 0.16;
            double totalHonorarios = subtotalHonorarios + ivaHonorarios;
            double totalDerechos = conceptos.Sum(c => c.PagoDerechos);
            double totalExtras = conceptos.Sum(c => c.Extra);

            nuevoPresupuesto.TotalDirecto = subtotalHonorarios;
            nuevoPresupuesto.TotalIndirecto = ivaHonorarios + totalDerechos + totalExtras;

            var created = await _presupuestoRepo.AddAsync(nuevoPresupuesto);

            // Auto-generar tareas si el presupuesto se crea directamente como aprobado
            if (string.Equals(created.Estado, "aprobado", StringComparison.OrdinalIgnoreCase))
            {
                await GenerarTareasDesdePresupuestoAsync(created, conceptos);
            }

            var proyectos = await _proyectoRepo.GetAllAsync();
            return MapToDTO(created, proyectos);
        }

        /// <summary>
        /// Actualiza un presupuesto.
        /// Si el estado cambia a "aprobado", genera automáticamente las tareas operativas.
        /// </summary>
        public async Task<PresupuestoDTO> UpdateAsync(Presupuesto presupuesto)
        {
            var conceptos = DeserializeConceptos(presupuesto.ConceptosJson);
            double subtotalHonorarios = conceptos.Sum(c => c.Honorarios);
            double ivaHonorarios = subtotalHonorarios * 0.16;
            double totalDerechos = conceptos.Sum(c => c.PagoDerechos);
            double totalExtras = conceptos.Sum(c => c.Extra);

            presupuesto.TotalDirecto = subtotalHonorarios;
            presupuesto.TotalIndirecto = ivaHonorarios + totalDerechos + totalExtras;

            var updated = await _presupuestoRepo.UpdateAsync(presupuesto);

            // Auto-generar tareas si el presupuesto fue aprobado
            if (string.Equals(updated.Estado, "aprobado", StringComparison.OrdinalIgnoreCase))
            {
                await GenerarTareasDesdePresupuestoAsync(updated, conceptos);
            }

            var proyectos = await _proyectoRepo.GetAllAsync();
            return MapToDTO(updated, proyectos);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _presupuestoRepo.DeleteAsync(id);
        }

        // ──────────────────────────────────────────────────────────────────
        // LÓGICA DE NEGOCIO: Auto-generación de tareas desde presupuesto aprobado
        // ──────────────────────────────────────────────────────────────────

        /// <summary>
        /// Por cada concepto en el presupuesto aprobado, crea una TareaDiaria en PostgreSQL
        /// si aún no existe una con el mismo Titulo + ProyectoId + PresupuestoId.
        /// </summary>
        private async Task GenerarTareasDesdePresupuestoAsync(Presupuesto presupuesto, List<ConceptoPresupuestoDTO> conceptos)
        {
            if (conceptos == null || conceptos.Count == 0)
            {
                Console.WriteLine($"[PresupuestoService] Sin conceptos para generar tareas del presupuesto #{presupuesto.Id}");
                return;
            }

            Console.WriteLine($"[PresupuestoService] Iniciando generacion de {conceptos.Count} tareas para presupuesto #{presupuesto.Id}...");

            string proyectoIdStr = presupuesto.ProyectoId ?? "";
            var fechaTarea = presupuesto.Fecha != default ? presupuesto.Fecha : DateTime.UtcNow;
            int tareasCreadas = 0;

            try
            {
                // Cargar tareas existentes para este presupuesto (evitar AnyAsync por cada item)
                var tareasExistentes = _db.TareasDiarias
                    .Where(t => t.PresupuestoId == presupuesto.Id)
                    .Select(t => t.Titulo)
                    .ToHashSet();

                foreach (var concepto in conceptos)
                {
                    if (string.IsNullOrWhiteSpace(concepto.Concepto)) continue;

                    // Verificar duplicado en memoria (más eficiente)
                    if (tareasExistentes.Contains(concepto.Concepto)) continue;

                    var nuevaTarea = new TareaDiaria
                    {
                        Titulo = concepto.Concepto,
                        Etapa = string.IsNullOrWhiteSpace(concepto.Etapa) ? "General" : concepto.Etapa,
                        ProyectoId = proyectoIdStr,
                        AsignadoA = string.IsNullOrWhiteSpace(concepto.EmpleadoAsignadoId)
                            ? "Responsable"
                            : concepto.EmpleadoAsignadoId,
                        Fecha = fechaTarea,
                        Prioridad = "media",
                        Hecho = false,
                        PresupuestoId = presupuesto.Id
                    };

                    _db.TareasDiarias.Add(nuevaTarea);
                    tareasExistentes.Add(concepto.Concepto);
                    tareasCreadas++;
                }

                if (tareasCreadas > 0)
                {
                    await _db.SaveChangesAsync();
                    Console.WriteLine($"[PresupuestoService] ✓ {tareasCreadas} tareas creadas para presupuesto #{presupuesto.Id} (Proyecto: {proyectoIdStr})");
                }
                else
                {
                    Console.WriteLine($"[PresupuestoService] Todas las tareas ya existian para presupuesto #{presupuesto.Id}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PresupuestoService] ERROR al generar tareas: {ex.Message}");
                Console.WriteLine($"[PresupuestoService] InnerException: {ex.InnerException?.Message}");
                Console.WriteLine($"[PresupuestoService] StackTrace: {ex.StackTrace}");
            }
        }

        // ──────────────────────────────────────────────────────────────────
        // LÓGICA DE NEGOCIO: Folio, proyecto resuelto, totales, badges
        // ──────────────────────────────────────────────────────────────────
        private static PresupuestoDTO MapToDTO(Presupuesto p, List<Proyecto> proyectos)
        {
            try
            {
                // Resolver proyecto asociado
                var proy = proyectos?.FirstOrDefault(pr =>
                    $"PRY-{pr.Id.ToString().PadLeft(3, '0')}" == p.ProyectoId ||
                    pr.Id.ToString() == p.ProyectoId);

                // Badge y label de estado
                string badge, label;
                switch (p.Estado?.ToLowerInvariant())
                {
                    case "aprobado": badge = "badge-green"; label = "Aprobado"; break;
                    case "en-revision": badge = "badge-blue"; label = "En Revisión"; break;
                    case "rechazado": badge = "badge-red"; label = "Rechazado"; break;
                    default: badge = "badge-amber"; label = "Borrador"; break;
                }

                // Deserializar conceptos
                var conceptos = DeserializeConceptos(p.ConceptosJson) ?? new List<ConceptoPresupuestoDTO>();

                // Cálculos financieros
                double subtotalHonorarios = conceptos.Where(c => c != null).Sum(c => c.Honorarios);
                double ivaHonorarios = subtotalHonorarios * 0.16;
                double totalHonorarios = subtotalHonorarios + ivaHonorarios;
                double totalDerechos = conceptos.Where(c => c != null).Sum(c => c.PagoDerechos);
                double totalExtras = conceptos.Where(c => c != null).Sum(c => c.Extra);
                double totalGeneral = totalHonorarios + totalDerechos + totalExtras;

                double costoDirectoConst = p.CostoDirectoConstruccion ?? 0;
                double pctGestion = costoDirectoConst > 0 ? (totalGeneral / costoDirectoConst) * 100 : 0;

                string fechaStr = "";
                try
                {
                    fechaStr = p.Fecha != default ? p.Fecha.ToString("yyyy-MM-dd") : DateTime.Now.ToString("yyyy-MM-dd");
                }
                catch
                {
                    fechaStr = DateTime.Now.ToString("yyyy-MM-dd");
                }

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
                    Fecha = fechaStr,

                    // Nuevos metadatos del predio (caso real)
                    Direccion = p.Direccion ?? "",
                    Propietario = p.Propietario ?? "",
                    SupPredio = p.SupPredio ?? 0,
                    SupConstExistente = p.SupConstExistente ?? 0,
                    SupIntervenir = p.SupIntervenir ?? 0,
                    Uso = p.Uso ?? "",
                    Clasificacion = p.Clasificacion ?? "",
                    ZonaPrimaria = p.ZonaPrimaria ?? "",
                    TipoVialidad = p.TipoVialidad ?? "",
                    CostoDirectoConstruccion = costoDirectoConst,
                    InfoAdicionalJson = p.InfoAdicionalJson ?? "",

                    // Totales detallados
                    SubtotalHonorarios = subtotalHonorarios,
                    IvaHonorarios = ivaHonorarios,
                    TotalHonorarios = totalHonorarios,
                    TotalDerechos = totalDerechos,
                    TotalExtras = totalExtras,
                    TotalGeneral = totalGeneral,
                    PorcentajeGestion = pctGestion,

                    // Campos heredados/compatibilidad
                    TotalDirecto = p.TotalDirecto,
                    TotalIndirecto = p.TotalIndirecto,

                    Conceptos = conceptos
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MapToDTO Error]: {ex.Message}");
                return new PresupuestoDTO
                {
                    Id = $"PRES-{p.Id.ToString().PadLeft(4, '0')}",
                    IdNumerico = p.Id,
                    Titulo = p.Titulo ?? "Presupuesto",
                    Estado = "borrador",
                    EstadoBadge = "badge-amber",
                    EstadoLabel = "Borrador",
                    Version = p.Version ?? "1.0"
                };
            }
        }

        private static List<ConceptoPresupuestoDTO> DeserializeConceptos(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new List<ConceptoPresupuestoDTO>();

            try
            {
                var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                return JsonSerializer.Deserialize<List<ConceptoPresupuestoDTO>>(json, opts)
                    ?? new List<ConceptoPresupuestoDTO>();
            }
            catch
            {
                return new List<ConceptoPresupuestoDTO>();
            }
        }
    }
}

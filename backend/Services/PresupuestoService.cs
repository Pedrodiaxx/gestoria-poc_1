using Data;
using Data.DTOs;
using Backend.Repositories;
using System.Text.Json;

namespace Backend.Services
{
    public class PresupuestoService
    {
        private readonly IPresupuestoRepository _presupuestoRepo;
        private readonly IProyectoRepository _proyectoRepo;
        private readonly IClienteRepository _clienteRepo;

        public PresupuestoService(
            IPresupuestoRepository presupuestoRepo,
            IProyectoRepository proyectoRepo,
            IClienteRepository clienteRepo)
        {
            _presupuestoRepo = presupuestoRepo;
            _proyectoRepo = proyectoRepo;
            _clienteRepo = clienteRepo;
        }

        /// <summary>
        /// Obtiene todos los presupuestos con seguridad por rol.
        /// REGLA DE NEGOCIO: Si rol == "cliente", filtra los presupuestos
        /// que pertenezcan a proyectos del clienteId.
        /// </summary>
        public async Task<List<PresupuestoDTO>> GetAllAsync(int? clienteId, string? rol)
        {
            List<string>? filtroProyectoIds = null;

            if (rol == "cliente" && clienteId.HasValue)
            {
                // Obtener los IDs numéricos de proyectos del cliente
                var proyectosCliente = await _proyectoRepo.GetAllAsync(clienteId);
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
        /// Crea un nuevo presupuesto y devuelve el DTO calculado.
        /// </summary>
        public async Task<PresupuestoDTO> CreateAsync(Presupuesto nuevoPresupuesto)
        {
            var conceptos = DeserializeConceptos(nuevoPresupuesto.ConceptosJson);
            double subtotalHonorarios = conceptos.Sum(c => c.Honorarios);
            double ivaHonorarios = subtotalHonorarios * 0.16;
            double totalHonorarios = subtotalHonorarios + ivaHonorarios;
            double totalDerechos = conceptos.Sum(c => c.PagoDerechos);
            double totalExtras = conceptos.Sum(c => c.Extra);

            // Rellenar campos heredados para mantener compatibilidad (ej: ProyectoService.cs que suma estos dos campos)
            nuevoPresupuesto.TotalDirecto = subtotalHonorarios;
            nuevoPresupuesto.TotalIndirecto = ivaHonorarios + totalDerechos + totalExtras;

            var created = await _presupuestoRepo.AddAsync(nuevoPresupuesto);
            var proyectos = await _proyectoRepo.GetAllAsync();
            return MapToDTO(created, proyectos);
        }

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
            var proyectos = await _proyectoRepo.GetAllAsync();
            return MapToDTO(updated, proyectos);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _presupuestoRepo.DeleteAsync(id);
        }

        // ──────────────────────────────────────────────────────────────────
        // LÓGICA DE NEGOCIO: Folio, proyecto resuelto, totales, badges
        // ──────────────────────────────────────────────────────────────────
        private static PresupuestoDTO MapToDTO(Presupuesto p, List<Proyecto> proyectos)
        {
            // Resolver proyecto asociado
            var proy = proyectos.FirstOrDefault(pr =>
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
            var conceptos = DeserializeConceptos(p.ConceptosJson);

            // Cálculos financieros
            double subtotalHonorarios = conceptos.Sum(c => c.Honorarios);
            double ivaHonorarios = subtotalHonorarios * 0.16;
            double totalHonorarios = subtotalHonorarios + ivaHonorarios;
            double totalDerechos = conceptos.Sum(c => c.PagoDerechos);
            double totalExtras = conceptos.Sum(c => c.Extra);
            double totalGeneral = totalHonorarios + totalDerechos + totalExtras;

            double costoDirectoConst = p.CostoDirectoConstruccion ?? 0;
            double pctGestion = costoDirectoConst > 0 ? (totalGeneral / costoDirectoConst) * 100 : 0;

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
                Estimacion = p.Estimacion ?? "",
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

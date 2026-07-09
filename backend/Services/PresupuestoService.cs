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
            var created = await _presupuestoRepo.AddAsync(nuevoPresupuesto);
            var proyectos = await _proyectoRepo.GetAllAsync();
            return MapToDTO(created, proyectos);
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
            double directo = p.TotalDirecto;
            double indirecto = p.TotalIndirecto;
            double subtotal = directo + indirecto;
            double contingencia = 0;
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

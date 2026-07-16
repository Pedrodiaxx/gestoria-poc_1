using Data;
using Data.DTOs;
using Backend.Repositories;

namespace Backend.Services
{
    public class ProyectoService
    {
        private readonly IProyectoRepository _proyectoRepo;
        private readonly IClienteRepository _clienteRepo;
        private readonly IPresupuestoRepository _presupuestoRepo;

        public ProyectoService(
            IProyectoRepository proyectoRepo,
            IClienteRepository clienteRepo,
            IPresupuestoRepository presupuestoRepo)
        {
            _proyectoRepo = proyectoRepo;
            _clienteRepo = clienteRepo;
            _presupuestoRepo = presupuestoRepo;
        }

        /// <summary>
        /// Obtiene todos los proyectos con seguridad por rol.
        /// REGLA DE NEGOCIO: Si rol == "cliente", filtra por clienteId en la query.
        /// </summary>
        public async Task<List<ProyectoDTO>> GetAllAsync(int? clienteId, string? rol)
        {
            int? filtroClienteId = (rol == "cliente" && clienteId.HasValue)
                ? clienteId
                : null;

            var proyectos = await _proyectoRepo.GetAllAsync(filtroClienteId);
            var clientes = await _clienteRepo.GetAllAsync();
            var presupuestos = await _presupuestoRepo.GetAllAsync();

            return proyectos.Select(p => MapToDTO(p, clientes, presupuestos)).ToList();
        }

        /// <summary>
        /// Crea un nuevo proyecto y devuelve el DTO calculado.
        /// </summary>
        public async Task<ProyectoDTO> CreateAsync(Proyecto nuevoProyecto)
        {
            var created = await _proyectoRepo.AddAsync(nuevoProyecto);
            var clientes = await _clienteRepo.GetAllAsync();
            return MapToDTO(created, clientes, new List<Presupuesto>());
        }

        public async Task<ProyectoDTO> UpdateAsync(Proyecto proyecto)
        {
            var updated = await _proyectoRepo.UpdateAsync(proyecto);
            var clientes = await _clienteRepo.GetAllAsync();
            var presupuestos = await _presupuestoRepo.GetAllAsync();
            return MapToDTO(updated, clientes, presupuestos);
        }

        // ────────────────────────────────────────────────────────────
        // LÓGICA DE NEGOCIO: Folio, cliente resuelto, monto, badges
        // ────────────────────────────────────────────────────────────
        private static ProyectoDTO MapToDTO(Proyecto p, List<Cliente> clientes, List<Presupuesto> presupuestos)
        {
            var cli = clientes.FirstOrDefault(c => c.Id == p.ClienteId);

            // Badge y label de estatus
            string badge, label;
            switch (p.Estatus?.ToLowerInvariant())
            {
                case "en-proceso": badge = "badge-blue"; label = "En Proceso"; break;
                case "completado": badge = "badge-green"; label = "Completado"; break;
                case "pausado": badge = "badge-gray"; label = "Pausado"; break;
                default: badge = "badge-amber"; label = "Pendiente"; break;
            }

            // Monto total de presupuestos asociados
            var folioProyecto = $"PRY-{p.Id.ToString().PadLeft(3, '0')}";
            var presAsociados = presupuestos.Where(b => b.ProyectoId == folioProyecto).ToList();
            double monto = presAsociados.Sum(b => b.TotalDirecto + b.TotalIndirecto);

            return new ProyectoDTO
            {
                Id = folioProyecto,
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
        }
    }
}

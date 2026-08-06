using Data;
using Data.DTOs;
using Backend.Repositories;
using System.Text.Json;

namespace Backend.Services
{
    public class ProyectoService
    {
        private readonly IProyectoRepository _proyectoRepo;
        private readonly IClienteRepository _clienteRepo;
        private readonly IPresupuestoRepository _presupuestoRepo;
        private readonly ITareaRepository _tareaRepo;

        public ProyectoService(
            IProyectoRepository proyectoRepo,
            IClienteRepository clienteRepo,
            IPresupuestoRepository presupuestoRepo,
            ITareaRepository tareaRepo)
        {
            _proyectoRepo = proyectoRepo;
            _clienteRepo = clienteRepo;
            _presupuestoRepo = presupuestoRepo;
            _tareaRepo = tareaRepo;
        }

        /// <summary>
        /// Obtiene todos los proyectos con seguridad por rol.
        /// REGLA DE NEGOCIO: Si el rol es "cliente" o se especifica clienteId, filtra por clienteId.
        /// </summary>
        public async Task<List<ProyectoDTO>> GetAllAsync(int? clienteId, string? rol)
        {
            bool isCliente = string.Equals(rol, "cliente", StringComparison.OrdinalIgnoreCase) || clienteId.HasValue;
            int? filtroClienteId = (isCliente && clienteId.HasValue) ? clienteId : null;

            var proyectos = await _proyectoRepo.GetAllAsync(filtroClienteId);
            var clientes = await _clienteRepo.GetAllAsync();
            var presupuestos = await _presupuestoRepo.GetAllAsync();
            var tareas = await _tareaRepo.GetAllAsync();

            return proyectos.Select(p => MapToDTO(p, clientes, presupuestos, tareas)).ToList();
        }

        /// <summary>
        /// Obtiene un proyecto por ID verificando propiedad del cliente.
        /// </summary>
        public async Task<ProyectoDTO?> GetByIdAsync(int id, int? clienteId, string? rol)
        {
            var p = await _proyectoRepo.GetByIdAsync(id);
            if (p == null) return null;

            bool isCliente = string.Equals(rol, "cliente", StringComparison.OrdinalIgnoreCase);
            if (isCliente && clienteId.HasValue && p.ClienteId != clienteId.Value)
            {
                return null; // Acceso denegado
            }

            var clientes = await _clienteRepo.GetAllAsync();
            var presupuestos = await _presupuestoRepo.GetAllAsync();
            var tareas = await _tareaRepo.GetAllAsync();
            return MapToDTO(p, clientes, presupuestos, tareas);
        }

        /// <summary>
        /// Crea un nuevo proyecto y devuelve el DTO calculado.
        /// REGLA DE NEGOCIO: Avance siempre inicia en 0.
        /// </summary>
        public async Task<ProyectoDTO> CreateAsync(Proyecto nuevoProyecto)
        {
            // Regla de negocio: el avance inicial siempre es 0 al crear
            nuevoProyecto.Avance = 0;

            var created = await _proyectoRepo.AddAsync(nuevoProyecto);
            var clientes = await _clienteRepo.GetAllAsync();
            var tareas = await _tareaRepo.GetAllAsync();
            return MapToDTO(created, clientes, new List<Presupuesto>(), tareas);
        }

        public async Task<ProyectoDTO> UpdateAsync(Proyecto proyecto)
        {
            var updated = await _proyectoRepo.UpdateAsync(proyecto);
            var clientes = await _clienteRepo.GetAllAsync();
            var presupuestos = await _presupuestoRepo.GetAllAsync();
            var tareas = await _tareaRepo.GetAllAsync();
            return MapToDTO(updated, clientes, presupuestos, tareas);
        }

        // ────────────────────────────────────────────────────────────────────────
        // LÓGICA DE NEGOCIO: Folio, cliente resuelto, monto, badges, metadatos urbanos
        // ────────────────────────────────────────────────────────────────────────
        private static ProyectoDTO MapToDTO(Proyecto p, List<Cliente> clientes, List<Presupuesto> presupuestos, List<TareaDiaria> tareas)
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

            var hoy = DateTime.UtcNow.Date;
            var tareasAsociadas = tareas
                .Where(t => t.ProyectoId == folioProyecto || t.ProyectoId == p.Id.ToString())
                .Select(t => TareaService.MapToDTO(t, hoy))
                .ToList();

            // Deserializar arrays JSON
            var usosComplementarios = DeserializeJsonArray(p.UsosComplementariosJson);
            var direccionesComplementarias = DeserializeJsonArray(p.DireccionesComplementariasJson);

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

                // Clasificación Normativa
                UsoPrincipal = p.UsoPrincipal ?? "",
                UsoComplementario = p.UsoComplementario ?? "",
                ImpactoPrincipal = p.ImpactoPrincipal ?? "",
                UsosComplementarios = usosComplementarios,
                ZonaPrimaria = p.ZonaPrimaria ?? "",

                // Dirección e Infraestructura Vial
                DireccionPrincipal = p.DireccionPrincipal ?? "",
                DireccionesComplementarias = direccionesComplementarias,
                VialidadPrincipal = p.VialidadPrincipal ?? "",
                VialidadComplementaria = p.VialidadComplementaria ?? "",
                AreaCompatibilidad = p.AreaCompatibilidad ?? "",
                ZonaCompatibilidadEspecifica = p.ZonaCompatibilidadEspecifica ?? "",

                // Información Adicional
                Alcance = p.Alcance ?? "",
                Descripcion = p.Descripcion ?? "",
                Responsable = p.Responsable ?? "",

                FechaInicio = p.FechaInicio.ToString("yyyy-MM-dd"),
                Tipo = "licencia_construccion",
                Monto = monto,
                TotalPresupuestos = presAsociados.Count,
                TareasDiarias = tareasAsociadas
            };
        }

        /// <summary>
        /// Deserializa un string JSON como array de strings.
        /// Devuelve lista vacía si el string es null, vacío o inválido.
        /// </summary>
        private static List<string> DeserializeJsonArray(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return new List<string>();
            try
            {
                var result = JsonSerializer.Deserialize<List<string>>(json);
                return result ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _proyectoRepo.DeleteAsync(id);
        }
    }
}

using Data;
using Data.DTOs;
using Backend.Repositories;

namespace Backend.Services
{
    public class ClienteService
    {
        private readonly IClienteRepository _repo;

        public ClienteService(IClienteRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<ClienteDTO>> GetAllAsync()
        {
            var clientes = await _repo.GetAllAsync();
            return clientes.Select(MapToDTO).ToList();
        }

        public async Task<ClienteDTO> CreateAsync(Cliente nuevoCliente)
        {
            var created = await _repo.AddAsync(nuevoCliente);
            return MapToDTO(created);
        }

        // ────────────────────────────────────────────
        // LÓGICA DE NEGOCIO: Mapeo de estatus a badges
        // ────────────────────────────────────────────
        private static ClienteDTO MapToDTO(Cliente c)
        {
            var est = (c.Estatus ?? "activo").ToLowerInvariant();
            string badge, label;

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
        }
    }
}

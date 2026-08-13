using Data;
using Data.DTOs;
using Backend.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Backend.Services
{
    public class TareaService
    {
        private readonly ITareaRepository _repo;
        private readonly ApplicationDbContext _db;

        public TareaService(ITareaRepository repo, ApplicationDbContext db)
        {
            _repo = repo;
            _db = db;
        }

        public async Task<List<TareaDiariaDTO>> GetAllAsync(int? clienteId, string? rol)
        {
            var tareas = await _repo.GetAllAsync();
            bool isCliente = string.Equals(rol, "cliente", StringComparison.OrdinalIgnoreCase) || clienteId.HasValue;

            if (isCliente && clienteId.HasValue)
            {
                var userIds = await _db.Usuarios
                    .Where(u => u.ClienteId == clienteId.Value)
                    .Select(u => u.Id)
                    .ToListAsync();

                var usernames = await _db.Usuarios
                    .Where(u => u.ClienteId == clienteId.Value)
                    .Select(u => u.Nombre.ToLower())
                    .ToListAsync();

                tareas = tareas.Where(t =>
                    (t.AsignadoA != null && userIds.Contains(t.AsignadoA)) ||
                    (t.AsignadoA != null && usernames.Contains(t.AsignadoA.ToLower()))
                ).ToList();
            }

            var hoy = DateTime.UtcNow.Date;
            return tareas.Select(t => MapToDTO(t, hoy)).ToList();
        }

        public async Task<TareaDiariaDTO> CreateAsync(TareaDiaria nuevaTarea)
        {
            var created = await _repo.AddAsync(nuevaTarea);
            var hoy = DateTime.UtcNow.Date;
            return MapToDTO(created, hoy);
        }

        public async Task<TareaDiariaDTO> UpdateAsync(TareaDiaria tarea)
        {
            var updated = await _repo.UpdateAsync(tarea);
            var hoy = DateTime.UtcNow.Date;
            return MapToDTO(updated, hoy);
        }

        public async Task<bool> DeleteTareaAsync(int id)
        {
            return await _repo.DeleteAsync(id);
        }

        // ───────────────────────────────────────────────────────────────────
        // LÓGICA DE NEGOCIO: Clasificación temporal y badges de prioridad
        // ───────────────────────────────────────────────────────────────────
        public static TareaDiariaDTO MapToDTO(TareaDiaria t, DateTime hoy)
        {
            // Badge y label de prioridad
            string prBadge, prLabel;
            switch (t.Prioridad?.ToLowerInvariant())
            {
                case "alta": prBadge = "badge-red"; prLabel = "Alta"; break;
                case "baja": prBadge = "badge-blue"; prLabel = "Baja"; break;
                default: prBadge = "badge-amber"; prLabel = "Media"; break;
            }

            // Clasificación temporal: hoy, completada o atrasada
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
                Columna = columna,
                ProyectoId = t.ProyectoId ?? ""
            };
        }
    }
}

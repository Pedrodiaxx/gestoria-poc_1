using Data;
using Data.DTOs;
using Backend.Repositories;

namespace Backend.Services
{
    public class TareaService
    {
        private readonly ITareaRepository _repo;

        public TareaService(ITareaRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<TareaDiariaDTO>> GetAllAsync()
        {
            var tareas = await _repo.GetAllAsync();
            var hoy = DateTime.UtcNow.Date;
            return tareas.Select(t => MapToDTO(t, hoy)).ToList();
        }

        public async Task<TareaDiariaDTO> CreateAsync(TareaDiaria nuevaTarea)
        {
            var created = await _repo.AddAsync(nuevaTarea);
            var hoy = DateTime.UtcNow.Date;
            return MapToDTO(created, hoy);
        }

        // ───────────────────────────────────────────────────────────────────
        // LÓGICA DE NEGOCIO: Clasificación temporal y badges de prioridad
        // ───────────────────────────────────────────────────────────────────
        private static TareaDiariaDTO MapToDTO(TareaDiaria t, DateTime hoy)
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
                Columna = columna
            };
        }
    }
}

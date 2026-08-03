using Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class ProyectoRepository : IProyectoRepository
    {
        private readonly ApplicationDbContext _db;

        public ProyectoRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<Proyecto>> GetAllAsync(int? clienteId = null)
        {
            var query = _db.Proyectos.AsQueryable();

            if (clienteId.HasValue)
            {
                query = query.Where(p => p.ClienteId == clienteId.Value);
            }

            return await query.ToListAsync();
        }

        public async Task<Proyecto?> GetByIdAsync(int id)
        {
            return await _db.Proyectos.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Proyecto> AddAsync(Proyecto proyecto)
        {
            _db.Proyectos.Add(proyecto);
            await _db.SaveChangesAsync();
            return proyecto;
        }

        public async Task<Proyecto> UpdateAsync(Proyecto proyecto)
        {
            var existing = await _db.Proyectos.FirstOrDefaultAsync(p => p.Id == proyecto.Id);
            if (existing != null)
            {
                existing.Nombre = proyecto.Nombre;
                existing.ClienteId = proyecto.ClienteId;
                existing.Estatus = proyecto.Estatus;
                existing.Prioridad = proyecto.Prioridad;
                existing.Avance = proyecto.Avance;
                existing.UsoPrincipal = proyecto.UsoPrincipal;
                existing.UsoComplementario = proyecto.UsoComplementario;
                existing.ImpactoPrincipal = proyecto.ImpactoPrincipal;
                existing.UsosComplementariosJson = proyecto.UsosComplementariosJson;
                existing.DireccionPrincipal = proyecto.DireccionPrincipal;
                existing.DireccionesComplementariasJson = proyecto.DireccionesComplementariasJson;
                existing.VialidadPrincipal = proyecto.VialidadPrincipal;
                existing.VialidadComplementaria = proyecto.VialidadComplementaria;
                existing.Alcance = proyecto.Alcance;
                existing.Descripcion = proyecto.Descripcion;
                existing.Responsable = proyecto.Responsable;
                if (proyecto.FechaInicio != default)
                {
                    existing.FechaInicio = proyecto.FechaInicio;
                }
                await _db.SaveChangesAsync();
                return existing;
            }

            _db.Entry(proyecto).State = EntityState.Modified;
            await _db.SaveChangesAsync();
            return proyecto;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var proyecto = await _db.Proyectos.FirstOrDefaultAsync(p => p.Id == id);
            if (proyecto == null) return false;

            _db.Proyectos.Remove(proyecto);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}

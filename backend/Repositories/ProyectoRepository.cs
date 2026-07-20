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
            _db.Entry(proyecto).State = EntityState.Modified;
            await _db.SaveChangesAsync();
            return proyecto;
        }
    }
}

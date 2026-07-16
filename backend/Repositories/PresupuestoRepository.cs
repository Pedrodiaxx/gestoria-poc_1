using Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class PresupuestoRepository : IPresupuestoRepository
    {
        private readonly ApplicationDbContext _db;

        public PresupuestoRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<Presupuesto>> GetAllAsync(List<string>? proyectoIds = null)
        {
            var query = _db.Presupuestos.AsQueryable();

            if (proyectoIds != null && proyectoIds.Count > 0)
            {
                query = query.Where(p => proyectoIds.Contains(p.ProyectoId));
            }

            return await query.ToListAsync();
        }

        public async Task<Presupuesto?> GetByIdAsync(int id)
        {
            return await _db.Presupuestos.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Presupuesto> AddAsync(Presupuesto presupuesto)
        {
            _db.Presupuestos.Add(presupuesto);
            await _db.SaveChangesAsync();
            return presupuesto;
        }

        public async Task<Presupuesto> UpdateAsync(Presupuesto presupuesto)
        {
            _db.Entry(presupuesto).State = EntityState.Modified;
            await _db.SaveChangesAsync();
            return presupuesto;
        }
    }
}

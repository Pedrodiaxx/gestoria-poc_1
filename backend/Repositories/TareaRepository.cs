using Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class TareaRepository : ITareaRepository
    {
        private readonly ApplicationDbContext _db;

        public TareaRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<TareaDiaria>> GetAllAsync()
        {
            return await _db.TareasDiarias.ToListAsync();
        }

        public async Task<TareaDiaria> AddAsync(TareaDiaria tarea)
        {
            _db.TareasDiarias.Add(tarea);
            await _db.SaveChangesAsync();
            return tarea;
        }

        public async Task<TareaDiaria?> GetByIdAsync(int id)
        {
            return await _db.TareasDiarias.FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<TareaDiaria> UpdateAsync(TareaDiaria tarea)
        {
            _db.Entry(tarea).State = EntityState.Modified;
            await _db.SaveChangesAsync();
            return tarea;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _db.TareasDiarias.FindAsync(id);
            if (entity == null) return false;
            _db.TareasDiarias.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}

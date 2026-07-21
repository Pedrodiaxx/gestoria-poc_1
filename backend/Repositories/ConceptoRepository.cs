using Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class ConceptoRepository : IConceptoRepository
    {
        private readonly ApplicationDbContext _db;

        public ConceptoRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<Concepto>> GetAllAsync()
        {
            return await _db.Conceptos.ToListAsync();
        }

        public async Task<Concepto> AddAsync(Concepto concepto)
        {
            _db.Conceptos.Add(concepto);
            await _db.SaveChangesAsync();
            return concepto;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var concepto = await _db.Conceptos.FirstOrDefaultAsync(c => c.Id == id);
            if (concepto == null) return false;

            _db.Conceptos.Remove(concepto);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}

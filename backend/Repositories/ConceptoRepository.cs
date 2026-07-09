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
    }
}

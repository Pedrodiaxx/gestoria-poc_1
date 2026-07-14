using Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class CotizacionRepository : ICotizacionRepository
    {
        private readonly ApplicationDbContext _db;

        public CotizacionRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<Cotizacion>> GetAllAsync(string? filtroClienteNombre = null)
        {
            var query = _db.Cotizaciones.AsQueryable();

            if (!string.IsNullOrEmpty(filtroClienteNombre))
            {
                query = query.Where(c => c.Cliente.ToLower() == filtroClienteNombre.ToLower());
            }

            return await query.ToListAsync();
        }

        public async Task<Cotizacion> AddAsync(Cotizacion cotizacion)
        {
            _db.Cotizaciones.Add(cotizacion);
            await _db.SaveChangesAsync();
            return cotizacion;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _db.Cotizaciones.FindAsync(id);
            if (entity == null) return false;
            _db.Cotizaciones.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}

using Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class ClienteRepository : IClienteRepository
    {
        private readonly ApplicationDbContext _db;

        public ClienteRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<Cliente>> GetAllAsync()
        {
            return await _db.Clientes.ToListAsync();
        }

        public async Task<Cliente?> GetByIdAsync(int id)
        {
            return await _db.Clientes.FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Cliente> AddAsync(Cliente cliente)
        {
            _db.Clientes.Add(cliente);
            await _db.SaveChangesAsync();
            return cliente;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _db.Clientes.FindAsync(id);
            if (entity == null) return false;
            _db.Clientes.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}

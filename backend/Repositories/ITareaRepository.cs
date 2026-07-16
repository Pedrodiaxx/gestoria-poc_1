using Data;

namespace Backend.Repositories
{
    public interface ITareaRepository
    {
        Task<List<TareaDiaria>> GetAllAsync();
        Task<TareaDiaria?> GetByIdAsync(int id);
        Task<TareaDiaria> AddAsync(TareaDiaria tarea);
        Task<TareaDiaria> UpdateAsync(TareaDiaria tarea);
        Task<bool> DeleteAsync(int id);
    }
}

using Data;

namespace Backend.Repositories
{
    public interface ITareaRepository
    {
        Task<List<TareaDiaria>> GetAllAsync();
        Task<TareaDiaria> AddAsync(TareaDiaria tarea);
    }
}

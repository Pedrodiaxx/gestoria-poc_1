using Data;

namespace Backend.Repositories
{
    public interface IConceptoRepository
    {
        Task<List<Concepto>> GetAllAsync();
        Task<Concepto> AddAsync(Concepto concepto);
        Task<bool> DeleteAsync(int id);
    }
}

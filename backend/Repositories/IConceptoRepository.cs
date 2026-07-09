using Data;

namespace Backend.Repositories
{
    public interface IConceptoRepository
    {
        Task<List<Concepto>> GetAllAsync();
        Task<Concepto> AddAsync(Concepto concepto);
    }
}

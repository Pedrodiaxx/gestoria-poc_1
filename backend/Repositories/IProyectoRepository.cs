using Data;

namespace Backend.Repositories
{
    public interface IProyectoRepository
    {
        /// <summary>
        /// Obtiene todos los proyectos. Opcionalmente filtra por clienteId (seguridad por rol).
        /// </summary>
        Task<List<Proyecto>> GetAllAsync(int? clienteId = null);
        Task<Proyecto?> GetByIdAsync(int id);
        Task<Proyecto> AddAsync(Proyecto proyecto);
        Task<Proyecto> UpdateAsync(Proyecto proyecto);
    }
}

using Data;

namespace Backend.Repositories
{
    public interface IPresupuestoRepository
    {
        /// <summary>
        /// Obtiene todos los presupuestos. Opcionalmente filtra por lista de proyectoIds (seguridad por rol).
        /// </summary>
        Task<List<Presupuesto>> GetAllAsync(List<string>? proyectoIds = null);
        Task<Presupuesto?> GetByIdAsync(int id);
        Task<Presupuesto> AddAsync(Presupuesto presupuesto);
        Task<Presupuesto> UpdateAsync(Presupuesto presupuesto);
        Task<bool> DeleteAsync(int id);
    }
}

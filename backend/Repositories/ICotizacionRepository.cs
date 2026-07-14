using Data;

namespace Backend.Repositories
{
    public interface ICotizacionRepository
    {
        /// <summary>
        /// Obtiene todas las cotizaciones. Opcionalmente filtra por nombre de cliente (seguridad por rol).
        /// </summary>
        Task<List<Cotizacion>> GetAllAsync(string? filtroClienteNombre = null);
        Task<Cotizacion> AddAsync(Cotizacion cotizacion);
        Task<bool> DeleteAsync(int id);
    }
}

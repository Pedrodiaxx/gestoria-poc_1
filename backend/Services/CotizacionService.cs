using Data;
using Data.DTOs;
using Backend.Repositories;
using System.Text.Json;

namespace Backend.Services
{
    public class CotizacionService
    {
        private readonly ICotizacionRepository _cotizacionRepo;
        private readonly IClienteRepository _clienteRepo;

        public CotizacionService(ICotizacionRepository cotizacionRepo, IClienteRepository clienteRepo)
        {
            _cotizacionRepo = cotizacionRepo;
            _clienteRepo = clienteRepo;
        }

        /// <summary>
        /// Obtiene todas las cotizaciones, aplicando filtrado por rol si corresponde.
        /// REGLA DE NEGOCIO: Si rol == "cliente", solo se devuelven las cotizaciones
        /// del cliente identificado por clienteId.
        /// </summary>
        public async Task<List<CotizacionDTO>> GetAllAsync(int? clienteId, string? rol)
        {
            string? filtroNombre = null;

            // SEGURIDAD POR ROL: resolver nombre del cliente para filtrar
            if (rol == "cliente" && clienteId.HasValue)
            {
                var cliente = await _clienteRepo.GetByIdAsync(clienteId.Value);
                filtroNombre = cliente?.Nombre;
            }

            var cotizaciones = await _cotizacionRepo.GetAllAsync(filtroNombre);
            var clientes = await _clienteRepo.GetAllAsync();

            return cotizaciones.Select(c => MapToDTO(c, clientes)).ToList();
        }

        /// <summary>
        /// Crea una nueva cotización y devuelve el DTO calculado.
        /// </summary>
        public async Task<CotizacionDTO> CreateAsync(Cotizacion nuevaCotizacion)
        {
            var created = await _cotizacionRepo.AddAsync(nuevaCotizacion);
            var clientes = await _clienteRepo.GetAllAsync();
            return MapToDTO(created, clientes);
        }

        public async Task<bool> DeleteCotizacionAsync(int id)
        {
            return await _cotizacionRepo.DeleteAsync(id);
        }

        // ────────────────────────────────────────────────────────────────
        // LÓGICA DE NEGOCIO: Cálculos financieros, folios y badges
        // ────────────────────────────────────────────────────────────────
        private static CotizacionDTO MapToDTO(Cotizacion c, List<Cliente> clientes)
        {
            var cli = clientes.FirstOrDefault(cl =>
                cl.Nombre.Equals(c.Cliente, StringComparison.OrdinalIgnoreCase));

            // Cálculos financieros
            double total = c.Total;
            double abonado = 0;
            double saldo = total - abonado;

            // Clasificación de estatus por saldo
            string estatus, badge, label;
            if (saldo <= 0)
            {
                estatus = "liquidada"; badge = "badge-green"; label = "Liquidada";
            }
            else if (abonado > 0)
            {
                estatus = "parcial"; badge = "badge-amber"; label = "Parcial";
            }
            else
            {
                estatus = "pendiente"; badge = "badge-red"; label = "Sin abono";
            }

            // Deserialización de conceptos desde JSON
            var conceptos = DeserializeConceptos(c.ConceptosJson);

            return new CotizacionDTO
            {
                Id = FormatFolio("COT", c.Id, 3),
                IdNumerico = c.Id,
                ClienteId = cli?.Id ?? 0,
                ClienteNombre = cli?.Nombre ?? c.Cliente,
                ClienteContacto = cli?.Contacto ?? "",
                Fecha = c.Fecha.ToString("yyyy-MM-dd"),
                Total = total,
                Abonado = abonado,
                Saldo = saldo,
                Estatus = estatus,
                EstatusBadge = badge,
                EstatusLabel = label,
                Conceptos = conceptos
            };
        }

        /// <summary>
        /// Genera un folio formateado: "COT-001", "PRY-012", etc.
        /// </summary>
        private static string FormatFolio(string prefijo, int id, int padding)
        {
            return $"{prefijo}-{id.ToString().PadLeft(padding, '0')}";
        }

        /// <summary>
        /// Deserializa la columna ConceptosJson de la base de datos.
        /// </summary>
        private static List<ConceptoLineaDTO> DeserializeConceptos(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new List<ConceptoLineaDTO>();

            try
            {
                var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                return JsonSerializer.Deserialize<List<ConceptoLineaDTO>>(json, opts)
                    ?? new List<ConceptoLineaDTO>();
            }
            catch
            {
                return new List<ConceptoLineaDTO>();
            }
        }
    }
}

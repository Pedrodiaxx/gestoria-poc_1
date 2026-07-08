namespace Data.DTOs
{
    /// <summary>
    /// DTO de salida para el endpoint GET /api/cotizaciones.
    /// Todos los cálculos (total, abonado, saldo, estatus) se resuelven
    /// en el servidor para que React solo pinte sin computar nada.
    /// </summary>
    public class CotizacionDTO
    {
        /// <summary>Folio formateado: "COT-001", "COT-012", etc.</summary>
        public string Id { get; set; } = string.Empty;

        /// <summary>ID numérico original de la base de datos (útil para operaciones POST/PUT).</summary>
        public int IdNumerico { get; set; }

        /// <summary>ID del cliente vinculado (resuelto por JOIN con la tabla Clientes).</summary>
        public int ClienteId { get; set; }

        /// <summary>Nombre del cliente ya resuelto en el servidor.</summary>
        public string ClienteNombre { get; set; } = string.Empty;

        /// <summary>Contacto del cliente (para la segunda línea de la celda en la tabla).</summary>
        public string ClienteContacto { get; set; } = string.Empty;

        /// <summary>Fecha formateada como "yyyy-MM-dd" lista para la UI.</summary>
        public string Fecha { get; set; } = string.Empty;

        /// <summary>Total de la cotización (suma de conceptos × cantidad).</summary>
        public double Total { get; set; }

        /// <summary>Monto total abonado por el cliente.</summary>
        public double Abonado { get; set; }

        /// <summary>Saldo pendiente (Total - Abonado).</summary>
        public double Saldo { get; set; }

        /// <summary>
        /// Estatus calculado en el servidor:
        /// "liquidada" si Saldo <= 0,
        /// "parcial" si Abonado > 0 pero Saldo > 0,
        /// "pendiente" en cualquier otro caso.
        /// </summary>
        public string Estatus { get; set; } = "pendiente";

        /// <summary>
        /// Clase CSS del badge para el estatus, resuelta en el servidor:
        /// "badge-green" para liquidada, "badge-amber" para parcial, "badge-red" para pendiente.
        /// </summary>
        public string EstatusBadge { get; set; } = "badge-red";

        /// <summary>
        /// Etiqueta visible del estatus:
        /// "Liquidada", "Parcial" o "Sin abono".
        /// </summary>
        public string EstatusLabel { get; set; } = "Sin abono";

        /// <summary>Lista de conceptos con sus precios ya resueltos.</summary>
        public List<ConceptoLineaDTO> Conceptos { get; set; } = new();
    }
}

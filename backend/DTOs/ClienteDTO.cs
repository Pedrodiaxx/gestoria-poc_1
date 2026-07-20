namespace Data.DTOs
{
    /// <summary>
    /// DTO de salida para el endpoint GET /api/clientes.
    /// Entrega los campos limpios y listos para la UI sin que React
    /// tenga que rellenar valores por defecto ni hacer transformaciones.
    /// </summary>
    public class ClienteDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Contacto { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Estatus { get; set; } = "activo";
        public string Tipo { get; set; } = "empresa";

        /// <summary>
        /// Clase CSS del badge de estatus, calculada en el servidor.
        /// "badge-green" para activo, "badge-gray" para inactivo, "badge-amber" para prospecto.    
        /// </summary>
        public string EstatusBadge { get; set; } = "badge-green";

        /// <summary>
        /// Etiqueta visible del estatus: "Activo", "Inactivo", "Prospecto".
        /// </summary>
        public string EstatusLabel { get; set; } = "Activo";
    }
}

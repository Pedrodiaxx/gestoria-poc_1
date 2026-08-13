namespace Data.DTOs
{
    public class ClienteDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string NombreComercial { get; set; } = string.Empty;
        public string ApoderadoLegal { get; set; } = string.Empty;
        public string Rfc { get; set; } = string.Empty;
        public string Ciudad { get; set; } = string.Empty;
        public string DireccionFiscal { get; set; } = string.Empty;
        public string Responsable { get; set; } = string.Empty;
        public string Contacto { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Estatus { get; set; } = "activo";
        public string Tipo { get; set; } = "empresa";

        public string EstatusBadge { get; set; } = "badge-green";
        public string EstatusLabel { get; set; } = "Activo";
    }
}

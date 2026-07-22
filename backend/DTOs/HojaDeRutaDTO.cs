namespace Data.DTOs
{
    public class HojaDeRutaDTO
    {
        public string Id { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public int ClienteId { get; set; }
        public string ProyectoId { get; set; } = string.Empty;
        public string Folio { get; set; } = string.Empty;
        public string PresupuestoId { get; set; } = string.Empty;
        public string AsignadoA { get; set; } = string.Empty;
        public string Prioridad { get; set; } = "alta";
        public string FechaInicio { get; set; } = string.Empty;
        public int PasoActual { get; set; } = 1;
        public string Estatus { get; set; } = "en-proceso";
        public string? FechaFinalizacion { get; set; }
        public string? Notas { get; set; }
    }
}

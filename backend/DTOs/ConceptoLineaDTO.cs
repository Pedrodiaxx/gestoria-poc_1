namespace Data.DTOs
{
    /// <summary>
    /// Línea de concepto dentro de una cotización.
    /// Estructura plana para alimentar las filas expandibles de React.
    /// </summary>
    public class ConceptoLineaDTO
    {
        public string Clave { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Unidad { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public double PrecioUnitario { get; set; }
        public double Subtotal { get; set; }
    }
}

namespace Data.DTOs
{
    public class ConceptoDTO
    {
        public int Id { get; set; }
        public string Clave { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Unidad { get; set; } = "m²";
        public double Cantidad { get; set; } = 1;
        public double Precio { get; set; }
    }
}

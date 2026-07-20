using System;

namespace Data
{
    public class Presupuesto
    {
        public int Id { get; set; }
        public string ProyectoId { get; set; }
        public string Titulo { get; set; }
        public string Estado { get; set; }
        public string Version { get; set; }
        public double TotalDirecto { get; set; }
        public double TotalIndirecto { get; set; }
        public DateTime Fecha { get; set; }
        public string ConceptosJson { get; set; }

        // Nuevos metadatos del predio (caso real)
        public string? Direccion { get; set; }
        public string? Propietario { get; set; }
        public double? SupPredio { get; set; }
        public double? SupConstExistente { get; set; }
        public double? SupIntervenir { get; set; }
        public string? Uso { get; set; }
        public string? Clasificacion { get; set; }
        public string? ZonaPrimaria { get; set; }
        public string? TipoVialidad { get; set; }
        public string? Estimacion { get; set; }
        public double? CostoDirectoConstruccion { get; set; }
        public string? InfoAdicionalJson { get; set; }
    }
}

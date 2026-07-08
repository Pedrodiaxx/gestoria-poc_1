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
    }
}

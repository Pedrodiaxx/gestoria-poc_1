using System;

namespace Data
{
    public class Proyecto
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public int ClienteId { get; set; }
        public string Estatus { get; set; }
        public string Prioridad { get; set; }
        public int Avance { get; set; }
        public DateTime FechaInicio { get; set; }
    }
}

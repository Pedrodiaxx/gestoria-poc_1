using System;

namespace Data
{
    public class TareaDiaria
    {
        public int Id { get; set; }
        public string Titulo { get; set; }
        public string Prioridad { get; set; }
        public bool Hecho { get; set; }
        public DateTime Fecha { get; set; }
        public string AsignadoA { get; set; }
    }
}

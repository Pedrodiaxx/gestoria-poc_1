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
        public string? ProyectoId { get; set; }
        /// <summary>Etapa administrativa del trámite (Uso de Suelo, Licencia de Construcción, etc.)</summary>
        public string? Etapa { get; set; }
        /// <summary>ID del presupuesto del que se originó esta tarea al ser aprobado</summary>
        public int? PresupuestoId { get; set; }
        public int Figam {get; set;}
        
    }
}

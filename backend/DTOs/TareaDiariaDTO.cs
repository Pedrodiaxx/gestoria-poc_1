namespace Data.DTOs
{
    /// <summary>
    /// DTO de salida para el endpoint GET /api/tareas.
    /// Formatea las fechas y pre-clasifica la tarea como
    /// "hoy", "completada" o "atrasada" para que el frontend
    /// solo la coloque en la columna correcta sin lógica.
    /// </summary>
    public class TareaDiariaDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Prioridad { get; set; } = "media";

        /// <summary>
        /// Clase CSS del badge de prioridad:
        /// "badge-red" para alta, "badge-amber" para media, "badge-blue" para baja.
        /// </summary>
        public string PrioridadBadge { get; set; } = "badge-amber";

        /// <summary>Etiqueta visible: "Alta", "Media", "Baja".</summary>
        public string PrioridadLabel { get; set; } = "Media";

        public bool Completada { get; set; }

        /// <summary>Fecha formateada como "yyyy-MM-dd".</summary>
        public string Fecha { get; set; } = string.Empty;

        /// <summary>Clave del usuario asignado (ej: "u1", "u2").</summary>
        public string AsignadoA { get; set; } = string.Empty;

        /// <summary>
        /// Columna pre-calculada en el servidor:
        /// "hoy" si la fecha es hoy y no está completada,
        /// "completada" si está hecha,
        /// "atrasada" si la fecha es pasada y no está completada.
        /// </summary>
        public string Columna { get; set; } = "hoy";
    }
}

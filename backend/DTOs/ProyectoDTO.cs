namespace Data.DTOs
{
    /// <summary>
    /// DTO de salida para el endpoint GET /api/proyectos.
    /// Contiene el folio formateado, el nombre del cliente ya resuelto,
    /// los datos de avance, y las estadísticas de presupuesto calculadas en el servidor.
    /// </summary>
    public class ProyectoDTO
    {
        /// <summary>Folio formateado: "PRY-001", "PRY-012", etc.</summary>
        public string Id { get; set; } = string.Empty;

        /// <summary>ID numérico original de la base de datos.</summary>
        public int IdNumerico { get; set; }

        public string Nombre { get; set; } = string.Empty;

        /// <summary>ID del cliente vinculado.</summary>
        public int ClienteId { get; set; }

        /// <summary>Nombre del cliente ya resuelto en el servidor (JOIN con Clientes).</summary>
        public string ClienteNombre { get; set; } = string.Empty;

        public string Estatus { get; set; } = "pendiente";

        /// <summary>Clase CSS del badge: badge-blue, badge-green, badge-amber, badge-gray.</summary>
        public string EstatusBadge { get; set; } = "badge-amber";

        /// <summary>Etiqueta visible: "En Proceso", "Completado", "Pendiente", "Pausado".</summary>
        public string EstatusLabel { get; set; } = "Pendiente";

        public string Prioridad { get; set; } = "media";
        public int Avance { get; set; }

        /// <summary>Fecha formateada como "yyyy-MM-dd" lista para la UI.</summary>
        public string FechaInicio { get; set; } = string.Empty;

        /// <summary>Tipo de trámite (ej: "licencia_construccion").</summary>
        public string Tipo { get; set; } = "licencia_construccion";

        /// <summary>Descripción del proyecto.</summary>
        public string Descripcion { get; set; } = string.Empty;

        /// <summary>Responsable asignado.</summary>
        public string Responsable { get; set; } = "usr-admin-1";

        /// <summary>Monto total del presupuesto base asociado, calculado en el servidor.</summary>
        public double Monto { get; set; }

        /// <summary>Cantidad de presupuestos asociados a este proyecto.</summary>
        public int TotalPresupuestos { get; set; }
    }
}

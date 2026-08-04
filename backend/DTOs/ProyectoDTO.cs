namespace Data.DTOs
{
    /// <summary>
    /// DTO de salida para el endpoint GET /api/proyectos.
    /// Contiene el folio formateado, el nombre del cliente ya resuelto,
    /// los datos de avance, las estadísticas de presupuesto y todos los metadatos urbanos (Anexo N-02).
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

        // ─── Clasificación Normativa (Anexo N-02) ────────────────────────────────
        public string UsoPrincipal { get; set; } = string.Empty;
        public string UsoComplementario { get; set; } = string.Empty;
        public string ImpactoPrincipal { get; set; } = string.Empty;

        /// <summary>Array de usos complementarios (hasta 3), deserializado desde JSON.</summary>
        public List<string> UsosComplementarios { get; set; } = new();

        /// <summary>Zona Primaria según el PDUM Mérida.</summary>
        public string ZonaPrimaria { get; set; } = string.Empty;

        // ─── Dirección e Infraestructura Vial ────────────────────────────────────
        public string DireccionPrincipal { get; set; } = string.Empty;

        /// <summary>Array de hasta 3 direcciones complementarias, deserializado desde JSON.</summary>
        public List<string> DireccionesComplementarias { get; set; } = new();

        public string VialidadPrincipal { get; set; } = string.Empty;
        public string VialidadComplementaria { get; set; } = string.Empty;

        // ─── Información Adicional ────────────────────────────────────────────────
        public string Alcance { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;

        /// <summary>ID del usuario responsable asignado.</summary>
        public string Responsable { get; set; } = string.Empty;

        /// <summary>Fecha formateada como "yyyy-MM-dd" lista para la UI.</summary>
        public string FechaInicio { get; set; } = string.Empty;

        /// <summary>Tipo de trámite (ej: "licencia_construccion").</summary>
        public string Tipo { get; set; } = "licencia_construccion";

        /// <summary>Monto total del presupuesto base asociado, calculado en el servidor.</summary>
        public double Monto { get; set; }

        /// <summary>Cantidad de presupuestos asociados a este proyecto.</summary>
        public int TotalPresupuestos { get; set; }
    }
}

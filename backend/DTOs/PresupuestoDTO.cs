namespace Data.DTOs
{
    /// <summary>
    /// DTO de salida para el endpoint GET /api/presupuestos.
    /// Centraliza todos los cálculos de costos directos, indirectos, IVA
    /// y total general en el servidor.
    /// </summary>
    public class PresupuestoDTO
    {
        /// <summary>Folio formateado: "PRES-0001", "PRES-0012", etc.</summary>
        public string Id { get; set; } = string.Empty;

        /// <summary>ID numérico original de la base de datos.</summary>
        public int IdNumerico { get; set; }

        /// <summary>ID del proyecto asociado (ej: "PRY-001").</summary>
        public string ProyectoId { get; set; } = string.Empty;

        /// <summary>Nombre del proyecto ya resuelto en el servidor.</summary>
        public string ProyectoNombre { get; set; } = string.Empty;

        public string Titulo { get; set; } = string.Empty;
        public string Estado { get; set; } = "borrador";

        /// <summary>Clase CSS del badge: badge-blue, badge-green, badge-amber, badge-gray.</summary>
        public string EstadoBadge { get; set; } = "badge-amber";

        /// <summary>Etiqueta visible: "Borrador", "Aprobado", "En Revisión", etc.</summary>
        public string EstadoLabel { get; set; } = "Borrador";

        public string Version { get; set; } = "V1.0";

        /// <summary>Fecha formateada como "yyyy-MM-dd".</summary>
        public string Fecha { get; set; } = string.Empty;

        // Nuevos metadatos del predio (caso real)
        public string Direccion { get; set; } = string.Empty;
        public string Propietario { get; set; } = string.Empty;
        public double SupPredio { get; set; }
        public double SupConstExistente { get; set; }
        public double SupIntervenir { get; set; }
        public string Uso { get; set; } = string.Empty;
        public string Clasificacion { get; set; } = string.Empty;
        public string ZonaPrimaria { get; set; } = string.Empty;
        public string TipoVialidad { get; set; } = string.Empty;
        public string Estimacion { get; set; } = string.Empty;
        public double CostoDirectoConstruccion { get; set; }
        public string InfoAdicionalJson { get; set; } = string.Empty;

        // Nuevos campos calculados para sumas financieras
        public double SubtotalHonorarios { get; set; }
        public double IvaHonorarios { get; set; }
        public double TotalHonorarios { get; set; }
        public double TotalDerechos { get; set; }
        public double TotalExtras { get; set; }
        public double TotalGeneral { get; set; }
        public double PorcentajeGestion { get; set; }

        // Campos heredados/compatibilidad
        public double TotalDirecto { get; set; }
        public double TotalIndirecto { get; set; }

        /// <summary>Lista de conceptos del presupuesto, ya deserializados desde ConceptosJson.</summary>
        public List<ConceptoPresupuestoDTO> Conceptos { get; set; } = new();
    }

    /// <summary>
    /// DTO para cada línea de concepto dentro de un presupuesto de gestoría.
    /// Se deserializa en el servidor desde la columna ConceptosJson de la DB.
    /// </summary>
    public class ConceptoPresupuestoDTO
    {
        public int No { get; set; }
        public string Etapa { get; set; } = string.Empty; // Ej: "Uso de Suelo", "Licencia de Construcción"
        public string Concepto { get; set; } = string.Empty; // Descripción del trámite/servicio
        public string Unidad { get; set; } = string.Empty; // Ej: "GESTIÓN", "TRAMITE", "ESTUDIO", "PROYECTO"
        public double Honorarios { get; set; } // Honorarios profesionales
        public string Comentarios { get; set; } = string.Empty;
        public double PagoDerechos { get; set; } // Derechos de pago municipales/estatales
        public double Extra { get; set; } // Costos extras
        public string EmpleadoAsignadoId { get; set; } = string.Empty;
    }
}

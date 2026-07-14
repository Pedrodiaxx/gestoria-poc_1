namespace Data.DTOs
{
    /// <summary>
    /// DTO de salida para el endpoint GET /api/presupuestos.
    /// Centraliza todos los cálculos de costos directos, indirectos, contingencia
    /// y total general en el servidor. React solo pinta los números.
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

        /// <summary>Suma de costos directos (materiales + mano de obra + equipos + subcontratistas).</summary>
        public double TotalDirecto { get; set; }

        /// <summary>Suma de costos indirectos (oficina + seguros + permisos + administración).</summary>
        public double TotalIndirecto { get; set; }

        /// <summary>Subtotal = TotalDirecto + TotalIndirecto.</summary>
        public double Subtotal { get; set; }

        /// <summary>Monto de contingencia calculado sobre el subtotal.</summary>
        public double Contingencia { get; set; }

        /// <summary>Total general = Subtotal + Contingencia.</summary>
        public double TotalGeneral { get; set; }

        /// <summary>Lista de conceptos del presupuesto, ya deserializados desde ConceptosJson.</summary>
        public List<ConceptoPresupuestoDTO> Conceptos { get; set; } = new();
    }

    /// <summary>
    /// DTO para cada línea de concepto dentro de un presupuesto.
    /// Se deserializa en el servidor desde la columna ConceptosJson de la DB.
    /// </summary>
    public class ConceptoPresupuestoDTO
    {
        public string Clave { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string Unidad { get; set; } = string.Empty;
        public string UnidadMedida { get; set; } = string.Empty;
        public double Cantidad { get; set; }
        public double CostoMaterial { get; set; }
        public double CostoMateriales { get; set; }
        public double CostoManoObra { get; set; }
        public double CostoEquipo { get; set; }
        public double Subtotal { get; set; }
        public string AsignadoA { get; set; } = string.Empty;
        public string EmpleadoAsignadoId { get; set; } = string.Empty;
    }
}

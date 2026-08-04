using System;

namespace Data
{
    public class Proyecto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int ClienteId { get; set; }
        public string Estatus { get; set; } = "pendiente";
        public string Prioridad { get; set; } = "media";
        public int Avance { get; set; }

        // ─── Clasificación Normativa (Anexo N-02) ────────────────────────────────
        /// <summary>Categoría normativa principal (Giro). Ej: "HABITACIONAL", "COMERCIO".</summary>
        public string? UsoPrincipal { get; set; }

        /// <summary>Giro autorizado específico. Ej: "VIVIENDA", "RESTAURANTE DE PRIMERA A".</summary>
        public string? UsoComplementario { get; set; }

        /// <summary>Nivel de impacto autocalculado. Ej: "Bajo Impacto", "Alto Impacto".</summary>
        public string? ImpactoPrincipal { get; set; }

        /// <summary>Usos complementarios adicionales (hasta 3) serializados como JSON array.</summary>
        public string? UsosComplementariosJson { get; set; }

        /// <summary>Zona Primaria según el PDUM Mérida (ej: "ZCO - ZONA 1. CONSOLIDACIÓN URBANA").</summary>
        public string? ZonaPrimaria { get; set; }

        // ─── Dirección e Infraestructura Vial ────────────────────────────────────
        /// <summary>Dirección principal del predio donde se ubica el proyecto.</summary>
        public string? DireccionPrincipal { get; set; }

        /// <summary>Hasta 3 direcciones complementarias serializadas como JSON array.</summary>
        public string? DireccionesComplementariasJson { get; set; }

        /// <summary>Nombre de la vialidad principal (calle/avenida principal).</summary>
        public string? VialidadPrincipal { get; set; }

        /// <summary>Nombre de la vialidad complementaria (calle secundaria, esquina).</summary>
        public string? VialidadComplementaria { get; set; }

        // ─── Información Adicional del Proyecto ──────────────────────────────────
        /// <summary>Alcance del proyecto (descripción técnica detallada).</summary>
        public string? Alcance { get; set; }

        /// <summary>Resumen corto / descripción breve visible en la tarjeta.</summary>
        public string? Descripcion { get; set; }

        /// <summary>ID del usuario responsable asignado (referencia a Control de Usuarios).</summary>
        public string? Responsable { get; set; }

        public DateTime FechaInicio { get; set; }
    }
}

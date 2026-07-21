using Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    /// <summary>
    /// Servicio centralizado para reajustar las secuencias IDENTITY/SERIAL de PostgreSQL
    /// tras eliminar registros, garantizando IDs consecutivos sin saltos.
    /// </summary>
    public class SequenceResetService
    {
        private readonly ApplicationDbContext _context;

        public SequenceResetService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Reajusta la secuencia de la columna "Id" de la tabla indicada al MAX(Id) actual.
        /// El próximo INSERT recibirá MAX(Id)+1. Si la tabla está vacía, reinicia a 1.
        /// </summary>
        /// <param name="tableName">Nombre exacto de la tabla en PostgreSQL (case-sensitive con comillas).</param>
        public async Task ResetSequenceAsync(string tableName)
        {
            // pg_get_serial_sequence obtiene el nombre de la secuencia vinculada a la columna "Id".
            // COALESCE maneja el caso de tabla vacía (0 registros) reiniciando a 1.
            // El tercer parámetro 'false' indica que el valor proporcionado será el PRÓXIMO valor usado.
            var sql = $@"
                SELECT setval(
                    pg_get_serial_sequence('""{tableName}""', 'Id'),
                    COALESCE((SELECT MAX(""Id"") FROM ""{tableName}""), 0) + 1,
                    false
                );";

            await _context.Database.ExecuteSqlRawAsync(sql);
        }

        /// <summary>
        /// Reajusta las secuencias de TODAS las tablas del sistema.
        /// Útil como script de mantenimiento inicial.
        /// </summary>
        public async Task ResetAllSequencesAsync()
        {
            var tables = new[]
            {
                "Clientes",
                "Conceptos",
                "Cotizaciones",
                "Presupuestos",
                "Proyectos",
                "TareasDiarias"
                // "Usuarios" usa Id de tipo string (no tiene secuencia numérica)
            };

            foreach (var table in tables)
            {
                try
                {
                    await ResetSequenceAsync(table);
                    Console.WriteLine($"[SequenceReset] Secuencia de '{table}' reajustada correctamente.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[SequenceReset] Error al reajustar secuencia de '{table}': {ex.Message}");
                }
            }
        }
    }
}

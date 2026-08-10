using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEstimacionFromPresupuestos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Usar raw SQL con IF EXISTS para que sea idempotente:
            // la migración no falla si la columna ya fue eliminada o nunca existió.
            migrationBuilder.Sql("ALTER TABLE \"Presupuestos\" DROP COLUMN IF EXISTS \"Estimacion\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Estimacion",
                table: "Presupuestos",
                type: "text",
                nullable: true);
        }
    }
}

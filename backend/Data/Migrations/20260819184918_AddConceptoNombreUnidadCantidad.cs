using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConceptoNombreUnidadCantidad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Etapa",
                table: "TareasDiarias",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PresupuestoId",
                table: "TareasDiarias",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Etapa",
                table: "TareasDiarias");

            migrationBuilder.DropColumn(
                name: "PresupuestoId",
                table: "TareasDiarias");
        }
    }
}

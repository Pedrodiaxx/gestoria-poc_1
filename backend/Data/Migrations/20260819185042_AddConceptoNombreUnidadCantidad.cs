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

            // Nuevos campos en Conceptos: Nombre, Unidad y Cantidad
            migrationBuilder.AddColumn<string>(
                name: "Nombre",
                table: "Conceptos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Unidad",
                table: "Conceptos",
                type: "text",
                nullable: false,
                defaultValue: "m²");

            migrationBuilder.AddColumn<double>(
                name: "Cantidad",
                table: "Conceptos",
                type: "double precision",
                nullable: false,
                defaultValue: 1.0);
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

            migrationBuilder.DropColumn(
                name: "Nombre",
                table: "Conceptos");

            migrationBuilder.DropColumn(
                name: "Unidad",
                table: "Conceptos");

            migrationBuilder.DropColumn(
                name: "Cantidad",
                table: "Conceptos");
        }
    }
}

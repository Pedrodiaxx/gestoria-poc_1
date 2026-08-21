using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConceptoCamposCompletos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Nuevos campos en la tabla Conceptos
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
                defaultValue: "m\u00b2");

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

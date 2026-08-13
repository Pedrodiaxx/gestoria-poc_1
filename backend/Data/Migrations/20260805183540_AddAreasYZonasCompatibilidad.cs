using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAreasYZonasCompatibilidad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AreaCompatibilidad",
                table: "Proyectos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZonaCompatibilidadEspecifica",
                table: "Proyectos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AreaCompatibilidad",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "ZonaCompatibilidadEspecifica",
                table: "Proyectos");
        }
    }
}

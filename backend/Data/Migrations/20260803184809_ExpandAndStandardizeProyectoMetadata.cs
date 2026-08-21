using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class ExpandAndStandardizeProyectoMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Alcance",
                table: "Proyectos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Descripcion",
                table: "Proyectos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DireccionPrincipal",
                table: "Proyectos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DireccionesComplementariasJson",
                table: "Proyectos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Responsable",
                table: "Proyectos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UsosComplementariosJson",
                table: "Proyectos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VialidadComplementaria",
                table: "Proyectos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VialidadPrincipal",
                table: "Proyectos",
                type: "text",
                nullable: true);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Alcance",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "Descripcion",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "DireccionPrincipal",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "DireccionesComplementariasJson",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "ImpactoPrincipal",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "Responsable",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "UsoComplementario",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "UsoPrincipal",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "UsosComplementariosJson",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "VialidadComplementaria",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "VialidadPrincipal",
                table: "Proyectos");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Usuarios",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}

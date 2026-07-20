using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class RedisenioPresupuestosCasoReal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Clasificacion",
                table: "Presupuestos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "CostoDirectoConstruccion",
                table: "Presupuestos",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Direccion",
                table: "Presupuestos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Estimacion",
                table: "Presupuestos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InfoAdicionalJson",
                table: "Presupuestos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Propietario",
                table: "Presupuestos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "SupConstExistente",
                table: "Presupuestos",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "SupIntervenir",
                table: "Presupuestos",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "SupPredio",
                table: "Presupuestos",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoVialidad",
                table: "Presupuestos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Uso",
                table: "Presupuestos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZonaPrimaria",
                table: "Presupuestos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Clasificacion",
                table: "Presupuestos");

            migrationBuilder.DropColumn(
                name: "CostoDirectoConstruccion",
                table: "Presupuestos");

            migrationBuilder.DropColumn(
                name: "Direccion",
                table: "Presupuestos");

            migrationBuilder.DropColumn(
                name: "Estimacion",
                table: "Presupuestos");

            migrationBuilder.DropColumn(
                name: "InfoAdicionalJson",
                table: "Presupuestos");

            migrationBuilder.DropColumn(
                name: "Propietario",
                table: "Presupuestos");

            migrationBuilder.DropColumn(
                name: "SupConstExistente",
                table: "Presupuestos");

            migrationBuilder.DropColumn(
                name: "SupIntervenir",
                table: "Presupuestos");

            migrationBuilder.DropColumn(
                name: "SupPredio",
                table: "Presupuestos");

            migrationBuilder.DropColumn(
                name: "TipoVialidad",
                table: "Presupuestos");

            migrationBuilder.DropColumn(
                name: "Uso",
                table: "Presupuestos");

            migrationBuilder.DropColumn(
                name: "ZonaPrimaria",
                table: "Presupuestos");
        }
    }
}

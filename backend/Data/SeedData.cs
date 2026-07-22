using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Data
{
    public static class SeedData
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using var context = new ApplicationDbContext(
                serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>());

            // Check and migrate automatically if needed
            context.Database.Migrate();

            // Eliminar conceptos duplicados (conservar el primero por Id)
            try
            {
                var duplicateGroups = context.Conceptos
                    .ToList()
                    .GroupBy(c => c.Clave)
                    .Where(g => g.Count() > 1);

                foreach (var group in duplicateGroups)
                {
                    var sorted = group.OrderBy(c => c.Id).ToList();
                    var keep = sorted.First();
                    var dupes = sorted.Skip(1).ToList();
                    context.Conceptos.RemoveRange(dupes);
                }
                context.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al limpiar conceptos duplicados: {ex.Message}");
            }

            if (!context.Clientes.Any(c => c.Id == 1))
            {
                context.Clientes.Add(new Cliente
                {
                    Id = 1,
                    Nombre = "Urbania Desarrollos / Santos Lugo",
                    Contacto = "Arq. Alejandro Gómez Reyes",
                    Email = "agomez@urbania.mx",
                    Telefono = "+52 442 310 8800",
                    Tipo = "empresa",
                    Estatus = "activo"
                });
                context.SaveChanges();
            }

            if (!context.Proyectos.Any(p => p.Id == 1))
            {
                context.Proyectos.Add(new Proyecto
                {
                    Id = 1,
                    Nombre = "Residencial Los Álamos Fase I / Santos Lugo",
                    ClienteId = 1,
                    Estatus = "En Trámite",
                    Prioridad = "alta",
                    Avance = 45,
                    FechaInicio = DateTime.UtcNow.AddMonths(-2)
                });
                context.SaveChanges();
            }

            if (!context.Presupuestos.Any())
            {
                var conceptosJson = @"[
  { ""no"": 1, ""etapa"": ""Uso de Suelo"", ""concepto"": ""Dictamen de Factibilidad de Uso de Suelo"", ""unidad"": ""GESTIÓN"", ""honorarios"": 35000, ""pagoDerechos"": 12500, ""extra"": 0, ""id"": ""c-101"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 2, ""etapa"": ""Uso de Suelo"", ""concepto"": ""Resolutivo de Impacto Urbano y Vial"", ""unidad"": ""GESTIÓN"", ""honorarios"": 48000, ""pagoDerechos"": 22000, ""extra"": 5000, ""id"": ""c-102"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 3, ""etapa"": ""Uso de Suelo"", ""concepto"": ""Alineamiento y Número Oficial"", ""unidad"": ""GESTIÓN"", ""honorarios"": 15000, ""pagoDerechos"": 3800, ""extra"": 0, ""id"": ""c-103"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 4, ""etapa"": ""Licencia de Construcción"", ""concepto"": ""Proyecto Arquitectónico Ejecutivo y Memorias"", ""unidad"": ""M2"", ""honorarios"": 180000, ""pagoDerechos"": 0, ""extra"": 0, ""id"": ""c-104"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 5, ""etapa"": ""Licencia de Construcción"", ""concepto"": ""Cálculo Estructural y Firma de Corresponsable (CSE)"", ""unidad"": ""M2"", ""honorarios"": 145000, ""pagoDerechos"": 0, ""extra"": 0, ""id"": ""c-105"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 6, ""etapa"": ""Licencia de Construcción"", ""concepto"": ""Memoria e Instalaciones Eléctricas / Hidrosanitarias"", ""unidad"": ""M2"", ""honorarios"": 95000, ""pagoDerechos"": 0, ""extra"": 0, ""id"": ""c-106"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 7, ""etapa"": ""Licencia de Construcción"", ""concepto"": ""Mecánica de Suelos y Topografía Georeferenciada"", ""unidad"": ""ESTUDIO"", ""honorarios"": 65000, ""pagoDerechos"": 0, ""extra"": 0, ""id"": ""c-107"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 8, ""etapa"": ""Licencia de Construcción"", ""concepto"": ""Firma de Director Responsable de Obra (DRO)"", ""unidad"": ""FIRMA"", ""honorarios"": 120000, ""pagoDerechos"": 0, ""extra"": 0, ""id"": ""c-108"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 9, ""etapa"": ""Licencia de Construcción"", ""concepto"": ""Gestión ante Desarrollo Urbano para Licencia de Construcción"", ""unidad"": ""GESTIÓN"", ""honorarios"": 85000, ""pagoDerechos"": 142000, ""extra"": 15000, ""id"": ""c-109"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 10, ""etapa"": ""Licencia de Construcción"", ""concepto"": ""Permiso de Construcción ante Protección Civil Municipal"", ""unidad"": ""GESTIÓN"", ""honorarios"": 45000, ""pagoDerechos"": 18500, ""extra"": 0, ""id"": ""c-110"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 11, ""etapa"": ""Licencia de Construcción"", ""concepto"": ""Factibilidad de Agua Potable y Alcantarillado (JAPAY)"", ""unidad"": ""GESTIÓN"", ""honorarios"": 32000, ""pagoDerechos"": 28000, ""extra"": 0, ""id"": ""c-111"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 12, ""etapa"": ""Licencia de Construcción"", ""concepto"": ""Aprobación de Proyecto ante Bomberos / CFE"", ""unidad"": ""GESTIÓN"", ""honorarios"": 40000, ""pagoDerechos"": 15000, ""extra"": 0, ""id"": ""c-112"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 13, ""etapa"": ""Licencia de Construcción"", ""concepto"": ""Bitácora Oficial de Obra y Registro IMSS (SIROC)"", ""unidad"": ""TRÁMITE"", ""honorarios"": 28000, ""pagoDerechos"": 8500, ""extra"": 0, ""id"": ""c-113"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 14, ""etapa"": ""Terminación de Obra"", ""concepto"": ""Aviso de Terminación de Obra ante Desarrollo Urbano"", ""unidad"": ""GESTIÓN"", ""honorarios"": 55000, ""pagoDerechos"": 34000, ""extra"": 0, ""id"": ""c-114"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 15, ""etapa"": ""Terminación de Obra"", ""concepto"": ""Constancia de Seguridad Estructural y Vo.Bo. Protección Civil"", ""unidad"": ""GESTIÓN"", ""honorarios"": 42000, ""pagoDerechos"": 12000, ""extra"": 0, ""id"": ""c-115"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 16, ""etapa"": ""Terminación de Obra"", ""concepto"": ""Cierre de Bitácora y Liberación de SIROC IMSS"", ""unidad"": ""TRÁMITE"", ""honorarios"": 35000, ""pagoDerechos"": 0, ""extra"": 0, ""id"": ""c-116"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 17, ""etapa"": ""Licencia de Funcionamiento"", ""concepto"": ""Licencia de Funcionamiento Municipal (Bajo Impacto)"", ""unidad"": ""GESTIÓN"", ""honorarios"": 48000, ""pagoDerechos"": 26000, ""extra"": 0, ""id"": ""c-117"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 18, ""etapa"": ""Licencia de Funcionamiento"", ""concepto"": ""Anuencia de Protección Civil Operativa y Plan de Emergencia"", ""unidad"": ""GESTIÓN"", ""honorarios"": 38000, ""pagoDerechos"": 14000, ""extra"": 0, ""id"": ""c-118"", ""empleadoAsignadoId"": ""usr-emp-1"" },
  { ""no"": 19, ""etapa"": ""Licencia de Funcionamiento"", ""concepto"": ""Permiso de Anuncios y Publicidad Exterior"", ""unidad"": ""GESTIÓN"", ""honorarios"": 22000, ""pagoDerechos"": 9500, ""extra"": 0, ""id"": ""c-119"", ""empleadoAsignadoId"": ""usr-emp-1"" }
]";

                var infoAdicionalJson = @"{
  ""clausula"": ""Los honorarios presentados cubren exclusivamente la gestión, dirección técnica y firma de los peritos oficiales ante las dependencias de los tres niveles de gobierno. No incluyen el pago de derechos municipales, estatales o federales ni multas que pudieran generarse por inicios de obra no autorizados. Los tiempos de respuesta están sujetos a los plazos normativos de las dependencias correspondientes."",
  ""duracionUsoSuelo"": ""3 a 4 semanas"",
  ""duracionLicenciaConst"": ""8 a 10 semanas"",
  ""duracionTerminacionObra"": ""3 a 4 semanas"",
  ""duracionLicenciaFunc"": ""4 a 5 semanas"",
  ""porcentajeGestion"": ""1.65""
}";

                context.Presupuestos.Add(new Presupuesto
                {
                    Id = 9001,
                    ProyectoId = "PRY-001",
                    Titulo = "Presupuesto Ejecutivo Gestoría — Comercializadora Santos Lugo",
                    Estado = "Enviado",
                    Version = "2.00",
                    TotalDirecto = 1173000,
                    TotalIndirecto = 553480,
                    Fecha = DateTime.UtcNow,
                    ConceptosJson = conceptosJson,
                    Propietario = "SANTOS LUGO",
                    Direccion = "TABLAJES 20690 COLONIA CENTRO",
                    SupPredio = 8307.29,
                    SupConstExistente = 0.00,
                    SupIntervenir = 4300.00,
                    Uso = "Tienda de Abarrotes",
                    Clasificacion = "Bajo Impacto",
                    ZonaPrimaria = "2",
                    TipoVialidad = "LOCAL",
                    Estimacion = "Normal",
                    CostoDirectoConstruccion = 77400000.00,
                    InfoAdicionalJson = infoAdicionalJson
                });

                context.SaveChanges();
            }

            // Asegurar que solo Gabriel Cervera existe y remover los mock de prueba si existen
            var laura = context.Usuarios.Find("usr-emp-1");
            if (laura != null) context.Usuarios.Remove(laura);

            var patricia = context.Usuarios.Find("usr-cli-1");
            if (patricia != null) context.Usuarios.Remove(patricia);

            context.SaveChanges();

            var adminUser = context.Usuarios.FirstOrDefault(u => u.Id == "usr-admin-1" || u.Email == "gabrielcoc@gmail.com");
            if (adminUser != null)
            {
                adminUser.Contrasenia = "123456789";
                adminUser.Nombre = "Gabriel";
                context.SaveChanges();
            }
            else
            {
                context.Usuarios.Add(new Usuario
                {
                    Id = "usr-admin-1",
                    Nombre = "Gabriel",
                    Email = "gabrielcoc@gmail.com",
                    Contrasenia = "123456789",
                    Rol = "admin",
                    ModulosJson = "[\"presupuestos\",\"administracion\",\"tareas\",\"catalogo\",\"cotizaciones\",\"proyectos\",\"clientes\"]",
                    Avatar = "G",
                    Color = "#2A5F3F"
                });
                context.SaveChanges();
            }

            if (!context.HojasDeRuta.Any())
            {
                var hoy = DateTime.UtcNow.ToString("yyyy-MM-dd");
                context.HojasDeRuta.AddRange(new System.Collections.Generic.List<HojaDeRuta>
                {
                    new HojaDeRuta
                    {
                        Id = "TRM-001",
                        Tipo = "licencia-const",
                        ClienteId = 1,
                        ProyectoId = "PRY-001",
                        Folio = "QRO/LC/2024-0489",
                        PresupuestoId = "COT-001",
                        AsignadoA = "usr-admin-1",
                        Prioridad = "alta",
                        FechaInicio = hoy,
                        PasoActual = 6,
                        Estatus = "en-proceso",
                        Notas = "Residencial Los Álamos — Expediente ingresado en Obras Públicas. Pendiente firma de DRO."
                    },
                    new HojaDeRuta
                    {
                        Id = "TRM-002",
                        Tipo = "uso-suelo",
                        ClienteId = 2,
                        ProyectoId = "PRY-002",
                        Folio = "QRO/US/2024-0302",
                        PresupuestoId = "COT-002",
                        AsignadoA = "usr-gestor-1",
                        Prioridad = "alta",
                        FechaInicio = hoy,
                        PasoActual = 4,
                        Estatus = "en-proceso",
                        Notas = "Parque logístico Juriquilla — Uso de suelo industrial. Pendiente pago de derechos en Tesorería."
                    },
                    new HojaDeRuta
                    {
                        Id = "TRM-003",
                        Tipo = "licencia-const",
                        ClienteId = 2,
                        ProyectoId = "PRY-002",
                        Folio = "QRO/LC/2024-0512",
                        PresupuestoId = "COT-002",
                        AsignadoA = "usr-gestor-1",
                        Prioridad = "media",
                        FechaInicio = hoy,
                        PasoActual = 2,
                        Estatus = "en-proceso",
                        Notas = "Inicia en paralelo al uso de suelo. En espera de resolución favorable para continuar con planos estructurales."
                    },
                    new HojaDeRuta
                    {
                        Id = "TRM-004",
                        Tipo = "proteccion-civil",
                        ClienteId = 3,
                        ProyectoId = "PRY-003",
                        Folio = "QRO/PC/2024-0093",
                        PresupuestoId = "COT-003",
                        AsignadoA = "usr-gestor-2",
                        Prioridad = "alta",
                        FechaInicio = hoy,
                        PasoActual = 7,
                        Estatus = "completado",
                        FechaFinalizacion = DateTime.UtcNow.ToString("o"),
                        Notas = "Plaza Comercial San Juan del Río — Visto Bueno de Protección Civil entregado. Trámite completado."
                    }
                });
                context.SaveChanges();
            }
        }
    }
}

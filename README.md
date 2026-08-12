# Gestoria Industrial Urbana - Sistema de Gestion Interna


## Descripcion General

Gestoria Industrial Urbana (GIU) es un sistema de gestion interna disenado para gestorias y firmas de tramites urbanos e industriales. La plataforma centraliza la administracion de clientes, proyectos, presupuestos, conceptos de tramite y seguimiento operativo en una sola interfaz web. El sistema esta pensado para equipos que gestionan tramites ante dependencias gubernamentales, permisos de construccion, uso de suelo, y procesos similares.

El proyecto es una prueba de concepto (POC) funcional con backend real conectado a base de datos en produccion, autenticacion por usuarios y sesion, y despliegue en la nube.


## Objetivo del Sistema

El sistema busca reemplazar flujos de trabajo basados en hojas de calculo y documentos aislados, ofreciendo a los gestores y responsables una herramienta centralizada donde puedan:

- Registrar y dar seguimiento a clientes con todos sus datos fiscales y comerciales.
- Crear y gestionar proyectos vinculados a clientes con campos especificos del ramo (uso de suelo, vialidad, zona primaria, alcance).
- Elaborar presupuestos detallados con conceptos de tramite, cantidades, precios unitarios y totales.
- Administrar conceptos de tramite reutilizables que se aplican en los presupuestos.
- Registrar tareas diarias del equipo y hacer seguimiento por proyecto.
- Generar hojas de ruta por proyecto para documentar el avance de cada tramite.
- Controlar el acceso al sistema mediante roles de usuario.


## Tecnologias Utilizadas

### Frontend

- React 18 con Vite como bundler y servidor de desarrollo.
- JavaScript (JSX) sin TypeScript.
- CSS puro (Vanilla CSS) con variables personalizadas para todo el sistema de diseno: colores, sombras, radios de borde, tipografia y espaciados.
- La tipografia principal es Inter, cargada desde Google Fonts.
- Hooks personalizados para cada modulo de datos (useClientes, useProyectos, usePresupuestos, useCatalogo, etc.).
- Patron de capas: components para vistas, hooks para estado y logica de negocio, services para llamadas HTTP, mappers para normalizar datos entre backend y frontend, useCases para casos de uso complejos.
- Sin librerias de componentes externas. Todo el sistema de UI (modales, formularios, sidebars, tarjetas, tablas, dropdowns) esta construido con HTML y CSS propios.
- La comunicacion con el backend se hace mediante fetch nativo de JavaScript apuntando a la URL base configurada en src/config/api.js.
- La URL de produccion del backend es https://gestoria-backend.onrender.com.

### Backend

- ASP.NET Core 8 (net8.0), el framework web de Microsoft basado en .NET 8.
- C# como lenguaje del servidor.
- Entity Framework Core 8 con el proveedor Npgsql para PostgreSQL.
- Patron de repositorio (Repository Pattern) con inyeccion de dependencias mediante la interfaz de servicios de ASP.NET Core.
- Capa de servicios (Services) que encapsula la logica de negocio por modulo.
- DTOs (Data Transfer Objects) para separar el modelo de base de datos de lo que se expone en la API.
- BCrypt.Net-Next para el hash seguro de contrasenas.
- CORS configurado con politica abierta (AllowAll) para facilitar el consumo desde el frontend en distintos entornos.
- El esquema de base de datos se actualiza automaticamente en el arranque mediante sentencias SQL en raw a traves de ExecuteSqlRawAsync, sin usar migraciones formales de EF Core.
- Datos iniciales (seed) se siembran al arrancar si la base de datos esta vacia.

### Base de Datos

- PostgreSQL alojado en Render como servicio gestionado.
- Nombre de la base de datos: gestioria_db.
- Las tablas principales son: Usuarios, Roles, Clientes, Proyectos, Presupuestos, TareasDiarias, HojasDeRuta, Conceptos.

### Infraestructura y Despliegue

- El backend se despliega en Render como un servicio web de tipo Docker.
- El Dockerfile realiza una compilacion en dos etapas: primero compila y publica con la imagen del SDK de .NET 8, luego genera la imagen final con la imagen de runtime de ASP.NET 8. El servidor escucha en el puerto 10000, que es el requerido por Render.
- El frontend se sirve de forma estatica. El build de produccion se genera con npm run build (Vite) y se despliega en Render como un sitio estatico.
- La rama de produccion en GitHub es produccion, que tambien esta sincronizada con main.
- Las variables de entorno de conexion a la base de datos se configuran directamente en el panel de Render mediante la variable DATABASE_URL.


## Estructura del Repositorio

`
gestoria-poc/
  backend/
    Controllers/       Controladores REST por modulo (Clientes, Proyectos, Presupuestos, Conceptos, Tareas, HojasDeRuta, Roles, Auth)
    Data/              DbContext y configuracion de EF Core, SeedData
    DTOs/              Objetos de transferencia de datos
    Repositories/      Interfaces e implementaciones del repositorio
    Services/          Logica de negocio por dominio
    Program.cs         Configuracion de la aplicacion, inyeccion de dependencias, schema updates al arranque
    backend.csproj     Definicion del proyecto .NET

  frontend/
    src/
      components/      Vistas principales por modulo
      hooks/           Hooks de React para estado y operaciones por modulo
      services/        Funciones de llamada HTTP a la API
      mappers/         Transformacion de datos entre el formato del backend y el frontend
      useCases/        Casos de uso complejos que orquestan multiples servicios
      config/          Configuracion global (URL base de la API)
      data/            Datos estaticos o mock usados en el frontend
      core/            Utilidades compartidas, sistema de iconos
      utils/           Funciones utilitarias generales
      index.css        Sistema de diseno completo en CSS puro
      App.jsx          Punto de entrada de la aplicacion, enrutamiento por hash
      main.jsx         Inicializacion de React

  Dockerfile           Definicion del contenedor Docker para el backend
  README.md            Este archivo
`


## Modulos del Sistema

### Clientes

Gestion completa del catalogo de clientes. Cada cliente tiene: nombre o razon social, nombre comercial, tipo de persona (fisica o moral), RFC, correo electronico, telefono, direccion fiscal, ciudad, apoderado o representante legal, nombre del contacto, responsable dentro de la gestoria y estatus del cliente. Se pueden crear, editar y eliminar clientes, y cada cliente puede estar relacionado con uno o mas proyectos. El modulo incluye vista de tarjetas en cuadricula con panel de detalle lateral, filtros por estatus, busqueda en tiempo real y seleccion multiple para cambios masivos de estatus.

### Proyectos

Gestion de proyectos vinculados a clientes. Los proyectos contienen datos tecnicos del ramo: uso principal y usos complementarios, zona primaria, impacto, direccion principal y direcciones complementarias, vialidad principal y complementaria, area y zona de compatibilidad, alcance, descripcion, responsable y estimacion economica. El modulo tiene vistas de tarjetas, lista y tabla, con panel de detalle lateral y soporte para multiples presupuestos y tareas asociadas.

### Presupuestos

Elaboracion y gestion de presupuestos por proyecto. Cada presupuesto tiene un nombre, numero de expediente, fecha, cliente, proyecto relacionado, y una tabla de partidas donde cada partida contiene: cantidad, unidad, descripcion (concepto de tramite), precio unitario y total calculado. El sistema calcula subtotal, IVA y total automaticamente. Los presupuestos pueden tener distintos estatus (borrador, enviado, aprobado, rechazado). El modulo incluye una vista de edicion completa del presupuesto con selector de conceptos desde el catalogo.

### Conceptos

Catalogo de conceptos de tramite reutilizables. Cada concepto tiene clave, descripcion, unidad de medida y precio unitario. Los conceptos se usan directamente al construir partidas en los presupuestos. El modulo permite crear, editar y eliminar conceptos.

### Administracion

Panel administrativo que concentra la gestion de usuarios y roles. Permite crear usuarios con nombre, contrasena y rol asignado. Los roles definen los niveles de acceso dentro del sistema.

### Tareas Diarias

Registro de las tareas del equipo de trabajo. Cada tarea tiene una descripcion, fecha, responsable y puede estar asociada a un proyecto. Permite hacer seguimiento del trabajo diario del equipo.

### Hojas de Ruta

Documentacion del avance de los tramites por proyecto. Las hojas de ruta permiten registrar hitos, fechas y estados de cada etapa del proceso de tramite para cada proyecto.

### Dashboard

Pantalla de inicio del sistema con un resumen visual del estado general: conteo de clientes activos, proyectos en proceso, presupuestos pendientes y tareas del dia.

### Login y Autenticacion

Pantalla de inicio de sesion con validacion de credenciales contra la base de datos. Las contrasenas se almacenan con hash BCrypt. El sistema mantiene la sesion en memoria durante la sesion del navegador.


## Como Ejecutar Localmente

### Requisitos

- Node.js 18 o superior con npm.
- .NET SDK 8.
- Acceso a la base de datos PostgreSQL en Render.

### Backend

Desde la raiz del repositorio:

    dotnet run --project backend/backend.csproj

El servidor arranca en http://localhost:5158.

### Frontend

Desde la carpeta frontend:

    npm install
    npm run dev

La aplicacion queda disponible en http://localhost:5173.

Para apuntar el frontend al backend local, cambiar la URL en frontend/src/config/api.js a http://localhost:5158. Para produccion debe apuntar a https://gestoria-backend.onrender.com.


## Despliegue en Produccion

El backend esta desplegado en Render como un Web Service de tipo Docker. Render construye la imagen usando el Dockerfile en la raiz del repositorio y la expone en el puerto 10000.

La variable de entorno DATABASE_URL se configura en el panel de Render y contiene la cadena de conexion completa a PostgreSQL. El Program.cs la lee y la usa para configurar el DbContext.

El frontend compilado se despliega en Render como Static Site. El directorio de publicacion es frontend/dist.

Los cambios se despliegan automaticamente al hacer push a la rama produccion o main en GitHub.

# GestorCons — PoC de Gestoría de Trámites de Construcción

Sistema de prueba de concepto para gestión de trámites, cotizaciones y tareas de una gestoría de construcción. Construido con React + Vite.

## 🚀 Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar servidor de desarrollo
npm run dev
```

Abre **http://localhost:5173** en tu navegador.

---

## 📦 Estructura del proyecto

```
gestoria-poc/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx       ← Punto de entrada React
    ├── App.jsx        ← Toda la lógica y pantallas (componente único modular)
    └── index.css      ← Sistema de diseño / estilos globales
```

---

## 🗂️ Módulos incluidos

### Módulo 1 — Administración y Presupuestos

| Sección | Descripción |
|---|---|
| **Dashboard** | Vista ejecutiva con métricas financieras y estado de trámites |
| **Catálogo** | 15 conceptos con clave, descripción y precio unitario. Búsqueda en tiempo real. |
| **Cotizaciones** | Creador de cotizaciones: selecciona cliente, busca conceptos por clave, calcula total automáticamente. |
| **Presupuestos** | Estatus financiero: Total, Abonado, Saldo Pendiente por cotización. Registro de abonos. |

### Módulo 2 — Gestión de Trámites y Tareas

| Sección | Descripción |
|---|---|
| **Hojas de Ruta** | 5 tipos de trámite, cada uno con pasos predefinidos. Avance interactivo paso a paso. |
| **Tareas Diarias** | Tablero tipo Kanban: "Para Hoy", "Ya se Hizo", "Falta por Hacer". Filtro por miembro del equipo. |

---

## 👥 Datos mockeados incluidos

- **5 clientes** (empresas y personas físicas de Querétaro)
- **15 conceptos** en catálogo de trámites
- **5 cotizaciones** con distintos estados (pendiente, parcial, liquidada)
- **5 trámites activos** con avance en distintas etapas
- **8 tareas** distribuidas entre 3 miembros del equipo
- **5 tipos de trámite** con hojas de ruta completas

---

## 🔧 Tecnologías

- **React 18** — UI
- **Vite 5** — Build tool / dev server
- **CSS personalizado** — Sin dependencias de UI (sin Tailwind), diseño propio con variables CSS
- **DM Sans + DM Mono** — Tipografía vía Google Fonts

> Sin base de datos. Todo el estado vive en memoria (React useState). Para persistencia, integra con cualquier API REST.

import { useState, useEffect, Fragment } from 'react'
import logoImg from './logo.png'


// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const CATALOGO_CONCEPTOS = [
  { clave: 'LIC-RES-01', descripcion: 'Trámite de Licencia de Construcción Residencial < 200m²', precio: 8500 },
  { clave: 'LIC-RES-02', descripcion: 'Trámite de Licencia de Construcción Residencial 200–500m²', precio: 14000 },
  { clave: 'LIC-COM-01', descripcion: 'Licencia de Construcción Comercial Local < 100m²', precio: 11500 },
  { clave: 'LIC-COM-02', descripcion: 'Licencia de Construcción Comercial 100–300m²', precio: 19800 },
  { clave: 'USO-SUE-01', descripcion: 'Licencia de Uso de Suelo Habitacional', precio: 4200 },
  { clave: 'USO-SUE-02', descripcion: 'Licencia de Uso de Suelo Comercial / Mixto', precio: 6800 },
  { clave: 'AMP-01', descripcion: 'Trámite de Ampliación de Construcción Existente', precio: 5500 },
  { clave: 'DIV-01', descripcion: 'Trámite de División y/o Fusión de Predios', precio: 9200 },
  { clave: 'DICT-01', descripcion: 'Dictamen de Uso de Suelo Express', precio: 3100 },
  { clave: 'DICT-02', descripcion: 'Dictamen de Factibilidad de Servicios (Agua/Drenaje)', precio: 2800 },
  { clave: 'REG-01', descripcion: 'Registro de Obra ante IMSS', precio: 1900 },
  { clave: 'ALIN-01', descripcion: 'Alineamiento y Número Oficial', precio: 1600 },
  { clave: 'CONN-01', descripcion: 'Trámite de Conexión a Red de Agua Potable', precio: 3800 },
  { clave: 'PROT-01', descripcion: 'Visto Bueno de Protección Civil (local)', precio: 4500 },
  { clave: 'TERM-01', descripcion: 'Aviso de Terminación de Obra y Ocupación', precio: 2200 },
]

const CLIENTES = [
  { id: 1, nombre: 'Constructora Horizonte S.A. de C.V.', contacto: 'Ing. Marco Salinas', email: 'msalinas@horizonte.mx', tel: '442-310-8821', tipo: 'empresa', rfc: 'CHO850312AB3', ciudad: 'Querétaro, Qro.' },
  { id: 2, nombre: 'Arq. Patricia Noriega Vda.', contacto: 'Arq. Patricia Noriega', email: 'pnoriega@gmail.com', tel: '442-198-4403', tipo: 'persona', rfc: 'NOPV710905KL7', ciudad: 'Juriquilla, Qro.' },
  { id: 3, nombre: 'Inmobiliaria del Centro SA', contacto: 'Lic. Roberto Fuentes', email: 'rfuentes@inmocentro.com.mx', tel: '442-501-2290', tipo: 'empresa', rfc: 'ICS920801TT2', ciudad: 'Centro Histórico, Qro.' },
  { id: 4, nombre: 'Desarrollos Cumbres del Valle', contacto: 'Ing. Sofía Mendoza', email: 'sofia.mendoza@cumbres.mx', tel: '442-877-3312', tipo: 'empresa', rfc: 'DCV040118PQ9', ciudad: 'El Marqués, Qro.' },
  { id: 5, nombre: 'Proyectos Querétaro 2000', contacto: 'Arq. Diego Landa', email: 'dlanda@pq2000.mx', tel: '442-663-7745', tipo: 'empresa', rfc: 'PQD001220XY1', ciudad: 'Corregidora, Qro.' },
  { id: 6, nombre: 'Familia Reséndiz Ochoa', contacto: 'Sr. Ernesto Reséndiz', email: 'eresendiz@hotmail.com', tel: '442-114-9930', tipo: 'persona', rfc: 'REOE780623BN4', ciudad: 'Av. Constituyentes, Qro.' },
  { id: 7, nombre: 'Comercial El Nogal S.C.', contacto: 'Ing. Valeria Garza', email: 'vgarza@elnogal.com.mx', tel: '442-320-0017', tipo: 'empresa', rfc: 'CNO110907RV6', ciudad: 'San Juan del Río, Qro.' },
  { id: 8, nombre: 'Lic. Fernando Bustamante Pérez', contacto: 'Lic. Fernando Bustamante', email: 'fbustamante@fbplaw.mx', tel: '442-745-8823', tipo: 'persona', rfc: 'BUPF830410GH2', ciudad: 'Lomas de Juriquilla, Qro.' },
  { id: 9, nombre: 'Grupo Inmobiliario Pedregal SA de CV', contacto: 'Arq. Claudia Trujillo', email: 'ctrujillo@gipedregal.mx', tel: '442-289-6614', tipo: 'empresa', rfc: 'GIP150302WZ5', ciudad: 'Pedregal de Schoenstatt, Qro.' },
]

const TRAMITES_TIPOS = {
  'uso-suelo': {
    nombre: 'Licencia de Uso de Suelo',
    icono: '🗺️',
    color: 'blue',
    pasos: [
      'Solicitar planos actualizados al cliente',
      'Verificar zonificación en Plan Municipal de Desarrollo',
      'Recolectar escrituras notariales del predio',
      'Tramitar alineamiento y número oficial',
      'Pago de derechos en Tesorería Municipal',
      'Ingreso de expediente en ventanilla única',
      'Seguimiento y respuesta de resolución',
      'Entrega de licencia al cliente',
    ],
  },
  'licencia-const': {
    nombre: 'Licencia de Construcción',
    icono: '🏗️',
    color: 'amber',
    pasos: [
      'Recibir proyecto ejecutivo completo',
      'Verificar memoria de cálculo estructural',
      'Revisión de planos arquitectónicos (firma DRO)',
      'Obtener dictamen de Uso de Suelo vigente',
      'Dictamen de factibilidad de agua/drenaje',
      'Registro de obra ante IMSS',
      'Pago de derechos municipales de construcción',
      'Ingreso de expediente con todos los requisitos',
      'Atender observaciones del H. Ayuntamiento',
      'Recepción y entrega de licencia al cliente',
    ],
  },
  'ampliacion': {
    nombre: 'Ampliación de Construcción',
    icono: '📐',
    color: 'purple',
    pasos: [
      'Levantar planos del estado actual del inmueble',
      'Elaborar planos de la ampliación propuesta',
      'Revisar que no invada restricciones de predial',
      'Obtener visto bueno del DRO',
      'Pago de derechos por metros ampliados',
      'Ingreso de expediente a Obras Públicas',
      'Seguimiento en ventanilla',
      'Aviso de terminación de obra',
    ],
  },
  'division': {
    nombre: 'División de Predio',
    icono: '✂️',
    color: 'green',
    pasos: [
      'Verificar superficie mínima divisible según reglamento',
      'Solicitar levantamiento topográfico actualizado',
      'Elaborar plano de subdivisión con cotas y rumbos',
      'Gestionar dictamen favorable de Uso de Suelo',
      'Pago de impuesto predial al corriente',
      'Ingreso de solicitud ante Catastro Municipal',
      'Atender observaciones (si las hay)',
      'Inscripción en Registro Público de la Propiedad',
    ],
  },
  'proteccion-civil': {
    nombre: 'Visto Bueno de Protección Civil',
    icono: '🛡️',
    color: 'red',
    pasos: [
      'Elaborar Programa Interno de Protección Civil',
      'Recolectar planos de instalaciones y rutas de evacuación',
      'Verificar señalética y equipo contra incendio',
      'Agendar visita de inspección con Protección Civil',
      'Atender observaciones de la inspección',
      'Pago de derechos',
      'Entrega de Visto Bueno',
    ],
  },
}

const EQUIPO = [
  { id: 'u1', nombre: 'Carlos R.', avatar: 'CR', color: '#2A5F3F' },
  { id: 'u2', nombre: 'Laura M.', avatar: 'LM', color: '#1A5276' },
  { id: 'u3', nombre: 'Tomás V.', avatar: 'TV', color: '#5B2C6F' },
]

const hoy = new Date()
const fmt = (d) => d.toISOString().split('T')[0]
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

const TRAMITES_MOCK = [
  // ── Cliente 1: Constructora Horizonte — Licencia Construcción (en proceso, paso 6/10)
  {
    id: 'TRM-001', tipo: 'licencia-const', clienteId: 1,
    folio: 'QRO/LC/2024-0489', presupuestoId: 'COT-001', asignadoA: 'u1',
    prioridad: 'alta', fechaInicio: fmt(addDays(hoy, -18)), pasoActual: 6,
    notas: 'Proyecto en Col. Álamos — 3 plantas, 320m²',
  },
  // ── Cliente 2: Patricia Noriega — Uso de Suelo (inicio, paso 3/8)
  {
    id: 'TRM-002', tipo: 'uso-suelo', clienteId: 2,
    folio: 'QRO/US/2024-0302', presupuestoId: 'COT-002', asignadoA: 'u2',
    prioridad: 'media', fechaInicio: fmt(addDays(hoy, -7)), pasoActual: 3,
    notas: 'Predio esquina en Juriquilla',
  },
  // ── Cliente 3: Inmobiliaria del Centro — División de Predio (casi terminado, paso 7/8)
  {
    id: 'TRM-003', tipo: 'division', clienteId: 3,
    folio: 'QRO/DP/2024-0178', presupuestoId: 'COT-003', asignadoA: 'u3',
    prioridad: 'alta', fechaInicio: fmt(addDays(hoy, -28)), pasoActual: 7,
    notas: 'División en 3 fracciones — Col. Centro',
  },
  // ── Cliente 4: Cumbres del Valle — Ampliación (recién iniciado, paso 2/8)
  {
    id: 'TRM-004', tipo: 'ampliacion', clienteId: 4,
    folio: 'QRO/AM/2024-0411', presupuestoId: 'COT-004', asignadoA: 'u1',
    prioridad: 'baja', fechaInicio: fmt(addDays(hoy, -5)), pasoActual: 2,
    notas: 'Ampliación segundo piso casa habitación',
  },
  // ── Cliente 5: Proyectos QRO 2000 — Protección Civil (avanzado, paso 5/7)
  {
    id: 'TRM-005', tipo: 'proteccion-civil', clienteId: 5,
    folio: 'QRO/PC/2024-0093', presupuestoId: 'COT-005', asignadoA: 'u2',
    prioridad: 'media', fechaInicio: fmt(addDays(hoy, -12)), pasoActual: 5,
    notas: 'Local comercial 180m² en Plaza Antea',
  },
  // ── Cliente 6: Familia Reséndiz — Uso de Suelo COMPLETADO (paso 8/8)
  {
    id: 'TRM-006', tipo: 'uso-suelo', clienteId: 6,
    folio: 'QRO/US/2024-0211', presupuestoId: 'COT-006', asignadoA: 'u2',
    prioridad: 'baja', fechaInicio: fmt(addDays(hoy, -45)), pasoActual: 8,
    notas: 'Licencia de uso de suelo habitacional entregada al cliente',
  },
  // ── Cliente 6: Familia Reséndiz — Licencia Construcción (ahora sigue con la licencia, inicio)
  {
    id: 'TRM-007', tipo: 'licencia-const', clienteId: 6,
    folio: 'QRO/LC/2024-0512', presupuestoId: 'COT-007', asignadoA: 'u1',
    prioridad: 'alta', fechaInicio: fmt(addDays(hoy, -3)), pasoActual: 1,
    notas: 'Casa habitación 180m² — inicia trámite con uso de suelo ya aprobado',
  },
  // ── Cliente 7: Comercial El Nogal — Licencia Comercial (a mitad, paso 5/10) + Prot Civil
  {
    id: 'TRM-008', tipo: 'licencia-const', clienteId: 7,
    folio: 'QRO/LC/2024-0398', presupuestoId: 'COT-008', asignadoA: 'u3',
    prioridad: 'alta', fechaInicio: fmt(addDays(hoy, -22)), pasoActual: 5,
    notas: 'Local 240m² en San Juan del Río — zona comercial consolidada',
  },
  {
    id: 'TRM-009', tipo: 'proteccion-civil', clienteId: 7,
    folio: 'QRO/PC/2024-0101', presupuestoId: 'COT-008', asignadoA: 'u2',
    prioridad: 'media', fechaInicio: fmt(addDays(hoy, -10)), pasoActual: 2,
    notas: 'Paralelo a licencia — Protección Civil local comercial',
  },
  // ── Cliente 8: Fernando Bustamante — División de Predio COMPLETADA (8/8) + pendiente Reg. Público
  {
    id: 'TRM-010', tipo: 'division', clienteId: 8,
    folio: 'QRO/DP/2024-0099', presupuestoId: 'COT-009', asignadoA: 'u3',
    prioridad: 'baja', fechaInicio: fmt(addDays(hoy, -60)), pasoActual: 8,
    notas: 'División en 2 lotes — ya inscrita en Registro Público',
  },
  // ── Cliente 9: Grupo Pedregal — Uso de Suelo Comercial (en observaciones, paso 6/8)
  {
    id: 'TRM-011', tipo: 'uso-suelo', clienteId: 9,
    folio: 'QRO/US/2024-0358', presupuestoId: 'COT-010', asignadoA: 'u1',
    prioridad: 'alta', fechaInicio: fmt(addDays(hoy, -14)), pasoActual: 6,
    notas: 'Uso de suelo mixto — complejo de 12 departamentos + locales',
  },
  // ── Cliente 9: Grupo Pedregal — Ampliación pendiente de autorización de uso de suelo
  {
    id: 'TRM-012', tipo: 'ampliacion', clienteId: 9,
    folio: 'QRO/AM/2024-0430', presupuestoId: 'COT-010', asignadoA: 'u3',
    prioridad: 'media', fechaInicio: fmt(addDays(hoy, -2)), pasoActual: 0,
    notas: 'En espera de resolución de uso de suelo para iniciar ampliación',
  },
]

const initialCotizaciones = [
  // ── COT-001: Horizonte (LIC-RES-02 + servicios) — parcialmente pagada
  {
    id: 'COT-001', clienteId: 1, fecha: fmt(addDays(hoy, -20)),
    conceptos: [
      { clave: 'LIC-RES-02', cantidad: 1 },
      { clave: 'DICT-02', cantidad: 1 },
      { clave: 'REG-01', cantidad: 1 },
      { clave: 'ALIN-01', cantidad: 1 },
    ],
    abonos: [14000, 5500], estatus: 'en-proceso',
  },
  // ── COT-002: Patricia Noriega — uso suelo, un pago inicial
  {
    id: 'COT-002', clienteId: 2, fecha: fmt(addDays(hoy, -9)),
    conceptos: [
      { clave: 'USO-SUE-01', cantidad: 1 },
      { clave: 'DICT-01', cantidad: 1 },
      { clave: 'ALIN-01', cantidad: 1 },
    ],
    abonos: [4200], estatus: 'en-proceso',
  },
  // ── COT-003: Inmobiliaria Centro — división, completamente liquidada
  {
    id: 'COT-003', clienteId: 3, fecha: fmt(addDays(hoy, -30)),
    conceptos: [
      { clave: 'DIV-01', cantidad: 1 },
      { clave: 'USO-SUE-02', cantidad: 1 },
    ],
    abonos: [9200, 6800], estatus: 'liquidada',
  },
  // ── COT-004: Cumbres — ampliación, sin abonos aún
  {
    id: 'COT-004', clienteId: 4, fecha: fmt(addDays(hoy, -6)),
    conceptos: [
      { clave: 'AMP-01', cantidad: 1 },
      { clave: 'DICT-02', cantidad: 1 },
    ],
    abonos: [], estatus: 'pendiente',
  },
  // ── COT-005: Proyectos QRO — protección civil, parcial
  {
    id: 'COT-005', clienteId: 5, fecha: fmt(addDays(hoy, -14)),
    conceptos: [
      { clave: 'PROT-01', cantidad: 1 },
      { clave: 'LIC-COM-01', cantidad: 1 },
    ],
    abonos: [4500], estatus: 'en-proceso',
  },
  // ── COT-006: Reséndiz — uso de suelo (ya terminado y liquidado)
  {
    id: 'COT-006', clienteId: 6, fecha: fmt(addDays(hoy, -50)),
    conceptos: [
      { clave: 'USO-SUE-01', cantidad: 1 },
      { clave: 'ALIN-01', cantidad: 1 },
      { clave: 'DICT-01', cantidad: 1 },
    ],
    abonos: [4200, 4700], estatus: 'liquidada',
  },
  // ── COT-007: Reséndiz — ahora licencia de construcción, primer anticipo
  {
    id: 'COT-007', clienteId: 6, fecha: fmt(addDays(hoy, -3)),
    conceptos: [
      { clave: 'LIC-RES-01', cantidad: 1 },
      { clave: 'DICT-02', cantidad: 1 },
      { clave: 'REG-01', cantidad: 1 },
    ],
    abonos: [5000], estatus: 'en-proceso',
  },
  // ── COT-008: Comercial El Nogal — licencia comercial + protección civil, anticipo fuerte
  {
    id: 'COT-008', clienteId: 7, fecha: fmt(addDays(hoy, -25)),
    conceptos: [
      { clave: 'LIC-COM-02', cantidad: 1 },
      { clave: 'PROT-01', cantidad: 1 },
      { clave: 'CONN-01', cantidad: 1 },
      { clave: 'REG-01', cantidad: 1 },
    ],
    abonos: [15000, 8000], estatus: 'en-proceso',
  },
  // ── COT-009: Bustamante — división ya liquidada y concluida
  {
    id: 'COT-009', clienteId: 8, fecha: fmt(addDays(hoy, -65)),
    conceptos: [
      { clave: 'DIV-01', cantidad: 1 },
      { clave: 'DICT-01', cantidad: 1 },
    ],
    abonos: [6150, 6150], estatus: 'liquidada',
  },
  // ── COT-010: Grupo Pedregal — uso de suelo + ampliación, gran proyecto sin liquidar
  {
    id: 'COT-010', clienteId: 9, fecha: fmt(addDays(hoy, -16)),
    conceptos: [
      { clave: 'USO-SUE-02', cantidad: 1 },
      { clave: 'AMP-01', cantidad: 1 },
      { clave: 'DICT-02', cantidad: 1 },
      { clave: 'LIC-COM-02', cantidad: 1 },
    ],
    abonos: [12000], estatus: 'en-proceso',
  },
]
const TAREAS_MOCK = [
  { id: 't1', titulo: 'Entregar planos firmados al H. Ayuntamiento', tramiteId: 'TRM-001', asignadoA: 'u1', fecha: fmt(hoy), prioridad: 'alta', hecho: false },
  { id: 't2', titulo: 'Pago de derechos en Tesorería Municipal — TRM-002', tramiteId: 'TRM-002', asignadoA: 'u2', fecha: fmt(hoy), prioridad: 'media', hecho: false },
  { id: 't3', titulo: 'Llamar a Catastro por resolución pendiente TRM-003', tramiteId: 'TRM-003', asignadoA: 'u3', fecha: fmt(hoy), prioridad: 'alta', hecho: true },
  { id: 't4', titulo: 'Recolectar escrituras actualizadas — cliente Noriega', tramiteId: 'TRM-002', asignadoA: 'u2', fecha: fmt(addDays(hoy, -1)), prioridad: 'alta', hecho: false },
  { id: 't5', titulo: 'Enviar presupuesto COT-004 al cliente para revisión', tramiteId: 'TRM-004', asignadoA: 'u1', fecha: fmt(hoy), prioridad: 'baja', hecho: false },
  { id: 't6', titulo: 'Verificar observaciones de Protección Civil — TRM-005', tramiteId: 'TRM-005', asignadoA: 'u2', fecha: fmt(hoy), prioridad: 'media', hecho: true },
  { id: 't7', titulo: 'Registrar avance en expediente TRM-001', tramiteId: 'TRM-001', asignadoA: 'u1', fecha: fmt(addDays(hoy, -2)), prioridad: 'baja', hecho: true },
  { id: 't8', titulo: 'Solicitar planos de instalaciones — TRM-005', tramiteId: 'TRM-005', asignadoA: 'u3', fecha: fmt(addDays(hoy, -3)), prioridad: 'alta', hecho: false },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const money = (n) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 })
let currentClientes = CLIENTES
const getCliente = (id) => currentClientes.find(c => c.id === id)
let currentConceptos = CATALOGO_CONCEPTOS
const getConcepto = (clave) => currentConceptos.find(c => c.clave === clave)
const cotTotal = (cot) => cot.conceptos.reduce((s, c) => {
  const con = getConcepto(c.clave)
  return s + (con ? con.precio * c.cantidad : 0)
}, 0)
const cotAbonado = (cot) => cot.abonos.reduce((s, a) => s + a, 0)
const cotSaldo = (cot) => cotTotal(cot) - cotAbonado(cot)

const COLOR_MAP = { blue: '#1A5276', amber: '#B87A0A', purple: '#5B2C6F', green: '#2A5F3F', red: '#C0392B' }
const BG_MAP = { blue: '#EAF2F8', amber: '#FEF3DC', purple: '#F5EEF8', green: '#EBF3EE', red: '#FDEDEB' }

// ─── ICONS (inline SVG, minimal) ─────────────────────────────────────────────
const Icon = ({ name, size = 16, style = {} }) => {
  const paths = {
    home: <><rect x="3" y="9" width="18" height="12" rx="1" /><path d="M3 9L12 3l9 6" /></>,
    folder: <><path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" /></>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8L14 2z" /><path d="M14 2v6h6" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    check: <><polyline points="20 6 9 17 4 12" /></>,
    search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" /></>,
    list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></>,
    task: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    chevdown: <><polyline points="6 9 12 15 18 9" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    receipt: <><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="14" y2="16" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      {paths[name]}
    </svg>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const navItems = [
  { id: 'presupuestos', label: 'Presupuestos', icon: 'dollar' },
  { id: 'administracion', label: 'Administración', icon: 'user' },
  { id: 'tareas', label: 'Tareas Diarias', icon: 'task' },
  { id: 'catalogo', label: 'Catálogo', icon: 'file' },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: 'receipt' },
]

function Sidebar({ active, setActive }) {
  const handleSectionClick = (e, targetTab) => {
    e.stopPropagation()
    setActive(targetTab)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => setActive('home')} style={{ cursor: 'pointer' }}>
        <div className="wordmark">GIU</div>
        <div className="tagline">Gestoría de Construcción</div>
      </div>
      <div className="sidebar-section-label">Módulos</div>
      {navItems.map(n => (
        <div key={n.id} className={`nav-item ${active === n.id ? 'active' : ''}`} onClick={() => setActive(n.id)}>
          <Icon name={n.icon} size={15} />
          <span>{n.label}</span>

          <div className="hover-card" onClick={(e) => e.stopPropagation()}>
            <div className="hover-card-header">Accesos Rápidos</div>
            <div className="hover-card-sections">
              <div className="hover-section" onClick={(e) => handleSectionClick(e, 'catalogo')}>
                <div className="hover-section-icon" style={{ color: 'var(--accent)' }}>
                  <Icon name="list" size={13} />
                </div>
                <div className="hover-section-content">
                  <div className="hover-section-title">Conceptos</div>
                  <div className="hover-section-desc">Precios y claves</div>
                </div>
              </div>
              <div className="hover-section" onClick={(e) => handleSectionClick(e, 'administracion')}>
                <div className="hover-section-icon" style={{ color: 'var(--blue)' }}>
                  <Icon name="user" size={13} />
                </div>
                <div className="hover-section-content">
                  <div className="hover-section-title">Clientes</div>
                  <div className="hover-section-desc">Directorio de contactos</div>
                </div>
              </div>
              <div className="hover-section" onClick={(e) => handleSectionClick(e, 'tramites')}>
                <div className="hover-section-icon" style={{ color: 'var(--amber)' }}>
                  <Icon name="map" size={13} />
                </div>
                <div className="hover-section-content">
                  <div className="hover-section-title">Proyectos</div>
                  <div className="hover-section-desc">Hojas de ruta y avance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="sidebar-footer">PoC v1.0 · Querétaro, MX</div>
    </aside>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ cotizaciones, tareas, setActive }) {
  const totalCotizado = cotizaciones.reduce((s, c) => s + cotTotal(c), 0)
  const totalAbonado = cotizaciones.reduce((s, c) => s + cotAbonado(c), 0)
  const pendienteCobro = cotizaciones.reduce((s, c) => s + Math.max(0, cotSaldo(c)), 0)
  const tareasHoy = tareas.filter(t => t.fecha === fmt(hoy) && !t.hecho).length
  const tramitesActivos = TRAMITES_MOCK.length

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Dashboard General</div>
        <div className="page-subtitle">Vista ejecutiva · {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="metric-card">
          <div className="metric-label">Total Cotizado</div>
          <div className="metric-value" style={{ color: 'var(--text)' }}>{money(totalCotizado)}</div>
          <div className="metric-sub">{cotizaciones.length} cotizaciones</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Abonado</div>
          <div className="metric-value text-green">{money(totalAbonado)}</div>
          <div className="metric-sub">{Math.round(totalAbonado / totalCotizado * 100)}% del total</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Saldo Pendiente</div>
          <div className="metric-value text-amber">{money(pendienteCobro)}</div>
          <div className="metric-sub">por recuperar</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Trámites Activos</div>
          <div className="metric-value" style={{ color: 'var(--blue)' }}>{tramitesActivos}</div>
          <div className="metric-sub">{tareasHoy} tareas hoy</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">Cotizaciones Recientes</div>
          {cotizaciones.slice(0, 5).map(c => {
            const cli = getCliente(c.clienteId)
            const saldo = cotSaldo(c)
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.id}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{cli?.nombre}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{money(cotTotal(c))}</div>
                  <span className={`badge ${saldo <= 0 ? 'badge-green' : saldo < cotTotal(c) ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: 10 }}>
                    {saldo <= 0 ? 'Liquidada' : saldo < cotTotal(c) ? 'Parcial' : 'Sin abono'}
                  </span>
                </div>
              </div>
            )
          })}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setActive('cotizaciones')}>
            Ver todas →
          </button>
        </div>

        <div className="card">
          <div className="card-title">Trámites en Curso</div>
          {TRAMITES_MOCK.map(t => {
            const tipo = TRAMITES_TIPOS[t.tipo]
            const total = tipo.pasos.length
            const pct = Math.round((t.pasoActual / total) * 100)
            const col = COLOR_MAP[tipo.color]
            return (
              <div key={t.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{t.id}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>{tipo.nombre}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.pasoActual}/{total} pasos</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: col }} />
                </div>
              </div>
            )
          })}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => setActive('tramites')}>
            Ver hojas de ruta →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────────
function Catalogo({ conceptos, setConceptos }) {
  const [q, setQ] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [nuevaClave, setNuevaClave] = useState('')
  const [nuevaDesc, setNuevaDesc] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const list = conceptos || CATALOGO_CONCEPTOS

  const filtered = list.filter(c =>
    c.clave.toLowerCase().includes(q.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(q.toLowerCase())
  )

  const handleAdd = () => {
    if (!nuevaClave || !nuevaDesc || !nuevoPrecio) {
      setErrorMsg('Por favor completa todos los campos.')
      return
    }

    const key = nuevaClave.trim().toUpperCase()
    if (list.some(c => c.clave === key)) {
      setErrorMsg(`La clave "${key}" ya existe en el catálogo.`)
      return
    }

    const nuevo = {
      clave: key,
      descripcion: nuevaDesc.trim(),
      precio: parseFloat(nuevoPrecio) || 0
    }

    if (setConceptos) {
      setConceptos(prev => [...prev, nuevo])
    } else {
      CATALOGO_CONCEPTOS.push(nuevo)
    }

    setShowAddModal(false)
    setNuevaClave('')
    setNuevaDesc('')
    setNuevoPrecio('')
    setErrorMsg('')
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Catálogo de Conceptos</div>
          <div className="page-subtitle">{list.length} conceptos disponibles para presupuestos</div>
        </div>
        {setConceptos && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" size={14} /> Nuevo Concepto
          </button>
        )}
      </div>

      <div className="card">
        <div className="search-wrap mb-4" style={{ maxWidth: 380 }}>
          <Icon name="search" size={14} />
          <input className="form-control search-input" placeholder="Buscar por clave o descripción…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Clave</th>
                <th>Descripción del Trámite / Servicio</th>
                <th style={{ textAlign: 'right' }}>Precio Unitario</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.clave}>
                  <td><span className="mono" style={{ background: 'var(--surface2)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>{c.clave}</span></td>
                  <td style={{ color: 'var(--text)' }}>{c.descripcion}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'DM Mono' }}>{money(c.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal">
            <div className="modal-title">Agregar Nuevo Concepto</div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-light)', color: 'var(--red-text)', border: '1px solid rgba(192,57,43,0.2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 16 }}>
                <Icon name="alert" size={12} style={{ marginRight: 6 }} />
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Clave del Concepto *</label>
              <input
                className="form-control"
                placeholder="Ej: LIC-RES-03"
                value={nuevaClave}
                style={{ textTransform: 'uppercase', fontFamily: 'DM Mono' }}
                onChange={e => setNuevaClave(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción del Trámite o Servicio *</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Ej: Licencia de Construcción Residencial > 500m² con dictamen DRO"
                value={nuevaDesc}
                onChange={e => setNuevaDesc(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Precio Referencia (MXN) *</label>
              <input
                className="form-control"
                type="number"
                placeholder="0.00"
                value={nuevoPrecio}
                onChange={e => setNuevoPrecio(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={!nuevaClave || !nuevaDesc || !nuevoPrecio}
                style={{ opacity: (!nuevaClave || !nuevaDesc || !nuevoPrecio) ? 0.5 : 1 }}
              >
                <Icon name="check" size={14} /> Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── COTIZACIONES ─────────────────────────────────────────────────────────────
function Cotizaciones({ cotizaciones, setCotizaciones, clientes }) {
  const [vista, setVista] = useState('lista') // 'lista' | 'nueva'
  const [clienteId, setClienteId] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [lineItems, setLineItems] = useState([])
  const [resultados, setResultados] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [guardado, setGuardado] = useState(false)
  const [qList, setQList] = useState('')

  const buscarConcepto = (q) => {
    setBusqueda(q)
    if (q.length < 1) { setResultados([]); return }
    setResultados(currentConceptos.filter(c =>
      c.clave.toLowerCase().includes(q.toLowerCase()) ||
      c.descripcion.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 6))
  }

  const agregarConcepto = (c) => {
    if (lineItems.find(li => li.clave === c.clave)) return
    setLineItems(prev => [...prev, { clave: c.clave, cantidad: 1 }])
    setBusqueda('')
    setResultados([])
  }

  const quitarConcepto = (clave) => setLineItems(prev => prev.filter(li => li.clave !== clave))

  const totalNuevo = lineItems.reduce((s, li) => {
    const c = getConcepto(li.clave)
    return s + (c ? c.precio * li.cantidad : 0)
  }, 0)

  const resetForm = () => {
    setClienteId('')
    setLineItems([])
    setBusqueda('')
    setResultados([])
    setGuardado(false)
  }

  const guardar = () => {
    if (!clienteId || lineItems.length === 0) return
    const nueva = {
      id: `COT-${String(cotizaciones.length + 1).padStart(3, '0')}`,
      clienteId: parseInt(clienteId),
      fecha: fmt(hoy),
      conceptos: lineItems,
      abonos: [],
      estatus: 'pendiente',
    }
    setCotizaciones(prev => [nueva, ...prev])
    setGuardado(nueva.id)
    setTimeout(() => {
      resetForm()
      setVista('lista')
    }, 1800)
  }

  if (vista === 'nueva') {
    const canSave = clienteId && lineItems.length > 0
    return (
      <div>
        <div className="page-header flex items-center justify-between">
          <div>
            <div className="page-title">Nueva Cotización</div>
            <div className="page-subtitle">Selecciona un cliente y agrega los conceptos del servicio</div>
          </div>
          <button className="btn btn-secondary" onClick={() => { resetForm(); setVista('lista') }}>
            ← Volver a la lista
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
          {/* Columna izquierda: formulario */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">1. Datos del cliente</div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Seleccionar cliente</label>
                <select className="form-control" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                  <option value="">— Elige un cliente —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              {clienteId && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-text)' }}>{getCliente(parseInt(clienteId))?.nombre}</div>
                  <div style={{ color: 'var(--text-2)', marginTop: 2 }}>{getCliente(parseInt(clienteId))?.contacto} · {getCliente(parseInt(clienteId))?.email}</div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-title">2. Agregar conceptos</div>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <label className="form-label">Buscar por clave (ej: LIC-RES-01) o descripción</label>
                <div className="search-wrap">
                  <Icon name="search" size={14} />
                  <input
                    className="form-control search-input"
                    placeholder="Escribe una clave o palabra clave…"
                    value={busqueda}
                    onChange={e => buscarConcepto(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                {resultados.length > 0 && (
                  <div style={{ position: 'absolute', zIndex: 20, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', width: '100%', top: 'calc(100% + 2px)', overflow: 'hidden' }}>
                    {resultados.map(r => {
                      const yaAgregado = lineItems.find(li => li.clave === r.clave)
                      return (
                        <div key={r.clave}
                          onClick={() => !yaAgregado && agregarConcepto(r)}
                          style={{ padding: '10px 14px', cursor: yaAgregado ? 'default' : 'pointer', borderBottom: '1px solid var(--border)', opacity: yaAgregado ? 0.45 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                          onMouseEnter={e => { if (!yaAgregado) e.currentTarget.style.background = 'var(--surface2)' }}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: 'DM Mono', fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{r.clave}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.descripcion}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ fontFamily: 'DM Mono', fontSize: 13, fontWeight: 600 }}>{money(r.precio)}</span>
                            {yaAgregado
                              ? <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Agregado</span>
                              : <button className="btn btn-primary btn-sm"><Icon name="plus" size={12} /></button>
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {lineItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-3)', fontSize: 13, border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)' }}>
                  Busca y agrega conceptos usando el buscador de arriba
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Clave</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Descripción</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Precio</th>
                        <th style={{ width: 36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((li, i) => {
                        const c = getConcepto(li.clave)
                        return (
                          <tr key={li.clave} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                            <td style={{ padding: '10px 12px' }}><span className="mono" style={{ fontSize: 11, background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--accent)', fontWeight: 600 }}>{li.clave}</span></td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-2)', fontSize: 12 }}>{c?.descripcion}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 600 }}>{money(c?.precio || 0)}</td>
                            <td style={{ padding: '10px 8px' }}>
                              <button onClick={() => quitarConcepto(li.clave)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 4, display: 'flex' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-light)' }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = '' }}>
                                <Icon name="trash" size={13} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: resumen y guardar */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div className="card">
              <div className="card-title">Resumen de Cotización</div>

              {lineItems.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Sin conceptos aún</div>
              ) : (
                <>
                  {lineItems.map(li => {
                    const c = getConcepto(li.clave)
                    return (
                      <div key={li.clave} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
                        <span style={{ color: 'var(--text-2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c?.descripcion}</span>
                        <span style={{ fontFamily: 'DM Mono', fontWeight: 600, flexShrink: 0 }}>{money(c?.precio || 0)}</span>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTop: '2px solid var(--text)', fontWeight: 700, fontSize: 17 }}>
                    <span>Total</span>
                    <span style={{ fontFamily: 'DM Mono', color: 'var(--accent)' }}>{money(totalNuevo)}</span>
                  </div>
                </>
              )}

              <hr className="divider" />

              {guardado ? (
                <div className="alert alert-green">
                  <Icon name="check" size={14} />
                  <span>¡Cotización <strong>{guardado}</strong> guardada! Volviendo…</span>
                </div>
              ) : (
                <button
                  className="btn btn-primary w-full"
                  onClick={guardar}
                  disabled={!canSave}
                  style={{ opacity: canSave ? 1 : 0.45, justifyContent: 'center', fontSize: 14, padding: '10px' }}>
                  <Icon name="check" size={15} /> Guardar Cotización
                </button>
              )}

              {!canSave && (
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
                  {!clienteId ? 'Selecciona un cliente' : 'Agrega al menos un concepto'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Vista: lista de cotizaciones ───────────────────────────────────────────
  const filteredCotizaciones = cotizaciones.filter(c => {
    const cli = getCliente(c.clienteId)
    const clientName = cli ? cli.nombre.toLowerCase() : ''
    const contactName = cli ? cli.contacto.toLowerCase() : ''
    return c.id.toLowerCase().includes(qList.toLowerCase()) ||
      clientName.includes(qList.toLowerCase()) ||
      contactName.includes(qList.toLowerCase())
  })

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Cotizaciones</div>
          <div className="page-subtitle">{filteredCotizaciones.length} cotizaciones registradas</div>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setVista('nueva') }}>
          <Icon name="plus" size={14} /> Nueva Cotización
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="search-wrap" style={{ maxWidth: 380, margin: '16px 20px 0' }}>
          <Icon name="search" size={14} />
          <input className="form-control search-input" placeholder="Buscar por folio o cliente…" value={qList} onChange={e => setQList(e.target.value)} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 10 }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Folio</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Cliente</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Fecha</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Total</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Estatus</th>
              <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredCotizaciones.map(c => {
              const cli = getCliente(c.clienteId)
              const saldo = cotSaldo(c)
              const isExpanded = expandedId === c.id
              return (
                <Fragment key={c.id}>
                  <tr
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isExpanded ? 'var(--accent-light)' : '' }}
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = '' }}>
                    <td style={{ padding: '12px 16px' }}><span className="mono fw-600" style={{ color: 'var(--accent)' }}>{c.id}</span></td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{cli?.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{cli?.contacto}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)', fontSize: 12 }}>{c.fecha}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 700, fontSize: 14 }}>{money(cotTotal(c))}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${saldo <= 0 ? 'badge-green' : saldo < cotTotal(c) ? 'badge-amber' : 'badge-red'}`}>
                        {saldo <= 0 ? '✓ Liquidada' : saldo < cotTotal(c) ? '◑ Parcial' : '○ Sin abono'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>
                      <Icon name="chevdown" size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${c.id}-detail`} style={{ background: 'var(--accent-light)', borderBottom: '1px solid var(--border)' }}>
                      <td colSpan={6} style={{ padding: '0 16px 16px 16px' }}>
                        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                              <tr style={{ background: 'var(--surface2)' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-3)', fontSize: 11, fontWeight: 600 }}>Clave</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-3)', fontSize: 11, fontWeight: 600 }}>Descripción</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-3)', fontSize: 11, fontWeight: 600 }}>Precio</th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.conceptos.map((li, i) => {
                                const con = getConcepto(li.clave)
                                return (
                                  <tr key={li.clave} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                                    <td style={{ padding: '8px 12px' }}><span className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{li.clave}</span></td>
                                    <td style={{ padding: '8px 12px', color: 'var(--text-2)' }}>{con?.descripcion}</td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 600 }}>{money(con?.precio || 0)}</td>
                                  </tr>
                                )
                              })}
                              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface2)' }}>
                                <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700 }}>Total</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>{money(cotTotal(c))}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── PRESUPUESTOS — MÓDULO COMPLETO ──────────────────────────────────────────

// Calculadora de costos: 3 secciones x 2 bloques (honorarios y derechos)
const emptyCosto = () => ({
  planos: { cantidad: '', precioUnitario: '' },
  hrsHombre: { horas: '', precioPorHora: '' },
  oficina: { horas: '', precioPorHora: '' },
})

const emptyDerechos = () => ({
  derecho1: { nombre: '', costo: '' },
  derecho2: { nombre: '', costo: '' },
  derecho3: { nombre: '', costo: '' },
})

const calcSeccion = (s) => {
  const planos = (parseFloat(s.planos.cantidad) || 0) * (parseFloat(s.planos.precioUnitario) || 0)
  const hrs = (parseFloat(s.hrsHombre.horas) || 0) * (parseFloat(s.hrsHombre.precioPorHora) || 0)
  const oficina = (parseFloat(s.oficina.horas) || 0) * (parseFloat(s.oficina.precioPorHora) || 0)
  return { planos, hrs, oficina, subtotal: planos + hrs + oficina }
}

const calcDerechos = (d) => {
  if (!d) return { derecho1: 0, derecho2: 0, derecho3: 0, subtotal: 0, lbl1: '', lbl2: '', lbl3: '' }

  // Retrocompatibilidad con la estructura anterior
  if (d.planos && d.hrsHombre && d.oficina) {
    const planos = (parseFloat(d.planos.cantidad) || 0) * (parseFloat(d.planos.precioUnitario) || 0)
    const hrs = (parseFloat(d.hrsHombre.horas) || 0) * (parseFloat(d.hrsHombre.precioPorHora) || 0)
    const oficina = (parseFloat(d.oficina.horas) || 0) * (parseFloat(d.oficina.precioPorHora) || 0)
    return {
      derecho1: planos,
      derecho2: hrs,
      derecho3: oficina,
      subtotal: planos + hrs + oficina,
      lbl1: 'Planos',
      lbl2: 'Hrs. Hombre',
      lbl3: 'Oficina'
    }
  }

  const c1 = parseFloat(d.derecho1?.costo) || 0
  const c2 = parseFloat(d.derecho2?.costo) || 0
  const c3 = parseFloat(d.derecho3?.costo) || 0
  return {
    derecho1: c1,
    derecho2: c2,
    derecho3: c3,
    subtotal: c1 + c2 + c3,
    lbl1: d.derecho1?.nombre || 'Derecho 1',
    lbl2: d.derecho2?.nombre || 'Derecho 2',
    lbl3: d.derecho3?.nombre || 'Derecho 3'
  }
}

function CalcBloque({ titulo, color, datos, onChange }) {
  const res = calcSeccion(datos)
  const upd = (campo, key, val) => onChange({ ...datos, [campo]: { ...datos[campo], [key]: val } })
  const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', fontFamily: 'DM Mono', fontSize: 13, outline: 'none', background: 'var(--surface)' }
  const labelStyle = { fontSize: 11, color: 'var(--text-3)', marginBottom: 3, display: 'block', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }
  const resultBox = (label, val) => (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', minWidth: 120 }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 14, color: val > 0 ? color : 'var(--text-3)', marginTop: 2 }}>{money(val)}</div>
    </div>
  )

  return (
    <div style={{ border: `1px solid ${color}33`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ background: `${color}11`, borderBottom: `1px solid ${color}22`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <span style={{ fontWeight: 600, fontSize: 13, color }}>{titulo}</span>
      </div>
      <div style={{ padding: '16px' }}>

        {/* Planos */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span></span> Planos
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <div><label style={labelStyle}>Cantidad</label><input style={inputStyle} type="number" placeholder="0" value={datos.planos.cantidad} onChange={e => upd('planos', 'cantidad', e.target.value)} /></div>
            <div><label style={labelStyle}>Precio Unitario</label><input style={inputStyle} type="number" placeholder="$0.00" value={datos.planos.precioUnitario} onChange={e => upd('planos', 'precioUnitario', e.target.value)} /></div>
            {resultBox('= Total Planos', res.planos)}
          </div>
        </div>

        {/* Hrs Hombre */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span></span> Hrs. Hombre
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <div><label style={labelStyle}>Horas</label><input style={inputStyle} type="number" placeholder="0 hrs" value={datos.hrsHombre.horas} onChange={e => upd('hrsHombre', 'horas', e.target.value)} /></div>
            <div><label style={labelStyle}>Precio × Hora</label><input style={inputStyle} type="number" placeholder="$0.00/hr" value={datos.hrsHombre.precioPorHora} onChange={e => upd('hrsHombre', 'precioPorHora', e.target.value)} /></div>
            {resultBox('= Total Hrs', res.hrs)}
          </div>
        </div>

        {/* Oficina */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span></span> Oficina
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <div><label style={labelStyle}>Horas</label><input style={inputStyle} type="number" placeholder="0 hrs" value={datos.oficina.horas} onChange={e => upd('oficina', 'horas', e.target.value)} /></div>
            <div><label style={labelStyle}>Precio × Hora</label><input style={inputStyle} type="number" placeholder="$0.00/hr" value={datos.oficina.precioPorHora} onChange={e => upd('oficina', 'precioPorHora', e.target.value)} /></div>
            {resultBox('= Total Oficina', res.oficina)}
          </div>
        </div>

        {/* Subtotal bloque */}
        <div style={{ background: color, borderRadius: 'var(--radius-sm)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Subtotal {titulo}</span>
          <span style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 18, color: '#fff' }}>{money(res.subtotal)}</span>
        </div>
      </div>
    </div>
  )
}

function CalcDerechos({ color, datos, onChange }) {
  const res = calcDerechos(datos)
  const upd = (campo, key, val) => onChange({ ...datos, [campo]: { ...datos[campo], [key]: val } })
  const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 13, outline: 'none', background: 'var(--surface)' }
  const labelStyle = { fontSize: 11, color: 'var(--text-3)', marginBottom: 3, display: 'block', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }
  const resultBox = (label, val) => (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', minWidth: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 14, color: val > 0 ? color : 'var(--text-3)', marginTop: 2 }}>{money(val)}</div>
    </div>
  )

  return (
    <div style={{ border: `1px solid ${color}33`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ background: `${color}11`, borderBottom: `1px solid ${color}22`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <span style={{ fontWeight: 600, fontSize: 13, color }}>Derechos</span>
      </div>
      <div style={{ padding: '16px' }}>

        {/* Derecho 1 */}
        <div style={{ marginBottom: 14, padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span></span> Derecho 1
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: 8, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Nombre del Derecho</label>
              <input style={inputStyle} type="text" placeholder="Ej: Pago de Licencia" value={datos.derecho1?.nombre || ''} onChange={e => upd('derecho1', 'nombre', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Costo</label>
              <input style={{ ...inputStyle, fontFamily: 'DM Mono' }} type="number" placeholder="$0.00" value={datos.derecho1?.costo || ''} onChange={e => upd('derecho1', 'costo', e.target.value)} />
            </div>
            {resultBox('= Total D1', res.derecho1)}
          </div>
        </div>

        {/* Derecho 2 */}
        <div style={{ marginBottom: 14, padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span></span> Derecho 2
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: 8, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Nombre del Derecho</label>
              <input style={inputStyle} type="text" placeholder="Ej: Derechos Municipales" value={datos.derecho2?.nombre || ''} onChange={e => upd('derecho2', 'nombre', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Costo</label>
              <input style={{ ...inputStyle, fontFamily: 'DM Mono' }} type="number" placeholder="$0.00" value={datos.derecho2?.costo || ''} onChange={e => upd('derecho2', 'costo', e.target.value)} />
            </div>
            {resultBox('= Total D2', res.derecho2)}
          </div>
        </div>

        {/* Derecho 3 */}
        <div style={{ marginBottom: 14, padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🏛️</span> Derecho 3
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: 8, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Nombre del Derecho</label>
              <input style={inputStyle} type="text" placeholder="Ej: Inscripción de Obra" value={datos.derecho3?.nombre || ''} onChange={e => upd('derecho3', 'nombre', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Costo</label>
              <input style={{ ...inputStyle, fontFamily: 'DM Mono' }} type="number" placeholder="$0.00" value={datos.derecho3?.costo || ''} onChange={e => upd('derecho3', 'costo', e.target.value)} />
            </div>
            {resultBox('= Total D3', res.derecho3)}
          </div>
        </div>

        {/* Subtotal bloque */}
        <div style={{ background: color, borderRadius: 'var(--radius-sm)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Subtotal Derechos</span>
          <span style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 18, color: '#fff' }}>{money(res.subtotal)}</span>
        </div>
      </div>
    </div>
  )
}

const initialPresupuestosDB = [
  {
    id: 'PRES-001', titulo: 'Licencia de Construcción Residencial — Horizonte',
    documentacion: 'Identificación oficial del propietario\nEscritura del predio\nPlanos arquitectónicos firmados por DRO\nMemoria de cálculo estructural',
    requisitos: 'Pago de predial al corriente\nDictamen de uso de suelo vigente\nFactibilidad de servicios de agua y drenaje\nRegistro de obra ante IMSS',
    proceso: 'Se ingresa expediente en ventanilla única del H. Ayuntamiento. El área de Obras Públicas revisa en 15-20 días hábiles. Se atienden observaciones y se obtiene licencia.',
    honorarios: { planos: { cantidad: '4', precioUnitario: '1200' }, hrsHombre: { horas: '18', precioPorHora: '450' }, oficina: { horas: '12', precioPorHora: '250' } },
    derechos: { derecho1: { nombre: 'Pago de derechos en Tesorería', costo: '1050' }, derecho2: { nombre: 'Pago de derechos municipales', costo: '1000' }, derecho3: { nombre: '', costo: '' } },
    fecha: fmt(addDays(hoy, -22)), clienteId: 1,
  },
  {
    id: 'PRES-002', titulo: 'Uso de Suelo Habitacional — Patricia Noriega',
    documentacion: 'Identificación oficial\nEscritura notarial del predio\nCroquis de localización',
    requisitos: 'Pago de predial vigente\nAlineamiento y número oficial\nNo adeudo de servicios municipales',
    proceso: 'Trámite ante Dirección de Desarrollo Urbano. Resolución en 10 días hábiles. Se verifica zonificación en Plan Municipal.',
    honorarios: { planos: { cantidad: '1', precioUnitario: '800' }, hrsHombre: { horas: '8', precioPorHora: '450' }, oficina: { horas: '6', precioPorHora: '250' } },
    derechos: { derecho1: { nombre: 'Pago de derechos por metros', costo: '700' }, derecho2: { nombre: 'Pago de derechos municipales', costo: '600' }, derecho3: { nombre: '', costo: '' } },
    fecha: fmt(addDays(hoy, -10)), clienteId: 2,
  },
]

function FormNuevoPresupuesto({ onGuardar, onCancelar, clientes }) {
  const [titulo, setTitulo] = useState('')
  const [documentacion, setDocumentacion] = useState('')
  const [requisitos, setRequisitos] = useState('')
  const [proceso, setProceso] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [honorarios, setHonorarios] = useState(emptyCosto())
  const [derechos, setDerechos] = useState(emptyDerechos())
  const [guardado, setGuardado] = useState(false)

  const resH = calcSeccion(honorarios)
  const resD = calcDerechos(derechos)
  const totalGeneral = resH.subtotal + resD.subtotal

  const isValidDerecho = (der) => der && der.nombre?.trim() !== '' && der.costo?.trim() !== ''
  const hasAtLeastOneDerecho = isValidDerecho(derechos.derecho1) || isValidDerecho(derechos.derecho2) || isValidDerecho(derechos.derecho3)
  const canSave = titulo && hasAtLeastOneDerecho

  const handleGuardar = () => {
    if (!canSave) return
    const nuevo = {
      id: `PRES-${String(Date.now()).slice(-4)}`,
      titulo, documentacion, requisitos, proceso,
      clienteId: clienteId ? parseInt(clienteId) : null,
      honorarios, derechos,
      fecha: fmt(hoy),
    }
    onGuardar(nuevo)
    setGuardado(true)
    setTimeout(() => onCancelar(), 1600)
  }

  const sectionTitle = (emoji, txt) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid var(--border)' }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{txt}</span>
    </div>
  )

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Nuevo Presupuesto</div>
          <div className="page-subtitle">Completa la información y los costos se calcularán automáticamente</div>
        </div>
        <button className="btn btn-secondary" onClick={onCancelar}>← Volver</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        <div>
          {/* ── Datos generales */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('', 'Datos Generales')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ gridColumn: '1/-1', marginBottom: 0 }}>
                <label className="form-label">Título del Presupuesto *</label>
                <input className="form-control" placeholder="Ej: Licencia de Construcción Comercial — El Nogal" value={titulo} onChange={e => setTitulo(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cliente (opcional)</label>
                <select className="form-control" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                  <option value="">— Sin asignar —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fecha</label>
                <input className="form-control" type="text" value={fmt(hoy)} readOnly style={{ color: 'var(--text-3)' }} />
              </div>
            </div>
          </div>

          {/* ── Proceso */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('', 'Proceso del Trámite')}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Describe el proceso general</label>
              <textarea className="form-control" rows={3} placeholder="Describe los pasos del trámite, tiempos estimados, dependencias involucradas…" value={proceso} onChange={e => setProceso(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>

          {/* ── Documentación y Requisitos */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('', 'Documentación y Requisitos')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Documentación necesaria <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(un ítem por línea → se convierte en checklist)</span></label>
                <textarea className="form-control" rows={6} placeholder={"Identificación oficial\nEscritura del predio\nPlanos arquitectónicos firmados\nMemoria de cálculo"} value={documentacion} onChange={e => setDocumentacion(e.target.value)} style={{ resize: 'vertical', fontFamily: 'DM Mono', fontSize: 12 }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Requisitos previos <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(un ítem por línea → se convierte en checklist)</span></label>
                <textarea className="form-control" rows={6} placeholder={"Pago de predial al corriente\nUso de suelo vigente\nFactibilidad de servicios"} value={requisitos} onChange={e => setRequisitos(e.target.value)} style={{ resize: 'vertical', fontFamily: 'DM Mono', fontSize: 12 }} />
              </div>
            </div>
            {(documentacion || requisitos) && (
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(42,95,63,0.2)', fontSize: 12, color: 'var(--accent-text)' }}>
                <Icon name="check" size={12} style={{ marginRight: 6 }} />
                Al guardar se generará un checklist con <strong>{documentacion.split('\n').filter(l => l.trim()).length}</strong> ítems de documentación y <strong>{requisitos.split('\n').filter(l => l.trim()).length}</strong> requisitos.
              </div>
            )}
          </div>

          {/* ── Calculadora Honorarios */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('', 'Costo de Honorarios')}
            <CalcBloque titulo="Honorarios" color="#2A5F3F" datos={honorarios} onChange={setHonorarios} />
          </div>

          {/* ── Calculadora Derechos */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('', 'Costo de Derechos')}
            <CalcDerechos color="#1A5276" datos={derechos} onChange={setDerechos} />
          </div>
        </div>

        {/* ── Panel derecho: resumen pegajoso */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>Resumen de Costos</div>

            {/* Honorarios breakdown */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, fontWeight: 600 }}>Honorarios</div>
              {[[' Planos', resH.planos], [' Hrs. Hombre', resH.hrs], [' Oficina', resH.oficina]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--text-2)' }}>
                  <span>{l}</span><span style={{ fontFamily: 'DM Mono' }}>{money(v)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, padding: '6px 0', borderTop: '1px solid var(--border)', marginTop: 4, color: 'var(--accent)' }}>
                <span>Subtotal Honor.</span><span style={{ fontFamily: 'DM Mono' }}>{money(resH.subtotal)}</span>
              </div>
            </div>

            {/* Derechos breakdown */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, fontWeight: 600 }}>Derechos</div>
              {[
                [resD.lbl1, resD.derecho1],
                [resD.lbl2, resD.derecho2],
                [resD.lbl3, resD.derecho3]
              ].map(([l, v], idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--text-2)' }}>
                  <span>{l}</span><span style={{ fontFamily: 'DM Mono' }}>{money(v)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, padding: '6px 0', borderTop: '1px solid var(--border)', marginTop: 4, color: 'var(--blue)' }}>
                <span>Subtotal Derechos</span><span style={{ fontFamily: 'DM Mono' }}>{money(resD.subtotal)}</span>
              </div>
            </div>

            {/* Gran total */}
            <div style={{ background: totalGeneral > 0 ? 'var(--text)' : 'var(--surface2)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: totalGeneral > 0 ? 'rgba(255,255,255,0.5)' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total General</div>
                <div style={{ fontSize: 10, color: totalGeneral > 0 ? 'rgba(255,255,255,0.35)' : 'var(--text-3)' }}>Honor. + Derechos</div>
              </div>
              <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 22, color: totalGeneral > 0 ? '#FFFFFF' : 'var(--text-3)' }}>
                {money(totalGeneral)}
              </div>
            </div>
          </div>

          {guardado ? (
            <div className="alert alert-green"><Icon name="check" size={14} /> Presupuesto guardado correctamente</div>
          ) : (
            <button className="btn btn-primary w-full" onClick={handleGuardar} disabled={!canSave} style={{ opacity: !canSave ? 0.45 : 1, justifyContent: 'center', padding: '11px', fontSize: 14 }}>
              <Icon name="check" size={15} /> Guardar Presupuesto
            </button>
          )}
          {!titulo && <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>Ingresa un título para poder guardar</div>}
          {titulo && !hasAtLeastOneDerecho && <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>Ingresa al menos un derecho (nombre y costo) para poder guardar</div>}
        </div>
      </div>
    </div>
  )
}

function VistaPresupuesto({ p, onCerrar }) {
  const [checkDoc, setCheckDoc] = useState({})
  const [checkReq, setCheckReq] = useState({})
  const resH = calcSeccion(p.honorarios)
  const resD = calcDerechos(p.derechos)
  const total = resH.subtotal + resD.subtotal
  const cliente = p.clienteId ? getCliente(p.clienteId) : null

  const docItems = p.documentacion.split('\n').map(l => l.trim()).filter(Boolean)
  const reqItems = p.requisitos.split('\n').map(l => l.trim()).filter(Boolean)
  const docDone = docItems.filter((_, i) => checkDoc[i]).length
  const reqDone = reqItems.filter((_, i) => checkReq[i]).length

  const CheckItem = ({ label, idx, state, setState }) => (
    <div onClick={() => setState(s => ({ ...s, [idx]: !s[idx] }))} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: state[idx] ? 'var(--accent-light)' : 'transparent', marginBottom: 4, transition: 'background 0.15s' }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${state[idx] ? 'var(--accent)' : 'var(--border-strong)'}`, background: state[idx] ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
        {state[idx] && <Icon name="check" size={10} style={{ color: '#fff' }} />}
      </div>
      <span style={{ fontSize: 13, textDecoration: state[idx] ? 'line-through' : 'none', color: state[idx] ? 'var(--text-3)' : 'var(--text)' }}>{label}</span>
    </div>
  )

  const CostRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{money(value)}</span>
    </div>
  )

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title" style={{ fontSize: 19 }}>{p.titulo}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-gray">{p.id}</span>
            <span className="badge badge-gray">📅 {p.fecha}</span>
            {cliente && <span className="badge badge-blue">👤 {cliente.nombre}</span>}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onCerrar}>← Volver</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Proceso */}
        {p.proceso && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>🔄 Proceso del Trámite</div>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{p.proceso}</p>
          </div>
        )}

        {/* Checklist Documentación */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>📁 Documentación</div>
            <span className="badge badge-green">{docDone}/{docItems.length}</span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 12 }}>
            <div className="progress-fill" style={{ width: `${docItems.length ? docDone / docItems.length * 100 : 0}%`, background: 'var(--accent)' }} />
          </div>
          {docItems.map((item, i) => <CheckItem key={i} label={item} idx={i} state={checkDoc} setState={setCheckDoc} />)}
          {docItems.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>Sin ítems de documentación</div>}
        </div>

        {/* Checklist Requisitos */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>✅ Requisitos Previos</div>
            <span className="badge badge-blue">{reqDone}/{reqItems.length}</span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 12 }}>
            <div className="progress-fill" style={{ width: `${reqItems.length ? reqDone / reqItems.length * 100 : 0}%`, background: 'var(--blue)' }} />
          </div>
          {reqItems.map((item, i) => <CheckItem key={i} label={item} idx={i} state={checkReq} setState={setCheckReq} />)}
          {reqItems.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>Sin requisitos previos</div>}
        </div>
      </div>

      {/* Tabla de costos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>💼 Honorarios</div>
          <CostRow label=" Planos" value={resH.planos} />
          <CostRow label=" Hrs. Hombre" value={resH.hrs} />
          <CostRow label=" Oficina" value={resH.oficina} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
            <span>Subtotal</span><span style={{ fontFamily: 'DM Mono' }}>{money(resH.subtotal)}</span>
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>🏛️ Derechos</div>
          <CostRow label={resD.lbl1} value={resD.derecho1} />
          <CostRow label={resD.lbl2} value={resD.derecho2} />
          <CostRow label={resD.lbl3} value={resD.derecho3} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, fontSize: 14, color: 'var(--blue)' }}>
            <span>Subtotal</span><span style={{ fontFamily: 'DM Mono' }}>{money(resD.subtotal)}</span>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--text)', border: 'none', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Total General</div>
          <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 28, color: '#FFFFFF', lineHeight: 1 }}>{money(total)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Honorarios + Derechos</div>
        </div>
      </div>
    </div>
  )
}

function Presupuestos({ clientes }) {
  const [tab, setTab] = useState('catalogo')  // 'catalogo' | 'nuevo' | 'ver'
  const [presupuestos, setPresupuestos] = useState(() => {
    const saved = localStorage.getItem('giu_presupuestos')
    return saved ? JSON.parse(saved) : initialPresupuestosDB
  })
  const [viendoId, setViendoId] = useState(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    localStorage.setItem('giu_presupuestos', JSON.stringify(presupuestos))
  }, [presupuestos])

  const verPres = presupuestos.find(p => p.id === viendoId)

  const guardarNuevo = (p) => {
    setPresupuestos(prev => [p, ...prev])
  }

  if (tab === 'nuevo') return <FormNuevoPresupuesto onGuardar={guardarNuevo} onCancelar={() => setTab('catalogo')} clientes={clientes} />
  if (tab === 'ver' && verPres) return <VistaPresupuesto p={verPres} onCerrar={() => setTab('catalogo')} />

  const filtrados = presupuestos.filter(p => {
    const cli = p.clienteId ? getCliente(p.clienteId) : null
    const clientName = cli ? cli.nombre.toLowerCase() : ''
    return p.titulo.toLowerCase().includes(q.toLowerCase()) ||
      p.id.toLowerCase().includes(q.toLowerCase()) ||
      clientName.includes(q.toLowerCase())
  })
  const catalogoFiltrado = currentConceptos.filter(c =>
    c.clave.toLowerCase().includes(q.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Presupuestos</div>
          <div className="page-subtitle">Catálogo de conceptos y presupuestos detallados con calculadora de costos</div>
        </div>
        <button className="btn btn-primary" onClick={() => setTab('nuevo')}>
          <Icon name="plus" size={14} /> Nuevo Presupuesto
        </button>
      </div>

      {/* Buscador global */}
      <div className="search-wrap mb-6" style={{ maxWidth: 400 }}>
        <Icon name="search" size={14} />
        <input className="form-control search-input" placeholder="Buscar en presupuestos y catálogo…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {/* ── Presupuestos guardados */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="receipt" size={15} style={{ color: 'var(--text-3)' }} />
          Presupuestos Guardados
          <span className="badge badge-gray">{filtrados.length}</span>
        </div>
        {filtrados.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
            <Icon name="file" size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <div>No hay presupuestos aún</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 14 }}>
            {filtrados.map(p => {
              const resH = calcSeccion(p.honorarios)
              const resD = calcDerechos(p.derechos)
              const total = resH.subtotal + resD.subtotal
              const cli = p.clienteId ? getCliente(p.clienteId) : null
              const docItems = p.documentacion.split('\n').filter(Boolean).length
              const reqItems = p.requisitos.split('\n').filter(Boolean).length
              return (
                <div key={p.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                  onClick={() => { setViendoId(p.id); setTab('ver') }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{p.id}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.fecha}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{p.titulo}</div>
                  {cli && <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>👤 {cli.nombre}</div>}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    {docItems > 0 && <span className="badge badge-blue">{docItems} docs</span>}
                    {reqItems > 0 && <span className="badge badge-amber">{reqItems} req.</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Total estimado</div>
                    <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 16, color: total > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                      {total > 0 ? money(total) : '$ —'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Catálogo de conceptos */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="list" size={15} style={{ color: 'var(--text-3)' }} />
          Catálogo de Conceptos
          <span className="badge badge-gray">{catalogoFiltrado.length}</span>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Clave</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Descripción del Servicio</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Precio Referencia</th>
              </tr>
            </thead>
            <tbody>
              {catalogoFiltrado.map((c, i) => (
                <tr key={c.clave} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '' : 'var(--bg)' }}>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontFamily: 'DM Mono', fontSize: 12, fontWeight: 700, background: 'var(--surface2)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--accent)' }}>{c.clave}</span>
                  </td>
                  <td style={{ padding: '11px 16px', color: 'var(--text-2)' }}>{c.descripcion}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 700, fontSize: 13 }}>{money(c.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── HOJAS DE RUTA ────────────────────────────────────────────────────────────
function HojasRuta() {
  const [selectedTramite, setSelectedTramite] = useState(TRAMITES_MOCK[0])
  const [pasoActual, setPasoActual] = useState(TRAMITES_MOCK[0].pasoActual)

  const seleccionar = (t) => {
    setSelectedTramite(t)
    setPasoActual(t.pasoActual)
  }

  const tipo = TRAMITES_TIPOS[selectedTramite.tipo]
  const col = COLOR_MAP[tipo.color]
  const bgCol = BG_MAP[tipo.color]
  const cli = getCliente(selectedTramite.clienteId)
  const equipo = EQUIPO.find(e => e.id === selectedTramite.asignadoA)
  const pct = Math.round((pasoActual / tipo.pasos.length) * 100)

  const avanzar = () => {
    if (pasoActual < tipo.pasos.length) setPasoActual(p => p + 1)
  }

  const retroceder = () => {
    if (pasoActual > 0) setPasoActual(p => p - 1)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Hojas de Ruta por Trámite</div>
        <div className="page-subtitle">Seguimiento de requisitos y pasos predefinidos para cada gestión</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div>
          {TRAMITES_MOCK.map(t => {
            const tp = TRAMITES_TIPOS[t.tipo]
            const c = COLOR_MAP[tp.color]
            const bg = BG_MAP[tp.color]
            const pct2 = Math.round((t.pasoActual / tp.pasos.length) * 100)
            const isActive = selectedTramite.id === t.id
            return (
              <div key={t.id} onClick={() => seleccionar(t)} style={{
                background: isActive ? bg : 'var(--surface)',
                border: `1px solid ${isActive ? c : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: 10,
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: isActive ? `0 0 0 2px ${c}22` : 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, fontWeight: 600, color: c }}>{t.id}</span>
                  <span className={`badge badge-${t.prioridad === 'alta' ? 'red' : t.prioridad === 'media' ? 'amber' : 'gray'}`} style={{ fontSize: 10 }}>
                    {t.prioridad}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{tp.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{getCliente(t.clienteId)?.nombre}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct2}%`, background: c }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>{t.pasoActual}/{tp.pasos.length} pasos · {pct2}%</div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{tipo.icono}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>{tipo.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Folio: {selectedTramite.folio}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <span className="badge badge-blue">{cli?.nombre}</span>
                {equipo && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: equipo.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700 }}>{equipo.avatar}</span>
                    {equipo.nombre}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: col, fontFamily: 'DM Mono' }}>{pct}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>completado</div>
            </div>
          </div>

          <div className="progress-bar" style={{ height: 8, marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: `${pct}%`, background: col, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 24 }}>Paso {pasoActual} de {tipo.pasos.length}</div>

          {selectedTramite.notas && (
            <div className="alert alert-amber" style={{ marginBottom: 20 }}>
              <Icon name="alert" size={14} style={{ flexShrink: 0 }} />
              <span>{selectedTramite.notas}</span>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            {tipo.pasos.map((paso, i) => {
              const idx = i + 1
              const hecho = idx < pasoActual
              const actual = idx === pasoActual
              const pendiente = idx > pasoActual
              return (
                <div key={i} className="roadmap-step">
                  <div className="step-num" style={{
                    background: hecho ? col : actual ? bgCol : 'var(--surface2)',
                    color: hecho ? '#fff' : actual ? col : 'var(--text-3)',
                    border: actual ? `2px solid ${col}` : '1px solid var(--border)',
                  }}>
                    {hecho ? <Icon name="check" size={11} /> : idx}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: actual ? 600 : 400,
                      color: pendiente ? 'var(--text-3)' : hecho ? 'var(--text-2)' : 'var(--text)',
                      textDecoration: hecho ? 'line-through' : 'none',
                    }}>
                      {paso}
                    </div>
                    {actual && <div style={{ fontSize: 11, color: col, fontWeight: 500, marginTop: 2 }}>← Paso actual</div>}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={retroceder} disabled={pasoActual === 0} style={{ opacity: pasoActual === 0 ? 0.4 : 1 }}>
              ← Paso anterior
            </button>
            <button className="btn btn-primary" onClick={avanzar} disabled={pasoActual >= tipo.pasos.length} style={{ opacity: pasoActual >= tipo.pasos.length ? 0.4 : 1 }}>
              {pasoActual >= tipo.pasos.length ? '✓ Trámite completado' : 'Siguiente paso →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TAREAS DIARIAS ───────────────────────────────────────────────────────────
function TareasDiarias() {
  const [tareas, setTareas] = useState(() => {
    const saved = localStorage.getItem('giu_tareas')
    return saved ? JSON.parse(saved) : TAREAS_MOCK
  })
  const [filtroUser, setFiltroUser] = useState('todos')
  const [showNueva, setShowNueva] = useState(false)
  const [nueva, setNueva] = useState({ titulo: '', tramiteId: 'TRM-001', asignadoA: 'u1', prioridad: 'media', fecha: fmt(hoy) })

  useEffect(() => {
    localStorage.setItem('giu_tareas', JSON.stringify(tareas))
  }, [tareas])

  const toggle = (id) => setTareas(prev => prev.map(t => t.id === id ? { ...t, hecho: !t.hecho } : t))

  const filtered = tareas.filter(t => filtroUser === 'todos' || t.asignadoA === filtroUser)

  const todayStr = fmt(hoy)
  const col1 = filtered.filter(t => !t.hecho && t.fecha === todayStr)
  const col2 = filtered.filter(t => t.hecho)
  const col3 = filtered.filter(t => !t.hecho && t.fecha < todayStr)

  const guardarNueva = () => {
    if (!nueva.titulo) return
    setTareas(prev => [...prev, { ...nueva, id: `t${Date.now()}`, hecho: false }])
    setShowNueva(false)
    setNueva({ titulo: '', tramiteId: 'TRM-001', asignadoA: 'u1', prioridad: 'media', fecha: fmt(hoy) })
  }

  const PrioColors = { alta: 'badge-red', media: 'badge-amber', baja: 'badge-gray' }

  const TCard = ({ t }) => {
    const eq = EQUIPO.find(e => e.id === t.asignadoA)
    return (
      <div className="task-card" onClick={() => toggle(t.id)} style={{ opacity: t.hecho ? 0.65 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', border: `2px solid ${t.hecho ? 'var(--accent)' : 'var(--border-strong)'}`,
            background: t.hecho ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
          }}>
            {t.hecho && <Icon name="check" size={10} style={{ color: '#fff' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div className="task-card-title" style={{ textDecoration: t.hecho ? 'line-through' : 'none' }}>{t.titulo}</div>
            <div className="task-card-meta">
              <span className={`badge ${PrioColors[t.prioridad]}`} style={{ fontSize: 10 }}>{t.prioridad}</span>
              <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--text-3)' }}>{t.tramiteId}</span>
              {eq && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: eq.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 700 }}>{eq.avatar}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{eq.nombre}</span>
                </span>
              )}
              {t.fecha !== todayStr && !t.hecho && <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 500 }}>vence: {t.fecha}</span>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Tareas Diarias del Equipo</div>
          <div className="page-subtitle">Organización diaria · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="form-control" style={{ width: 'auto' }} value={filtroUser} onChange={e => setFiltroUser(e.target.value)}>
            <option value="todos">Todo el equipo</option>
            {EQUIPO.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowNueva(true)}>
            <Icon name="plus" size={14} /> Nueva Tarea
          </button>
        </div>
      </div>

      <div className="three-col">
        <div className="task-col">
          <div className="task-col-header">
            <div className="task-col-title" style={{ color: 'var(--blue)' }}>
              <Icon name="clock" size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Para Hoy
            </div>
            <span className="task-col-count" style={{ background: 'var(--blue-light)', color: 'var(--blue-text)' }}>{col1.length}</span>
          </div>
          {col1.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>¡Todo al día! ✓</div>}
          {col1.map(t => <TCard key={t.id} t={t} />)}
        </div>

        <div className="task-col">
          <div className="task-col-header">
            <div className="task-col-title" style={{ color: 'var(--accent)' }}>
              <Icon name="check" size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Ya se Hizo
            </div>
            <span className="task-col-count" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>{col2.length}</span>
          </div>
          {col2.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>Sin completadas aún</div>}
          {col2.map(t => <TCard key={t.id} t={t} />)}
        </div>

        <div className="task-col" style={{ borderColor: 'var(--red)' }}>
          <div className="task-col-header">
            <div className="task-col-title" style={{ color: 'var(--red)' }}>
              <Icon name="alert" size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Falta por Hacer
            </div>
            <span className="task-col-count" style={{ background: 'var(--red-light)', color: 'var(--red-text)' }}>{col3.length}</span>
          </div>
          {col3.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>Sin pendientes atrasados</div>}
          {col3.map(t => <TCard key={t.id} t={t} />)}
        </div>
      </div>

      {showNueva && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNueva(false)}>
          <div className="modal">
            <div className="modal-title">Nueva Tarea</div>
            <div className="form-group">
              <label className="form-label">Descripción de la tarea</label>
              <input className="form-control" placeholder="Ej: Entregar expediente al Ayuntamiento" value={nueva.titulo} onChange={e => setNueva(n => ({ ...n, titulo: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Trámite relacionado</label>
                <select className="form-control" value={nueva.tramiteId} onChange={e => setNueva(n => ({ ...n, tramiteId: e.target.value }))}>
                  {TRAMITES_MOCK.map(t => <option key={t.id} value={t.id}>{t.id} — {TRAMITES_TIPOS[t.tipo].nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Asignar a</label>
                <select className="form-control" value={nueva.asignadoA} onChange={e => setNueva(n => ({ ...n, asignadoA: e.target.value }))}>
                  {EQUIPO.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Prioridad</label>
                <select className="form-control" value={nueva.prioridad} onChange={e => setNueva(n => ({ ...n, prioridad: e.target.value }))}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha límite</label>
                <input className="form-control" type="date" value={nueva.fecha} onChange={e => setNueva(n => ({ ...n, fecha: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowNueva(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarNueva} disabled={!nueva.titulo} style={{ opacity: !nueva.titulo ? 0.5 : 1 }}>
                <Icon name="check" size={14} /> Agregar Tarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ADMINISTRACIÓN ───────────────────────────────────────────────────────────
function Administracion({ clientes, setClientes, conceptos, setConceptos, setTab, setActive }) {
  const [adminTab, setAdminTab] = useState('clientes')
  const [qClientes, setQClientes] = useState('')
  const [showAddClienteModal, setShowAddClienteModal] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', contacto: '', email: '', tel: '', tipo: 'empresa', rfc: '', ciudad: ''
  })

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(qClientes.toLowerCase()) ||
    c.contacto.toLowerCase().includes(qClientes.toLowerCase()) ||
    c.rfc.toLowerCase().includes(qClientes.toLowerCase())
  )

  const totalClientes = clientes.length
  const empresasCount = clientes.filter(c => c.tipo === 'empresa').length
  const personasCount = clientes.filter(c => c.tipo === 'persona').length

  const handleAddCliente = () => {
    if (!nuevoCliente.nombre || !nuevoCliente.contacto) return
    const nuevo = {
      ...nuevoCliente,
      id: Math.max(...clientes.map(c => c.id), 0) + 1
    }
    setClientes(prev => [...prev, nuevo])
    setShowAddClienteModal(false)
    setNuevoCliente({
      nombre: '', contacto: '', email: '', tel: '', tipo: 'empresa', rfc: '', ciudad: ''
    })
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Módulo Administrativo</div>
          <div className="page-subtitle">Administración de clientes, catálogo y configuraciones generales</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddClienteModal(true)}>
          <Icon name="plus" size={14} /> Registrar Cliente
        </button>
      </div>

      {/* Metric summary banner */}
      <div className="metric-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="metric-card">
          <div className="metric-label">Total Clientes</div>
          <div className="metric-value" style={{ color: 'var(--blue)' }}>{totalClientes}</div>
          <div className="metric-sub">registrados en la plataforma</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Empresas / Constructoras</div>
          <div className="metric-value" style={{ color: 'var(--accent)' }}>{empresasCount}</div>
          <div className="metric-sub">personas morales</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Personas Físicas</div>
          <div className="metric-value" style={{ color: 'var(--purple)' }}>{personasCount}</div>
          <div className="metric-sub">trámites residenciales o individuales</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-4">
        <button
          className={`tab-btn ${adminTab === 'clientes' ? 'active' : ''}`}
          onClick={() => setAdminTab('clientes')}
        >
          Directorio de Clientes
        </button>
        <button
          className={`tab-btn ${adminTab === 'conceptos' ? 'active' : ''}`}
          onClick={() => setAdminTab('conceptos')}
        >
          Gestión de Conceptos
        </button>
      </div>

      {/* Subview Clientes */}
      {adminTab === 'clientes' && (
        <div className="card">
          <div className="search-wrap mb-4" style={{ maxWidth: 380 }}>
            <Icon name="search" size={14} />
            <input
              className="form-control search-input"
              placeholder="Buscar por cliente, contacto o RFC…"
              value={qClientes}
              onChange={e => setQClientes(e.target.value)}
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente / Razón Social</th>
                  <th>Contacto</th>
                  <th>RFC</th>
                  <th>Contacto Directo</th>
                  <th>Ubicación</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{c.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>ID: CLI-{String(c.id).padStart(3, '0')}</div>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{c.contacto}</td>
                    <td>
                      <span className="mono" style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{c.rfc}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>📧 {c.email}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>📞 {c.tel}</div>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>📍 {c.ciudad}</td>
                    <td>
                      <span className={`badge ${c.tipo === 'empresa' ? 'badge-blue' : 'badge-purple'}`}>
                        {c.tipo === 'empresa' ? 'Empresa' : 'Persona'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subview Conceptos */}
      {adminTab === 'conceptos' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Servicios / Trámites Disponibles</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setActive('catalogo')}>
                Ver en módulo de Catálogo →
              </button>
            </div>
            <Catalogo conceptos={conceptos} setConceptos={setConceptos} />
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClienteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddClienteModal(false)}>
          <div className="modal">
            <div className="modal-title">Registrar Nuevo Cliente</div>

            <div className="form-group">
              <label className="form-label">Nombre o Razón Social *</label>
              <input
                className="form-control"
                placeholder="Ej: Inmobiliaria del Bajío S.A."
                value={nuevoCliente.nombre}
                onChange={e => setNuevoCliente(n => ({ ...n, nombre: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Nombre del Contacto *</label>
                <input
                  className="form-control"
                  placeholder="Ej: Ing. Luis Morales"
                  value={nuevoCliente.contacto}
                  onChange={e => setNuevoCliente(n => ({ ...n, contacto: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de Contribuyente</label>
                <select
                  className="form-control"
                  value={nuevoCliente.tipo}
                  onChange={e => setNuevoCliente(n => ({ ...n, tipo: e.target.value }))}
                >
                  <option value="empresa">Empresa (Persona Moral)</option>
                  <option value="persona">Persona Física</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">RFC</label>
                <input
                  className="form-control"
                  placeholder="Ej: IMD180215AB1"
                  value={nuevoCliente.rfc}
                  onChange={e => setNuevoCliente(n => ({ ...n, rfc: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ciudad / Ubicación</label>
                <input
                  className="form-control"
                  placeholder="Ej: Querétaro, Qro."
                  value={nuevoCliente.ciudad}
                  onChange={e => setNuevoCliente(n => ({ ...n, ciudad: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="Ej: contacto@empresa.com"
                  value={nuevoCliente.email}
                  onChange={e => setNuevoCliente(n => ({ ...n, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  className="form-control"
                  placeholder="Ej: 442-555-0199"
                  value={nuevoCliente.tel}
                  onChange={e => setNuevoCliente(n => ({ ...n, tel: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowAddClienteModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleAddCliente}
                disabled={!nuevoCliente.nombre || !nuevoCliente.contacto}
                style={{ opacity: (!nuevoCliente.nombre || !nuevoCliente.contacto) ? 0.5 : 1 }}
              >
                <Icon name="check" size={14} /> Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── HOME / SPLASH SCREEN ─────────────────────────────────────────────────────
function Home() {
  return (
    <div className="home-container">
      <div className="home-logo-section-large">
        <img src={logoImg} alt="GIU Gestión Integral Urbana" className="home-logo-img" />
      </div>
    </div>
  )
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState('home')
  const [clientes, setClientes] = useState(() => {
    const saved = localStorage.getItem('giu_clientes')
    return saved ? JSON.parse(saved) : CLIENTES
  })
  const [cotizaciones, setCotizaciones] = useState(() => {
    const saved = localStorage.getItem('giu_cotizaciones')
    return saved ? JSON.parse(saved) : initialCotizaciones
  })
  const [conceptos, setConceptos] = useState(() => {
    const saved = localStorage.getItem('giu_conceptos')
    return saved ? JSON.parse(saved) : CATALOGO_CONCEPTOS
  })

  useEffect(() => {
    localStorage.setItem('giu_clientes', JSON.stringify(clientes))
    currentClientes = clientes
  }, [clientes])

  useEffect(() => {
    localStorage.setItem('giu_cotizaciones', JSON.stringify(cotizaciones))
  }, [cotizaciones])

  useEffect(() => {
    localStorage.setItem('giu_conceptos', JSON.stringify(conceptos))
    currentConceptos = conceptos
  }, [conceptos])

  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} />
      <main className="main-content" style={{ padding: active === 'home' ? '0' : '32px 36px' }}>
        {active === 'home' && <Home setActive={setActive} />}
        {active === 'dashboard' && <Dashboard cotizaciones={cotizaciones} tareas={TAREAS_MOCK} setActive={setActive} />}
        {active === 'catalogo' && <Catalogo conceptos={conceptos} setConceptos={setConceptos} />}
        {active === 'cotizaciones' && <Cotizaciones cotizaciones={cotizaciones} setCotizaciones={setCotizaciones} clientes={clientes} />}
        {active === 'presupuestos' && <Presupuestos clientes={clientes} />}
        {active === 'tramites' && <HojasRuta />}
        {active === 'tareas' && <TareasDiarias />}
        {active === 'administracion' && <Administracion clientes={clientes} setClientes={setClientes} conceptos={conceptos} setConceptos={setConceptos} setTab={setActive} setActive={setActive} />}
      </main>
    </div>
  )
}

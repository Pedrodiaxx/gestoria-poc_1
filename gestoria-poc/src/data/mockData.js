export const CATALOGO_CONCEPTOS = [
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

export const CLIENTES = [
  {
    id: 1,
    nombre: 'MexPack',
    contacto: 'Ing. Marco Salinas',
    email: 'joel.diaz.lopez7@gmail.com',
    tel: '+34 611 222 333',
    tipo: 'empresa',
    rfc: 'CHO850312AB3',
    ciudad: 'Querétaro, Qro.',
    estatus: 'lead',
    proyectos: ['Proyecto A'],
    responsable: 'usr-emp-1'
  },
  {
    id: 2,
    nombre: 'GreenTech Solutions',
    contacto: 'Lic. Roberto Fuentes',
    email: 'contacto@greentech.com',
    tel: '+34 600 123 456',
    tipo: 'empresa',
    rfc: 'ICS920801TT2',
    ciudad: 'Juriquilla, Qro.',
    estatus: 'activo',
    proyectos: ['Proyecto B'],
    responsable: 'usr-admin-1'
  },
  {
    id: 3,
    nombre: 'SolarWave',
    contacto: 'Arq. Diego Landa',
    email: 'sales@solarwave.com',
    tel: '+34 633 555 666',
    tipo: 'empresa',
    rfc: 'PQD001220XY1',
    ciudad: 'Av. Constituyentes, Qro.',
    estatus: 'lead',
    proyectos: [],
    responsable: 'usr-emp-1'
  },
  {
    id: 4,
    nombre: 'Innovatech Corp',
    contacto: 'Ing. Sofía Mendoza',
    email: 'info@innovatech.com',
    tel: '+34 611 222 333',
    tipo: 'empresa',
    rfc: 'DCV040118PQ9',
    ciudad: 'El Marqués, Qro.',
    estatus: 'activo',
    proyectos: ['Proyecto A', 'Proyecto B'],
    responsable: 'usr-admin-1'
  },
  {
    id: 5,
    nombre: 'BioFuture Inc',
    contacto: 'Lic. Fernando Bustamante',
    email: 'contact@biofuture.com',
    tel: '+34 644 666 777',
    tipo: 'persona',
    rfc: 'BUPF830410GH2',
    ciudad: 'San Juan del Río, Qro.',
    estatus: 'activo',
    proyectos: ['Proyecto C'],
    responsable: 'usr-emp-1'
  },
  {
    id: 6,
    nombre: 'EcoDesign Ltd',
    contacto: 'Arq. Patricia Noriega',
    email: 'contact@ecodesign.com',
    tel: '+34 622 444 555',
    tipo: 'empresa',
    rfc: 'GIP150302WZ5',
    ciudad: 'Querétaro, Qro.',
    estatus: 'pausado',
    proyectos: ['Proyecto A'],
    responsable: 'usr-emp-1'
  }
]

export const TRAMITES_TIPOS = {
  'uso-suelo': {
    nombre: 'Licencia de Uso de Suelo',
    icono: '',
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
    icono: '',
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
    icono: '',
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
    icono: '',
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
    icono: '',
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

export const EQUIPO = [
  { id: 'u1', nombre: 'Carlos R.', avatar: 'CR', color: '#2A5F3F' },
  { id: 'u2', nombre: 'Laura M.', avatar: 'LM', color: '#1A5276' },
  { id: 'u3', nombre: 'Tomás V.', avatar: 'TV', color: '#5B2C6F' },
]

const hoy = new Date()
const fmt = (d) => d.toISOString().split('T')[0]
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

export const TRAMITES_MOCK = [
  {
    id: 'TRM-001', tipo: 'licencia-const', clienteId: 1,
    folio: 'QRO/LC/2024-0489', presupuestoId: 'COT-001', asignadoA: 'u1',
    prioridad: 'alta', fechaInicio: fmt(addDays(hoy, -18)), pasoActual: 6,
    notas: 'Proyecto en Col. Álamos — 3 plantas, 320m²',
  },
  {
    id: 'TRM-002', tipo: 'uso-suelo', clienteId: 2,
    folio: 'QRO/US/2024-0302', presupuestoId: 'COT-002', asignadoA: 'u2',
    prioridad: 'media', fechaInicio: fmt(addDays(hoy, -7)), pasoActual: 3,
    notas: 'Predio esquina en Juriquilla',
  },
  {
    id: 'TRM-003', tipo: 'division', clienteId: 3,
    folio: 'QRO/DP/2024-0178', presupuestoId: 'COT-003', asignadoA: 'u3',
    prioridad: 'alta', fechaInicio: fmt(addDays(hoy, -28)), pasoActual: 7,
    notas: 'División en 3 fracciones — Col. Centro',
  },
  {
    id: 'TRM-004', tipo: 'ampliacion', clienteId: 4,
    folio: 'QRO/AM/2024-0411', presupuestoId: 'COT-004', asignadoA: 'u1',
    prioridad: 'baja', fechaInicio: fmt(addDays(hoy, -5)), pasoActual: 2,
    notas: 'Ampliación segundo piso casa habitación',
  },
  {
    id: 'TRM-005', tipo: 'proteccion-civil', clienteId: 5,
    folio: 'QRO/PC/2024-0093', presupuestoId: 'COT-005', asignadoA: 'u2',
    prioridad: 'media', fechaInicio: fmt(addDays(hoy, -12)), pasoActual: 5,
    notas: 'Local comercial 180m² en Plaza Antea',
  },
  {
    id: 'TRM-006', tipo: 'uso-suelo', clienteId: 6,
    folio: 'QRO/US/2024-0211', presupuestoId: 'COT-006', asignadoA: 'u2',
    prioridad: 'baja', fechaInicio: fmt(addDays(hoy, -45)), pasoActual: 8,
    notas: 'Licencia de uso de suelo habitacional entregada al cliente',
  },
  {
    id: 'TRM-007', tipo: 'licencia-const', clienteId: 6,
    folio: 'QRO/LC/2024-0512', presupuestoId: 'COT-007', asignadoA: 'u1',
    prioridad: 'alta', fechaInicio: fmt(addDays(hoy, -3)), pasoActual: 1,
    notas: 'Casa habitación 180m² — inicia trámite con uso de suelo ya aprobado',
  },
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
  {
    id: 'TRM-010', tipo: 'division', clienteId: 8,
    folio: 'QRO/DP/2024-0099', presupuestoId: 'COT-009', asignadoA: 'u3',
    prioridad: 'baja', fechaInicio: fmt(addDays(hoy, -60)), pasoActual: 8,
    notas: 'División en 2 lotes — ya inscrita en Registro Público',
  },
  {
    id: 'TRM-011', tipo: 'uso-suelo', clienteId: 9,
    folio: 'QRO/US/2024-0358', presupuestoId: 'COT-010', asignadoA: 'u1',
    prioridad: 'alta', fechaInicio: fmt(addDays(hoy, -14)), pasoActual: 6,
    notas: 'Uso de suelo mixto — complejo de 12 departamentos + locales',
  },
  {
    id: 'TRM-012', tipo: 'ampliacion', clienteId: 9,
    folio: 'QRO/AM/2024-0430', presupuestoId: 'COT-010', asignadoA: 'u3',
    prioridad: 'media', fechaInicio: fmt(addDays(hoy, -2)), pasoActual: 0,
    notas: 'En espera de resolución de uso de suelo para iniciar ampliación',
  },
]

export const initialCotizaciones = [
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
  {
    id: 'COT-002', clienteId: 2, fecha: fmt(addDays(hoy, -9)),
    conceptos: [
      { clave: 'USO-SUE-01', cantidad: 1 },
      { clave: 'DICT-01', cantidad: 1 },
      { clave: 'ALIN-01', cantidad: 1 },
    ],
    abonos: [4200], estatus: 'en-proceso',
  },
  {
    id: 'COT-003', clienteId: 3, fecha: fmt(addDays(hoy, -30)),
    conceptos: [
      { clave: 'DIV-01', cantidad: 1 },
      { clave: 'USO-SUE-02', cantidad: 1 },
    ],
    abonos: [9200, 6800], estatus: 'liquidada',
  },
  {
    id: 'COT-004', clienteId: 4, fecha: fmt(addDays(hoy, -6)),
    conceptos: [
      { clave: 'AMP-01', cantidad: 1 },
      { clave: 'DICT-02', cantidad: 1 },
    ],
    abonos: [], estatus: 'pendiente',
  },
  {
    id: 'COT-005', clienteId: 5, fecha: fmt(addDays(hoy, -14)),
    conceptos: [
      { clave: 'PROT-01', cantidad: 1 },
      { clave: 'LIC-COM-01', cantidad: 1 },
    ],
    abonos: [4500], estatus: 'en-proceso',
  },
  {
    id: 'COT-006', clienteId: 6, fecha: fmt(addDays(hoy, -50)),
    conceptos: [
      { clave: 'USO-SUE-01', cantidad: 1 },
      { clave: 'ALIN-01', cantidad: 1 },
      { clave: 'DICT-01', cantidad: 1 },
    ],
    abonos: [4200, 4700], estatus: 'liquidada',
  },
  {
    id: 'COT-007', clienteId: 6, fecha: fmt(addDays(hoy, -3)),
    conceptos: [
      { clave: 'LIC-RES-01', cantidad: 1 },
      { clave: 'DICT-02', cantidad: 1 },
      { clave: 'REG-01', cantidad: 1 },
    ],
    abonos: [5000], estatus: 'en-proceso',
  },
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
  {
    id: 'COT-009', clienteId: 8, fecha: fmt(addDays(hoy, -65)),
    conceptos: [
      { clave: 'DIV-01', cantidad: 1 },
      { clave: 'DICT-01', cantidad: 1 },
    ],
    abonos: [6150, 6150], estatus: 'liquidada',
  },
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

export const TAREAS_MOCK = [
  { id: 't1', titulo: 'Entregar planos firmados al H. Ayuntamiento', tramiteId: 'TRM-001', asignadoA: 'u1', fecha: fmt(hoy), prioridad: 'alta', hecho: false },
  { id: 't2', titulo: 'Pago de derechos en Tesorería Municipal — TRM-002', tramiteId: 'TRM-002', asignadoA: 'u2', fecha: fmt(hoy), prioridad: 'media', hecho: false },
  { id: 't3', titulo: 'Llamar a Catastro por resolución pendiente TRM-003', tramiteId: 'TRM-003', asignadoA: 'u3', fecha: fmt(hoy), prioridad: 'alta', hecho: true },
  { id: 't4', titulo: 'Recolectar escrituras actualizadas — cliente Noriega', tramiteId: 'TRM-002', asignadoA: 'u2', fecha: fmt(addDays(hoy, -1)), prioridad: 'alta', hecho: false },
  { id: 't5', titulo: 'Enviar presupuesto COT-004 al cliente para revisión', tramiteId: 'TRM-004', asignadoA: 'u1', fecha: fmt(hoy), prioridad: 'baja', hecho: false },
  { id: 't6', titulo: 'Verificar observaciones de Protección Civil — TRM-005', tramiteId: 'TRM-005', asignadoA: 'u2', fecha: fmt(hoy), prioridad: 'media', hecho: true },
  { id: 't7', titulo: ' avance en expediente TRM-001', tramiteId: 'TRM-001', asignadoA: 'u1', fecha: fmt(addDays(hoy, -2)), prioridad: 'baja', hecho: true },
  { id: 't8', titulo: 'Solicitar planos de instalaciones — TRM-005', tramiteId: 'TRM-005', asignadoA: 'u3', fecha: fmt(addDays(hoy, -3)), prioridad: 'alta', hecho: false },
]

export const PROYECTOS_MOCK = [
  {
    id: 'PRY-001',
    nombre: 'Residencial Los Álamos – Fase I',
    tipo: 'licencia-const',
    clienteId: 1,
    estatus: 'en-proceso',
    prioridad: 'alta',
    avance: 65,
    descripcion: 'Licencia de construcción residencial para 3 casas en Col. Álamos, 320m² c/u.',
    fechaInicio: fmt(addDays(hoy, -90)),
    fechaEstimada: fmt(addDays(hoy, 30)),
    responsable: 'u1',
    monto: 42000
  },
  {
    id: 'PRY-002',
    nombre: 'Uso de Suelo Juriquilla – GreenTech',
    tipo: 'uso-suelo',
    clienteId: 2,
    estatus: 'en-proceso',
    prioridad: 'media',
    avance: 40,
    descripcion: 'Obtención de licencia de uso de suelo habitacional/mixto en Juriquilla.',
    fechaInicio: fmt(addDays(hoy, -45)),
    fechaEstimada: fmt(addDays(hoy, 20)),
    responsable: 'u2',
    monto: 15000
  },
  {
    id: 'PRY-003',
    nombre: 'División de Predio Centro Histórico',
    tipo: 'division',
    clienteId: 3,
    estatus: 'completado',
    prioridad: 'alta',
    avance: 100,
    descripcion: 'División de predio en 3 fracciones en la Col. Centro, inscripción en Registro Público.',
    fechaInicio: fmt(addDays(hoy, -120)),
    fechaEstimada: fmt(addDays(hoy, -10)),
    responsable: 'u3',
    monto: 18000
  },
  {
    id: 'PRY-004',
    nombre: 'Ampliación Casa El Marqués',
    tipo: 'ampliacion',
    clienteId: 4,
    estatus: 'pendiente',
    prioridad: 'baja',
    avance: 15,
    descripcion: 'Ampliación de segundo piso en casa habitación, trámite ante Obras Públicas.',
    fechaInicio: fmt(addDays(hoy, -10)),
    fechaEstimada: fmt(addDays(hoy, 45)),
    responsable: 'u1',
    monto: 8800
  },
  {
    id: 'PRY-005',
    nombre: 'Protección Civil Plaza Antea',
    tipo: 'proteccion-civil',
    clienteId: 5,
    estatus: 'en-proceso',
    prioridad: 'media',
    avance: 55,
    descripcion: 'Visto bueno de Protección Civil para local comercial 180m² en Plaza Antea.',
    fechaInicio: fmt(addDays(hoy, -30)),
    fechaEstimada: fmt(addDays(hoy, 15)),
    responsable: 'u2',
    monto: 11500
  },
  {
    id: 'PRY-006',
    nombre: 'Uso de Suelo Habitacional – EcoDesign',
    tipo: 'uso-suelo',
    clienteId: 6,
    estatus: 'completado',
    prioridad: 'baja',
    avance: 100,
    descripcion: 'Licencia de uso de suelo habitacional entregada al cliente. Trámite finalizado.',
    fechaInicio: fmt(addDays(hoy, -150)),
    fechaEstimada: fmt(addDays(hoy, -60)),
    responsable: 'u2',
    monto: 12000
  },
  {
    id: 'PRY-007',
    nombre: 'Licencia de Construcción Casa 180m²',
    tipo: 'licencia-const',
    clienteId: 6,
    estatus: 'en-proceso',
    prioridad: 'alta',
    avance: 8,
    descripcion: 'Casa habitación 180m² – inicia trámite con uso de suelo ya aprobado.',
    fechaInicio: fmt(addDays(hoy, -5)),
    fechaEstimada: fmt(addDays(hoy, 60)),
    responsable: 'u1',
    monto: 22000
  },
  {
    id: 'PRY-008',
    nombre: 'Complejo Departamental San Juan del Río',
    tipo: 'uso-suelo',
    clienteId: 9,
    estatus: 'en-proceso',
    prioridad: 'alta',
    avance: 70,
    descripcion: 'Uso de suelo mixto para complejo de 12 departamentos + locales comerciales.',
    fechaInicio: fmt(addDays(hoy, -60)),
    fechaEstimada: fmt(addDays(hoy, 10)),
    responsable: 'u1',
    monto: 35000
  }
]

export const money = (n) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 })

export const COLOR_MAP = { blue: '#1A5276', amber: '#B87A0A', purple: '#5B2C6F', green: '#2A5F3F', red: '#C0392B' }
export const BG_MAP = { blue: '#EAF2F8', amber: '#FEF3DC', purple: '#F5EEF8', green: '#EBF3EE', red: '#FDEDEB' }

export const AVAILABLE_MODULES = [
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'administracion', label: 'Administración' },
  { id: 'tareas', label: 'Tareas Diarias' },
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'cotizaciones', label: 'Cotizaciones' },
  { id: 'proyectos', label: 'Proyectos' }
]

export const getDefaultModulos = (rol) => {
  if (rol === 'admin') return ['presupuestos', 'administracion', 'tareas', 'catalogo', 'cotizaciones', 'proyectos']
  if (rol === 'empleado' || rol === 'gestor') return ['presupuestos', 'tareas', 'catalogo', 'cotizaciones', 'proyectos']
  return ['presupuestos', 'cotizaciones']
}

export const initialPresupuestosDB = [
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


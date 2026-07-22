// ─── CATÁLOGO DE CONCEPTOS DE GESTORÍA ────────────────────────────────────────
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

// ─── CLIENTES ─────────────────────────────────────────────────────────────────
// 3 empresas principales — coherentes con proyectos, cotizaciones y trámites
export const CLIENTES = [
  {
    id: 1,
    nombre: 'Urbania Desarrollos',
    nombreComercial: 'Urbania Desarrollos S.A. de C.V.',
    contacto: 'Arq. Alejandro Gómez Reyes',
    email: 'agomez@urbania.mx',
    tel: '+52 442 310 8800',
    tipo: 'empresa',
    personaTipo: 'moral',
    apoderado: 'Arq. Alejandro Gómez Reyes',
    rfc: 'UDE180512KL4',
    rfcFiscal: 'UDE180512KL4',
    ciudad: 'Juriquilla, Querétaro, Qro.',
    direccionFiscal: 'Blvd. Juriquilla 1200, Edificio Torre Business, Piso 4, Querétaro, Qro.',
    estatus: 'activo',
    proyectos: ['PRY-001'],
    responsable: 'u1',
    notas: 'Desarrolladora con más de 15 años en el mercado queretano. Proyecto actual: Residencial Los Álamos Fase I.',
  },
  {
    id: 2,
    nombre: 'GreenTech Solutions',
    nombreComercial: 'GreenTech Solutions S.A. de C.V.',
    contacto: 'Ing. Roberto Fuentes Herrera',
    email: 'rfuentes@greentech.mx',
    tel: '+52 442 198 4400',
    tipo: 'empresa',
    personaTipo: 'moral',
    apoderado: 'Ing. Roberto Fuentes Herrera',
    rfc: 'GTS920801TT2',
    rfcFiscal: 'GTS920801TT2',
    ciudad: 'Juriquilla, Querétaro, Qro.',
    direccionFiscal: 'Av. de las Ciencias 700, Juriquilla, Querétaro, Qro.',
    estatus: 'activo',
    proyectos: ['PRY-002'],
    responsable: 'u2',
    notas: 'Empresa de tecnología logística. Requiere parque industrial con bodega y oficinas en Juriquilla.',
  },
  {
    id: 3,
    nombre: 'Inversiones Robles',
    nombreComercial: 'Inversiones Robles S.A. de C.V.',
    contacto: 'Lic. Patricia Robles Aguirre',
    email: 'probles@invrobles.com',
    tel: '+52 427 272 6600',
    tipo: 'empresa',
    personaTipo: 'moral',
    apoderado: 'Lic. Patricia Robles Aguirre',
    rfc: 'IRO050615MN7',
    rfcFiscal: 'IRO050615MN7',
    ciudad: 'San Juan del Río, Querétaro, Qro.',
    direccionFiscal: 'Av. Juárez Norte 450, Col. Centro, San Juan del Río, Qro.',
    estatus: 'activo',
    proyectos: ['PRY-003'],
    responsable: 'u3',
    notas: 'Grupo inversionista dueño de Plaza Comercial en San Juan del Río. Trámites completados.',
  },
]

// ─── TIPOS DE TRÁMITES ────────────────────────────────────────────────────────
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

// ─── EQUIPO ───────────────────────────────────────────────────────────────────
export const EQUIPO = [
  { id: 'usr-admin-1', nombre: 'Administrador', avatar: 'AD', color: '#2A5F3F' },
  { id: 'usr-gestor-1', nombre: 'Gestor de Obra', avatar: 'GO', color: '#1A5276' },
  { id: 'usr-gestor-2', nombre: 'Gestor de Trámites', avatar: 'GT', color: '#5B2C6F' },
]

const hoy = new Date()
const fmt = (d) => d.toISOString().split('T')[0]
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

// ─── TRÁMITES ─────────────────────────────────────────────────────────────────
// Ligados directamente con los proyectos y clientes
export const TRAMITES_MOCK = [
  // Cliente 1 — Urbania Desarrollos — Proyecto PRY-001
  {
    id: 'TRM-001',
    tipo: 'licencia-const',
    clienteId: 1,
    proyectoId: 'PRY-001',
    folio: 'QRO/LC/2024-0489',
    presupuestoId: 'COT-001',
    asignadoA: 'usr-admin-1',
    prioridad: 'alta',
    fechaInicio: fmt(addDays(hoy, -42)),
    pasoActual: 6,
    notas: 'Residencial Los Álamos — 3 viviendas de 3 plantas, 320m² c/u. Expediente ingresado el ' + fmt(addDays(hoy, -14)) + '. Pendiente respuesta de Obras Públicas.',
  },
  // Cliente 2 — GreenTech Solutions — Proyecto PRY-002
  {
    id: 'TRM-002',
    tipo: 'uso-suelo',
    clienteId: 2,
    proyectoId: 'PRY-002',
    folio: 'QRO/US/2024-0302',
    presupuestoId: 'COT-002',
    asignadoA: 'usr-gestor-1',
    prioridad: 'alta',
    fechaInicio: fmt(addDays(hoy, -21)),
    pasoActual: 4,
    notas: 'Parque logístico Juriquilla — Uso de suelo industrial. Alineamiento tramitado. Pendiente pago de derechos en Tesorería.',
  },
  {
    id: 'TRM-003',
    tipo: 'licencia-const',
    clienteId: 2,
    proyectoId: 'PRY-002',
    folio: 'QRO/LC/2024-0512',
    presupuestoId: 'COT-002',
    asignadoA: 'usr-gestor-1',
    prioridad: 'media',
    fechaInicio: fmt(addDays(hoy, -10)),
    pasoActual: 2,
    notas: 'Inicia en paralelo al uso de suelo. En espera de resolución favorable para continuar con planos estructurales.',
  },
  // Cliente 3 — Inversiones Robles — Proyecto PRY-003 (completado)
  {
    id: 'TRM-004',
    tipo: 'proteccion-civil',
    clienteId: 3,
    proyectoId: 'PRY-003',
    folio: 'QRO/PC/2024-0093',
    presupuestoId: 'COT-003',
    asignadoA: 'usr-gestor-2',
    prioridad: 'alta',
    fechaInicio: fmt(addDays(hoy, -85)),
    pasoActual: 7,
    notas: 'Plaza Comercial San Juan del Río — Visto Bueno de Protección Civil entregado el ' + fmt(addDays(hoy, -20)) + '. Trámite completado.',
  },
]

// ─── COTIZACIONES ─────────────────────────────────────────────────────────────
// Enlazadas con los mismos clientes y proyectos
export const initialCotizaciones = [
  {
    // Urbania Desarrollos — Los Álamos — en proceso
    id: 'COT-001',
    clienteId: 1,
    proyectoId: 'PRY-001',
    fecha: fmt(addDays(hoy, -45)),
    conceptos: [
      { clave: 'LIC-RES-02', cantidad: 1 },
      { clave: 'DICT-02', cantidad: 1 },
      { clave: 'REG-01', cantidad: 1 },
      { clave: 'ALIN-01', cantidad: 1 },
    ],
    abonos: [14000, 8000],
    estatus: 'en-proceso',
  },
  {
    // GreenTech Solutions — Parque Logístico — en proceso
    id: 'COT-002',
    clienteId: 2,
    proyectoId: 'PRY-002',
    fecha: fmt(addDays(hoy, -22)),
    conceptos: [
      { clave: 'USO-SUE-02', cantidad: 1 },
      { clave: 'LIC-COM-02', cantidad: 1 },
      { clave: 'DICT-01', cantidad: 1 },
      { clave: 'DICT-02', cantidad: 1 },
    ],
    abonos: [15000],
    estatus: 'en-proceso',
  },
  {
    // Inversiones Robles — Plaza Comercial — liquidada
    id: 'COT-003',
    clienteId: 3,
    proyectoId: 'PRY-003',
    fecha: fmt(addDays(hoy, -90)),
    conceptos: [
      { clave: 'PROT-01', cantidad: 1 },
      { clave: 'CONN-01', cantidad: 1 },
      { clave: 'TERM-01', cantidad: 1 },
    ],
    abonos: [4500, 3800, 2200],
    estatus: 'liquidada',
  },
]

// ─── TAREAS DIARIAS ───────────────────────────────────────────────────────────
// Ligadas a trámites reales y al equipo
export const TAREAS_MOCK = [
  {
    id: 't1',
    titulo: 'Entregar planos firmados por DRO al H. Ayuntamiento — TRM-001',
    tramiteId: 'TRM-001',
    proyectoId: 'PRY-001',
    asignadoA: 'usr-admin-1',
    fecha: fmt(hoy),
    prioridad: 'alta',
    hecho: false,
  },
  {
    id: 't2',
    titulo: 'Gestionar pago de derechos en Tesorería Municipal — TRM-002',
    tramiteId: 'TRM-002',
    proyectoId: 'PRY-002',
    asignadoA: 'usr-gestor-1',
    fecha: fmt(hoy),
    prioridad: 'alta',
    hecho: false,
  },
  {
    id: 't3',
    titulo: 'Solicitar escrituras notariales actualizadas — cliente GreenTech',
    tramiteId: 'TRM-002',
    proyectoId: 'PRY-002',
    asignadoA: 'usr-gestor-1',
    fecha: fmt(addDays(hoy, -1)),
    prioridad: 'media',
    hecho: false,
  },
  {
    id: 't4',
    titulo: 'Verificar estado del expediente TRM-001 en ventanilla Obras Públicas',
    tramiteId: 'TRM-001',
    proyectoId: 'PRY-001',
    asignadoA: 'usr-admin-1',
    fecha: fmt(addDays(hoy, -2)),
    prioridad: 'baja',
    hecho: true,
  },
  {
    id: 't5',
    titulo: 'Confirmar recepción del Visto Bueno de Protección Civil — TRM-004',
    tramiteId: 'TRM-004',
    proyectoId: 'PRY-003',
    asignadoA: 'usr-gestor-2',
    fecha: fmt(addDays(hoy, -5)),
    prioridad: 'alta',
    hecho: true,
  },
  {
    id: 't6',
    titulo: 'Enviar avance de trámite TRM-003 al contacto de GreenTech',
    tramiteId: 'TRM-003',
    proyectoId: 'PRY-002',
    asignadoA: 'u2',
    fecha: fmt(hoy),
    prioridad: 'media',
    hecho: false,
  },
]

// ─── PROYECTOS ────────────────────────────────────────────────────────────────
// Cada proyecto está ligado a exactamente un cliente
export const PROYECTOS_MOCK = [
  {
    id: 'PRY-001',
    nombre: 'Residencial Los Álamos — Fase I',
    tipo: 'licencia-const',
    clienteId: 1,
    estatus: 'en-proceso',
    prioridad: 'alta',
    avance: 58,
    descripcion: 'Desarrollo residencial de 3 viviendas unifamiliares de 3 plantas (320m² c/u) en Col. Álamos, Querétaro. Incluye tramitología completa ante el H. Ayuntamiento.',
    fechaInicio: fmt(addDays(hoy, -90)),
    fechaEstimada: fmt(addDays(hoy, 45)),
    responsable: 'u1',
    monto: 34500,
    ubicacion: 'Col. Álamos, Querétaro, Qro.',
    alcance: 'Licencia de construcción residencial para 3 viviendas de 3 plantas, cálculo estructural, registro ante IMSS y dictamen de factibilidad de servicios. Gestoría completa ante Obras Públicas.',
  },
  {
    id: 'PRY-002',
    nombre: 'Parque Logístico Juriquilla — GreenTech',
    tipo: 'licencia-const',
    clienteId: 2,
    estatus: 'en-proceso',
    prioridad: 'alta',
    avance: 28,
    descripcion: 'Nave industrial y oficinas administrativas de 2,400m² en Juriquilla. Tramitología de uso de suelo industrial y licencia de construcción.',
    fechaInicio: fmt(addDays(hoy, -25)),
    fechaEstimada: fmt(addDays(hoy, 75)),
    responsable: 'u2',
    monto: 29500,
    ubicacion: 'Av. de las Ciencias s/n, Juriquilla, Qro.',
    alcance: 'Uso de suelo industrial, licencia de construcción para nave de 2,400m² con oficinas. Dictamen de factibilidad, alineamiento y registro de obra.',
  },
  {
    id: 'PRY-003',
    nombre: 'Plaza Comercial San Juan del Río — Adecuación',
    tipo: 'proteccion-civil',
    clienteId: 3,
    estatus: 'completado',
    prioridad: 'media',
    avance: 100,
    descripcion: 'Visto Bueno de Protección Civil y trámites de conexión para plaza comercial de 8 locales en San Juan del Río. Proyecto completado y entregado.',
    fechaInicio: fmt(addDays(hoy, -110)),
    fechaEstimada: fmt(addDays(hoy, -20)),
    responsable: 'u3',
    monto: 10087,
    ubicacion: 'Av. Juárez Norte 450, San Juan del Río, Qro.',
    alcance: 'Visto Bueno de Protección Civil, conexión a red de agua potable y aviso de terminación de obra para plaza comercial de 8 locales.',
  },
  {
    id: 'PRY-004',
    nombre: 'Comercializadora Santos Lugo',
    tipo: 'licencia-const',
    clienteId: 1,
    estatus: 'en-proceso',
    prioridad: 'alta',
    avance: 45,
    descripcion: 'Proyecto de gestoría integral urbana para Comercializadora Santos Lugo.',
    fechaInicio: '2026-07-03',
    fechaEstimada: '2027-01-03',
    responsable: 'u1',
    monto: 1215037.50,
    ubicacion: 'Tablajes 20690 Colonia Centro, Mérida, Yucatán',
    alcance: 'Licencia de uso de suelo para construcción, factibilidad CFE y agua potable, dictamen de impacto vial, MIA, licencia de construcción, visto bueno de protección civil, y licencia de funcionamiento.',
  }
]

// ─── PRESUPUESTOS DE OBRA ─────────────────────────────────────────────────────
// 4 versiones enlazadas con proyectos reales
export const initialPresupuestosDB = [
  // ── PRY-004 Comercializadora Santos Lugo (Caso Real PDF) ─────────────────
  {
    id: 'PRES-001',
    proyectoId: 'PRY-004',
    version: '2.00',
    estado: 'Aprobado',
    isBaseline: true,
    titulo: 'Presupuesto de Gestión, Trámites y Estudios — Santos Lugo',
    fecha: '2026-07-03',
    clienteId: 1,
    
    // Metadatos del predio
    propietario: 'SANTOS LUGO',
    direccion: 'TABLAJES 20690 COLONIA CENTRO',
    supPredio: 8307.29,
    supConstExistente: 0.00,
    supIntervenir: 4300.00,
    uso: 'TIENDA DE ABARROTES',
    clasificacion: 'BAJO IMPACTO',
    zonaPrimaria: '2',
    tipoVialidad: 'LOCAL',
    estimacion: '',
    costoDirectoConstruccion: 77400000.00,
    infoAdicionalJson: JSON.stringify({
      duracionUsoSuelo: "3 meses",
      duracionLicenciaConst: "6 meses",
      duracionTerminacionObra: "4 meses a partir de la finalización de obra",
      duracionLicenciaFunc: "3 meses",
      documentosTecnicos: "PROYECTO ARQUITECTONICO, PROYECTOS DE INGENIERIAS ESTRUCTURAL, ELECTRICA MEDIA Y BAJA TENSIÓN, HIDROSANITARIA, ETC., MEMORIAS RESPONSIVAS DE CADA INGENIERIA Y FIRMAS DE RESPONSIVA POR ESPECIALIDAD ESTATAL Y FEDERAL",
      documentosLegales: "ESCRITURAS DE PROPIEDAD, ACTUALIZACIONES CATASTRALES, IMPUESTO PREDIAL 2026, CERTIFICACIONES NOTARIALES DE DOCUMENTOS, CEDULAS, PLANOS CATASTRALES, IDENTIFICACIONES DE PROPIETARIOS Y ESCRITURA DE APODERADO O REPRESENTANTE LEGAL.",
      derechosGastos: "CORREN POR CUENTA UNICA Y EXCLUSIVA DE LOS PROMOVENTES DEL PROYECTO, EN NINGUN CASO EL GESTOR SE HARÁ CARGO DE PAGAR LOS DERECHOS, LICENCIAS O PERMISOS.",
      formaPago: "50% DE ANTICIPO, SALDOS DE 50% POR EVENTO CONCLUIDO. POR ETAPA",
      exclusiones: "MULTAS O CLAUSURAS DURANTE LAS GESTIONES DERIVADOS DE DECISIONES DE LOS PROPIETARIOS O CONSTRUCTOR DEL PROYECTO, MODIFICACIONES A PROYECTO POR INCUMPLIR REGLAMENTO DE CONSTRUCCIONES, MODIFICACIONES A PLANOS POR CAMBIOS EN OBRA.",
      notas: "CUALQUIER OTRA GESTIÓN, TRÁMITE O ESTUDIO DERIVADO DE LAS GESTIONES QUE NO ESTÉ ENLISTADO EN ESTE PRESUPUESTO SE COTIZARÁ POR SEPARADO",
      firmadoPor: "ARQ. GABRIEL LÓPEZ CERVERA",
      firmadoCargo: "DIRECTOR / GESTIÓN INTEGRAL URBANA",
      firmadoCedula: "CEDULA PROFESIONAL 3770298 / P.C.M. L-055 / DC24-L010"
    }),
    conceptos: [
      // Uso de Suelo
      { no: 1, etapa: 'Uso de Suelo', concepto: 'DILIGENCIA DE VERIFICACION DE MARCAJE DE PREDIOS E INVESTIGACION DOCUMENTAL CON LEVANTAMIENTO TOPOGRAFICO ANTE CATASTRO DE MÉRIDA', unidad: 'TRAMITE', honorarios: 7200, comentarios: 'PARA VALIDAR LAS MEDIDAS FISICAS Y DOCUMENTALES DEL PREDIO.(MONTO APROXIMADO DE DERECHOS)', pagoDerechos: 15000, extra: 0, empleadoAsignadoId: 'u1' },
      { no: 2, etapa: 'Uso de Suelo', concepto: 'FACTIBILIDAD URBANO AMBIENTAL ANTE I.M.D.U.T., INCLUYE: ELABORACIÓN DE MEMORIA DESCRIPTIVA COMPLETA, COORDENADAS, FOTOGRAFIAS ELABORACIÓN DE EXPEDIENTE Y GESTIÓN', unidad: 'GESTIÓN', honorarios: 14000, comentarios: 'DETERMINA SI UN PROYECTO ES COMPATIBLE CON UN USO DEL SUELO, NECESARIO PARA OBTENER LA LICENCIA DE USO DE SUELO. SE PUEDE ACELERAR LA ENTREGA A 1 SEMANA Y CON ELLO AHORRAR DE 3 A 4 MESES DE GESTIÓN. PREVIA PLATICA CON PROMOVENTE.', pagoDerechos: 2066, extra: 60000, empleadoAsignadoId: 'u1' },
      { no: 3, etapa: 'Uso de Suelo', concepto: 'LICENCIA DE USO DE SUELO PARA CONSTRUCCIÓN, INCLUYE: MEMORIA DESCRIPTIVA, ELABORACIÓN DE EXPEDIENTE, FOTOGRAFIAS Y GESTIÓN', unidad: 'GESTIÓN', honorarios: 16000, comentarios: 'PARA OBTENER LA LICENCIA DE CONSTRUCCION', pagoDerechos: 12728.14, extra: 0, empleadoAsignadoId: 'u1' },
      // Licencia de Construcción
      { no: 4, etapa: 'Licencia de Construcción', concepto: 'FACTIBILIDAD DE USO DE SUELO, INCLUYE: INGRESO DE FORMATO, MEMORIA DESCRIPTIVA BREVE Y TRAMITE', unidad: 'TRAMITE', honorarios: 2000, comentarios: 'PARA REALIZAR LAS FACTIBILIDADES DE AGUA Y ENERGIA', pagoDerechos: 235, extra: 0, empleadoAsignadoId: 'u2' },
      { no: 5, etapa: 'Licencia de Construcción', concepto: 'CEDULA Y PLANO CATASTRAL 2026 PARA TRAMITES Y CERTIFICADO DE INSCRIPCION AL INSEJUPY, INCLUYE: ENVIO DE CORREOS PARA SOLICITAR FORMATOS DE PAGO Y TRAMITE', unidad: 'TRAMITE', honorarios: 2000, comentarios: 'NECESARIO PARA OBTENER FACTIBILIDADES DE AGUA Y CFE', pagoDerechos: 600, extra: 0, empleadoAsignadoId: 'u2' },
      { no: 6, etapa: 'Licencia de Construcción', concepto: 'FACTIBILIDAD DE DOTACIÓN DE SERVICIO DE ENERGÍA ELÉCTRICA (C.F.E.), INCLUYE: ELABORACIÓN DE EXPEDIENTE TECNICO, ELABORACIÓN DE OFICIOS, INGRESO PRESENCIAL Y GESTIÓN', unidad: 'TRAMITE', honorarios: 4500, comentarios: 'PARA FACTIBILIDAD DE ENERGIA ELECTRICA, NECESARIO PARA LICENCIA DE CONSTRUCCIÓN', pagoDerechos: 0, extra: 0, empleadoAsignadoId: 'u2' },
      { no: 7, etapa: 'Licencia de Construcción', concepto: 'FACTIBILIDAD O NEGATIVA DE SERVICIO DE AGUA POTABLE (J.A.P.A.Y.), INCLUYE: ELABORACIÓN DE EXPEDIENTE TECNICO, ELABORACIÓN DE OFICIOS, ELABORACIÓN DE MEMORIA TECNICA PARA GASTO DE AGUA, INGRESO PRESENCIAL Y GESTIÓN', unidad: 'TRAMITE', honorarios: 6500, comentarios: 'PARA FACTIBILIDAD DE AGUA POTABLE, NECESARIO PARA LICENCIA DE CONSTRUCCIÓN', pagoDerechos: 587, extra: 0, empleadoAsignadoId: 'u2' },
      { no: 8, etapa: 'Licencia de Construcción', concepto: 'ELABORACIÓN DE ESTUDIO DE IMPACTO VIAL Y GESTION ANTE S.S.P., INCLUYE: ELABORACIÓN DE ESTUDIO, METRICAS, ELABORACIÓN DE PLANO VIAL, ACTUALIZACIONES, RESPUESTAS A REQUERIMIENTOS TECNICOS, VISITAS A LA AUTORIDAD PARA GESTIÓN, RECOMENDACIONES A PROYECTISTAS E INVERSIONISTAS PARA AUTORIZACIÓN Y TRAMITE', unidad: 'GESTIÓN', honorarios: 45000, comentarios: 'PARA OBTENER AUTORIZACIÓN VIAL', pagoDerechos: 6472, extra: 0, empleadoAsignadoId: 'u1' },
      { no: 9, etapa: 'Licencia de Construcción', concepto: 'GESTIÓN ANTE CONAGUA PARA LA CONCESIÓN DE AGUAS NACIONALES (APROVECHAMIENTO, PERFORACIÓN DE POZO Y DESCARGA) INCLUYE: ELABORACIÓN DE EXPEDIENTE TECNICO, COORDINACIÓN DE E-FIRMA CON PROPIETARIO, REALIZACIÓN DE FIRMA "MX", OBTENCIÓN DE ACUSE DE INGRESO Y SEGUIMIENTO DE TRAMITE HASTA OBTENER LA CONCESIÓN.', unidad: 'GESTIÓN', honorarios: 28000, comentarios: 'NECESARIO PARA GARANTIZAR LA OBTENCIÓN DE AGUA POTABLE', pagoDerechos: 25000, extra: 0, empleadoAsignadoId: 'u2' },
      { no: 10, etapa: 'Licencia de Construcción', concepto: 'ELABORACION DE MANIFIESTO DE IMPACTO AMBIENTAL, INCLUYE: ESTUDIO, PROGRAMAS ANEXOS, FOTOGRAFIAS DE DRON Y ESTUDIO DE IMPACTO SOCIAL', unidad: 'ESTUDIO', honorarios: 95000, comentarios: 'PARA OBTENER RESOLUTIVO AMBIENTAL', pagoDerechos: 19217, extra: 0, empleadoAsignadoId: 'u1' },
      { no: 11, etapa: 'Licencia de Construcción', concepto: 'GESTIÓN PARA AUTORIZACIÓN DE INFORME PREVENTIVO AMBIENTAL ANTE S.D.S. INCLUYE: ELABORACIÓN DE PLANO DE ÁREAS VERDES, CONTESTACIONES A AUTORIDAD POR REVISIÓN TECNICA Y GESTIÓN.', unidad: 'GESTIÓN', honorarios: 22000, comentarios: 'PARA OBTENER RESOLUTIVO AMBIENTAL', pagoDerechos: 0, extra: 100000, empleadoAsignadoId: 'u1' },
      { no: 12, etapa: 'Licencia de Construcción', concepto: 'TRABAJOS PRELIMINARES DE OBRA, INCLUYE: ELABORACIÓN DE EXPEDIENTE, INGRESO Y SEGUIMIENTO DE RESPUESTA', unidad: 'PROYECTO', honorarios: 3000, comentarios: 'PARA REALIZAR TRAZOS, EXCAVACIONES Y CIMENTACIONES PREVIOS A LA CONSTRUCCIÓN, SE OBTIENE DESPUES DE LA SEGUNDA REVISIÓN DEL PROYECTO.', pagoDerechos: 351.93, extra: 0, empleadoAsignadoId: 'u2' },
      { no: 13, etapa: 'Licencia de Construcción', concepto: 'LICENCIA PARA CONSTRUCCIÓN, INCLUYE: CALIFICAR PRELIMINAR DE PARAMETROS DE DISEÑO, REUNIONES CON PROYECTISTA PARA CUMPLIMIENTO DE RCCM, ELABORACION DE PLANOS Y TABLAS DE LICENCIA DE CONSTRUCCIÓN, ELABORACIÓN DE PROYECTO DE SEÑALETICA DE SEGURIDAD HUMANA, ELABORACIÓN DE MEMORIAS DE VENTILACIÓN, ILUMINACIÓN ARTIFICIAL Y EXTRACCIÓN, REVISIÓN DE MEMORIAS DE INGENIERIAS, REVISIÓN DE RESPONSIVAS DE INGENIERIAS, ELABORACIÓN DE RESPONSIVAS DE OBRA, OFICIOS DE JUSTIFICACIÓN, GESTIÓN DE LICENCIA DE CONSTRUCCIÓN ANTE DDU Y VISITAS DE BITACORA ELECTRONICA. INCLUYE FIRMA DE P.C.M.', unidad: 'GESTIÓN', honorarios: 118500, comentarios: 'DEPENDERÁ DE LOS M2 DE CONSTRUCCIÓN FINALES, SE TOMARON EN CUENTA LOS M2 DECLARADOS EN EL PROYECTO ACTUAL. LOS DERECHOS ESTAN BASADOS EN U.M.A. 2026', pagoDerechos: 181589, extra: 0, empleadoAsignadoId: 'u1' },
      // Terminación de Obra
      { no: 14, etapa: 'Terminación de Obra', concepto: 'RECEPCION DE DISPOSITIVOS VIALES (SSP), INCLUYE: ELABORACION DE OFICIO, COMPARATIVA DE PRESUPUESTOS, SEGUIMIENTO DE PRESUPUESTO, COORDINACIÓN DE ENTREGA Y OBTENCIÓN DE RESOLUTIVO FINAL', unidad: 'GESTIÓN', honorarios: 9000, comentarios: 'EL COSTO DEL DERECHO ES VARIABLE SEGÚN DETERMINE LA S.S.P. (PENDIENTE DE CONTABILIZAR EN LOS PAGOS DE DERECHOS)', pagoDerechos: 150000, extra: 0, empleadoAsignadoId: 'u2' },
      { no: 15, etapa: 'Terminación de Obra', concepto: 'ACTA CIRCUNSTANCIADA EN MATERIA DE SEGURIDAD EN EL MARCO CONTRA INCENDIO Y SEGURIDAD HUMANA ANTE BOMBEROS, INCLUYE: ELABORACIÓN DE PLANOS, VISITAS PREVIAS CON CLIENTE, VISITAS AL SITIO CON LA SUPERVISION DE BOMBEROS, ACTUALIZACIONES, CAMBIOS Y OBTENCIÓN DE RESOLUTIVO', unidad: 'GESTIÓN', honorarios: 20000, comentarios: 'PARA LA APROBACIÓN DE LA SEÑALETICA INTERNA DEL PROYECTO, SEGURIDAD HUMANA Y SALIDAS DE EMERGENCIA', pagoDerechos: 2426, extra: 0, empleadoAsignadoId: 'u1' },
      { no: 16, etapa: 'Terminación de Obra', concepto: 'CONSTANCIA DE TERMINACION DE OBRA Y CONSTANCIA DE RECEPCIÓN DE AGUAS RESIDUALES, INCLUYE: CALIFICAR PRELIMINAR DE PROYECTO TERMINADO, ELABORACION DE PLANOS Y TABLAS DE TERMINACIÓN DE OBRA, ELABORACIÓN DE OFICIOS DE RESPONSIVAS FINALES, OFICIOS DE JUSTIFICACIÓN Y GESTIÓN ANTE DDU.', unidad: 'GESTIÓN', honorarios: 59500, comentarios: 'PARA OBTENER LA TERMINACIÓN DE OBRA. LOS DERECHOS ESTAN BASADOS EN U.M.A. 2026', pagoDerechos: 36511.29, extra: 0, empleadoAsignadoId: 'u2' },
      // Licencia de Funcionamiento
      { no: 17, etapa: 'Licencia de Funcionamiento', concepto: 'TRAMITE DE ANUNCIO PERMANENTE, INCLUYE: ELABORACIÓN DE FORMATOS, ELABORACIÓN DE EXPEDIENTE, FOTOGRAFIAS Y GESTIÓN ANTE DDU. (NO INCLUYE CALCULO ESTRUCTURAL NI TRAMITE DE POLIZA DE GARANTIA) INCLUYE FIRMA DE P.C.M.', unidad: 'GESTIÓN', honorarios: 16500, comentarios: 'PARA TRAMITAR LA AUTORIZA LA INSTALACIÓN DE ANUNCIOS EN PREDIOS', pagoDerechos: 587, extra: 0, empleadoAsignadoId: 'u2' },
      { no: 18, etapa: 'Licencia de Funcionamiento', concepto: 'LICENCIA DE USO DE SUELO PARA FUNCIONAMIENTO, INCLUYE: MEMORIA DESCRIPTIVA, ELABORACIÓN DE EXPEDIENTE, FOTOGRAFIAS Y GESTIÓN', unidad: 'GESTIÓN', honorarios: 22000, comentarios: 'PARA OBTENER LA LICENCIA DE FUNCIONAMIENTO. LOS DERECHOS ESTAN BASADOS EN U.M.A. 2026', pagoDerechos: 12728.14, extra: 0, empleadoAsignadoId: 'u2' },
      { no: 19, etapa: 'Licencia de Funcionamiento', concepto: 'LICENCIA DE FUNCIONAMIENTO, INCLUYE: ELABORACIÓN DE FORMATOS, ELABORACIÓN DE EXPEDIENTE, OFICIOS DE JUSTIFICACIÓN Y GESTIÓN ANTE DDU.', unidad: 'GESTIÓN', honorarios: 16500, comentarios: 'LAS DETERMINACIONES SANITARIAS NO ESTAN INCLUIDAS EN ESTE TRAMITE.', pagoDerechos: 587, extra: 0, empleadoAsignadoId: 'u2' }
    ]
  },
  // ── PRY-001 Residencial Los Álamos (Adaptado) ────────────────────────────
  {
    id: 'PRES-002',
    proyectoId: 'PRY-001',
    version: 'V1.0',
    estado: 'Aprobado',
    isBaseline: true,
    titulo: 'Presupuesto Base — Residencial Los Álamos Fase I',
    fecha: fmt(addDays(hoy, -60)),
    clienteId: 1,
    propietario: 'URBANIA DESARROLLOS',
    direccion: 'BLVD. JURIQUILLA 1200, JURIQUILLA',
    supPredio: 1500,
    supConstExistente: 0.00,
    supIntervenir: 960.00,
    uso: 'RESIDENCIAL',
    clasificacion: 'BAJO IMPACTO',
    zonaPrimaria: 'Habitacional',
    tipoVialidad: 'LOCAL',
    estimacion: '',
    costoDirectoConstruccion: 15000000.00,
    infoAdicionalJson: JSON.stringify({
      duracionUsoSuelo: "2 meses",
      duracionLicenciaConst: "3 meses",
      documentosTecnicos: "Planos arquitectónicos firmados por DRO, Memoria de cálculo estructural",
      documentosLegales: "Escritura del predio, Identificación oficial del propietario",
      derechosGastos: "Corren por cuenta del propietario.",
      formaPago: "50% de anticipo, 50% al finalizar"
    }),
    conceptos: [
      { no: 1, etapa: 'Uso de Suelo', concepto: 'Licencia de Uso de Suelo Habitacional y Factibilidad de Servicios', unidad: 'GESTIÓN', honorarios: 12000, comentarios: 'Verificación de zonificación y factibilidad', pagoDerechos: 4200, extra: 0, empleadoAsignadoId: 'u1' },
      { no: 2, etapa: 'Licencia de Construcción', concepto: 'Trámite de Licencia de Construcción Residencial con firmas de DRO', unidad: 'GESTIÓN', honorarios: 18000, comentarios: 'Revisión estructural e ingreso', pagoDerechos: 8500, extra: 0, empleadoAsignadoId: 'u2' }
    ]
  },
  // ── PRY-002 Parque Logístico (Adaptado) ──────────────────────────────────
  {
    id: 'PRES-003',
    proyectoId: 'PRY-002',
    version: 'V1.0',
    estado: 'Enviado',
    isBaseline: false,
    titulo: 'Presupuesto Inicial — Parque Logístico Juriquilla',
    fecha: fmt(addDays(hoy, -18)),
    clienteId: 2,
    propietario: 'GREENTECH SOLUTIONS',
    direccion: 'AV. DE LAS CIENCIAS 700, JURIQUILLA',
    supPredio: 5000,
    supConstExistente: 0.00,
    supIntervenir: 2400.00,
    uso: 'INDUSTRIAL',
    clasificacion: 'MEDIANO IMPACTO',
    zonaPrimaria: 'Industrial',
    tipoVialidad: 'SECUNDARIA',
    estimacion: '',
    costoDirectoConstruccion: 25000000.00,
    infoAdicionalJson: JSON.stringify({
      duracionUsoSuelo: "2 meses",
      duracionLicenciaConst: "4 meses",
      documentosTecnicos: "Estudio de impacto ambiental y vial, cálculo de naves",
      documentosLegales: "Escrituras y actas constitutivas",
      derechosGastos: "Exclusivo de GreenTech"
    }),
    conceptos: [
      { no: 1, etapa: 'Uso de Suelo', concepto: 'Licencia de Uso de Suelo Comercial / Mixto e Industrial', unidad: 'GESTIÓN', honorarios: 15000, comentarios: 'Zonificación autorizada', pagoDerechos: 6800, extra: 0, empleadoAsignadoId: 'u2' },
      { no: 2, etapa: 'Licencia de Construcción', concepto: 'Licencia de Construcción Comercial / Industrial Naves', unidad: 'GESTIÓN', honorarios: 22000, comentarios: 'Ingreso y atención de observaciones', pagoDerechos: 19800, extra: 0, empleadoAsignadoId: 'u2' }
    ]
  },
  // ── PRY-003 Plaza Comercial (Adaptado) ───────────────────────────────────
  {
    id: 'PRES-004',
    proyectoId: 'PRY-003',
    version: 'V1.0',
    estado: 'Aprobado',
    isBaseline: true,
    titulo: 'Presupuesto de Adecuación — Plaza Comercial San Juan del Río',
    fecha: fmt(addDays(hoy, -95)),
    clienteId: 3,
    propietario: 'INVERSIONES ROBLES',
    direccion: 'AV. JUÁREZ NORTE 450, SAN JUAN DEL RÍO',
    supPredio: 3500,
    supConstExistente: 1200.00,
    supIntervenir: 800.00,
    uso: 'COMERCIAL',
    clasificacion: 'MEDIANO IMPACTO',
    zonaPrimaria: 'Comercial',
    tipoVialidad: 'PRINCIPAL',
    estimacion: '',
    costoDirectoConstruccion: 8000000.00,
    infoAdicionalJson: JSON.stringify({
      duracionTerminacionObra: "2 meses",
      duracionLicenciaFunc: "1 mes"
    }),
    conceptos: [
      { no: 1, etapa: 'Terminación de Obra', concepto: 'Aviso de Terminación de Obra y Ocupación ante Obras Públicas', unidad: 'GESTIÓN', honorarios: 4500, comentarios: 'Cierre del expediente de construcción', pagoDerechos: 2200, extra: 0, empleadoAsignadoId: 'u3' },
      { no: 2, etapa: 'Licencia de Funcionamiento', concepto: 'Visto Bueno de Protección Civil y Licencia de Funcionamiento comercial', unidad: 'GESTIÓN', honorarios: 5000, comentarios: 'Inspección de seguridad aprobada', pagoDerechos: 4500, extra: 0, empleadoAsignadoId: 'u3' }
    ]
  }
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const money = (n) => (n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 })

export const COLOR_MAP = { blue: '#1A5276', amber: '#B87A0A', purple: '#5B2C6F', green: '#2A5F3F', red: '#C0392B' }
export const BG_MAP = { blue: '#EAF2F8', amber: '#FEF3DC', purple: '#F5EEF8', green: '#EBF3EE', red: '#FDEDEB' }

export const AVAILABLE_MODULES = [
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'administracion', label: 'Administración' },
  { id: 'tareas', label: 'Tareas Diarias' },
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'cotizaciones', label: 'Cotizaciones' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'tramites', label: 'Hojas de Ruta' },
  { id: 'clientes', label: 'Clientes' },
]

export const getDefaultModulos = (rol) => {
  if (rol === 'admin') return ['presupuestos', 'administracion', 'clientes', 'cotizaciones', 'catalogo', 'proyectos', 'tramites', 'tareas']
  if (rol === 'empleado' || rol === 'gestor') return ['presupuestos', 'clientes', 'cotizaciones', 'catalogo', 'proyectos', 'tramites', 'tareas']
  return ['presupuestos', 'cotizaciones', 'tramites']
}

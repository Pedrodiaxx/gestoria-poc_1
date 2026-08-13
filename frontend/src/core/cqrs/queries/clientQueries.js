import { TRAMITES_MOCK, TRAMITES_TIPOS, PROYECTOS_MOCK } from '../../../data/mockData';

export const filterClientsQuery = (clientes, qClientes, usuarios = [], conceptos = []) => {
  if (!Array.isArray(clientes)) return [];
  const query = (qClientes || '').toLowerCase().trim();
  if (!query) return clientes;

  const safeUsuarios = Array.isArray(usuarios) ? usuarios : [];

  return clientes.filter(c => {
    if (!c) return false;

    // 1. Cliente basic fields
    const matchesClient =
      ((c.nombre || '').toLowerCase().includes(query)) ||
      ((c.nombreComercial || '').toLowerCase().includes(query)) ||
      ((c.contacto || '').toLowerCase().includes(query)) ||
      ((c.rfc || '').toLowerCase().includes(query)) ||
      ((c.rfcFiscal || '').toLowerCase().includes(query)) ||
      ((c.email || '').toLowerCase().includes(query)) ||
      ((c.tel || '').toLowerCase().includes(query)) ||
      ((c.telefono || '').toLowerCase().includes(query)) ||
      ((c.ciudad || '').toLowerCase().includes(query)) ||
      ((c.direccionFiscal || '').toLowerCase().includes(query)) ||
      ((c.apoderado || '').toLowerCase().includes(query)) ||
      ((c.apoderadoLegal || '').toLowerCase().includes(query)) ||
      ((c.personaTipo || '').toLowerCase().includes(query)) ||
      ((c.estatus || '').toLowerCase().includes(query));

    if (matchesClient) return true;

    // 2. Proyectos vinculados (strings en el cliente)
    if (Array.isArray(c.proyectos)) {
      const matchesProyecto = c.proyectos.some(p => p && String(p).toLowerCase().includes(query));
      if (matchesProyecto) return true;
    }

    // 2b. Proyectos reales (PROYECTOS_MOCK) asociados al cliente
    const realProyectos = (PROYECTOS_MOCK || []).filter(p => p && p.clienteId === c.id);
    const matchesRealProyecto = realProyectos.some(p =>
      (p.id && String(p.id).toLowerCase().includes(query)) ||
      (p.nombre && String(p.nombre).toLowerCase().includes(query)) ||
      (p.descripcion && String(p.descripcion).toLowerCase().includes(query))
    );
    if (matchesRealProyecto) return true;

    // 3. Responsable (lookup in usuarios)
    const assignedUser = safeUsuarios.find(u => u && u.id === c.responsable);
    if (assignedUser) {
      const matchesUser =
        (assignedUser.nombre && String(assignedUser.nombre).toLowerCase().includes(query)) ||
        (assignedUser.email && String(assignedUser.email).toLowerCase().includes(query)) ||
        (assignedUser.rol && String(assignedUser.rol).toLowerCase().includes(query));
      if (matchesUser) return true;
    }

    // 4. Trámites / Hojas de ruta (lookup in TRAMITES_MOCK)
    const associatedTramites = (TRAMITES_MOCK || []).filter(t => t && t.clienteId === c.id);
    const matchesTramite = associatedTramites.some(t => {
      const tipoInfo = TRAMITES_TIPOS && TRAMITES_TIPOS[t.tipo];
      return (
        (t.id && String(t.id).toLowerCase().includes(query)) ||
        (t.folio && String(t.folio).toLowerCase().includes(query)) ||
        (t.notas && String(t.notas).toLowerCase().includes(query)) ||
        (tipoInfo && tipoInfo.nombre && String(tipoInfo.nombre).toLowerCase().includes(query))
      );
    });
    if (matchesTramite) return true;

    return false;
  });
};

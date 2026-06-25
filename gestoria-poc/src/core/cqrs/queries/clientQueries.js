import { TRAMITES_MOCK, TRAMITES_TIPOS, PROYECTOS_MOCK } from '../../../data/mockData';

export const filterClientsQuery = (clientes, qClientes, usuarios, cotizaciones, conceptos) => {
  const query = qClientes.toLowerCase().trim();
  if (!query) return clientes;

  return clientes.filter(c => {
    // 1. Cliente basic fields
    const matchesClient =
      c.nombre.toLowerCase().includes(query) ||
      (c.contacto && c.contacto.toLowerCase().includes(query)) ||
      (c.rfc && c.rfc.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.tel && c.tel.toLowerCase().includes(query)) ||
      (c.ciudad && c.ciudad.toLowerCase().includes(query)) ||
      (c.estatus && c.estatus.toLowerCase().includes(query));

    if (matchesClient) return true;

    // 2. Proyectos vinculados (strings en el cliente)
    const matchesProyecto = c.proyectos && c.proyectos.some(p => p.toLowerCase().includes(query));
    if (matchesProyecto) return true;

    // 2b. Proyectos reales (PROYECTOS_MOCK) asociados al cliente
    const realProyectos = PROYECTOS_MOCK.filter(p => p.clienteId === c.id);
    const matchesRealProyecto = realProyectos.some(p =>
      p.id.toLowerCase().includes(query) ||
      p.nombre.toLowerCase().includes(query) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(query))
    );
    if (matchesRealProyecto) return true;

    // 3. Responsable (lookup in usuarios)
    const assignedUser = usuarios.find(u => u.id === c.responsable);
    const matchesUser = assignedUser && (
      assignedUser.nombre.toLowerCase().includes(query) ||
      assignedUser.email.toLowerCase().includes(query) ||
      assignedUser.rol.toLowerCase().includes(query)
    );
    if (matchesUser) return true;

    // 4. Trámites / Hojas de ruta (lookup in TRAMITES_MOCK)
    const associatedTramites = TRAMITES_MOCK.filter(t => t.clienteId === c.id);
    const matchesTramite = associatedTramites.some(t => {
      const tipoInfo = TRAMITES_TIPOS[t.tipo];
      return (
        t.id.toLowerCase().includes(query) ||
        (t.folio && t.folio.toLowerCase().includes(query)) ||
        (t.notas && t.notas.toLowerCase().includes(query)) ||
        (tipoInfo && tipoInfo.nombre.toLowerCase().includes(query))
      );
    });
    if (matchesTramite) return true;

    // 5. Cotizaciones (lookup in cotizaciones)
    const associatedCotizaciones = (cotizaciones || []).filter(cot => cot.clienteId === c.id);
    const matchesCotizacion = associatedCotizaciones.some(cot => {
      return (
        cot.id.toLowerCase().includes(query) ||
        cot.estatus.toLowerCase().includes(query) ||
        cot.conceptos.some(item => {
          const conc = conceptos.find(co => co.clave === item.clave);
          return (
            item.clave.toLowerCase().includes(query) ||
            (conc && conc.descripcion.toLowerCase().includes(query))
          );
        })
      );
    });
    if (matchesCotizacion) return true;

    return false;
  });
};

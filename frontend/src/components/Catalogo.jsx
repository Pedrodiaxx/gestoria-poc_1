import React, { useState, useEffect } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { money } from '../data/mockData';
import { useConceptos } from '../hooks/useConceptos';

export function Catalogo({ conceptos: propsConceptos, setConceptos: propsSetConceptos }) {
  const context = useAppContext();
  const list = propsConceptos || context.conceptos || [];
  const setConceptos = propsSetConceptos || context.setConceptos;
  const presupuestos = context.presupuestos || [];

  // Limpieza explícita de borradores en caché al cargar la vista
  useEffect(() => {
    localStorage.removeItem("catalogo_draft");
    localStorage.removeItem("giu_concepto_en_progreso");
  }, []);

  // Hook: carga y creación de conceptos delegada a la capa de servicios
  const { crearConcepto } = useConceptos(setConceptos);

  const [q, setQ] = useState('');
  const [selectedConcepto, setSelectedConcepto] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [nuevaClave, setNuevaClave] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUnidad, setNuevaUnidad] = useState('m²');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState('1');
  const [errorMsg, setErrorMsg] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const filtered = list.filter(c =>
    (c.clave || '').toLowerCase().includes(q.toLowerCase()) ||
    (c.nombre || '').toLowerCase().includes(q.toLowerCase()) ||
    (c.descripcion || '').toLowerCase().includes(q.toLowerCase())
  );

  const handleAdd = async () => {
    if (guardando) return;
    if (!nuevaClave || (!nuevaDesc && !nuevoNombre) || !nuevoPrecio) {
      setErrorMsg('Por favor completa la clave, el nombre/descripción y el precio.');
      return;
    }

    const key = nuevaClave.trim().toUpperCase();
    if (list.some(c => c.clave === key)) {
      setErrorMsg(`La clave "${key}" ya existe en el catálogo.`);
      return;
    }

    const nuevo = {
      clave: key,
      nombre: nuevoNombre.trim(),
      descripcion: nuevaDesc.trim(),
      unidad: nuevaUnidad,
      cantidad: parseFloat(nuevaCantidad) || 1,
      precio: parseFloat(nuevoPrecio) || 0
    };

    setGuardando(true);
    try {
      const creado = await crearConcepto(nuevo);
      setShowAddModal(false);
      setNuevaClave('');
      setNuevoNombre('');
      setNuevaDesc('');
      setNuevaUnidad('m²');
      setNuevoPrecio('');
      setNuevaCantidad('1');
      setErrorMsg('');
      if (creado) {
        setSelectedConcepto(creado);
      }
    } catch (error) {
      console.error("Error al guardar el concepto en el servidor:", error);
      setErrorMsg('No se pudo guardar el concepto en el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const copiarClave = (clave) => {
    if (!clave) return;
    navigator.clipboard?.writeText(clave);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const showAddButton = !!propsSetConceptos || !!context.setConceptos;
  const cantNum = parseFloat(nuevaCantidad) || 1;
  const precNum = parseFloat(nuevoPrecio) || 0;
  const sumaTotalCalculada = cantNum * precNum;

  // ══════════════════════════════════════════════════════════════════════════
  // VISTA: DESGLOSE DEL CONCEPTO SELECCIONADO
  // ══════════════════════════════════════════════════════════════════════════
  if (selectedConcepto) {
    const c = selectedConcepto;
    const cCantidad = parseFloat(c.cantidad) || 1;
    const cPrecio = parseFloat(c.precio) || 0;
    const cImporte = cCantidad * cPrecio;
    const cUnidad = c.unidad || 'm²';
    const cTitulo = c.nombre || c.descripcion || c.clave;

    // Presupuestos relacionados que contienen este concepto
    const presupuestosRelacionados = presupuestos.filter(p => 
      p.conceptos && p.conceptos.some(item => 
        (item.clave && item.clave.toUpperCase() === c.clave.toUpperCase()) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(c.clave.toLowerCase()))
      )
    );

    return (
      <div className="module-container">
        {/* Navegación y Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              onClick={() => setSelectedConcepto(null)}
              title="Retroceder al listado"
              aria-label="Retroceder"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease',
                padding: 0
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface2)';
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <Icon name="arrowleft" size={16} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>Catálogo</span>
            <span style={{ color: 'var(--text-3)', fontSize: 12 }}>/</span>
            <span className="badge badge-gray" style={{ fontWeight: 600 }}>
              {c.clave}
            </span>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={() => copiarClave(c.clave)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name={copiado ? "check" : "copy"} size={13} />
            {copiado ? "¡Copiado!" : "Copiar Clave"}
          </button>
        </div>

        {/* Header Hero del Concepto */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-green" style={{ fontWeight: 600 }}>
                  {c.clave}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>•</span>
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                  Partida Activa en Catálogo
                </span>
              </div>
              <h1 className="page-title" style={{ margin: '0 0 6px 0' }}>
                {cTitulo}
              </h1>
              <p className="page-subtitle" style={{ margin: 0 }}>
                Ficha técnica analítica y desglose de costo unitario para cotizaciones de trámites y obras.
              </p>
            </div>

            {/* Total Destacado */}
            <div style={{ 
              background: 'var(--surface2)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-md)', 
              padding: '14px 20px', 
              textAlign: 'right',
              minWidth: 190
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
                Importe Total
              </div>
              <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', lineHeight: 1.1 }}>
                {money(cImporte)}
              </div>
              <div className="tabular-nums" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                {cCantidad} {cUnidad} × {money(cPrecio)}
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas KPI del Concepto usando el sistema metric-grid nativo */}
        <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginBottom: 20 }}>
          <div className="metric-card">
            <div className="metric-label">Clave de Partida</div>
            <div className="metric-value" style={{ fontSize: 18, color: 'var(--text)' }}>
              {c.clave}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Unidad de Medida</div>
            <div className="metric-value" style={{ fontSize: 18, color: 'var(--text)' }}>
              {cUnidad}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Cantidad Base</div>
            <div className="metric-value tabular-nums" style={{ fontSize: 18, color: 'var(--text)' }}>
              {cCantidad}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Precio Unitario</div>
            <div className="metric-value tabular-nums" style={{ fontSize: 18, color: 'var(--text)' }}>
              {money(cPrecio)}
            </div>
          </div>

          <div className="metric-card" style={{ background: 'var(--accent-light)', borderColor: 'rgba(42,95,63,0.2)' }}>
            <div className="metric-label" style={{ color: 'var(--accent-text)' }}>Suma Total ($)</div>
            <div className="metric-value tabular-nums" style={{ fontSize: 20, color: 'var(--accent)', fontWeight: 700 }}>
              {money(cImporte)}
            </div>
          </div>
        </div>

        {/* Retícula de Desglose Estilo Excel (Standard GIU) */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <div className="card-title" style={{ margin: 0 }}>
              Desglose Analítico de la Partida
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              Tabla matricial de especificaciones, rendimientos y cálculo de importes.
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Clave</th>
                  <th>Descripción del Concepto / Partida</th>
                  <th style={{ textAlign: 'center', width: 100 }}>Unidad</th>
                  <th style={{ textAlign: 'center', width: 90 }}>Cantidad</th>
                  <th style={{ textAlign: 'right', width: 140 }}>Precio Unitario</th>
                  <th style={{ textAlign: 'right', width: 140 }}>Importe ($)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="badge badge-gray" style={{ fontWeight: 600 }}>
                      {c.clave}
                    </span>
                  </td>
                  <td>
                    {c.nombre && (
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {c.nombre}
                      </div>
                    )}
                    <div style={{ color: c.nombre ? 'var(--text-2)' : 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {c.descripcion || 'Sin descripción detallada registrada.'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--text)' }}>
                    {cUnidad}
                  </td>
                  <td className="tabular-nums" style={{ textAlign: 'center', color: 'var(--text)', fontWeight: 600 }}>
                    {cCantidad}
                  </td>
                  <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--text)' }}>
                    {money(cPrecio)}
                  </td>
                  <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>
                    {money(cImporte)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface2)' }}>
                  <td colSpan={5} style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text-2)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Suma Total del Concepto:
                  </td>
                  <td className="tabular-nums" style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>
                    {money(cImporte)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Sección: Presupuestos Relacionados */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div className="card-title" style={{ margin: 0 }}>
                Presupuestos que utilizan este Concepto
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                Historial de cotizaciones y expedientes donde se encuentra referenciada esta clave.
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {presupuestosRelacionados.length} encontrados
            </span>
          </div>

          {presupuestosRelacionados.length === 0 ? (
            <div style={{ 
              padding: '24px 16px', 
              textAlign: 'center', 
              color: 'var(--text-3)', 
              background: 'var(--surface2)', 
              borderRadius: 'var(--radius-md)',
              fontSize: 13 
            }}>
              <Icon name="filetext" size={22} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div>Este concepto está disponible y listo para agregarse a nuevos presupuestos y cotizaciones.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Cliente / Proyecto</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Total Presupuesto</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuestosRelacionados.map((p, idx) => (
                    <tr key={p.id || p.folio || idx}>
                      <td>
                        <span className="badge badge-gray">
                          {p.folio || `#${p.id}`}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text)' }}>
                        <div style={{ fontWeight: 600 }}>{p.cliente || 'Cliente General'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.proyecto || 'Proyecto'}</div>
                      </td>
                      <td style={{ color: 'var(--text-2)' }}>
                        {p.fecha ? p.fecha.substring(0, 10) : '—'}
                      </td>
                      <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>
                        {money(p.total || p.subtotal || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VISTA: TABLA PRINCIPAL DEL CATÁLOGO DE CONCEPTOS
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="module-container">
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Conceptos</div>
          <div className="page-subtitle">{list.length} conceptos disponibles para presupuestos</div>
        </div>
        {showAddButton && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" size={14} /> Nuevo Concepto
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div className="search-wrap" style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
            <Icon name="search" size={14} />
            <input
              className="form-control search-input"
              placeholder="Buscar por clave o descripción…"
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ width: '100%', paddingRight: q ? 32 : 12 }}
            />
            {q && (
              <button
                onClick={() => setQ('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer',
                  color: 'var(--text-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Limpiar búsqueda"
              >
                <Icon name="x" size={13} />
              </button>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {filtered.length} {filtered.length === 1 ? 'concepto' : 'conceptos'}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '1%', whiteSpace: 'nowrap', minWidth: 130 }}>Clave</th>
                <th>Descripción del Trámite o Servicio</th>
                <th style={{ textAlign: 'right', width: 160, whiteSpace: 'nowrap' }}>Precio Unitario</th>
                <th style={{ width: 40, textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-3)', fontSize: 13 }}>
                    No se encontraron conceptos.
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr 
                    key={c.clave || idx}
                    onDoubleClick={() => setSelectedConcepto(c)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Doble clic para ver el desglose detallado de este concepto"
                  >
                    <td style={{ whiteSpace: 'nowrap', width: '1%', verticalAlign: 'middle' }}>
                      <span 
                        className="badge badge-gray mono" 
                        style={{ 
                          fontWeight: 600, 
                          letterSpacing: '0.4px', 
                          padding: '4px 10px',
                          fontSize: 11.5,
                          border: '1px solid var(--border)',
                          background: 'var(--surface2)',
                          color: 'var(--text)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {c.clave}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text)', verticalAlign: 'middle' }}>
                      {c.nombre && (
                        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                          {c.nombre}
                        </div>
                      )}
                      <div style={{ color: c.nombre ? 'var(--text-2)' : 'var(--text)', fontSize: 13 }}>
                        {c.descripcion}
                      </div>
                    </td>
                    <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {money(c.precio)}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-3)', verticalAlign: 'middle' }}>
                      <Icon name="chevronright" size={14} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Agregar Concepto en Cuadrícula Tabular Estilo Excel */}
      {showAddModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 840, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div className="modal-title">Agregar Nuevo Concepto</div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-light)', color: 'var(--red-text)', border: '1px solid rgba(192,57,43,0.2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 16 }}>
                <Icon name="alert" size={12} style={{ marginRight: 6 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Clave del Concepto y Nombre / Título */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Clave del Concepto *</label>
                <input
                  className="form-control"
                  placeholder="EJ: LIC-RES-03"
                  value={nuevaClave}
                  style={{ textTransform: 'uppercase' }}
                  onChange={e => setNuevaClave(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Nombre del Concepto *</label>
                <input
                  className="form-control"
                  placeholder="Ej: Licencia de Construcción Residencial"
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                />
              </div>
            </div>

            {/* 2. Cuadrícula / Tabla Estilo Excel con scroll horizontal responsivo en móvil */}
            <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Desglose de Partida</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>↔ Desliza para ver todas las columnas</span>
            </div>
            <div
              className="table-wrap"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                marginBottom: 16
              }}
            >
              <table style={{ minWidth: 680, width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    <th style={{ borderRight: '1px solid var(--border)', minWidth: 220 }}>
                      Descripción del Concepto / Partida
                    </th>
                    <th style={{ textAlign: 'center', width: 95, borderRight: '1px solid var(--border)' }}>
                      Unidad
                    </th>
                    <th style={{ textAlign: 'center', width: 85, borderRight: '1px solid var(--border)' }}>
                      Cantidad
                    </th>
                    <th style={{ textAlign: 'right', width: 130, borderRight: '1px solid var(--border)' }}>
                      Precio Unitario
                    </th>
                    <th style={{ textAlign: 'right', width: 130 }}>
                      Importe ($)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: 'var(--surface)', verticalAlign: 'top' }}>
                    {/* Celda 1: Descripción */}
                    <td style={{ padding: '8px 10px', borderRight: '1px solid var(--border)' }}>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Descripción detallada del concepto (especificaciones técnicas, memorias, mano de obra)..."
                        value={nuevaDesc}
                        onChange={e => setNuevaDesc(e.target.value)}
                        style={{ fontSize: 13, resize: 'vertical' }}
                      />
                    </td>

                    {/* Celda 2: Unidad */}
                    <td style={{ padding: '8px', borderRight: '1px solid var(--border)', textAlign: 'center' }}>
                      <select
                        className="form-control"
                        value={nuevaUnidad}
                        onChange={e => setNuevaUnidad(e.target.value)}
                        style={{ fontSize: 13, textAlign: 'center' }}
                      >
                        <option value="m²">m²</option>
                        <option value="m³">m³</option>
                        <option value="ml">ml</option>
                        <option value="Pza">Pza</option>
                        <option value="Lote">Lote</option>
                        <option value="Servicio">Servicio</option>
                        <option value="Trámite">Trámite</option>
                        <option value="Gestión">Gestión</option>
                      </select>
                    </td>

                    {/* Celda 3: Cantidad */}
                    <td style={{ padding: '8px', borderRight: '1px solid var(--border)', textAlign: 'center' }}>
                      <input
                        className="form-control tabular-nums"
                        type="number"
                        step="any"
                        placeholder="1"
                        value={nuevaCantidad}
                        onChange={e => setNuevaCantidad(e.target.value)}
                        style={{ textAlign: 'center', fontSize: 13 }}
                      />
                    </td>

                    {/* Celda 4: Precio Unitario */}
                    <td style={{ padding: '8px', borderRight: '1px solid var(--border)' }}>
                      <input
                        className="form-control tabular-nums"
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={nuevoPrecio}
                        onChange={e => setNuevoPrecio(e.target.value)}
                        style={{ textAlign: 'right', fontSize: 13 }}
                      />
                    </td>

                    {/* Celda 5: Importe Calculado */}
                    <td className="tabular-nums" style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--accent)', fontSize: 14, background: 'var(--surface2)' }}>
                      {money(sumaTotalCalculada)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                    <td colSpan={4} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      SUMA TOTAL:
                    </td>
                    <td className="tabular-nums" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--accent)', fontSize: 15, background: 'var(--accent-light)' }}>
                      {money(sumaTotalCalculada)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={guardando}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={!nuevaClave || (!nuevaDesc && !nuevoNombre) || !nuevoPrecio || guardando}
                style={{ opacity: (!nuevaClave || (!nuevaDesc && !nuevoNombre) || !nuevoPrecio || guardando) ? 0.5 : 1 }}
              >
                <Icon name="check" size={14} /> {guardando ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Catalogo;




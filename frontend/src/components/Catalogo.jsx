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
      <div style={{ width: '100%' }}>
        {/* Navegación y Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setSelectedConcepto(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 13 }}
            >
              <Icon name="arrowleft" size={14} /> Volver al Catálogo
            </button>
            <span style={{ color: 'var(--text-3)', fontSize: 13 }}>/</span>
            <span className="mono" style={{ background: 'var(--surface2)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12, fontWeight: 700 }}>
              {c.clave}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => copiarClave(c.clave)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            >
              <Icon name={copiado ? "check" : "copy"} size={13} />
              {copiado ? "¡Clave Copiada!" : "Copiar Clave"}
            </button>
          </div>
        </div>

        {/* Header Hero del Concepto */}
        <div className="card" style={{ marginBottom: 20, padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="mono" style={{ 
                  background: 'var(--accent-light)', 
                  color: 'var(--accent)', 
                  padding: '4px 10px', 
                  borderRadius: 6, 
                  fontWeight: 700, 
                  fontSize: 13,
                  border: '1px solid rgba(42,95,63,0.2)'
                }}>
                  {c.clave}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>•</span>
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="checkcircle" size={12} /> Partida Activa en Catálogo
                </span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                {cTitulo}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
                Ficha técnica analítica y desglose de costo unitario para cotizaciones de trámites y obras.
              </p>
            </div>

            {/* Total Destacado */}
            <div style={{ 
              background: 'var(--surface2)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius)', 
              padding: '14px 20px', 
              textAlign: 'right',
              minWidth: 200
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                Importe Total Estimado
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', fontFamily: 'DM Mono', lineHeight: 1.1 }}>
                {money(cImporte)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                {cCantidad} {cUnidad} × {money(cPrecio)}
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas KPI del Concepto */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: 14, 
          marginBottom: 20 
        }}>
          <div className="card" style={{ padding: '16px 20px', margin: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>
              Clave de Partida
            </div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {c.clave}
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', margin: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>
              Unidad de Medida
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {cUnidad}
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', margin: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>
              Cantidad Base
            </div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {cCantidad}
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', margin: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 6 }}>
              Precio Unitario
            </div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {money(cPrecio)}
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', margin: 0, background: 'var(--accent-light)', borderColor: 'rgba(42,95,63,0.2)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
              Suma Total ($)
            </div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>
              {money(cImporte)}
            </div>
          </div>
        </div>

        {/* Retícula de Desglose Estilo Excel (Standard GIU) */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                Desglose Analítico de la Partida
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                Tabla matricial de especificaciones, rendimientos y cálculo de importes.
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'left', width: 140, borderRight: '1px solid var(--border)' }}>
                    Clave
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'left', borderRight: '1px solid var(--border)' }}>
                    Descripción del Concepto / Partida
                  </th>
                  <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'center', width: 100, borderRight: '1px solid var(--border)' }}>
                    Unidad
                  </th>
                  <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'center', width: 90, borderRight: '1px solid var(--border)' }}>
                    Cantidad
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'right', width: 140, borderRight: '1px solid var(--border)' }}>
                    Precio Unitario
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'right', width: 140, background: 'var(--surface2)' }}>
                    Importe ($)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'var(--surface)', verticalAlign: 'top' }}>
                  <td style={{ padding: '12px 14px', borderRight: '1px solid var(--border)' }}>
                    <span className="mono" style={{ background: 'var(--surface2)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600 }}>
                      {c.clave}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', borderRight: '1px solid var(--border)' }}>
                    {c.nombre && (
                      <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4, fontSize: 13 }}>
                        {c.nombre}
                      </div>
                    )}
                    <div style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {c.descripcion || 'Sin descripción detallada registrada.'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', borderRight: '1px solid var(--border)', fontSize: 13, color: 'var(--text)' }}>
                    {cUnidad}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', borderRight: '1px solid var(--border)', fontFamily: 'DM Mono', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                    {cCantidad}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', borderRight: '1px solid var(--border)', fontFamily: 'DM Mono', fontSize: 13, color: 'var(--text)' }}>
                    {money(cPrecio)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'DM Mono', fontSize: 14, fontWeight: 700, color: 'var(--accent)', background: 'var(--surface2)' }}>
                    {money(cImporte)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--surface2)', borderTop: '2px solid var(--border)' }}>
                  <td colSpan={5} style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    SUMA TOTAL DEL CONCEPTO:
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--accent)', fontFamily: 'DM Mono', fontSize: 16, background: 'var(--accent-light)', borderLeft: '1px solid var(--border)' }}>
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
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                Presupuestos que utilizan este Concepto
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                Historial de cotizaciones y expedientes donde se encuentra referenciada esta clave.
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {presupuestosRelacionados.length} encontrados
            </span>
          </div>

          {presupuestosRelacionados.length === 0 ? (
            <div style={{ 
              padding: '28px 16px', 
              textAlign: 'center', 
              color: 'var(--text-3)', 
              background: 'var(--surface2)', 
              borderRadius: 'var(--radius-sm)',
              fontSize: 13 
            }}>
              <Icon name="filetext" size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div>Este concepto está disponible y listo para agregarse a nuevos presupuestos y cotizaciones.</div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'left' }}>Folio</th>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'left' }}>Cliente / Proyecto</th>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'left' }}>Fecha</th>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'right' }}>Total Presupuesto</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuestosRelacionados.map((p, idx) => (
                    <tr key={p.id || p.folio || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="mono" style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12 }}>
                          {p.folio || `#${p.id}`}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text)', fontSize: 13 }}>
                        <div style={{ fontWeight: 600 }}>{p.cliente || 'Cliente General'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.proyecto || 'Proyecto'}</div>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-2)', fontSize: 12 }}>
                        {p.fecha ? p.fecha.substring(0, 10) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: 600, color: 'var(--text)' }}>
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
    <div style={{ width: '100%' }}>
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
        <div className="search-wrap mb-4" style={{ maxWidth: 380 }}>
          <Icon name="search" size={14} />
          <input
            className="form-control search-input"
            placeholder="Buscar por clave o descripción…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ width: 140, padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'left' }}>Clave</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'left' }}>Descripción del Trámite o Servicio</th>
                <th style={{ textAlign: 'right', width: 160, padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' }}>Precio Unitario</th>
                <th style={{ width: 40, padding: '10px 8px', textAlign: 'center' }}></th>
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
                    onClick={() => setSelectedConcepto(c)}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      borderBottom: '1px solid var(--border)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Haz clic para ver el desglose detallado de este concepto"
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <span className="mono" style={{ 
                        background: 'var(--surface2)', 
                        padding: '3px 8px', 
                        borderRadius: 4, 
                        border: '1px solid var(--border)',
                        fontWeight: 600,
                        fontSize: 12
                      }}>
                        {c.clave}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text)' }}>
                      {c.nombre && (
                        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                          {c.nombre}
                        </div>
                      )}
                      <div style={{ color: c.nombre ? 'var(--text-2)' : 'var(--text)', fontSize: 13 }}>
                        {c.descripcion}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, fontFamily: 'DM Mono', color: 'var(--text)' }}>
                      {money(c.precio)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-3)' }}>
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
          <div className="modal" style={{ maxWidth: 840, width: '95%' }}>
            
            <div className="modal-title">Agregar Nuevo Concepto</div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-light)', color: 'var(--red-text)', border: '1px solid rgba(192,57,43,0.2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 16 }}>
                <Icon name="alert" size={12} style={{ marginRight: 6 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Clave del Concepto y Nombre / Título */}
            <div className="form-grid-2" style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Clave del Concepto *</label>
                <input
                  className="form-control"
                  placeholder="EJ: LIC-RES-03"
                  value={nuevaClave}
                  style={{ textTransform: 'uppercase', fontFamily: 'DM Mono' }}
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

            {/* 2. Cuadrícula / Tabla Estilo Excel con diseño nativo GIU */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'left', borderRight: '1px solid var(--border)' }}>
                      Descripción del Concepto / Partida
                    </th>
                    <th style={{ padding: '8px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'center', width: 95, borderRight: '1px solid var(--border)' }}>
                      Unidad
                    </th>
                    <th style={{ padding: '8px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'center', width: 80, borderRight: '1px solid var(--border)' }}>
                      Cantidad
                    </th>
                    <th style={{ padding: '8px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'right', width: 130, borderRight: '1px solid var(--border)' }}>
                      Precio Unitario
                    </th>
                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', textAlign: 'right', width: 130, background: 'var(--surface2)' }}>
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
                        className="form-control"
                        type="number"
                        step="any"
                        placeholder="1"
                        value={nuevaCantidad}
                        onChange={e => setNuevaCantidad(e.target.value)}
                        style={{ textAlign: 'center', fontFamily: 'DM Mono', fontSize: 13 }}
                      />
                    </td>

                    {/* Celda 4: Precio Unitario */}
                    <td style={{ padding: '8px', borderRight: '1px solid var(--border)' }}>
                      <input
                        className="form-control"
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={nuevoPrecio}
                        onChange={e => setNuevoPrecio(e.target.value)}
                        style={{ textAlign: 'right', fontFamily: 'DM Mono', fontSize: 13 }}
                      />
                    </td>

                    {/* Celda 5: Importe Calculado */}
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontFamily: 'DM Mono', color: 'var(--accent)', fontSize: 14, background: 'var(--surface2)' }}>
                      {money(sumaTotalCalculada)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                    <td colSpan={4} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      SUMA TOTAL:
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--accent)', fontFamily: 'DM Mono', fontSize: 15, background: 'var(--accent-light)' }}>
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



import React, { useState, useEffect } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { money } from '../data/mockData';
import { useConceptos } from '../hooks/useConceptos';

export function Catalogo({ conceptos: propsConceptos, setConceptos: propsSetConceptos }) {
  const context = useAppContext();
  const list = propsConceptos || context.conceptos || [];
  const setConceptos = propsSetConceptos || context.setConceptos;

  // Limpieza explícita de borradores en caché al cargar la vista
  useEffect(() => {
    localStorage.removeItem("catalogo_draft");
    localStorage.removeItem("giu_concepto_en_progreso");
  }, []);

  // Hook: carga y creación de conceptos delegada a la capa de servicios
  const { crearConcepto } = useConceptos(setConceptos);

  const [q, setQ] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [nuevaClave, setNuevaClave] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUnidad, setNuevaUnidad] = useState('m²');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState('1');
  const [errorMsg, setErrorMsg] = useState('');
  const [guardando, setGuardando] = useState(false);

  const filtered = list.filter(c =>
    (c.clave || '').toLowerCase().includes(q.toLowerCase()) ||
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
      await crearConcepto(nuevo);
      setShowAddModal(false);
      setNuevaClave('');
      setNuevoNombre('');
      setNuevaDesc('');
      setNuevaUnidad('m²');
      setNuevoPrecio('');
      setNuevaCantidad('1');
      setErrorMsg('');
    } catch (error) {
      console.error("Error al guardar el concepto en el servidor:", error);
      setErrorMsg('No se pudo guardar el concepto en el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const showAddButton = !!propsSetConceptos || !!context.setConceptos;
  const cantNum = parseFloat(nuevaCantidad) || 1;
  const precNum = parseFloat(nuevoPrecio) || 0;
  const sumaTotalCalculada = cantNum * precNum;

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
              <tr>
                <th style={{ width: 140 }}>Clave</th>
                <th>Descripción del Trámite o Servicio</th>
                <th style={{ textAlign: 'right', width: 160 }}>Precio Unitario</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-3)', fontSize: 13 }}>
                    No se encontraron conceptos.
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr key={c.clave || idx}>
                    <td>
                      <span className="mono" style={{ background: 'var(--surface2)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                        {c.clave}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text)' }}>{c.descripcion}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'DM Mono', color: 'var(--text)' }}>
                      {money(c.precio)}
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


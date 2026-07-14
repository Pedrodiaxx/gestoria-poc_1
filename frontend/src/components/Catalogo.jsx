import React, { useState } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { money } from '../data/mockData';
import { useConceptos } from '../hooks/useConceptos';

export function Catalogo({ conceptos: propsConceptos, setConceptos: propsSetConceptos }) {
  const context = useAppContext();
  const list = propsConceptos || context.conceptos;
  const setConceptos = propsSetConceptos || context.setConceptos;

  // Hook: carga y creación de conceptos delegada a la capa de servicios
  const { crearConcepto } = useConceptos(setConceptos);

  const [q, setQ] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [nuevaClave, setNuevaClave] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = list.filter(c =>
    c.clave.toLowerCase().includes(q.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(q.toLowerCase())
  );

  const handleAdd = async () => {
    if (!nuevaClave || !nuevaDesc || !nuevoPrecio) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    const key = nuevaClave.trim().toUpperCase();
    if (list.some(c => c.clave === key)) {
      setErrorMsg(`La clave "${key}" ya existe en el catálogo.`);
      return;
    }

    const nuevo = {
      clave: key,
      descripcion: nuevaDesc.trim(),
      precio: parseFloat(nuevoPrecio) || 0
    };

    try {
      await crearConcepto(nuevo);
      if (!propsSetConceptos) {
        context.addConcept(nuevo);
      }
    } catch (error) {
      console.error("Error al guardar el concepto en el servidor:", error);
    }

    setShowAddModal(false);
    setNuevaClave('');
    setNuevaDesc('');
    setNuevoPrecio('');
    setErrorMsg('');
  };

  const showAddButton = !!(propsSetConceptos || context.addConcept);

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Catálogo de Conceptos</div>
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
  );
}
export default Catalogo;

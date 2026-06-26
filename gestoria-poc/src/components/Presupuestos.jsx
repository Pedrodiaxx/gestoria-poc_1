import React, { useState, useEffect } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { money, EQUIPO } from '../data/mockData';

const hoy = new Date();
const fmt = (d) => d.toISOString().split('T')[0];

const ESTATUS_CONFIG = {
  'en-proceso': { label: 'En Proceso', color: '#1A5276', badge: 'badge-blue' },
  'completado':  { label: 'Completado', color: '#2A5F3F', badge: 'badge-green' },
  'pendiente':   { label: 'Pendiente', color: '#B87A0A', badge: 'badge-amber' },
  'pausado':     { label: 'Pausado', color: '#9C9A94', badge: 'badge-gray' },
};

const COLOR_MAP = { blue: '#1A5276', amber: '#B87A0A', purple: '#5B2C6F', green: '#2A5F3F', red: '#C0392B' };
const BG_MAP = { blue: '#EAF2F8', amber: '#FEF3DC', purple: '#F5EEF8', green: '#EBF3EE', red: '#FDEDEB' };

const TRAMITES_TIPOS = {
  'uso-suelo': { nombre: 'Licencia de Uso de Suelo', color: 'blue', icono: '🗺️' },
  'licencia-const': { nombre: 'Licencia de Construcción', color: 'green', icono: '🏗️' },
  'division': { nombre: 'Subdivisión y Fusión', color: 'purple', icono: '📐' },
  'ampliacion': { nombre: 'Ampliación de Obra', color: 'amber', icono: '🏠' },
  'proteccion-civil': { nombre: 'Visto Bueno PC', color: 'red', icono: '🚨' }
};

// Helper to auto-increment minor version (e.g. V1.0 -> V1.1)
const incrementVersion = (v) => {
  if (!v) return 'V1.0';
  const match = v.match(/^V(\d+)\.(\d+)$/);
  if (match) {
    const major = parseInt(match[1]);
    const minor = parseInt(match[2]) + 1;
    return `V${major}.${minor}`;
  }
  return v + '.1';
};

// Helper to calculate total budget
const calcBudgetTotal = (b) => {
  if (!b) return 0;
  // Retrocompatibility
  if (b.honorarios && b.derechos) {
    const planos = (parseFloat(b.honorarios.planos?.cantidad) || 0) * (parseFloat(b.honorarios.planos?.precioUnitario) || 0);
    const hrs = (parseFloat(b.honorarios.hrsHombre?.horas) || 0) * (parseFloat(b.honorarios.hrsHombre?.precioPorHora) || 0);
    const ofi = (parseFloat(b.honorarios.oficina?.horas) || 0) * (parseFloat(b.honorarios.oficina?.precioPorHora) || 0);
    const hTotal = planos + hrs + ofi;

    const d1 = parseFloat(b.derechos.derecho1?.costo) || 0;
    const d2 = parseFloat(b.derechos.derecho2?.costo) || 0;
    const d3 = parseFloat(b.derechos.derecho3?.costo) || 0;
    const dTotal = d1 + d2 + d3;
    return hTotal + dTotal;
  }

  const cd = b.costosDirectos || {};
  const ci = b.costosIndirectos || {};

  const directos = (parseFloat(cd.materiales) || 0) +
                   (parseFloat(cd.manoDeObra) || 0) +
                   (parseFloat(cd.equipos) || 0) +
                   (parseFloat(cd.subcontratistas) || 0);

  const indirectos = (parseFloat(ci.oficina) || 0) +
                     (parseFloat(ci.seguros) || 0) +
                     (parseFloat(ci.permisos) || 0) +
                     (parseFloat(ci.administracion) || 0);

  const subtotal = directos + indirectos;
  const contingencia = subtotal * ((parseFloat(b.contingenciaPorcentaje) || 0) / 100);
  return subtotal + contingencia;
};

// ─── SUPPLIER COMPARISON TABLE COMPONENT ──────────────────────────────────────
function ComparativaProveedores({ comparaciones, onChange, editable = false }) {
  const [nuevoConcepto, setNuevoConcepto] = useState('');
  
  const addRow = () => {
    if (!nuevoConcepto.trim()) return;
    const nuevaFila = {
      id: `comp-${Date.now()}`,
      concepto: nuevoConcepto,
      prov1: { nombre: '', precio: '', dias: '' },
      prov2: { nombre: '', precio: '', dias: '' },
      prov3: { nombre: '', precio: '', dias: '' }
    };
    onChange([...comparaciones, nuevaFila]);
    setNuevoConcepto('');
  };

  const removeRow = (id) => {
    onChange(comparaciones.filter(item => item.id !== id));
  };

  const updateCell = (rowId, provKey, field, val) => {
    onChange(comparaciones.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          [provKey]: {
            ...row[provKey],
            [field]: val
          }
        };
      }
      return row;
    }));
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid var(--border)' }}>
        <span style={{ fontSize: 18 }}>⚖️</span>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>Comparativa de Proveedores (Mín. 3)</span>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Concepto / Insumo</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--border)', background: 'rgba(26,82,118,0.02)' }}>Proveedor 1</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--border)', background: 'rgba(91,44,111,0.02)' }}>Proveedor 2</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--border)', background: 'rgba(42,95,63,0.02)' }}>Proveedor 3</th>
              {editable && <th style={{ width: 40, borderBottom: '1px solid var(--border)' }}></th>}
            </tr>
          </thead>
          <tbody>
            {comparaciones.map((row) => {
              // Find prices for highlighting
              const prices = [
                parseFloat(row.prov1?.precio) || Infinity,
                parseFloat(row.prov2?.precio) || Infinity,
                parseFloat(row.prov3?.precio) || Infinity
              ];
              const minPrice = Math.min(...prices);

              // Find fastest delivery days for highlighting
              const days = [
                parseFloat(row.prov1?.dias) || Infinity,
                parseFloat(row.prov2?.dias) || Infinity,
                parseFloat(row.prov3?.dias) || Infinity
              ];
              const minDays = Math.min(...days);

              const checkBestPrice = (val) => {
                const num = parseFloat(val);
                return num > 0 && num === minPrice;
              };

              const checkBestDays = (val) => {
                const num = parseFloat(val);
                return num > 0 && num === minDays;
              };

              const inputStyle = {
                width: '100%', padding: '4px 6px', border: '1px solid var(--border)',
                borderRadius: 4, background: 'var(--surface)', fontSize: 12, outline: 'none',
                textAlign: 'center'
              };

              return (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{row.concepto}</td>
                  {/* Prov 1 */}
                  <td style={{ padding: '8px 12px', background: 'rgba(26,82,118,0.01)' }}>
                    {editable ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input style={inputStyle} placeholder="Nombre" value={row.prov1.nombre} onChange={e => updateCell(row.id, 'prov1', 'nombre', e.target.value)} />
                        <input style={inputStyle} type="number" placeholder="Precio $" value={row.prov1.precio} onChange={e => updateCell(row.id, 'prov1', 'precio', e.target.value)} />
                        <input style={inputStyle} type="number" placeholder="Días" value={row.prov1.dias} onChange={e => updateCell(row.id, 'prov1', 'dias', e.target.value)} />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{row.prov1.nombre || 'Proveedor A'}</div>
                        <div style={{ fontWeight: 700, color: checkBestPrice(row.prov1.precio) ? 'var(--accent)' : 'var(--text)', fontFamily: 'DM Mono', fontSize: 13, marginTop: 2 }}>
                          {row.prov1.precio ? money(parseFloat(row.prov1.precio)) : '—'}
                          {checkBestPrice(row.prov1.precio) && <span style={{ fontSize: 9, marginLeft: 2 }}>🏷️</span>}
                        </div>
                        <div style={{ fontSize: 10, color: checkBestDays(row.prov1.dias) ? 'var(--blue)' : 'var(--text-3)', marginTop: 2 }}>
                          ⏱️ {row.prov1.dias ? `${row.prov1.dias} días` : '—'}
                          {checkBestDays(row.prov1.dias) && <span style={{ fontSize: 9, marginLeft: 2 }}>⚡</span>}
                        </div>
                      </div>
                    )}
                  </td>
                  {/* Prov 2 */}
                  <td style={{ padding: '8px 12px', background: 'rgba(91,44,111,0.01)' }}>
                    {editable ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input style={inputStyle} placeholder="Nombre" value={row.prov2.nombre} onChange={e => updateCell(row.id, 'prov2', 'nombre', e.target.value)} />
                        <input style={inputStyle} type="number" placeholder="Precio $" value={row.prov2.precio} onChange={e => updateCell(row.id, 'prov2', 'precio', e.target.value)} />
                        <input style={inputStyle} type="number" placeholder="Días" value={row.prov2.dias} onChange={e => updateCell(row.id, 'prov2', 'dias', e.target.value)} />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{row.prov2.nombre || 'Proveedor B'}</div>
                        <div style={{ fontWeight: 700, color: checkBestPrice(row.prov2.precio) ? 'var(--accent)' : 'var(--text)', fontFamily: 'DM Mono', fontSize: 13, marginTop: 2 }}>
                          {row.prov2.precio ? money(parseFloat(row.prov2.precio)) : '—'}
                          {checkBestPrice(row.prov2.precio) && <span style={{ fontSize: 9, marginLeft: 2 }}>🏷️</span>}
                        </div>
                        <div style={{ fontSize: 10, color: checkBestDays(row.prov2.dias) ? 'var(--blue)' : 'var(--text-3)', marginTop: 2 }}>
                          ⏱️ {row.prov2.dias ? `${row.prov2.dias} días` : '—'}
                          {checkBestDays(row.prov2.dias) && <span style={{ fontSize: 9, marginLeft: 2 }}>⚡</span>}
                        </div>
                      </div>
                    )}
                  </td>
                  {/* Prov 3 */}
                  <td style={{ padding: '8px 12px', background: 'rgba(42,95,63,0.01)' }}>
                    {editable ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input style={inputStyle} placeholder="Nombre" value={row.prov3.nombre} onChange={e => updateCell(row.id, 'prov3', 'nombre', e.target.value)} />
                        <input style={inputStyle} type="number" placeholder="Precio $" value={row.prov3.precio} onChange={e => updateCell(row.id, 'prov3', 'precio', e.target.value)} />
                        <input style={inputStyle} type="number" placeholder="Días" value={row.prov3.dias} onChange={e => updateCell(row.id, 'prov3', 'dias', e.target.value)} />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{row.prov3.nombre || 'Proveedor C'}</div>
                        <div style={{ fontWeight: 700, color: checkBestPrice(row.prov3.precio) ? 'var(--accent)' : 'var(--text)', fontFamily: 'DM Mono', fontSize: 13, marginTop: 2 }}>
                          {row.prov3.precio ? money(parseFloat(row.prov3.precio)) : '—'}
                          {checkBestPrice(row.prov3.precio) && <span style={{ fontSize: 9, marginLeft: 2 }}>🏷️</span>}
                        </div>
                        <div style={{ fontSize: 10, color: checkBestDays(row.prov3.dias) ? 'var(--blue)' : 'var(--text-3)', marginTop: 2 }}>
                          ⏱️ {row.prov3.dias ? `${row.prov3.dias} días` : '—'}
                          {checkBestDays(row.prov3.dias) && <span style={{ fontSize: 9, marginLeft: 2 }}>⚡</span>}
                        </div>
                      </div>
                    )}
                  </td>
                  {editable && (
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button className="btn btn-ghost" onClick={() => removeRow(row.id)} style={{ padding: 4, minWidth: 'auto', color: '#C0392B' }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {comparaciones.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-3)', fontStyle: 'italic', fontSize: 12 }}>
            No hay insumos agregados a la comparativa.
          </div>
        )}
      </div>

      {editable && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-control"
            placeholder="Añadir concepto para cotizar (ej: Acero Estructural, Cemento, Pintura)..."
            value={nuevoConcepto}
            onChange={e => setNuevoConcepto(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRow()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-secondary" onClick={addRow}>+ Insumo</button>
        </div>
      )}
    </div>
  );
}

// ─── FORM NUEVO PRESUPUESTO COMPONENT ─────────────────────────────────────────
function FormNuevoPresupuesto({ onGuardar, onCancelar, clientes, proyectos, preselectedProjectId }) {
  const [proyectoId, setProyectoId] = useState(preselectedProjectId || '');
  const [titulo, setTitulo] = useState('');
  const [version, setVersion] = useState('V1.0');
  const [documentacion, setDocumentacion] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [proceso, setProceso] = useState('');

  // Cost breakdowns
  const [costosDirectos, setCostosDirectos] = useState({
    materiales: '',
    manoDeObra: '',
    equipos: '',
    subcontratistas: ''
  });
  const [costosIndirectos, setCostosIndirectos] = useState({
    oficina: '',
    seguros: '',
    permisos: '',
    administracion: ''
  });
  const [contingenciaPorcentaje, setContingenciaPorcentaje] = useState(5);
  const [comparacionProveedores, setComparacionProveedores] = useState([]);
  const [guardado, setGuardado] = useState(false);

  // Auto-title when project is selected
  useEffect(() => {
    if (proyectoId) {
      const selectedProj = proyectos.find(p => p.id === proyectoId);
      if (selectedProj) {
        setTitulo(`Presupuesto — ${selectedProj.nombre}`);
      }
    }
  }, [proyectoId, proyectos]);

  const selProyecto = proyectos.find(p => p.id === proyectoId);
  const cliente = selProyecto ? clientes.find(c => c.id === selProyecto.clienteId) : null;

  // Calculators
  const calcDirectos = () => {
    return (parseFloat(costosDirectos.materiales) || 0) +
           (parseFloat(costosDirectos.manoDeObra) || 0) +
           (parseFloat(costosDirectos.equipos) || 0) +
           (parseFloat(costosDirectos.subcontratistas) || 0);
  };

  const calcIndirectos = () => {
    return (parseFloat(costosIndirectos.oficina) || 0) +
           (parseFloat(costosIndirectos.seguros) || 0) +
           (parseFloat(costosIndirectos.permisos) || 0) +
           (parseFloat(costosIndirectos.administracion) || 0);
  };

  const sumDirectos = calcDirectos();
  const sumIndirectos = calcIndirectos();
  const subtotal = sumDirectos + sumIndirectos;
  const contingenciaMonto = subtotal * (contingenciaPorcentaje / 100);
  const totalGeneral = subtotal + contingenciaMonto;

  const canSave = proyectoId && titulo.trim() !== '' && version.trim() !== '';

  const handleGuardar = () => {
    if (!canSave) return;
    const nuevo = {
      id: `PRES-${String(Date.now()).slice(-4)}`,
      proyectoId,
      version,
      estado: 'Borrador',
      isBaseline: false,
      titulo,
      documentacion,
      requisitos,
      proceso,
      costosDirectos: {
        materiales: parseFloat(costosDirectos.materiales) || 0,
        manoDeObra: parseFloat(costosDirectos.manoDeObra) || 0,
        equipos: parseFloat(costosDirectos.equipos) || 0,
        subcontratistas: parseFloat(costosDirectos.subcontratistas) || 0
      },
      costosIndirectos: {
        oficina: parseFloat(costosIndirectos.oficina) || 0,
        seguros: parseFloat(costosIndirectos.seguros) || 0,
        permisos: parseFloat(costosIndirectos.permisos) || 0,
        administracion: parseFloat(costosIndirectos.administracion) || 0
      },
      contingenciaPorcentaje: parseFloat(contingenciaPorcentaje) || 0,
      fecha: fmt(hoy),
      clienteId: cliente ? cliente.id : null,
      comparacionProveedores
    };
    onGuardar(nuevo);
    setGuardado(true);
    setTimeout(() => onCancelar(), 1500);
  };

  const sectionTitle = (emoji, txt) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid var(--border)' }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{txt}</span>
    </div>
  );

  const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', fontFamily: 'DM Mono', fontSize: 13, outline: 'none', background: 'var(--surface)' };
  const labelStyle = { fontSize: 11, color: 'var(--text-3)', marginBottom: 3, display: 'block', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Nuevo Presupuesto</div>
          <div className="page-subtitle">Define los costos del proyecto. El desglose se calculará automáticamente.</div>
        </div>
        <button className="btn btn-secondary" onClick={onCancelar}>← Volver</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        <div>
          {/* General Information */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('📋', 'Datos Generales')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Proyecto Vinculado *</label>
                <select className="form-control" value={proyectoId} onChange={e => setProyectoId(e.target.value)}>
                  <option value="">— Seleccionar Proyecto —</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.id} - {p.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Título del Presupuesto *</label>
                <input className="form-control" placeholder="Ej: Cotización Base Licencia de Construcción" value={titulo} onChange={e => setTitulo(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Versión *</label>
                <input className="form-control" style={{ fontFamily: 'DM Mono', fontWeight: 600, textAlign: 'center' }} placeholder="V1.0" value={version} onChange={e => setVersion(e.target.value)} />
              </div>
              {cliente && (
                <div style={{ gridColumn: '1/-1', background: 'var(--surface2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 13, display: 'flex', gap: 12 }}>
                  <span style={{ color: 'var(--text-3)' }}>Cliente Asociado:</span>
                  <strong style={{ color: 'var(--text)' }}>👤 {cliente.nombre}</strong>
                  <span style={{ color: 'var(--text-3)', marginLeft: 'auto' }}>Estatus del proyecto:</span>
                  <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{selProyecto?.estatus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Costos Directos */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('🧱', 'Costos Directos')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>🧱 Materiales</label>
                <input style={inputStyle} type="number" placeholder="$0.00" value={costosDirectos.materiales} onChange={e => setCostosDirectos({...costosDirectos, materiales: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>👥 Mano de Obra</label>
                <input style={inputStyle} type="number" placeholder="$0.00" value={costosDirectos.manoDeObra} onChange={e => setCostosDirectos({...costosDirectos, manoDeObra: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>🚜 Equipos y Herramientas</label>
                <input style={inputStyle} type="number" placeholder="$0.00" value={costosDirectos.equipos} onChange={e => setCostosDirectos({...costosDirectos, equipos: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>🤝 Subcontratistas</label>
                <input style={inputStyle} type="number" placeholder="$0.00" value={costosDirectos.subcontratistas} onChange={e => setCostosDirectos({...costosDirectos, subcontratistas: e.target.value})} />
              </div>
            </div>
            <div style={{ background: 'var(--surface2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Subtotal Costos Directos</span>
              <strong style={{ fontFamily: 'DM Mono', fontSize: 16 }}>{money(sumDirectos)}</strong>
            </div>
          </div>

          {/* Costos Indirectos */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('🏢', 'Costos Indirectos')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>🏢 Oficina y Gastos Centrales</label>
                <input style={inputStyle} type="number" placeholder="$0.00" value={costosIndirectos.oficina} onChange={e => setCostosIndirectos({...costosIndirectos, oficina: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>🛡️ Seguros y Fianzas</label>
                <input style={inputStyle} type="number" placeholder="$0.00" value={costosIndirectos.seguros} onChange={e => setCostosIndirectos({...costosIndirectos, seguros: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>🏛️ Permisos, Licencias y Derechos</label>
                <input style={inputStyle} type="number" placeholder="$0.00" value={costosIndirectos.permisos} onChange={e => setCostosIndirectos({...costosIndirectos, permisos: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>💼 Personal Administrativo</label>
                <input style={inputStyle} type="number" placeholder="$0.00" value={costosIndirectos.administracion} onChange={e => setCostosIndirectos({...costosIndirectos, administracion: e.target.value})} />
              </div>
            </div>
            <div style={{ background: 'var(--surface2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Subtotal Costos Indirectos</span>
              <strong style={{ fontFamily: 'DM Mono', fontSize: 16 }}>{money(sumIndirectos)}</strong>
            </div>
          </div>

          {/* Contingency Fund */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('🚨', 'Fondo de Contingencia')}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, alignItems: 'center' }}>
              <div>
                <label style={labelStyle}>Porcentaje %</label>
                <input style={{...inputStyle, textAlign: 'center'}} type="number" min="0" max="100" value={contingenciaPorcentaje} onChange={e => setContingenciaPorcentaje(parseFloat(e.target.value) || 0)} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Se sumará un fondo de reserva del <strong>{contingenciaPorcentaje}%</strong> calculado sobre la suma de costos directos e indirectos (Subtotal: {money(subtotal)}).
              </div>
            </div>
            <div style={{ background: 'var(--surface2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Fondo de Contingencia Calculado</span>
              <strong style={{ fontFamily: 'DM Mono', fontSize: 16, color: '#B87A0A' }}>{money(contingenciaMonto)}</strong>
            </div>
          </div>

          {/* Supplier Comparison widget */}
          <ComparativaProveedores comparaciones={comparacionProveedores} onChange={setComparacionProveedores} editable={true} />

          {/* Tramite Checklist templates */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('📁', 'Requisitos y Trámite')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Documentación requerida (un ítem por línea)</label>
                <textarea className="form-control" rows={4} placeholder="Escrituras del predio&#10;Identificación oficial&#10;Planos arquitectónicos" value={documentacion} onChange={e => setDocumentacion(e.target.value)} style={{ fontFamily: 'DM Mono', fontSize: 12 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Requisitos previos (un ítem por línea)</label>
                <textarea className="form-control" rows={4} placeholder="Predial al corriente&#10;Uso de suelo vigente" value={requisitos} onChange={e => setRequisitos(e.target.value)} style={{ fontFamily: 'DM Mono', fontSize: 12 }} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Proceso del Trámite</label>
                <textarea className="form-control" rows={2} placeholder="Descripción del flujo de gestiones administrativas..." value={proceso} onChange={e => setProceso(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right sticky summaries */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>Resumen de Costos</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>🧱 Costos Directos:</span>
                <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{money(sumDirectos)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>🏢 Costos Indirectos:</span>
                <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{money(sumIndirectos)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Subtotal de Costos:</span>
                <span style={{ fontFamily: 'DM Mono', fontWeight: 700 }}>{money(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#B87A0A' }}>
                <span>🚨 Contingencia ({contingenciaPorcentaje}%):</span>
                <span style={{ fontFamily: 'DM Mono', fontWeight: 700 }}>{money(contingenciaMonto)}</span>
              </div>
            </div>

            <div style={{ background: totalGeneral > 0 ? 'var(--text)' : 'var(--surface2)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: totalGeneral > 0 ? 'rgba(255,255,255,0.5)' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total Estimado</div>
                <div style={{ fontSize: 10, color: totalGeneral > 0 ? 'rgba(255,255,255,0.35)' : 'var(--text-3)' }}>IVA No Incluido</div>
              </div>
              <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 20, color: totalGeneral > 0 ? '#FFFFFF' : 'var(--text-3)' }}>
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
          {!proyectoId && <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>Selecciona un proyecto para poder guardar</div>}
          {proyectoId && !titulo && <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>Ingresa un título para poder guardar</div>}
        </div>
      </div>
    </div>
  );
}

// ─── VISTA DETALLADA DEL PRESUPUESTO COMPONENT ────────────────────────────────
function VistaPresupuesto({ p, onCerrar, clientes, proyectos, onAjustar, onCambiarEstatus, onMarcarBaseline }) {
  const [checkDoc, setCheckDoc] = useState({});
  const [checkReq, setCheckReq] = useState({});

  const proj = proyectos.find(pr => pr.id === p.proyectoId);
  const cliente = proj ? clientes.find(c => c.id === proj.clienteId) : (p.clienteId ? clientes.find(c => c.id === p.clienteId) : null);

  const docItems = p.documentacion?.split('\n').map(l => l.trim()).filter(Boolean) || [];
  const reqItems = p.requisitos?.split('\n').map(l => l.trim()).filter(Boolean) || [];
  const docDone = docItems.filter((_, i) => checkDoc[i]).length;
  const reqDone = reqItems.filter((_, i) => checkReq[i]).length;

  const cd = p.costosDirectos || {};
  const ci = p.costosIndirectos || {};

  const directosVal = (parseFloat(cd.materiales) || 0) +
                      (parseFloat(cd.manoDeObra) || 0) +
                      (parseFloat(cd.equipos) || 0) +
                      (parseFloat(cd.subcontratistas) || 0);

  const indirectosVal = (parseFloat(ci.oficina) || 0) +
                        (parseFloat(ci.seguros) || 0) +
                        (parseFloat(ci.permisos) || 0) +
                        (parseFloat(ci.administracion) || 0);

  const subtotal = directosVal + indirectosVal;
  const contingenciaVal = subtotal * ((p.contingenciaPorcentaje || 0) / 100);
  const total = subtotal + contingenciaVal;

  const CheckItem = ({ label, idx, state, setState }) => (
    <div onClick={() => setState(s => ({ ...s, [idx]: !s[idx] }))} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: state[idx] ? 'var(--accent-light)' : 'transparent', marginBottom: 4, transition: 'background 0.15s' }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${state[idx] ? 'var(--accent)' : 'var(--border-strong)'}`, background: state[idx] ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
        {state[idx] && <Icon name="check" size={10} style={{ color: '#fff' }} />}
      </div>
      <span style={{ fontSize: 13, textDecoration: state[idx] ? 'line-through' : 'none', color: state[idx] ? 'var(--text-3)' : 'var(--text)' }}>{label}</span>
    </div>
  );

  const CostRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{money(value)}</span>
    </div>
  );

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title" style={{ fontSize: 19 }}>{p.titulo}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: 'DM Mono', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{p.version}</span>
            <span className="badge badge-gray">{p.id}</span>
            {proj && <span className="badge badge-blue">🗂️ {proj.nombre}</span>}
            {cliente && <span className="badge badge-gray">👤 {cliente.nombre}</span>}
            <span style={{
              fontSize: 11,
              background: p.estado === 'Aprobado' ? 'var(--accent-light)' : p.estado === 'Enviado' ? 'var(--blue-light)' : p.estado === 'Rechazado' ? 'rgba(192,57,43,0.1)' : 'var(--surface2)',
              color: p.estado === 'Aprobado' ? 'var(--accent-text)' : p.estado === 'Enviado' ? 'var(--blue)' : p.estado === 'Rechazado' ? '#C0392B' : 'var(--text-3)',
              padding: '2px 8px', borderRadius: 10, fontWeight: 600
            }}>{p.estado}</span>
            {p.isBaseline && <span className="badge badge-green">Línea Base Activa</span>}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onCerrar}>← Volver</button>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface2)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>Acciones de Gestión:</span>
        
        {p.estado === 'Borrador' && (
          <button className="btn btn-sm btn-primary" onClick={() => onCambiarEstatus(p.id, 'Enviado')}>
            📨 Enviar al Cliente
          </button>
        )}
        
        {p.estado === 'Enviado' && (
          <>
            <button className="btn btn-sm btn-primary" onClick={() => onCambiarEstatus(p.id, 'Aprobado')} style={{ background: 'var(--accent)' }}>
              ✓ Aprobar Presupuesto
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => onCambiarEstatus(p.id, 'Rechazado')} style={{ color: '#C0392B' }}>
              ✕ Rechazar
            </button>
          </>
        )}

        {p.estado === 'Aprobado' && !p.isBaseline && (
          <button className="btn btn-sm btn-primary" onClick={() => onMarcarBaseline(p.id)} style={{ background: 'var(--accent)', color: '#fff' }}>
            🔒 Establecer como Línea Base
          </button>
        )}

        {/* Change management clone */}
        {(p.estado === 'Aprobado' || p.estado === 'Enviado' || p.estado === 'Rechazado') && (
          <button className="btn btn-sm btn-secondary" onClick={() => onAjustar(p)}>
            🔄 Ajustar Presupuesto (Nueva Versión)
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Proceso */}
        {p.proceso && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>🔄 Proceso del Trámite</div>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>{p.proceso}</p>
          </div>
        )}

        {/* Checklist Documentación */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>📁 Documentación Necesaria</div>
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

      {/* Supplier Comparison Display */}
      {p.comparacionProveedores && p.comparacionProveedores.length > 0 && (
        <ComparativaProveedores comparaciones={p.comparacionProveedores} onChange={() => {}} editable={false} />
      )}

      {/* Tabla de costos desglosados */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>🧱 Costos Directos</div>
          <CostRow label="Materiales" value={cd.materiales} />
          <CostRow label="Mano de Obra" value={cd.manoDeObra} />
          <CostRow label="Equipos y Herramientas" value={cd.equipos} />
          <CostRow label="Subcontratistas" value={cd.subcontratistas} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
            <span>Subtotal Directos</span><span style={{ fontFamily: 'DM Mono' }}>{money(directosVal)}</span>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>🏢 Costos Indirectos</div>
          <CostRow label="Oficina Central" value={ci.oficina} />
          <CostRow label="Seguros y Fianzas" value={ci.seguros} />
          <CostRow label="Permisos y Derechos" value={ci.permisos} />
          <CostRow label="Personal Administrativo" value={ci.administracion} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, fontSize: 14, color: 'var(--blue)' }}>
            <span>Subtotal Indirectos</span><span style={{ fontFamily: 'DM Mono' }}>{money(indirectosVal)}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--text)', border: 'none', color: '#fff', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Subtotal Costos</div>
          <div style={{ fontFamily: 'DM Mono', fontWeight: 600, fontSize: 16, color: '#fff', margin: '4px 0 10px' }}>{money(subtotal)}</div>
          
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Contingencia ({p.contingenciaPorcentaje}%)</div>
          <div style={{ fontFamily: 'DM Mono', fontWeight: 600, fontSize: 16, color: '#B87A0A', margin: '4px 0 14px' }}>{money(contingenciaVal)}</div>
          
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total General</div>
            <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 24, color: '#FFFFFF', lineHeight: 1.1, marginTop: 4 }}>{money(total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN MODULE COMPONENT ────────────────────────────────────────────────────
export function Presupuestos() {
  const {
    clientes,
    session,
    conceptos,
    proyectos,
    updateProyecto,
    presupuestos,
    setPresupuestos,
    preselectedProjectId,
    setPreselectedProjectId
  } = useAppContext();

  const [tab, setTab] = useState('agrupado'); // 'agrupado' | 'nuevo' | 'ver' | 'catalogo'
  const [viendoId, setViendoId] = useState(null);
  const [q, setQ] = useState('');
  const [expandedProyecto, setExpandedProyecto] = useState(null);

  // Automatically open creation tab if preselectedProjectId is active
  useEffect(() => {
    if (preselectedProjectId) {
      setTab('nuevo');
    }
  }, [preselectedProjectId]);

  const verPres = presupuestos.find(p => p.id === viendoId);

  const guardarNuevo = (p) => {
    setPresupuestos(prev => [p, ...prev]);
    // Clear preselected project
    if (preselectedProjectId) {
      setPreselectedProjectId(null);
    }
  };

  const statusMap = {
    'Borrador': 'badge-gray',
    'Enviado': 'badge-blue',
    'Aprobado': 'badge-green',
    'Rechazado': 'badge-red'
  };

  // Change management clone function
  const handleAjustar = (budget) => {
    const nextVer = incrementVersion(budget.version);
    const clon = {
      ...budget,
      id: `PRES-${String(Date.now()).slice(-4)}`,
      version: nextVer,
      estado: 'Borrador',
      isBaseline: false,
      fecha: fmt(hoy)
    };
    
    // Add clone to state
    setPresupuestos(prev => [clon, ...prev]);
    setViendoId(clon.id);
    setTab('ver');
  };

  // Update budget status
  const handleCambiarEstatus = (id, nuevoEstatus) => {
    setPresupuestos(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, estado: nuevoEstatus };
      }
      return b;
    }));
  };

  // Mark budget as project baseline
  const handleMarcarBaseline = (id) => {
    const targetBudget = presupuestos.find(b => b.id === id);
    if (!targetBudget) return;

    setPresupuestos(prev => prev.map(b => {
      if (b.proyectoId === targetBudget.proyectoId) {
        return {
          ...b,
          isBaseline: b.id === id
        };
      }
      return b;
    }));

    // Update project total amount in context
    const budgetTotalVal = calcBudgetTotal(targetBudget);
    const associatedProj = proyectos.find(pr => pr.id === targetBudget.proyectoId);
    if (associatedProj) {
      updateProyecto({
        ...associatedProj,
        monto: budgetTotalVal
      });
    }
  };

  if (tab === 'nuevo') {
    return (
      <FormNuevoPresupuesto
        onGuardar={guardarNuevo}
        onCancelar={() => { setTab('agrupado'); setPreselectedProjectId(null); }}
        clientes={clientes}
        proyectos={proyectos}
        preselectedProjectId={preselectedProjectId}
      />
    );
  }

  if (tab === 'ver' && verPres) {
    return (
      <VistaPresupuesto
        p={verPres}
        onCerrar={() => setTab('agrupado')}
        clientes={clientes}
        proyectos={proyectos}
        onAjustar={handleAjustar}
        onCambiarEstatus={handleCambiarEstatus}
        onMarcarBaseline={handleMarcarBaseline}
      />
    );
  }

  // Filter projects or budgets based on query
  const filteredProjects = proyectos.filter(p => {
    if (session.rol === 'cliente') {
      // Find if this project belongs to client
      if (p.clienteId !== session.clienteId) return false;
    }
    const cli = clientes.find(c => c.id === p.clienteId);
    const matchQ = p.nombre.toLowerCase().includes(q.toLowerCase()) ||
                   p.id.toLowerCase().includes(q.toLowerCase()) ||
                   (cli && cli.nombre.toLowerCase().includes(q.toLowerCase()));
    return matchQ;
  });

  const filteredCatalogo = conceptos.filter(c =>
    c.clave.toLowerCase().includes(q.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">{session.rol === 'cliente' ? 'Mis Presupuestos' : 'Presupuestos por Proyecto'}</div>
          <div className="page-subtitle">Gestión e historial de presupuestos, comparativa de proveedores y línea base oficial.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`btn ${tab === 'agrupado' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('agrupado')}>
            🗂️ Presupuestos
          </button>
          <button className={`btn ${tab === 'catalogo' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('catalogo')}>
            📖 Catálogo Conceptos
          </button>
          {session.rol !== 'cliente' && (
            <button className="btn btn-primary" onClick={() => setTab('nuevo')}>
              <Icon name="plus" size={14} /> Nuevo Presupuesto
            </button>
          )}
        </div>
      </div>

      {/* Global Search */}
      <div className="search-wrap mb-6" style={{ maxWidth: 400 }}>
        <Icon name="search" size={14} />
        <input className="form-control search-input" placeholder="Buscar por proyecto, id o concepto…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {tab === 'agrupado' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredProjects.map(proj => {
            const associatedBudgets = presupuestos.filter(b => b.proyectoId === proj.id);
            const baselineBudget = associatedBudgets.find(b => b.isBaseline);
            const isExpanded = expandedProyecto === proj.id;

            return (
              <div key={proj.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Project Group Header */}
                <div
                  onClick={() => setExpandedProyecto(isExpanded ? null : proj.id)}
                  style={{
                    padding: '16px 20px', background: 'var(--surface2)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{proj.id}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{proj.nombre}</span>
                      <span className={`badge badge-gray`} style={{ fontSize: 10 }}>{associatedBudgets.length} versiones</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      👤 Cliente: {clientes.find(c => c.id === proj.clienteId)?.nombre || '—'} · 📍 {proj.ubicacion || 'No especificada'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {baselineBudget && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Línea Base Oficial</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'DM Mono' }}>
                          {money(calcBudgetTotal(baselineBudget))}
                        </div>
                      </div>
                    )}
                    <Icon name="chevdown" size={16} style={{ transform: isExpanded ? 'rotate(180deg)' : '', transition: 'transform 0.2s', color: 'var(--text-3)' }} />
                  </div>
                </div>

                {/* Project Group Body (Budgets list) */}
                {isExpanded && (
                  <div style={{ padding: '8px 16px 16px' }}>
                    {associatedBudgets.length === 0 ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12, fontStyle: 'italic' }}>
                        No hay ningún presupuesto creado para este proyecto. Haz clic en "Nuevo Presupuesto" arriba para crear uno.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>Versión</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>Título del Presupuesto</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>Fecha</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>Estatus</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>Costo Total</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>Línea Base</th>
                            </tr>
                          </thead>
                          <tbody>
                            {associatedBudgets.sort((a,b) => b.version.localeCompare(a.version)).map(b => {
                              const totalCost = calcBudgetTotal(b);
                              return (
                                <tr
                                  key={b.id}
                                  onClick={() => { setViendoId(b.id); setTab('ver'); }}
                                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                                  onMouseLeave={e => e.currentTarget.style.background = ''}
                                >
                                  <td style={{ padding: '12px', fontWeight: 700, fontFamily: 'DM Mono', color: 'var(--accent)' }}>{b.version}</td>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ fontWeight: 600 }}>{b.titulo}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>ID: {b.id}</div>
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-2)' }}>{b.fecha}</td>
                                  <td style={{ padding: '12px', textAlign: 'center' }}>
                                    <span className={`badge ${statusMap[b.estado] || 'badge-gray'}`}>{b.estado}</span>
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontFamily: 'DM Mono', color: b.isBaseline ? 'var(--accent)' : 'var(--text)' }}>
                                    {money(totalCost)}
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'center' }}>
                                    {b.isBaseline ? (
                                      <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Sí</span>
                                    ) : (
                                      <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Catálogo de conceptos */
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="list" size={15} style={{ color: 'var(--text-3)' }} />
            Catálogo de Conceptos
            <span className="badge badge-gray">{filteredCatalogo.length}</span>
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
                {filteredCatalogo.map((c, i) => (
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
      )}
    </div>
  );
}

export default Presupuestos;

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { money, EQUIPO } from '../data/mockData';
import { usePresupuestos } from '../hooks/usePresupuestos';
import { useTareas } from '../hooks/useTareas';
import Swal from 'sweetalert2';

const hoy = new Date();
const fmt = (d) => d.toISOString().split('T')[0];

const STAGES = [
  "Uso de Suelo",
  "Licencia de Construcción",
  "Terminación de Obra",
  "Licencia de Funcionamiento"
];

// Helper to auto-increment version
const incrementVersion = (v) => {
  if (!v) return '1.00';
  const val = parseFloat(v);
  if (isNaN(val)) return v + '.1';
  return (val + 0.01).toFixed(2);
};

const flatTextarea = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '8px 12px',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: '12px',
  resize: 'vertical'
};

// Helper to calculate total budget using new schema
const calcBudgetTotal = (b) => {
  if (!b) return 0;
  if (b.conceptos && b.conceptos.length > 0) {
    if (b.conceptos[0].hasOwnProperty('honorarios')) {
      const subtotalHonorarios = b.conceptos.reduce((acc, c) => acc + (parseFloat(c.honorarios) || 0), 0);
      const iva = subtotalHonorarios * 0.16;
      const derechos = b.conceptos.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0);
      const extras = b.conceptos.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0);
      return subtotalHonorarios + iva + derechos + extras;
    }
    // Fallback for old mock budgets
    return b.conceptos.reduce((acc, c) => {
      const mat = parseFloat(c.costoMateriales) || 0;
      const mo = parseFloat(c.costoManoObra) || 0;
      const eq = parseFloat(c.costoEquipo) || 0;
      const cant = parseFloat(c.cantidad) || 0;
      return acc + cant * (mat + mo + eq);
    }, 0);
  }
  return 0;
};

// Returns stage duration key in infoAdicional
const getStageDurationKey = (stageName) => {
  if (stageName.includes("Uso de Suelo")) return "duracionUsoSuelo";
  if (stageName.includes("Construcción")) return "duracionLicenciaConst";
  if (stageName.includes("Terminación")) return "duracionTerminacionObra";
  if (stageName.includes("Funcionamiento")) return "duracionLicenciaFunc";
  return "duracionOtros";
};

// ─── CATALOG FILTER & CONCEPT BUILDER COMPONENT ──────────────────────────────
function ConceptBuilder({ catalog, onAddConcept, equipo }) {
  const [nuevaEtapa, setNuevaEtapa] = useState("Uso de Suelo");
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [nuevaUnidad, setNuevaUnidad] = useState("GESTIÓN");
  const [nuevosHonorarios, setNuevosHonorarios] = useState("");
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [nuevoPagoDerechos, setNuevoPagoDerechos] = useState("0");
  const [nuevoExtra, setNuevoExtra] = useState("0");
  const [nuevoAsignado, setNuevoAsignado] = useState("");

  // Search filter for catalog items
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCatalog = catalog.filter(c =>
    c.clave.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCatalogSelect = (cat) => {
    setNuevoConcepto(cat.descripcion);
    setNuevosHonorarios(cat.precio ? cat.precio.toString() : "0");
    setNuevaUnidad("GESTIÓN");
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleAdd = () => {
    if (!nuevoConcepto) return;
    onAddConcept({
      etapa: nuevaEtapa,
      concepto: nuevoConcepto,
      unidad: nuevaUnidad,
      honorarios: parseFloat(nuevosHonorarios) || 0,
      comentarios: nuevoComentario,
      pagoDerechos: parseFloat(nuevoPagoDerechos) || 0,
      extra: parseFloat(nuevoExtra) || 0,
      empleadoAsignadoId: nuevoAsignado || ""
    });
    setNuevoConcepto("");
    setNuevosHonorarios("");
    setNuevoComentario("");
    setNuevoPagoDerechos("0");
    setNuevoExtra("0");
    setNuevoAsignado("");
  };

  return (
    <div className="card" style={{ marginBottom: 20, padding: 20, border: '1px solid var(--border)', background: 'var(--surface2)' }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
        <Icon name="plus" size={16} style={{ color: 'var(--accent)' }} />
        <span>Agregar Conceptos al Presupuesto</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
        {/* Left Side: Catalog Filter Search */}
        <div style={{ position: 'relative' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
            1. FILTRAR Y SELECCIONAR DEL CATÁLOGO
          </label>
          <div style={{ position: 'relative' }}>
            <input
              className="form-control"
              placeholder="Buscar servicio en el catálogo (ej: Uso de suelo, Licencia...)"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              style={{ paddingLeft: 30, fontSize: 13 }}
            />
            <div style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-3)' }}>
              <Icon name="search" size={14} />
            </div>
          </div>

          {showDropdown && searchQuery && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg)',
              border: '1px solid var(--border)', borderRadius: 4, zIndex: 100, maxHeight: 200, overflowY: 'auto',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}>
              {filteredCatalog.length === 0 ? (
                <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>
                  No se encontraron conceptos.
                </div>
              ) : (
                filteredCatalog.map(cat => (
                  <div
                    key={cat.clave}
                    onClick={() => handleCatalogSelect(cat)}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div>
                      <span className="mono" style={{ background: 'var(--surface2)', padding: '2px 4px', borderRadius: 3, marginRight: 8, fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{cat.clave}</span>
                      <span>{cat.descripcion}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontFamily: 'DM Mono' }}>{money(cat.price || cat.precio)}</span>
                  </div>
                ))
              )}
            </div>
          )}
          {showDropdown && searchQuery && (
            <div style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, zIndex: 90 }} onClick={() => setShowDropdown(false)} />
          )}
        </div>

        {/* Right Side: Manual Title Edit */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
            CONCEPTO SELECCIONADO / PERSONALIZADO
          </label>
          <input
            className="form-control"
            placeholder="Escribe o edita el concepto aquí..."
            value={nuevoConcepto}
            onChange={e => setNuevoConcepto(e.target.value)}
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      {/* Detail inputs grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 4, display: 'block' }}>Etapa Administrativa</label>
          <select className="form-control" style={{ fontSize: 12, padding: '6px' }} value={nuevaEtapa} onChange={e => setNuevaEtapa(e.target.value)}>
            {STAGES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 4, display: 'block' }}>Unidad</label>
          <select className="form-control" style={{ fontSize: 12, padding: '6px' }} value={nuevaUnidad} onChange={e => setNuevaUnidad(e.target.value)}>
            <option value="GESTIÓN">GESTIÓN</option>
            <option value="TRAMITE">TRAMITE</option>
            <option value="ESTUDIO">ESTUDIO</option>
            <option value="PROYECTO">PROYECTO</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 4, display: 'block' }}>Honorarios ($)</label>
          <input type="number" className="form-control" placeholder="0" style={{ fontSize: 12, padding: '6px' }} value={nuevosHonorarios} onChange={e => setNuevosHonorarios(e.target.value)} />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 4, display: 'block' }}>Comentarios</label>
          <input className="form-control" placeholder="Obs..." style={{ fontSize: 12, padding: '6px' }} value={nuevoComentario} onChange={e => setNuevoComentario(e.target.value)} />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 4, display: 'block' }}>Derechos ($)</label>
          <input type="number" className="form-control" placeholder="0" style={{ fontSize: 12, padding: '6px' }} value={nuevoPagoDerechos} onChange={e => setNuevoPagoDerechos(e.target.value)} />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 4, display: 'block' }}>Extra ($)</label>
          <input type="number" className="form-control" placeholder="0" style={{ fontSize: 12, padding: '6px' }} value={nuevoExtra} onChange={e => setNuevoExtra(e.target.value)} />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 4, display: 'block' }}>Asignar Gestor</label>
          <select className="form-control" style={{ fontSize: 12, padding: '6px' }} value={nuevoAsignado} onChange={e => setNuevoAsignado(e.target.value)}>
            <option value="">— Gestor... —</option>
            {equipo.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleAdd} disabled={!nuevoConcepto} style={{ height: 38, justifyContent: 'center' }}>
          + Agregar Línea
        </button>
      </div>
    </div>
  );
}

// ─── CONCEPTS TABLE COMPONENT ────────────────────────────────────────────────
function TablaConceptos({ conceptos = [], onChange, editable = false, infoAdicional = {}, onInfoAdicionalChange }) {
  const removeConcept = (id) => {
    const updated = conceptos.filter(c => c.id !== id).map((c, idx) => ({ ...c, no: idx + 1 }));
    onChange(updated);
  };

  const updateConcept = (id, field, val) => {
    onChange(conceptos.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  // Group items by stage
  const conceptsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = conceptos.filter(c => c.etapa === stage);
    return acc;
  }, {});
  const otherItems = conceptos.filter(c => !STAGES.includes(c.etapa));

  const renderStageSection = (stageName, items) => {
    if (items.length === 0) return null;

    const sumHono = items.reduce((acc, c) => acc + (parseFloat(c.honorarios) || 0), 0);
    const sumDere = items.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0);
    const sumExtr = items.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0);
    const durationKey = getStageDurationKey(stageName);

    return (
      <React.Fragment key={stageName}>
        {/* Stage Separator Row */}
        <tr style={{ background: 'var(--surface2)', borderBottom: '2px solid var(--border)' }}>
          <td colSpan="9" style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--accent)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Etapa: {stageName}
          </td>
        </tr>

        {items.map((c) => {
          if (editable) {
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold' }}>{c.no}</td>
                <td style={{ padding: '10px 8px' }}>
                  <textarea className="form-control" rows={2} style={{ padding: '6px', fontSize: '13px', width: '100%' }} value={c.concepto} onChange={e => updateConcept(c.id, 'concepto', e.target.value)} />
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <select className="form-control" style={{ fontSize: '12px', padding: '6px' }} value={c.unidad} onChange={e => updateConcept(c.id, 'unidad', e.target.value)}>
                    <option value="GESTIÓN">GESTIÓN</option>
                    <option value="TRAMITE">TRAMITE</option>
                    <option value="ESTUDIO">ESTUDIO</option>
                    <option value="PROYECTO">PROYECTO</option>
                  </select>
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <input type="number" className="form-control" style={{ textAlign: 'right', fontSize: '12px', padding: '6px', fontFamily: 'DM Mono', fontWeight: 'bold' }} value={c.honorarios} onChange={e => updateConcept(c.id, 'honorarios', parseFloat(e.target.value) || 0)} />
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <textarea className="form-control" rows={2} style={{ padding: '6px', fontSize: '12px', width: '100%' }} value={c.comentarios} onChange={e => updateConcept(c.id, 'comentarios', e.target.value)} />
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <input type="number" className="form-control" style={{ textAlign: 'right', fontSize: '12px', padding: '6px', fontFamily: 'DM Mono' }} value={c.pagoDerechos} onChange={e => updateConcept(c.id, 'pagoDerechos', parseFloat(e.target.value) || 0)} />
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <input type="number" className="form-control" style={{ textAlign: 'right', fontSize: '12px', padding: '6px', fontFamily: 'DM Mono' }} value={c.extra} onChange={e => updateConcept(c.id, 'extra', parseFloat(e.target.value) || 0)} />
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <select className="form-control" style={{ fontSize: '12px', padding: '6px' }} value={c.empleadoAsignadoId || ''} onChange={e => updateConcept(c.id, 'empleadoAsignadoId', e.target.value || null)}>
                    <option value="">— Asignar —</option>
                    {EQUIPO.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
                  </select>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <button className="btn btn-ghost" onClick={() => removeConcept(c.id)} style={{ padding: 4, color: 'var(--red)' }}>
                    <Icon name="trash" size={14} />
                  </button>
                </td>
              </tr>
            );
          } else {
            const assigned = EQUIPO.find(eq => eq.id === c.empleadoAsignadoId);
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
                <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-3)' }}>{c.no}</td>
                <td style={{ padding: '12px 10px', fontWeight: '500', fontSize: '13px' }}>{c.concepto}</td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}><span className="badge badge-gray">{c.unidad}</span></td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: '600' }}>{money(c.honorarios)}</td>
                <td style={{ padding: '12px 10px', fontSize: '12px', color: 'var(--text-2)', whiteSpace: 'pre-line' }}>{c.comentarios || '—'}</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'DM Mono' }}>{c.pagoDerechos > 0 ? money(c.pagoDerechos) : '$ -'}</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'DM Mono' }}>{c.extra > 0 ? money(c.extra) : '$ -'}</td>
                <td style={{ padding: '12px 10px' }}>
                  {assigned ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: assigned.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>{assigned.avatar}</span>
                      <span style={{ fontSize: 12 }}>{assigned.nombre}</span>
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-3)', fontSize: 12, fontStyle: 'italic' }}>— Sin Asignar —</span>
                  )}
                </td>
              </tr>
            );
          }
        })}

        {/* Stage Total Sub-row */}
        <tr style={{ background: 'var(--surface)', fontWeight: 'bold', borderBottom: '2px solid var(--border-strong)' }}>
          <td colSpan="3" style={{ padding: '10px 12px', color: 'var(--text-2)', textTransform: 'uppercase', fontSize: '11px', textAlign: 'right' }}>
            Subtotal {stageName}
          </td>
          <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono', color: 'var(--accent)', fontSize: '12px' }}>
            {money(sumHono)}
          </td>
          <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--amber)', fontWeight: '700' }}>
            {editable ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 'bold' }}>DURACIÓN DE ETAPA:</span>
                <input className="form-control" style={{ padding: '4px 8px', fontSize: '12px', width: 220 }} placeholder="Ej: 3 meses" value={infoAdicional[durationKey] || ''} onChange={e => onInfoAdicionalChange(durationKey, e.target.value)} />
              </div>
            ) : (
              <span>Duración de {infoAdicional[durationKey] ? infoAdicional[durationKey] : 'N/A'}</span>
            )}
          </td>
          <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono', fontSize: '12px' }}>
            {money(sumDere)}
          </td>
          <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'DM Mono', fontSize: '12px' }}>
            {money(sumExtr)}
          </td>
          <td colSpan={editable ? 2 : 1}></td>
        </tr>
      </React.Fragment>
    );
  };

  return (
    <div style={{ overflowX: 'auto', marginBottom: 20, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: 'var(--surface)' }}>
        <thead>
          <tr style={{ background: 'var(--surface2)', borderBottom: '2px solid var(--border-strong)', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 10px', textAlign: 'center', width: '4%' }}>No.</th>
            <th style={{ padding: '12px 10px', textAlign: 'left', width: '38%' }}>Concepto / Descripción</th>
            <th style={{ padding: '12px 10px', textAlign: 'center', width: '8%' }}>Unidad</th>
            <th style={{ padding: '12px 10px', textAlign: 'right', width: '10%' }}>Honorarios</th>
            <th style={{ padding: '12px 10px', textAlign: 'left', width: '20%' }}>Comentarios</th>
            <th style={{ padding: '12px 10px', textAlign: 'right', width: '10%' }}>Derechos</th>
            <th style={{ padding: '12px 10px', textAlign: 'right', width: '10%' }}>Extra</th>
            <th style={{ padding: '12px 10px', textAlign: 'left', width: '10%' }}>Asignación</th>
            {editable && <th style={{ width: '4%' }}></th>}
          </tr>
        </thead>
        <tbody>
          {STAGES.map(stage => renderStageSection(stage, conceptsByStage[stage]))}
          {otherItems.length > 0 && renderStageSection("Otros", otherItems)}
          {conceptos.length === 0 && (
            <tr>
              <td colSpan="9" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontStyle: 'italic' }}>
                No hay conceptos agregados a este presupuesto. Utiliza el buscador superior para agregar conceptos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── SPECIFICATIONS CARD COMPONENT ──────────────────────────────────────────
function FichaDatosPredio({ b, editable = false, onFieldChange }) {
  return (
    <div className="card" style={{ marginBottom: 20, padding: 20, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <Icon name="list" size={16} style={{ color: 'var(--accent)' }} />
        <span>Ficha de Metadatos del Predio y Parámetros Urbanos</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div>
          <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>PROPIETARIO / CLIENTE</label>
          {editable ? (
            <input className="form-control" value={b.propietario} onChange={e => onFieldChange('propietario', e.target.value)} placeholder="Ej: Santos Lugo" />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{b.propietario || '—'}</div>
          )}
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>DIRECCIÓN COMPLETA</label>
          {editable ? (
            <input className="form-control" value={b.direccion} onChange={e => onFieldChange('direccion', e.target.value)} placeholder="Ej: Tablajes 20690 Colonia Centro" />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{b.direccion || '—'}</div>
          )}
        </div>

        <div>
          <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>USO DE SUELO AUTORIZADO</label>
          {editable ? (
            <input className="form-control" value={b.uso} onChange={e => onFieldChange('uso', e.target.value)} placeholder="Ej: Tienda de Abarrotes" />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{b.uso || '—'}</div>
          )}
        </div>

        <div>
          <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>CLASIFICACIÓN DE IMPACTO</label>
          {editable ? (
            <input className="form-control" value={b.clasificacion} onChange={e => onFieldChange('clasificacion', e.target.value)} placeholder="Ej: Bajo Impacto" />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{b.clasificacion || '—'}</div>
          )}
        </div>

        <div>
          <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>ZONA PRIMARIA (PDUM)</label>
          {editable ? (
            <input className="form-control" value={b.zonaPrimaria} onChange={e => onFieldChange('zonaPrimaria', e.target.value)} placeholder="Ej: 2" />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{b.zonaPrimaria || '—'}</div>
          )}
        </div>

        <div>
          <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>TIPO DE VIALIDAD (PDUM)</label>
          {editable ? (
            <input className="form-control" value={b.tipoVialidad} onChange={e => onFieldChange('tipoVialidad', e.target.value)} placeholder="Ej: Local" />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{b.tipoVialidad || '—'}</div>
          )}
        </div>

        <div>
          <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>SUPERFICIE PREDIO (M2)</label>
          {editable ? (
            <input type="number" className="form-control" value={b.supPredio} onChange={e => onFieldChange('supPredio', e.target.value)} placeholder="0.00" />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'DM Mono' }}>{b.supPredio ? `${parseFloat(b.supPredio).toLocaleString('es-MX', { minimumFractionDigits: 2 })} M2` : '—'}</div>
          )}
        </div>

        <div>
          <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>SUPERFICIE CONST. EXISTENTE (M2)</label>
          {editable ? (
            <input type="number" className="form-control" value={b.supConstExistente} onChange={e => onFieldChange('supConstExistente', e.target.value)} placeholder="0.00" />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'DM Mono' }}>{b.supConstExistente ? `${parseFloat(b.supConstExistente).toLocaleString('es-MX', { minimumFractionDigits: 2 })} M2` : '0.00 M2'}</div>
          )}
        </div>

        <div>
          <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>SUPERFICIE A INTERVENIR (M2)</label>
          {editable ? (
            <input type="number" className="form-control" value={b.supIntervenir} onChange={e => onFieldChange('supIntervenir', e.target.value)} placeholder="0.00" />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', fontFamily: 'DM Mono' }}>{b.supIntervenir ? `${parseFloat(b.supIntervenir).toLocaleString('es-MX', { minimumFractionDigits: 2 })} M2` : '—'}</div>
          )}
        </div>

        <div>
          <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>ESTIMACIÓN</label>
          {editable ? (
            <input className="form-control" value={b.estimacion} onChange={e => onFieldChange('estimacion', e.target.value)} placeholder="Estimación" />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{b.estimacion || '—'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FORM NUEVO PRESUPUESTO COMPONENT ─────────────────────────────────────────
function FormNuevoPresupuesto({ onGuardar, onCancelar, clientes, proyectos, preselectedProjectId }) {
  const { conceptos: catalog } = useAppContext();
  const [proyectoId, setProyectoId] = useState(preselectedProjectId || '');
  const [titulo, setTitulo] = useState('');
  const [version, setVersion] = useState('1.00');

  // Metadata of property
  const [propietario, setPropietario] = useState('');
  const [direccion, setDireccion] = useState('');
  const [supPredio, setSupPredio] = useState('');
  const [supConstExistente, setSupConstExistente] = useState('0.00');
  const [supIntervenir, setSupIntervenir] = useState('');
  const [uso, setUso] = useState('');
  const [clasificacion, setClasificacion] = useState('');
  const [zonaPrimaria, setZonaPrimaria] = useState('');
  const [tipoVialidad, setTipoVialidad] = useState('');
  const [estimacion, setEstimacion] = useState('');
  const [costoDirectoConstruccion, setCostoDirectoConstruccion] = useState('');

  // Auxiliary information JSON
  const [infoAdicional, setInfoAdicional] = useState({
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
  });

  const handleInfoAdicionalChange = (key, val) => {
    setInfoAdicional(prev => ({ ...prev, [key]: val }));
  };

  const handleFieldChange = (field, value) => {
    if (field === 'propietario') setPropietario(value);
    else if (field === 'direccion') setDireccion(value);
    else if (field === 'supPredio') setSupPredio(value);
    else if (field === 'supConstExistente') setSupConstExistente(value);
    else if (field === 'supIntervenir') setSupIntervenir(value);
    else if (field === 'uso') setUso(value);
    else if (field === 'clasificacion') setClasificacion(value);
    else if (field === 'zonaPrimaria') setZonaPrimaria(value);
    else if (field === 'tipoVialidad') setTipoVialidad(value);
    else if (field === 'estimacion') setEstimacion(value);
  };

  const [conceptosList, setConceptosList] = useState([]);
  const [guardado, setGuardado] = useState(false);

  // Prepopulate title and address if project is selected
  useEffect(() => {
    if (proyectoId) {
      const selectedProj = proyectos.find(p => p.id === proyectoId);
      if (selectedProj) {
        setTitulo(`Presupuesto Gestoría — ${selectedProj.nombre}`);
        setDireccion(selectedProj.ubicacion || '');
        const client = clientes.find(c => String(c.id) === String(selectedProj.clienteId) || c.id === selectedProj.clienteId);
        if (client) {
          setPropietario(client.nombre || '');
        }
      }
    }
  }, [proyectoId, proyectos, clientes]);

  const selProyecto = proyectos.find(p => p.id === proyectoId);
  const cliente = selProyecto ? clientes.find(c => String(c.id) === String(selProyecto.clienteId) || c.id === selProyecto.clienteId) : null;

  // Calculators
  const subtotalHonorarios = conceptosList.reduce((acc, c) => acc + (parseFloat(c.honorarios) || 0), 0);
  const totalDerechos = conceptosList.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0);
  const totalExtras = conceptosList.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0);

  const totalGeneral = subtotalHonorarios * 1.16 + totalDerechos + totalExtras;
  const costDirectConstVal = parseFloat(costoDirectoConstruccion) || 0;
  const pctGestion = costDirectConstVal > 0 ? (totalGeneral / costDirectConstVal) * 100 : 0;

  const canSave = proyectoId && titulo.trim() !== '' && version.trim() !== '';

  const handleAddConcept = (newConc) => {
    const nextNo = conceptosList.length + 1;
    setConceptosList(prev => [...prev, {
      ...newConc,
      id: `conc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      no: nextNo
    }]);
  };

  const handleGuardar = () => {
    if (!canSave) return;
    const nuevo = {
      proyectoId,
      version,
      estado: 'Borrador',
      titulo,
      fecha: fmt(hoy),
      clienteId: cliente ? cliente.id : null,
      conceptos: conceptosList,
      propietario,
      direccion,
      supPredio: parseFloat(supPredio) || 0,
      supConstExistente: parseFloat(supConstExistente) || 0,
      supIntervenir: parseFloat(supIntervenir) || 0,
      uso,
      clasificacion,
      zonaPrimaria,
      tipoVialidad,
      estimacion,
      costoDirectoConstruccion: costDirectConstVal,
      infoAdicionalJson: JSON.stringify(infoAdicional)
    };
    onGuardar(nuevo);
    setGuardado(true);
    setTimeout(() => onCancelar(), 1500);
  };

  return (
    <div style={{ maxWidth: '100%', padding: '0 10px' }}>
      <div className="page-header flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Nuevo Presupuesto de Gestoría</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            Crea un presupuesto con el modelo de etapas administrativas para licencias urbanas.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={onCancelar}>Volver al Listado</button>
          {guardado ? (
            <div className="alert alert-green" style={{ padding: '8px 16px', margin: 0 }}><Icon name="check" size={14} /> Presupuesto Guardado</div>
          ) : (
            <button className="btn btn-primary" onClick={handleGuardar} disabled={!canSave || conceptosList.length === 0} style={{ opacity: (!canSave || conceptosList.length === 0) ? 0.5 : 1 }}>
              <Icon name="check" size={14} /> Guardar Presupuesto
            </button>
          )}
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 0.5fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>Proyecto Vinculado *</label>
            <select className="form-control" value={proyectoId} onChange={e => setProyectoId(e.target.value)}>
              <option value="">— Selecciona un proyecto para importar datos —</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.id} - {p.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>Título del Presupuesto *</label>
            <input className="form-control" placeholder="Ej: Presupuesto Base de Gestoría" value={titulo} onChange={e => setTitulo(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>Versión *</label>
            <input className="form-control" style={{ fontFamily: 'DM Mono', fontWeight: 'bold', textAlign: 'center' }} value={version} onChange={e => setVersion(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Property metadata */}
      <FichaDatosPredio
        b={{ propietario, direccion, supPredio, supConstExistente, supIntervenir, uso, clasificacion, zonaPrimaria, tipoVialidad, estimacion }}
        editable={true}
        onFieldChange={handleFieldChange}
      />

      {/* Visually Prominent Concept Builder right after main project data */}
      <ConceptBuilder
        catalog={catalog}
        onAddConcept={handleAddConcept}
        equipo={EQUIPO}
      />

      {/* Concepts table */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Líneas del Presupuesto</span>
          <span className="badge badge-gray">{conceptosList.length} conceptos</span>
        </div>
        <TablaConceptos
          conceptos={conceptosList}
          onChange={setConceptosList}
          editable={true}
          infoAdicional={infoAdicional}
          onInfoAdicionalChange={handleInfoAdicionalChange}
        />
      </div>

      {/* Financial & notes grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 20, marginBottom: 20 }}>
        {/* Left: Summary totals & Construction Cost */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            Resumen del Presupuesto
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-3)' }}>Honorarios de Gestión:</span>
            <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{money(subtotalHonorarios)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-3)' }}>I.V.A. Honorarios (16%):</span>
            <span style={{ fontFamily: 'DM Mono', fontWeight: 600, color: 'var(--red)' }}>{money(subtotalHonorarios * 0.16)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-3)' }}>Pago de Derechos Totales:</span>
            <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{money(totalDerechos)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <span style={{ color: 'var(--text-3)' }}>Gastos Extras / Especiales:</span>
            <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{money(totalExtras)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', padding: 12, borderRadius: 4, border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Total Presupuesto</div>
              <div style={{ fontSize: 9, color: 'var(--text-3)' }}>IVA Incluido en Honorarios</div>
            </div>
            <div style={{ fontSize: 18, fontFamily: 'DM Mono', fontWeight: 800, color: 'var(--accent)' }}>
              {money(totalGeneral)}
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>COSTO DIRECTO DE CONSTRUCCIÓN</label>
            <input
              type="number"
              className="form-control"
              style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--blue)' }}
              value={costoDirectoConstruccion}
              onChange={e => setCostoDirectoConstruccion(e.target.value)}
              placeholder="Ej: 77400000"
            />
          </div>

          {costDirectConstVal > 0 && (
            <div style={{ background: 'var(--accent-light)', color: 'var(--accent-text)', padding: 12, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>% GESTIÓN VS COSTO CONST.</span>
              <span className="mono" style={{ fontSize: 15, fontWeight: 800 }}>{pctGestion.toFixed(3)}%</span>
            </div>
          )}
        </div>

        {/* Right: Notes textareas */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            Términos y Cláusulas del Presupuesto
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>DOCUMENTOS TÉCNICOS NECESARIOS</label>
              <textarea style={flatTextarea} rows={3} value={infoAdicional.documentosTecnicos} onChange={e => handleInfoAdicionalChange('documentosTecnicos', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>DOCUMENTOS LEGALES NECESARIOS</label>
              <textarea style={flatTextarea} rows={3} value={infoAdicional.documentosLegales} onChange={e => handleInfoAdicionalChange('documentosLegales', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>DERECHOS Y GASTOS</label>
              <textarea style={flatTextarea} rows={2} value={infoAdicional.derechosGastos} onChange={e => handleInfoAdicionalChange('derechosGastos', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>FORMA DE PAGO</label>
              <textarea style={flatTextarea} rows={2} value={infoAdicional.formaPago} onChange={e => handleInfoAdicionalChange('formaPago', e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>LOS TRABAJOS NO INCLUYEN</label>
              <textarea style={flatTextarea} rows={2} value={infoAdicional.exclusiones} onChange={e => handleInfoAdicionalChange('exclusiones', e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>NOTAS ADICIONALES</label>
              <textarea style={flatTextarea} rows={2} value={infoAdicional.notas} onChange={e => handleInfoAdicionalChange('notas', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Signature block */}
      <div className="card" style={{ padding: 20, textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
          Bloque de Firmas
        </div>
        <div style={{ display: 'inline-grid', gridTemplateColumns: '1fr', gap: 6, width: 300, margin: '10px auto 0' }}>
          <input className="form-control" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 12 }} value={infoAdicional.firmadoPor} onChange={e => handleInfoAdicionalChange('firmadoPor', e.target.value)} placeholder="Nombre del Responsable" />
          <input className="form-control" style={{ textAlign: 'center', fontSize: 11 }} value={infoAdicional.firmadoCargo} onChange={e => handleInfoAdicionalChange('firmadoCargo', e.target.value)} placeholder="Cargo (Ej: Director General)" />
          <input className="form-control" style={{ textAlign: 'center', fontSize: 10, fontFamily: 'DM Mono' }} value={infoAdicional.firmadoCedula} onChange={e => handleInfoAdicionalChange('firmadoCedula', e.target.value)} placeholder="Registro / Cédula Profesional" />
        </div>
      </div>
    </div>
  );
}

// ─── VISTA DETALLADA DEL PRESUPUESTO COMPONENT ────────────────────────────────
function VistaPresupuesto({ p, onCerrar, clientes, proyectos, onAjustar, onCambiarEstatus, onMarcarBaseline, onGuardarCambios, onEliminar }) {
  const { conceptos: catalog } = useAppContext();
  const proj = proyectos.find(pr => pr.id === p.proyectoId);
  const cliente = proj ? clientes.find(c => String(c.id) === String(proj.clienteId) || c.id === proj.clienteId) : (p.clienteId ? clientes.find(c => String(c.id) === String(p.clienteId) || c.id === p.clienteId) : null);

  const [conceptosList, setConceptosList] = useState(p.conceptos || []);
  const [isEdited, setIsEdited] = useState(false);

  // Parse property metadata and auxiliary info
  const [propietario, setPropietario] = useState(p.propietario || '');
  const [direccion, setDireccion] = useState(p.direccion || '');
  const [supPredio, setSupPredio] = useState(p.supPredio || 0);
  const [supConstExistente, setSupConstExistente] = useState(p.supConstExistente || 0);
  const [supIntervenir, setSupIntervenir] = useState(p.supIntervenir || 0);
  const [uso, setUso] = useState(p.uso || '');
  const [clasificacion, setClasificacion] = useState(p.clasificacion || '');
  const [zonaPrimaria, setZonaPrimaria] = useState(p.zonaPrimaria || '');
  const [tipoVialidad, setTipoVialidad] = useState(p.tipoVialidad || '');
  const [estimacion, setEstimacion] = useState(p.estimacion || '');
  const [costoDirectoConstruccion, setCostoDirectoConstruccion] = useState(p.costoDirectoConstruccion || 0);
  const [titulo, setTitulo] = useState(p.titulo || '');
  const [version, setVersion] = useState(p.version || '');

  // Parse auxiliary JSON notes
  const [infoAdicional, setInfoAdicional] = useState(() => {
    if (p.infoAdicionalJson) {
      try {
        return JSON.parse(p.infoAdicionalJson);
      } catch (e) { }
    }
    return {
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
    };
  });

  const handleInfoAdicionalChange = (key, val) => {
    setInfoAdicional(prev => ({ ...prev, [key]: val }));
    setIsEdited(true);
  };

  const handleFieldChange = (field, value) => {
    setIsEdited(true);
    if (field === 'titulo') setTitulo(value);
    else if (field === 'version') setVersion(value);
    else if (field === 'propietario') setPropietario(value);
    else if (field === 'direccion') setDireccion(value);
    else if (field === 'supPredio') setSupPredio(value);
    else if (field === 'supConstExistente') setSupConstExistente(value);
    else if (field === 'supIntervenir') setSupIntervenir(value);
    else if (field === 'uso') setUso(value);
    else if (field === 'clasificacion') setClasificacion(value);
    else if (field === 'zonaPrimaria') setZonaPrimaria(value);
    else if (field === 'tipoVialidad') setTipoVialidad(value);
    else if (field === 'estimacion') setEstimacion(value);
  };

  useEffect(() => {
    setConceptosList(p.conceptos || []);
    setPropietario(p.propietario || '');
    setDireccion(p.direccion || '');
    setSupPredio(p.supPredio || 0);
    setSupConstExistente(p.supConstExistente || 0);
    setSupIntervenir(p.supIntervenir || 0);
    setUso(p.uso || '');
    setClasificacion(p.clasificacion || '');
    setZonaPrimaria(p.zonaPrimaria || '');
    setTipoVialidad(p.tipoVialidad || '');
    setEstimacion(p.estimacion || '');
    setCostoDirectoConstruccion(p.costoDirectoConstruccion || 0);
    setTitulo(p.titulo || '');
    setVersion(p.version || '');

    if (p.infoAdicionalJson) {
      try {
        setInfoAdicional(JSON.parse(p.infoAdicionalJson));
      } catch (e) { }
    }
    setIsEdited(false);
  }, [p]);

  const handleConceptosChange = (newList) => {
    setConceptosList(newList);
    setIsEdited(true);
  };

  const handleAddConcept = (newConc) => {
    const nextNo = conceptosList.length + 1;
    handleConceptosChange([...conceptosList, {
      ...newConc,
      id: `conc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      no: nextNo
    }]);
  };

  const saveEdits = () => {
    const updated = {
      ...p,
      titulo,
      version,
      conceptos: conceptosList,
      propietario,
      direccion,
      supPredio: parseFloat(supPredio) || 0,
      supConstExistente: parseFloat(supConstExistente) || 0,
      supIntervenir: parseFloat(supIntervenir) || 0,
      uso,
      clasificacion,
      zonaPrimaria,
      tipoVialidad,
      estimacion,
      costoDirectoConstruccion: parseFloat(costoDirectoConstruccion) || 0,
      infoAdicionalJson: JSON.stringify(infoAdicional)
    };
    onGuardarCambios(updated);
    setIsEdited(false);
  };

  // Calculations
  const subtotalHonorarios = conceptosList.reduce((acc, c) => acc + (parseFloat(c.honorarios) || 0), 0);
  const totalDerechos = conceptosList.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0);
  const totalExtras = conceptosList.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0);

  const totalGeneral = subtotalHonorarios * 1.16 + totalDerechos + totalExtras;
  const costDirectConstVal = parseFloat(costoDirectoConstruccion) || 0;
  const pctGestion = costDirectConstVal > 0 ? (totalGeneral / costDirectConstVal) * 100 : 0;

  const isBorrador = p.estado === 'Borrador';

  return (
    <div style={{ maxWidth: '100%', padding: '0 10px' }}>
      <div className="page-header flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title" style={{ fontSize: 19 }}>Detalle de Presupuesto: {titulo}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge badge-gray">{p.id}</span>
            {proj && <span className="badge badge-blue">{proj.nombre}</span>}
            <span style={{
              fontSize: 11,
              background: p.estado === 'Aprobado' ? 'var(--accent-light)' : p.estado === 'Enviado' ? 'var(--blue-light)' : p.estado === 'Rechazado' ? 'rgba(192,57,43,0.1)' : 'var(--surface2)',
              color: p.estado === 'Aprobado' ? 'var(--accent-text)' : p.estado === 'Enviado' ? 'var(--blue)' : p.estado === 'Rechazado' ? '#C0392B' : 'var(--text-3)',
              padding: '2px 8px', borderRadius: 10, fontWeight: 600
            }}>{p.estado}</span>
            {p.isBaseline && <span className="badge badge-green">Línea Base Activa</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={onCerrar}>Volver al Listado</button>
          {isEdited && (
            <button className="btn btn-primary" onClick={saveEdits} style={{ background: '#B87A0A', color: '#fff' }}>
              <Icon name="check" size={14} /> Guardar Cambios
            </button>
          )}
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="card" style={{ padding: 14, marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>Acciones Disponibles:</span>

        {p.estado === 'Borrador' && (
          <>
            <button className="btn btn-sm btn-primary" onClick={() => onCambiarEstatus(p.id, 'Enviado')}>
              Enviar al Cliente
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => onEliminar(p.id, p.idNumerico)} style={{ color: 'var(--red)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="trash" size={14} /> Eliminar Presupuesto
            </button>
          </>
        )}

        {p.estado === 'Enviado' && (
          <>
            <button className="btn btn-sm btn-primary" onClick={() => onCambiarEstatus(p.id, 'Aprobado')} style={{ background: 'var(--accent)' }}>
              Aprobar Presupuesto
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => onCambiarEstatus(p.id, 'Rechazado')} style={{ color: 'var(--red)' }}>
              Rechazar
            </button>
          </>
        )}

        {p.estado === 'Aprobado' && !p.isBaseline && (
          <button className="btn btn-sm btn-primary" onClick={() => onMarcarBaseline(p.id)} style={{ background: 'var(--accent)', color: '#fff' }}>
            Establecer como Línea Base
          </button>
        )}

        {(p.estado === 'Aprobado' || p.estado === 'Enviado' || p.estado === 'Rechazado') && (
          <button className="btn btn-sm btn-secondary" onClick={() => onAjustar(p)}>
            Crear Nueva Versión
          </button>
        )}
      </div>

      {/* Title & Version Editable fields for drafts */}
      {isBorrador && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Título del Presupuesto</label>
              <input className="form-control" value={titulo} onChange={e => handleFieldChange('titulo', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Versión</label>
              <input className="form-control" style={{ fontFamily: 'DM Mono', fontWeight: 'bold' }} value={version} onChange={e => handleFieldChange('version', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Property metadata card */}
      <FichaDatosPredio
        b={{ propietario, direccion, supPredio, supConstExistente, supIntervenir, uso, clasificacion, zonaPrimaria, tipoVialidad, estimacion }}
        editable={isBorrador}
        onFieldChange={handleFieldChange}
      />

      {/* Concept Builder right after main metadata only in edit mode */}
      {isBorrador && (
        <ConceptBuilder
          catalog={catalog}
          onAddConcept={handleAddConcept}
          equipo={EQUIPO}
        />
      )}

      {/* Concepts table card */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
          Conceptos y Servicios Enlistados
        </div>
        <TablaConceptos
          conceptos={conceptosList}
          onChange={handleConceptosChange}
          editable={isBorrador}
          infoAdicional={infoAdicional}
          onInfoAdicionalChange={handleInfoAdicionalChange}
        />
      </div>

      {/* Financial & notes grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 20, marginBottom: 20 }}>
        {/* Left: Summary totals */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            Resumen del Presupuesto
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-3)' }}>Honorarios de Gestión:</span>
            <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{money(subtotalHonorarios)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-3)' }}>I.V.A. Honorarios (16%):</span>
            <span style={{ fontFamily: 'DM Mono', fontWeight: 600, color: 'var(--red)' }}>{money(subtotalHonorarios * 0.16)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-3)' }}>Pago de Derechos Totales:</span>
            <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{money(totalDerechos)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <span style={{ color: 'var(--text-3)' }}>Gastos Extras / Especiales:</span>
            <span style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{money(totalExtras)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', padding: 12, borderRadius: 4, border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Total Presupuesto</div>
              <div style={{ fontSize: 9, color: 'var(--text-3)' }}>IVA Incluido en Honorarios</div>
            </div>
            <div style={{ fontSize: 18, fontFamily: 'DM Mono', fontWeight: 800, color: 'var(--accent)' }}>
              {money(totalGeneral)}
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label className="form-label" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>COSTO DIRECTO DE CONSTRUCCIÓN</label>
            {isBorrador ? (
              <input
                type="number"
                className="form-control"
                style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--blue)' }}
                value={costoDirectoConstruccion}
                onChange={e => { setCostoDirectoConstruccion(e.target.value); setIsEdited(true); }}
                placeholder="Ej: 77400000"
              />
            ) : (
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'DM Mono' }}>{money(costDirectConstVal)}</div>
            )}
          </div>

          {costDirectConstVal > 0 && (
            <div style={{ background: 'var(--accent-light)', color: 'var(--accent-text)', padding: 12, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>% GESTIÓN VS COSTO CONST.</span>
              <span className="mono" style={{ fontSize: 15, fontWeight: 800 }}>{pctGestion.toFixed(3)}%</span>
            </div>
          )}
        </div>

        {/* Right: Notes */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            Términos y Cláusulas del Presupuesto
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>DOCUMENTOS TÉCNICOS NECESARIOS</label>
              {isBorrador ? (
                <textarea style={flatTextarea} rows={3} value={infoAdicional.documentosTecnicos} onChange={e => handleInfoAdicionalChange('documentosTecnicos', e.target.value)} />
              ) : (
                <p style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{infoAdicional.documentosTecnicos}</p>
              )}
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>DOCUMENTOS LEGALES NECESARIOS</label>
              {isBorrador ? (
                <textarea style={flatTextarea} rows={3} value={infoAdicional.documentosLegales} onChange={e => handleInfoAdicionalChange('documentosLegales', e.target.value)} />
              ) : (
                <p style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{infoAdicional.documentosLegales}</p>
              )}
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>DERECHOS Y GASTOS</label>
              {isBorrador ? (
                <textarea style={flatTextarea} rows={2} value={infoAdicional.derechosGastos} onChange={e => handleInfoAdicionalChange('derechosGastos', e.target.value)} />
              ) : (
                <p style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{infoAdicional.derechosGastos}</p>
              )}
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>FORMA DE PAGO</label>
              {isBorrador ? (
                <textarea style={flatTextarea} rows={2} value={infoAdicional.formaPago} onChange={e => handleInfoAdicionalChange('formaPago', e.target.value)} />
              ) : (
                <p style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{infoAdicional.formaPago}</p>
              )}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>LOS TRABAJOS NO INCLUYEN</label>
              {isBorrador ? (
                <textarea style={flatTextarea} rows={2} value={infoAdicional.exclusiones} onChange={e => handleInfoAdicionalChange('exclusiones', e.target.value)} />
              ) : (
                <p style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{infoAdicional.exclusiones}</p>
              )}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>NOTAS ADICIONALES</label>
              {isBorrador ? (
                <textarea style={flatTextarea} rows={2} value={infoAdicional.notas} onChange={e => handleInfoAdicionalChange('notas', e.target.value)} />
              ) : (
                <p style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-line', lineHeight: 1.4 }}>{infoAdicional.notas}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature block */}
      <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
          Bloque de Firmas Autorizadas
        </div>
        <div style={{ display: 'inline-grid', gridTemplateColumns: '1fr', gap: 6, width: 300, margin: '10px auto 0' }}>
          {isBorrador ? (
            <>
              <input className="form-control" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 12 }} value={infoAdicional.firmadoPor} onChange={e => handleInfoAdicionalChange('firmadoPor', e.target.value)} />
              <input className="form-control" style={{ textAlign: 'center', fontSize: 11 }} value={infoAdicional.firmadoCargo} onChange={e => handleInfoAdicionalChange('firmadoCargo', e.target.value)} />
              <input className="form-control" style={{ textAlign: 'center', fontSize: 10, fontFamily: 'DM Mono' }} value={infoAdicional.firmadoCedula} onChange={e => handleInfoAdicionalChange('firmadoCedula', e.target.value)} />
            </>
          ) : (
            <>
              <div style={{ height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: 'Dancing Script, cursive', fontSize: 20, color: 'var(--text)', transform: 'rotate(-4deg)', opacity: 0.85 }}>{infoAdicional.firmadoPor}</span>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{infoAdicional.firmadoPor?.toUpperCase()}</div>
              <div style={{ color: 'var(--text-2)', fontSize: 11 }}>{infoAdicional.firmadoCargo?.toUpperCase()}</div>
              <div style={{ color: 'var(--text-3)', fontSize: 9, fontFamily: 'DM Mono' }}>{infoAdicional.firmadoCedula}</div>
            </>
          )}
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
    setPreselectedProjectId,
    tareas,
    setTareas
  } = useAppContext();

  const [tab, setTab] = useState('agrupado'); // 'agrupado' | 'nuevo' | 'ver' | 'catalogo'
  const [viendoId, setViendoId] = useState(null);
  const [q, setQ] = useState('');
  const [collapsedProyectos, setCollapsedProyectos] = useState({});

  // Network services hook integration
  const { crearPresupuesto, actualizarPresupuesto, eliminarPresupuesto } = usePresupuestos(setPresupuestos, session);
  const { crearTarea } = useTareas(setTareas);

  // Automatically open creation tab if preselectedProjectId is active
  useEffect(() => {
    if (preselectedProjectId) {
      setTab('nuevo');
    }
  }, [preselectedProjectId]);

  const verPres = presupuestos.find(p => p.id === viendoId);

  const guardarNuevo = async (p) => {
    try {
      const subtotalHono = p.conceptos?.reduce((acc, c) => acc + (parseFloat(c.honorarios) || 0), 0) || 0;
      const ivaVal = subtotalHono * 0.16;
      const derechosVal = p.conceptos?.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0) || 0;
      const extrasVal = p.conceptos?.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0) || 0;

      const datosParaBackend = {
        proyectoId: p.proyectoId,
        titulo: p.titulo,
        estado: p.estado,
        version: p.version,
        totalDirecto: subtotalHono,
        totalIndirecto: ivaVal + derechosVal + extrasVal,
        fecha: p.fecha ? new Date(p.fecha).toISOString() : new Date().toISOString(),
        conceptosJson: JSON.stringify(p.conceptos || []),
        propietario: p.propietario,
        direccion: p.direccion,
        supPredio: parseFloat(p.supPredio) || 0,
        supConstExistente: parseFloat(p.supConstExistente) || 0,
        supIntervenir: parseFloat(p.supIntervenir) || 0,
        uso: p.uso,
        clasificacion: p.clasificacion,
        zonaPrimaria: p.zonaPrimaria,
        tipoVialidad: p.tipoVialidad,
        estimacion: p.estimacion,
        costoDirectoConstruccion: parseFloat(p.costoDirectoConstruccion) || 0,
        infoAdicionalJson: p.infoAdicionalJson
      };

      const presupuestoMasticadoPorElBackend = await crearPresupuesto(datosParaBackend);

      setPresupuestos(prev => [presupuestoMasticadoPorElBackend, ...prev]);
      if (preselectedProjectId) {
        setPreselectedProjectId(null);
      }
    } catch (error) {
      console.error("Hubo un problema al conectar con el Backend:", error);
      alert("No se pudo conectar con el servidor. Revisa la consola.");
    }
  };

  const statusMap = {
    'Borrador': 'badge-gray',
    'Enviado': 'badge-blue',
    'Aprobado': 'badge-green',
    'Rechazado': 'badge-red'
  };

  // Change management clone function (Immutable versioning)
  const handleAjustar = async (budget) => {
    const nextVer = incrementVersion(budget.version);
    const subtotalHono = budget.conceptos?.reduce((acc, c) => acc + (parseFloat(c.honorarios) || 0), 0) || 0;
    const ivaVal = subtotalHono * 0.16;
    const derechosVal = budget.conceptos?.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0) || 0;
    const extrasVal = budget.conceptos?.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0) || 0;

    const datosParaBackend = {
      proyectoId: budget.proyectoId,
      titulo: budget.titulo,
      estado: 'Borrador',
      version: nextVer,
      fecha: new Date().toISOString(),
      totalDirecto: subtotalHono,
      totalIndirecto: ivaVal + derechosVal + extrasVal,
      conceptosJson: budget.conceptos ? JSON.stringify(budget.conceptos.map(c => ({
        ...c,
        id: `conc-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      }))) : '[]',
      propietario: budget.propietario,
      direccion: budget.direccion,
      supPredio: budget.supPredio || 0,
      supConstExistente: budget.supConstExistente || 0,
      supIntervenir: budget.supIntervenir || 0,
      uso: budget.uso,
      clasificacion: budget.clasificacion,
      zonaPrimaria: budget.zonaPrimaria,
      tipoVialidad: budget.tipoVialidad,
      estimacion: budget.estimacion,
      costoDirectoConstruccion: budget.costoDirectoConstruccion || 0,
      infoAdicionalJson: budget.infoAdicionalJson
    };

    try {
      const presupuestoCreado = await crearPresupuesto(datosParaBackend);
      setPresupuestos(prev => [presupuestoCreado, ...prev]);
      setViendoId(presupuestoCreado.id);
      setTab('ver');
    } catch (error) {
      console.error("Error al clonar/ajustar presupuesto:", error);
      alert("Hubo un error al guardar la nueva versión del presupuesto.");
    }
  };

  // Save changes to draft budgets
  const handleGuardarCambios = async (updated) => {
    const idNumerico = updated.idNumerico || updated.id;
    const modeloPresupuesto = {
      id: idNumerico,
      proyectoId: updated.proyectoId,
      titulo: updated.titulo,
      estado: updated.estado,
      version: updated.version,
      fecha: updated.fecha ? new Date(updated.fecha).toISOString() : new Date().toISOString(),
      conceptosJson: JSON.stringify(updated.conceptos || []),
      propietario: updated.propietario,
      direccion: updated.direccion,
      supPredio: parseFloat(updated.supPredio) || 0,
      supConstExistente: parseFloat(updated.supConstExistente) || 0,
      supIntervenir: parseFloat(updated.supIntervenir) || 0,
      uso: updated.uso,
      clasificacion: updated.clasificacion,
      zonaPrimaria: updated.zonaPrimaria,
      tipoVialidad: updated.tipoVialidad,
      estimacion: updated.estimacion,
      costoDirectoConstruccion: parseFloat(updated.costoDirectoConstruccion) || 0,
      infoAdicionalJson: updated.infoAdicionalJson,
      isBaseline: updated.isBaseline || false
    };

    try {
      const presupuestoActualizado = await actualizarPresupuesto(idNumerico, modeloPresupuesto);
      setPresupuestos(prev => prev.map(b => b.id === updated.id ? presupuestoActualizado : b));
    } catch (error) {
      console.error("Error al guardar cambios del presupuesto:", error);
      alert("Hubo un error al guardar los cambios en el servidor.");
    }
  };

  // Update budget status and trigger automatic task generation on approval
  const handleCambiarEstatus = async (id, nuevoEstatus) => {
    const targetBudget = presupuestos.find(b => b.id === id);
    if (!targetBudget) return;

    const idNumerico = targetBudget.idNumerico || targetBudget.id;
    const modeloPresupuesto = {
      id: idNumerico,
      proyectoId: targetBudget.proyectoId,
      titulo: targetBudget.titulo,
      estado: nuevoEstatus,
      version: targetBudget.version,
      fecha: targetBudget.fecha ? new Date(targetBudget.fecha).toISOString() : new Date().toISOString(),
      conceptosJson: JSON.stringify(targetBudget.conceptos || []),
      propietario: targetBudget.propietario,
      direccion: targetBudget.direccion,
      supPredio: targetBudget.supPredio || 0,
      supConstExistente: targetBudget.supConstExistente || 0,
      supIntervenir: targetBudget.supIntervenir || 0,
      uso: targetBudget.uso,
      clasificacion: targetBudget.clasificacion,
      zonaPrimaria: targetBudget.zonaPrimaria,
      tipoVialidad: targetBudget.tipoVialidad,
      estimacion: targetBudget.estimacion,
      costoDirectoConstruccion: targetBudget.costoDirectoConstruccion || 0,
      infoAdicionalJson: targetBudget.infoAdicionalJson,
      isBaseline: targetBudget.isBaseline || false
    };

    try {
      const presupuestoActualizado = await actualizarPresupuesto(idNumerico, modeloPresupuesto);
      setPresupuestos(prev => prev.map(b => b.id === id ? presupuestoActualizado : b));

      if (nuevoEstatus === 'Aprobado') {
        const newTasks = [];
        if (targetBudget.conceptos && targetBudget.conceptos.length > 0) {
          for (const c of targetBudget.conceptos) {
            if (c.empleadoAsignadoId) {
              const alreadyExists = tareas.some(t => t.conceptoOrigenId === c.id);
              if (!alreadyExists) {
                const taskData = {
                  titulo: `[${c.etapa}] ${c.concepto}`,
                  prioridad: 'media',
                  hecho: false,
                  fecha: targetBudget.fecha ? new Date(targetBudget.fecha).toISOString() : new Date().toISOString(),
                  asignadoA: c.empleadoAsignadoId
                };
                try {
                  const tareaCreada = await crearTarea(taskData);
                  const taskLocal = {
                    ...tareaCreada,
                    proyectoId: targetBudget.proyectoId,
                    conceptoOrigenId: c.id
                  };
                  newTasks.push(taskLocal);
                } catch (taskErr) {
                  console.error("Error al crear tarea de presupuesto aprobado:", taskErr);
                }
              }
            }
          }
        }
        if (newTasks.length > 0) {
          setTareas(prevTareas => [...prevTareas, ...newTasks]);
          alert(`Se han creado y asignado ${newTasks.length} tareas de gestoría basadas en el presupuesto aprobado.`);
        }
      }
    } catch (error) {
      console.error("Error al cambiar estatus del presupuesto:", error);
      alert("Hubo un error al cambiar el estatus en el servidor.");
    }
  };

  // Mark budget as project baseline
  const handleMarcarBaseline = async (id) => {
    const targetBudget = presupuestos.find(b => b.id === id);
    if (!targetBudget) return;

    try {
      const budgetsOfProj = presupuestos.filter(b => b.proyectoId === targetBudget.proyectoId);
      for (const b of budgetsOfProj) {
        const idNum = b.idNumerico || b.id;
        const updatedBaselineVal = (b.id === id);
        const modeloPresupuesto = {
          id: idNum,
          proyectoId: b.proyectoId,
          titulo: b.titulo,
          estado: b.estado,
          version: b.version,
          fecha: b.fecha ? new Date(b.fecha).toISOString() : new Date().toISOString(),
          conceptosJson: JSON.stringify(b.conceptos || []),
          propietario: b.propietario,
          direccion: b.direccion,
          supPredio: b.supPredio || 0,
          supConstExistente: b.supConstExistente || 0,
          supIntervenir: b.supIntervenir || 0,
          uso: b.uso,
          clasificacion: b.clasificacion,
          zonaPrimaria: b.zonaPrimaria,
          tipoVialidad: b.tipoVialidad,
          estimacion: b.estimacion,
          costoDirectoConstruccion: b.costoDirectoConstruccion || 0,
          infoAdicionalJson: b.infoAdicionalJson,
          isBaseline: updatedBaselineVal
        };
        await actualizarPresupuesto(idNum, modeloPresupuesto);
      }

      setPresupuestos(prev => prev.map(b => {
        if (b.proyectoId === targetBudget.proyectoId) {
          return {
            ...b,
            isBaseline: b.id === id
          };
        }
        return b;
      }));

      const budgetTotalVal = calcBudgetTotal(targetBudget);
      const associatedProj = proyectos.find(pr => pr.id === targetBudget.proyectoId);
      if (associatedProj) {
        await updateProyecto({
          ...associatedProj,
          monto: budgetTotalVal
        });
      }
    } catch (error) {
      console.error("Error al marcar baseline en el servidor:", error);
      alert("Hubo un error al marcar el baseline en el servidor.");
    }
  };

  const handleEliminarPresupuesto = async (id, idNumerico) => {
    const targetId = idNumerico || id;
    
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Estás seguro de que deseas eliminar esta versión del presupuesto? Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#C0392B',
      cancelButtonColor: '#7F8C8D',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--surface)',
      color: 'var(--text)'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await eliminarPresupuesto(targetId);
      Swal.fire({
        title: 'Eliminado',
        text: 'El presupuesto ha sido eliminado con éxito.',
        icon: 'success',
        background: 'var(--surface)',
        color: 'var(--text)'
      });
      setTab('agrupado');
      setViendoId(null);
    } catch (error) {
      console.error("Error al eliminar presupuesto:", error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un error al eliminar el presupuesto en el servidor.',
        icon: 'error',
        background: 'var(--surface)',
        color: 'var(--text)'
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
        onGuardarCambios={handleGuardarCambios}
        onEliminar={handleEliminarPresupuesto}
      />
    );
  }

  // Filter projects or budgets based on query
  const filteredProjects = proyectos.filter(p => {
    if (session.rol === 'cliente') {
      if (String(p.clienteId) !== String(session.clienteId) && p.clienteId !== session.clienteId) return false;
    }
    const cli = clientes.find(c => String(c.id) === String(p.clienteId) || c.id === p.clienteId);
    const matchQ = p.nombre.toLowerCase().includes(q.toLowerCase()) ||
      p.id.toLowerCase().includes(q.toLowerCase()) ||
      (cli && cli.nombre && cli.nombre.toLowerCase().includes(q.toLowerCase()));
    return matchQ;
  });

  const filteredCatalogo = conceptos.filter(c =>
    c.clave.toLowerCase().includes(q.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ padding: '0 10px' }}>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">{session.rol === 'cliente' ? 'Mis Presupuestos' : 'Presupuestos por Proyecto'}</div>
          <div className="page-subtitle">Historial de presupuestos ejecutivos agrupados por etapas administrativas de gestoría.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`btn ${tab === 'agrupado' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('agrupado')}>
            Presupuestos
          </button>
          <button className={`btn ${tab === 'catalogo' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('catalogo')}>
            Catálogo Conceptos
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
            const isExpanded = !collapsedProyectos[proj.id];

            return (
              <div key={proj.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Project Group Header */}
                <div
                  onClick={() => setCollapsedProyectos(prev => ({ ...prev, [proj.id]: !prev[proj.id] }))}
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
                      Cliente: {clientes.find(c => String(c.id) === String(proj.clienteId) || c.id === proj.clienteId)?.nombre || 'Cliente no asignado'} · Ubicación: {proj.ubicacion || 'No especificada'}
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

                {/* Project Group Body */}
                {isExpanded && (
                  <div style={{ padding: '8px 16px 16px' }}>
                    {associatedBudgets.length === 0 ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12, fontStyle: 'italic' }}>
                        No hay ningún presupuesto creado para este proyecto.
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
                              {session.rol !== 'cliente' && (
                                <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>Acciones</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {associatedBudgets.sort((a, b) => (b.version || '').localeCompare(a.version || '')).map(b => {
                              const totalCost = calcBudgetTotal(b);
                              return (
                                <tr
                                  key={b.id}
                                  onClick={() => { setViendoId(b.id); setTab('ver'); }}
                                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                                  onMouseLeave={e => e.currentTarget.style.background = ''}
                                >
                                  <td style={{ padding: '12px', fontWeight: 700, fontFamily: 'DM Mono', color: 'var(--accent)' }}>V{b.version}</td>
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
                                      <span className="badge badge-green" style={{ fontSize: 10 }}>Línea Base</span>
                                    ) : (
                                      <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
                                    )}
                                  </td>
                                  {session.rol !== 'cliente' && (
                                    <td style={{ padding: '12px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                      <button 
                                        className="btn btn-ghost btn-sm" 
                                        style={{ padding: '4px 8px', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}
                                        onClick={() => handleEliminarPresupuesto(b.id, b.idNumerico)}
                                        title="Eliminar Presupuesto"
                                      >
                                        <Icon name="trash" size={13} />
                                      </button>
                                    </td>
                                  )}
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

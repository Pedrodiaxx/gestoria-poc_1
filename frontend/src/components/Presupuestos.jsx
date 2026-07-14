import React, { useState, useEffect } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { money, EQUIPO } from '../data/mockData';
import { usePresupuestos } from '../hooks/usePresupuestos';

const hoy = new Date();
const fmt = (d) => d.toISOString().split('T')[0];

const STAGES = [
  "Uso de Suelo",
  "Licencia de Construcción",
  "Terminación de Obra",
  "Licencia de Funcionamiento"
];

// Helper to auto-increment minor version (e.g. 2.00 -> 2.01)
const incrementVersion = (v) => {
  if (!v) return '1.00';
  const val = parseFloat(v);
  if (isNaN(val)) return v + '.1';
  return (val + 0.01).toFixed(2);
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

// Flat styles for inputs mimicking spreadsheet fields
const flatInput = {
  width: '100%',
  border: 'none',
  background: 'rgba(235, 245, 251, 0.45)',
  outline: 'none',
  padding: '3px 6px',
  fontFamily: 'inherit',
  fontSize: '11px',
  boxSizing: 'border-box'
};

const flatTextarea = {
  width: '100%',
  border: '1px solid #BDC3C7',
  background: '#fff',
  outline: 'none',
  padding: '4px',
  fontFamily: 'inherit',
  fontSize: '10px',
  resize: 'vertical',
  boxSizing: 'border-box',
  marginTop: '2px'
};

// ─── DESGLOSE DE CONCEPTOS POR ETAPAS COMPONENT ─────────────────────────────
function TablaConceptos({ conceptos = [], onChange, editable = false, catalog = [], infoAdicional = {}, onInfoAdicionalChange }) {
  const [nuevaEtapa, setNuevaEtapa] = useState("Uso de Suelo");
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [nuevaUnidad, setNuevaUnidad] = useState("GESTIÓN");
  const [nuevosHonorarios, setNuevosHonorarios] = useState("");
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [nuevoPagoDerechos, setNuevoPagoDerechos] = useState("");
  const [nuevoExtra, setNuevoExtra] = useState("");
  const [nuevoAsignado, setNuevoAsignado] = useState("");

  const handleCatalogSelect = (clave) => {
    const matched = catalog.find(c => c.clave === clave);
    if (matched) {
      setNuevoConcepto(matched.descripcion);
      setNuevosHonorarios(matched.precio ? matched.precio.toString() : "0");
      setNuevaUnidad("GESTIÓN");
      setNuevoPagoDerechos("0");
      setNuevoExtra("0");
    }
  };

  const addConcept = () => {
    if (!nuevoConcepto) return;
    const nextNo = conceptos.length + 1;
    const nuevo = {
      id: `conc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      no: nextNo,
      etapa: nuevaEtapa,
      concepto: nuevoConcepto,
      unidad: nuevaUnidad,
      honorarios: parseFloat(nuevosHonorarios) || 0,
      comentarios: nuevoComentario,
      pagoDerechos: parseFloat(nuevoPagoDerechos) || 0,
      extra: parseFloat(nuevoExtra) || 0,
      empleadoAsignadoId: nuevoAsignado || ""
    };
    onChange([...conceptos, nuevo]);
    setNuevoConcepto("");
    setNuevosHonorarios("");
    setNuevoComentario("");
    setNuevoPagoDerechos("");
    setNuevoExtra("");
    setNuevoAsignado("");
  };

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
    if (items.length === 0 && !editable) return null;

    const sumHono = items.reduce((acc, c) => acc + (parseFloat(c.honorarios) || 0), 0);
    const sumDere = items.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0);
    const sumExtr = items.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0);
    const durationKey = getStageDurationKey(stageName);

    return (
      <React.Fragment key={stageName}>
        {items.map((c) => {
          if (editable) {
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #000' }}>
                <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000' }}>{c.no}</td>
                <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                  <textarea className="form-control" rows={2} style={{ padding: '4px', fontSize: '11px', width: '100%', border: 'none', outline: 'none', background: 'transparent' }} value={c.concepto} onChange={e => updateConcept(c.id, 'concepto', e.target.value)} />
                </td>
                <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #000' }}>
                  <select style={{ ...flatInput, background: 'transparent' }} value={c.unidad} onChange={e => updateConcept(c.id, 'unidad', e.target.value)}>
                    <option value="GESTIÓN">GESTIÓN</option>
                    <option value="TRAMITE">TRAMITE</option>
                    <option value="ESTUDIO">ESTUDIO</option>
                    <option value="PROYECTO">PROYECTO</option>
                  </select>
                </td>
                <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                  <input type="number" style={{ ...flatInput, textAlign: 'right', background: 'transparent' }} value={c.honorarios} onChange={e => updateConcept(c.id, 'honorarios', parseFloat(e.target.value) || 0)} />
                </td>
                <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                  <textarea className="form-control" rows={2} style={{ padding: '4px', fontSize: '11px', width: '100%', border: 'none', outline: 'none', background: 'transparent' }} value={c.comentarios} onChange={e => updateConcept(c.id, 'comentarios', e.target.value)} />
                </td>
                <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                  <input type="number" style={{ ...flatInput, textAlign: 'right', background: 'transparent' }} value={c.pagoDerechos} onChange={e => updateConcept(c.id, 'pagoDerechos', parseFloat(e.target.value) || 0)} />
                </td>
                <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                  <input type="number" style={{ ...flatInput, textAlign: 'right', background: 'transparent' }} value={c.extra} onChange={e => updateConcept(c.id, 'extra', parseFloat(e.target.value) || 0)} />
                </td>
                <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                  <select style={{ ...flatInput, background: 'transparent' }} value={c.empleadoAsignadoId || ''} onChange={e => updateConcept(c.id, 'empleadoAsignadoId', e.target.value || null)}>
                    <option value="">— Gestor —</option>
                    {EQUIPO.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
                  </select>
                </td>
                <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                  <button className="btn btn-ghost" onClick={() => removeConcept(c.id)} style={{ padding: 2, color: '#C0392B' }}>
                    <Icon name="trash" size={12} />
                  </button>
                </td>
              </tr>
            );
          } else {
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #000' }}>
                <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '500', borderRight: '1px solid #000' }}>{c.no}</td>
                <td style={{ padding: '8px 6px', borderRight: '1px solid #000', fontSize: '11px', fontWeight: '500' }}>{c.concepto}</td>
                <td style={{ padding: '8px 6px', textAlign: 'center', borderRight: '1px solid #000', fontSize: '11px' }}>{c.unidad}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'DM Mono', fontWeight: '600', borderRight: '1px solid #000' }}>{money(c.honorarios)}</td>
                <td style={{ padding: '8px 6px', fontSize: '11px', color: '#333', borderRight: '1px solid #000', whiteSpace: 'pre-line' }}>{c.comentarios}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'DM Mono', borderRight: '1px solid #000' }}>{c.pagoDerechos > 0 ? money(c.pagoDerechos) : '$ -'}</td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'DM Mono', borderRight: '1px solid #000' }}>{c.extra > 0 ? money(c.extra) : '$ -'}</td>
                <td style={{ padding: '8px 6px', borderRight: '1px solid #000', fontSize: '11px' }}>
                  {EQUIPO.find(eq => eq.id === c.empleadoAsignadoId)?.nombre || '—'}
                </td>
              </tr>
            );
          }
        })}

        {/* Stage Total Row (Highlighted with light grey) */}
        <tr style={{ background: '#eaeaea', fontWeight: 'bold', borderBottom: '2px solid #000' }}>
          <td colSpan="3" style={{ padding: '8px 6px', textAlign: 'right', borderRight: '1px solid #000', fontSize: '11px', textTransform: 'uppercase' }}>
            TOTAL ETAPA {stageName.toUpperCase()}
          </td>
          <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'DM Mono', borderRight: '1px solid #000', fontSize: '11px' }}>
            {money(sumHono)}
          </td>
          <td style={{ padding: '8px 6px', fontSize: '11px', color: '#000', borderRight: '1px solid #000', textTransform: 'uppercase' }}>
            {editable ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 'bold' }}>DURACIÓN:</span>
                <input style={{ ...flatInput, width: 'auto', flex: 1 }} placeholder="Ej: DURACION DE 3 MESES" value={infoAdicional[durationKey] || ''} onChange={e => onInfoAdicionalChange(durationKey, e.target.value)} />
              </div>
            ) : (
              <span>DURACION DE {infoAdicional[durationKey] ? infoAdicional[durationKey].toUpperCase() : 'N/A'}</span>
            )}
          </td>
          <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'DM Mono', borderRight: '1px solid #000', fontSize: '11px' }}>
            {money(sumDere)}
          </td>
          <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'DM Mono', borderRight: '1px solid #000', fontSize: '11px' }}>
            {money(sumExtr)}
          </td>
          <td colSpan={editable ? 2 : 1}></td>
        </tr>
      </React.Fragment>
    );
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', borderBottom: '2px solid #000' }}>
      <thead>
        <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #000', textTransform: 'uppercase', fontWeight: 'bold' }}>
          <th style={{ padding: '8px 6px', textAlign: 'center', width: '4%', borderRight: '1px solid #000' }}>No.</th>
          <th style={{ padding: '8px 6px', textAlign: 'center', width: '38%', borderRight: '1px solid #000' }}>Concepto</th>
          <th style={{ padding: '8px 6px', textAlign: 'center', width: '8%', borderRight: '1px solid #000' }}>Unidad</th>
          <th style={{ padding: '8px 6px', textAlign: 'center', width: '10%', borderRight: '1px solid #000' }}>Honorarios</th>
          <th style={{ padding: '8px 6px', textAlign: 'center', width: '20%', borderRight: '1px solid #000' }}>Comentarios</th>
          <th style={{ padding: '8px 6px', textAlign: 'center', width: '10%', borderRight: '1px solid #000' }}>Pago de Derechos</th>
          <th style={{ padding: '8px 6px', textAlign: 'center', width: '10%', borderRight: '1px solid #000' }}>Extra</th>
          <th style={{ padding: '8px 6px', textAlign: 'center', width: '10%', borderRight: '1px solid #000' }}>Asignado</th>
          {editable && <th style={{ width: '4%' }}></th>}
        </tr>
      </thead>
      <tbody>
        {STAGES.map(stage => renderStageSection(stage, conceptsByStage[stage]))}
        {otherItems.length > 0 && renderStageSection("Otros", otherItems)}

        {/* Edit mode: Dynamic add row styled inside the sheet */}
        {editable && (
          <>
            <tr style={{ background: '#F2F4F4', borderBottom: '1px solid #000' }}>
              <td colSpan="9" style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 'bold', color: '#1B4F72' }}>
                <span style={{ marginRight: 8 }}>ETAPA PARA EL NUEVO CONCEPTO:</span>
                <select className="form-control" style={{ display: 'inline-block', width: 'auto', padding: '2px 6px', fontSize: 10 }} value={nuevaEtapa} onChange={e => setNuevaEtapa(e.target.value)}>
                  {STAGES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </td>
            </tr>
            <tr style={{ background: '#FBFCFC', borderBottom: '1px solid #000' }}>
              <td style={{ textAlign: 'center', padding: '6px 4px', borderRight: '1px solid #000', fontWeight: 'bold' }}>+</td>
              <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {catalog && catalog.length > 0 && (
                    <select className="form-control" style={{ width: 'auto', padding: '2px 4px', fontSize: 10 }} value="" onChange={e => { if (e.target.value) handleCatalogSelect(e.target.value); e.target.value = ""; }}>
                      <option value="">[Catálogo]</option>
                      {catalog.map(cat => <option key={cat.clave} value={cat.clave}>[{cat.clave}] {cat.descripcion.slice(0, 30)}...</option>)}
                    </select>
                  )}
                  <input className="form-control" placeholder="Concepto..." style={{ fontSize: 11, padding: 3, flex: 1 }} value={nuevoConcepto} onChange={e => setNuevoConcepto(e.target.value)} />
                </div>
              </td>
              <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                <select className="form-control" style={{ fontSize: 11, padding: 3 }} value={nuevaUnidad} onChange={e => setNuevaUnidad(e.target.value)}>
                  <option value="GESTIÓN">GESTIÓN</option>
                  <option value="TRAMITE">TRAMITE</option>
                  <option value="ESTUDIO">ESTUDIO</option>
                  <option value="PROYECTO">PROYECTO</option>
                </select>
              </td>
              <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                <input type="number" className="form-control" placeholder="Honorarios" style={{ fontSize: 11, padding: 3, textAlign: 'right' }} value={nuevosHonorarios} onChange={e => setNuevosHonorarios(e.target.value)} />
              </td>
              <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                <input className="form-control" placeholder="Comentarios" style={{ fontSize: 11, padding: 3 }} value={nuevoComentario} onChange={e => setNuevoComentario(e.target.value)} />
              </td>
              <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                <input type="number" className="form-control" placeholder="Derechos" style={{ fontSize: 11, padding: 3, textAlign: 'right' }} value={nuevoPagoDerechos} onChange={e => setNuevoPagoDerechos(e.target.value)} />
              </td>
              <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                <input type="number" className="form-control" placeholder="Extra" style={{ fontSize: 11, padding: 3, textAlign: 'right' }} value={nuevoExtra} onChange={e => setNuevoExtra(e.target.value)} />
              </td>
              <td style={{ padding: '6px 4px', borderRight: '1px solid #000' }}>
                <select className="form-control" style={{ fontSize: 11, padding: 3 }} value={nuevoAsignado} onChange={e => setNuevoAsignado(e.target.value)}>
                  <option value="">— Gestor —</option>
                  {EQUIPO.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
                </select>
              </td>
              <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={addConcept} disabled={!nuevoConcepto} style={{ padding: '3px 8px', fontSize: 10 }}>
                  Añadir
                </button>
              </td>
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
}

// ─── UNIFIED HEAD SECTION COMPONENT ─────────────────────────────────────────
function EncabezadoOficial({ b, proyectoNombre, editable = false, onFieldChange }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', borderBottom: '2px solid #000' }}>
      <tbody>
        <tr>
          <td rowSpan="2" style={{ width: '15%', border: '1px solid #000', textAlignment: 'center', padding: '10px', verticalAlign: 'middle', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', fontWeight: 900, background: '#000', color: '#fff', padding: '4px 14px', display: 'inline-block', fontFamily: 'Outfit, sans-serif' }}>GIU</span>
          </td>
          <td colSpan="2" style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', background: '#eaeaea', letterSpacing: '1px' }}>
            GESTIÓN INTEGRAL URBANA
          </td>
        </tr>
        <tr>
          <td colSpan="2" style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
            PRESUPUESTO DE GESTIÓN, TRAMITES Y ESTUDIOS
          </td>
        </tr>

        {/* Row 3 */}
        <tr>
          <td rowSpan="3" style={{ width: '45%', border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
            <div style={{ fontWeight: 'bold', color: '#555', marginBottom: 2 }}>PROYECTO:</div>
            {editable ? (
              <textarea style={{ ...flatInput, fontWeight: 'bold', fontSize: '12px', resize: 'none', background: 'transparent' }} rows={2} value={b.titulo} onChange={e => onFieldChange('titulo', e.target.value)} />
            ) : (
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{proyectoNombre?.toUpperCase() || b.titulo?.toUpperCase()}</div>
            )}
          </td>
          <td style={{ width: '35%', border: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>
            <span style={{ fontWeight: 'bold' }}>DIRECCIÓN:</span> {editable ? <input style={flatInput} value={b.direccion} onChange={e => onFieldChange('direccion', e.target.value)} /> : (b.direccion || '').toUpperCase()}
          </td>
          <td style={{ width: '20%', border: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>
            <span style={{ fontWeight: 'bold' }}>FECHA:</span> <span style={{ color: '#C0392B', fontWeight: 'bold' }}>{b.fecha}</span>
          </td>
        </tr>

        {/* Row 4 */}
        <tr>
          <td style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>
            <span style={{ fontWeight: 'bold' }}>PROPIETARIO:</span> {editable ? <input style={flatInput} value={b.propietario} onChange={e => onFieldChange('propietario', e.target.value)} /> : (b.propietario || '').toUpperCase()}
          </td>
          <td style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>
            <span style={{ fontWeight: 'bold' }}>ZONA PRIMARIA (PDUM):</span> {editable ? <input style={flatInput} value={b.zonaPrimaria} onChange={e => onFieldChange('zonaPrimaria', e.target.value)} /> : (b.zonaPrimaria || '').toUpperCase()}
          </td>
        </tr>

        {/* Row 5 */}
        <tr>
          <td style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>
            <span style={{ fontWeight: 'bold' }}>SUP. DE PREDIO:</span> {editable ? <input type="number" style={flatInput} value={b.supPredio} onChange={e => onFieldChange('supPredio', e.target.value)} /> : `${parseFloat(b.supPredio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} M2`}
          </td>
          <td style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>
            <span style={{ fontWeight: 'bold' }}>TIPO DE VIALIDAD (PDUM):</span> {editable ? <input style={flatInput} value={b.tipoVialidad} onChange={e => onFieldChange('tipoVialidad', e.target.value)} /> : (b.tipoVialidad || '').toUpperCase()}
          </td>
        </tr>

        {/* Row 6 */}
        <tr>
          <td style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>
            <span style={{ fontWeight: 'bold' }}>USO:</span> {editable ? <input style={flatInput} value={b.uso} onChange={e => onFieldChange('uso', e.target.value)} /> : (b.uso || '').toUpperCase()}
          </td>
          <td style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>
            <span style={{ fontWeight: 'bold' }}>SUP. CONST. EXISTENTE:</span> {editable ? <input type="number" style={flatInput} value={b.supConstExistente} onChange={e => onFieldChange('supConstExistente', e.target.value)} /> : `${parseFloat(b.supConstExistente || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} M2`}
          </td>
          <td style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>
            <span style={{ fontWeight: 'bold' }}>VERSION PRESUPUESTO:</span> <span style={{ color: '#C0392B', fontWeight: 'bold' }}>{editable ? <input style={{ ...flatInput, color: '#C0392B', fontWeight: 'bold' }} value={b.version} onChange={e => onFieldChange('version', e.target.value)} /> : b.version}</span>
          </td>
        </tr>

        {/* Row 7 */}
        <tr>
          <td style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>
            <span style={{ fontWeight: 'bold' }}>CLASIFICACIÓN:</span> {editable ? <input style={flatInput} value={b.clasificacion} onChange={e => onFieldChange('clasificacion', e.target.value)} /> : (b.clasificacion || '').toUpperCase()}
          </td>
          <td style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'middle', color: '#C0392B', fontWeight: 'bold' }}>
            <span style={{ color: '#000' }}>SUP. A INTERVENIR:</span> {editable ? <input type="number" style={{ ...flatInput, color: '#C0392B', fontWeight: 'bold' }} value={b.supIntervenir} onChange={e => onFieldChange('supIntervenir', e.target.value)} /> : `${parseFloat(b.supIntervenir || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} M2`}
          </td>
          <td style={{ border: '1px solid #000', padding: '4px', verticalAlign: 'middle' }}>
            <span style={{ fontWeight: 'bold' }}>ESTIMACIÓN:</span> {editable ? <input style={flatInput} value={b.estimacion} onChange={e => onFieldChange('estimacion', e.target.value)} /> : (b.estimacion || '').toUpperCase()}
          </td>
        </tr>
      </tbody>
    </table>
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

  const [conceptosList, setConceptosList] = useState([]);
  const [guardado, setGuardado] = useState(false);

  // Prepopulate title and address if project is selected
  useEffect(() => {
    if (proyectoId) {
      const selectedProj = proyectos.find(p => p.id === proyectoId);
      if (selectedProj) {
        setTitulo(`Presupuesto Gestoría — ${selectedProj.nombre}`);
        setDireccion(selectedProj.ubicacion || '');
        const client = clientes.find(c => c.id === selectedProj.clienteId);
        if (client) {
          setPropietario(client.nombre || '');
        }
      }
    }
  }, [proyectoId, proyectos, clientes]);

  const selProyecto = proyectos.find(p => p.id === proyectoId);
  const cliente = selProyecto ? clientes.find(c => c.id === selProyecto.clienteId) : null;

  // Calculators
  const subtotalHonorarios = conceptosList.reduce((acc, c) => acc + (parseFloat(c.honorarios) || 0), 0);
  const totalDerechos = conceptosList.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0);
  const totalExtras = conceptosList.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0);

  const totalGeneral = subtotalHonorarios * 1.16 + totalDerechos + totalExtras;
  const costDirectConstVal = parseFloat(costoDirectoConstruccion) || 0;
  const pctGestion = costDirectConstVal > 0 ? (totalGeneral / costDirectConstVal) * 100 : 0;

  const canSave = proyectoId && titulo.trim() !== '' && version.trim() !== '';

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
    <div>
      <div className="page-header flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Nuevo Presupuesto</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Proyecto:</span>
            <select className="form-control" style={{ width: 300, padding: '4px 8px' }} value={proyectoId} onChange={e => setProyectoId(e.target.value)}>
              <option value="">— Seleccionar Proyecto —</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.id} - {p.nombre}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>
          {guardado ? (
            <div className="alert alert-green" style={{ padding: '8px 16px', margin: 0 }}><Icon name="check" size={14} /> Guardado</div>
          ) : (
            <button className="btn btn-primary" onClick={handleGuardar} disabled={!canSave || conceptosList.length === 0} style={{ opacity: (!canSave || conceptosList.length === 0) ? 0.5 : 1 }}>
              Guardar Presupuesto
            </button>
          )}
        </div>
      </div>

      {/* SINGLE UNIFIED SHEET FOR EDITING */}
      <div style={{ border: '2px solid #000', padding: 0, background: '#fff', borderRadius: 4, overflow: 'hidden', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        <EncabezadoOficial
          b={{
            titulo,
            direccion,
            propietario,
            zonaPrimaria,
            supPredio,
            tipoVialidad,
            uso,
            supConstExistente,
            version,
            clasificacion,
            supIntervenir,
            estimacion,
            fecha: fmt(hoy)
          }}
          editable={true}
          onFieldChange={handleFieldChange}
          proyectoNombre={selProyecto?.nombre}
        />

        <TablaConceptos
          conceptos={conceptosList}
          onChange={setConceptosList}
          editable={true}
          catalog={catalog}
          infoAdicional={infoAdicional}
          onInfoAdicionalChange={handleInfoAdicionalChange}
        />

        {/* Totals spreadsheet row */}
        <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2px solid #000' }}>
          <tbody>
            <tr style={{ background: '#BDC3C7', fontWeight: 'bold', fontSize: '11px' }}>
              <td colSpan="3" style={{ padding: '10px 8px', textAlignment: 'right', textAlign: 'right', borderRight: '1px solid #000', width: '50%' }}>
                TOTAL DE GESTIÓN, TRAMITES Y ESTUDIOS
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'DM Mono', borderRight: '1px solid #000', width: '10%' }}>
                {money(subtotalHonorarios)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #000', width: '20%' }}>
                MÁS I.V.A.
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'DM Mono', borderRight: '1px solid #000', width: '10%' }}>
                {money(totalDerechos)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'DM Mono', width: '10%' }}>
                {money(totalExtras)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bottom Percentage & Notes Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', fontSize: '11px', background: '#fff' }}>
          {/* Left Block */}
          <div style={{ borderRight: '1px solid #000', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#FCF3CF', border: '1px solid #F4D03F', padding: 8, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>PORCENTAJE DE GESTIÓN VS. COSTO DIRECTO DE CONSTRUCCIÓN:</span>
              <span style={{ fontSize: '13px', fontFamily: 'DM Mono' }}>{pctGestion.toFixed(3)}%</span>
            </div>
            <div style={{ background: '#F2F4F4', border: '1px solid #BDC3C7', padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>COSTO DIRECTO DE CONSTRUCCIÓN:</span>
              <input type="number" style={{ border: 'none', background: 'transparent', textAlign: 'right', fontWeight: 'bold', width: '120px', outline: 'none' }} value={costoDirectoConstruccion} onChange={e => setCostoDirectoConstruccion(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          {/* Right Block (Notes) */}
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, lineStyle: 'none' }}>
            <div><strong>DOCUMENTOS TECNICOS NECESARIOS:</strong> <textarea style={flatTextarea} rows={2} value={infoAdicional.documentosTecnicos} onChange={e => handleInfoAdicionalChange('documentosTecnicos', e.target.value)} /></div>
            <div><strong>DOCUMENTOS LEGALES NECESARIOS:</strong> <textarea style={flatTextarea} rows={2} value={infoAdicional.documentosLegales} onChange={e => handleInfoAdicionalChange('documentosLegales', e.target.value)} /></div>
            <div><strong>DERECHOS Y GASTOS:</strong> <textarea style={flatTextarea} rows={2} value={infoAdicional.derechosGastos} onChange={e => handleInfoAdicionalChange('derechosGastos', e.target.value)} /></div>
            <div><strong>FORMA DE PAGO:</strong> <textarea style={flatTextarea} rows={2} value={infoAdicional.formaPago} onChange={e => handleInfoAdicionalChange('formaPago', e.target.value)} /></div>
            <div><strong>LOS TRABAJOS NO INCLUYEN:</strong> <textarea style={flatTextarea} rows={2} value={infoAdicional.exclusiones} onChange={e => handleInfoAdicionalChange('exclusiones', e.target.value)} /></div>
            <div><strong>NOTAS:</strong> <textarea style={flatTextarea} rows={2} value={infoAdicional.notas} onChange={e => handleInfoAdicionalChange('notas', e.target.value)} /></div>
            <div style={{ color: '#7F8C8D', fontStyle: 'italic', marginTop: 4 }}>PRECIOS MÁS I.V.A. SI SE REQUIERE</div>
          </div>
        </div>

        {/* Signature Box */}
        <div style={{ borderTop: '1px solid #000', padding: '20px 0', textAlign: 'center', background: '#fff' }}>
          <div style={{ display: 'inline-block', width: '300px', borderTop: '1px solid #000', paddingTop: 6, marginTop: '30px', fontSize: '11px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input style={{ ...flatInput, textAlign: 'center', fontWeight: 'bold' }} value={infoAdicional.firmadoPor} onChange={e => handleInfoAdicionalChange('firmadoPor', e.target.value)} />
              <input style={{ ...flatInput, textAlign: 'center' }} value={infoAdicional.firmadoCargo} onChange={e => handleInfoAdicionalChange('firmadoCargo', e.target.value)} />
              <input style={{ ...flatInput, textAlign: 'center' }} value={infoAdicional.firmadoCedula} onChange={e => handleInfoAdicionalChange('firmadoCedula', e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VISTA DETALLADA DEL PRESUPUESTO COMPONENT ────────────────────────────────
function VistaPresupuesto({ p, onCerrar, clientes, proyectos, onAjustar, onCambiarEstatus, onMarcarBaseline, onGuardarCambios }) {
  const { conceptos: catalog } = useAppContext();
  const proj = proyectos.find(pr => pr.id === p.proyectoId);
  const cliente = proj ? clientes.find(c => c.id === proj.clienteId) : (p.clienteId ? clientes.find(c => c.id === p.clienteId) : null);

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
      } catch (e) {}
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
      } catch (e) {}
    }
    setIsEdited(false);
  }, [p]);

  const handleConceptosChange = (newList) => {
    setConceptosList(newList);
    setIsEdited(true);
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
    <div>
      <div className="page-header flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title" style={{ fontSize: 19 }}>Ficha del Presupuesto</div>
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
          <button className="btn btn-secondary" onClick={onCerrar}>Volver</button>
          {isEdited && (
            <button className="btn btn-primary" onClick={saveEdits} style={{ background: '#B87A0A', color: '#fff' }}>
              Guardar Cambios
            </button>
          )}
        </div>
      </div>

      {/* Actions Toolbar */}
      <div style={{ padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>Acciones de Gestión:</span>

        {p.estado === 'Borrador' && (
          <button className="btn btn-sm btn-primary" onClick={() => onCambiarEstatus(p.id, 'Enviado')}>
            Enviar al Cliente
          </button>
        )}

        {p.estado === 'Enviado' && (
          <>
            <button className="btn btn-sm btn-primary" onClick={() => onCambiarEstatus(p.id, 'Aprobado')} style={{ background: 'var(--accent)' }}>
              Aprobar Presupuesto
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => onCambiarEstatus(p.id, 'Rechazado')} style={{ color: '#C0392B' }}>
              Rechazar
            </button>
          </>
        )}

        {p.estado === 'Aprobado' && !p.isBaseline && (
          <button className="btn btn-sm btn-primary" onClick={() => onMarcarBaseline(p.id)} style={{ background: 'var(--accent)', color: '#fff' }}>
            Establecer como Línea Base
          </button>
        )}

        {/* Change management clone */}
        {(p.estado === 'Aprobado' || p.estado === 'Enviado' || p.estado === 'Rechazado') && (
          <button className="btn btn-sm btn-secondary" onClick={() => onAjustar(p)}>
            Ajustar Presupuesto — Nueva Versión
          </button>
        )}
      </div>

      {/* SINGLE UNIFIED SHEET FOR VIEW / EDIT */}
      <div style={{ border: '2px solid #000', padding: 0, background: '#fff', borderRadius: 4, overflow: 'hidden', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        <EncabezadoOficial
          b={{
            titulo,
            direccion,
            propietario,
            zonaPrimaria,
            supPredio,
            tipoVialidad,
            uso,
            supConstExistente,
            version,
            clasificacion,
            supIntervenir,
            estimacion,
            fecha: p.fecha
          }}
          editable={isBorrador}
          onFieldChange={handleFieldChange}
          proyectoNombre={proj?.nombre}
        />

        <TablaConceptos
          conceptos={conceptosList}
          onChange={handleConceptosChange}
          editable={isBorrador}
          catalog={catalog}
          infoAdicional={infoAdicional}
          onInfoAdicionalChange={handleInfoAdicionalChange}
        />

        {/* Totals spreadsheet row */}
        <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2px solid #000' }}>
          <tbody>
            <tr style={{ background: '#BDC3C7', fontWeight: 'bold', fontSize: '11px' }}>
              <td colSpan="3" style={{ padding: '10px 8px', textAlignment: 'right', textAlign: 'right', borderRight: '1px solid #000', width: '50%' }}>
                TOTAL DE GESTIÓN, TRAMITES Y ESTUDIOS
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'DM Mono', borderRight: '1px solid #000', width: '10%' }}>
                {money(subtotalHonorarios)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #000', width: '20%' }}>
                MÁS I.V.A.
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'DM Mono', borderRight: '1px solid #000', width: '10%' }}>
                {money(totalDerechos)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'DM Mono', width: '10%' }}>
                {money(totalExtras)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bottom Percentage & Notes Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', fontSize: '11px', background: '#fff' }}>
          {/* Left Block */}
          <div style={{ borderRight: '1px solid #000', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#FCF3CF', border: '1px solid #F4D03F', padding: 8, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>PORCENTAJE DE GESTIÓN VS. COSTO DIRECTO DE CONSTRUCCIÓN:</span>
              <span style={{ fontSize: '13px', fontFamily: 'DM Mono' }}>{pctGestion.toFixed(3)}%</span>
            </div>
            <div style={{ background: '#F2F4F4', border: '1px solid #BDC3C7', padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>COSTO DIRECTO DE CONSTRUCCIÓN:</span>
              {isBorrador ? (
                <input type="number" style={{ border: 'none', background: 'transparent', textAlign: 'right', fontWeight: 'bold', width: '120px', outline: 'none' }} value={costoDirectoConstruccion} onChange={e => { setCostoDirectoConstruccion(e.target.value); setIsEdited(true); }} placeholder="0.00" />
              ) : (
                <span style={{ fontWeight: 'bold', fontFamily: 'DM Mono' }}>{money(costDirectConstVal)}</span>
              )}
            </div>
          </div>

          {/* Right Block (Notes) */}
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, lineStyle: 'none' }}>
            <div><strong>DOCUMENTOS TECNICOS NECESARIOS:</strong> {isBorrador ? <textarea style={flatTextarea} rows={2} value={infoAdicional.documentosTecnicos} onChange={e => handleInfoAdicionalChange('documentosTecnicos', e.target.value)} /> : infoAdicional.documentosTecnicos}</div>
            <div><strong>DOCUMENTOS LEGALES NECESARIOS:</strong> {isBorrador ? <textarea style={flatTextarea} rows={2} value={infoAdicional.documentosLegales} onChange={e => handleInfoAdicionalChange('documentosLegales', e.target.value)} /> : infoAdicional.documentosLegales}</div>
            <div><strong>DERECHOS Y GASTOS:</strong> {isBorrador ? <textarea style={flatTextarea} rows={2} value={infoAdicional.derechosGastos} onChange={e => handleInfoAdicionalChange('derechosGastos', e.target.value)} /> : infoAdicional.derechosGastos}</div>
            <div><strong>FORMA DE PAGO:</strong> {isBorrador ? <textarea style={flatTextarea} rows={2} value={infoAdicional.formaPago} onChange={e => handleInfoAdicionalChange('formaPago', e.target.value)} /> : infoAdicional.formaPago}</div>
            <div><strong>LOS TRABAJOS NO INCLUYEN:</strong> {isBorrador ? <textarea style={flatTextarea} rows={2} value={infoAdicional.exclusiones} onChange={e => handleInfoAdicionalChange('exclusiones', e.target.value)} /> : infoAdicional.exclusiones}</div>
            <div><strong>NOTAS:</strong> {isBorrador ? <textarea style={flatTextarea} rows={2} value={infoAdicional.notas} onChange={e => handleInfoAdicionalChange('notas', e.target.value)} /> : infoAdicional.notas}</div>
            <div style={{ color: '#7F8C8D', fontStyle: 'italic', marginTop: 4 }}>PRECIOS MÁS I.V.A. SI SE REQUIERE</div>
          </div>
        </div>

        {/* Signature Box */}
        <div style={{ borderTop: '1px solid #000', padding: '20px 0', textAlign: 'center', background: '#fff' }}>
          <div style={{ display: 'inline-block', width: '300px', borderTop: '1px solid #000', paddingTop: 6, marginTop: '30px', fontSize: '11px' }}>
            {isBorrador ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <input style={{ ...flatInput, textAlign: 'center', fontWeight: 'bold' }} value={infoAdicional.firmadoPor} onChange={e => handleInfoAdicionalChange('firmadoPor', e.target.value)} />
                <input style={{ ...flatInput, textAlign: 'center' }} value={infoAdicional.firmadoCargo} onChange={e => handleInfoAdicionalChange('firmadoCargo', e.target.value)} />
                <input style={{ ...flatInput, textAlign: 'center' }} value={infoAdicional.firmadoCedula} onChange={e => handleInfoAdicionalChange('firmadoCedula', e.target.value)} />
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{infoAdicional.firmadoPor?.toUpperCase()}</div>
                <div style={{ color: '#555', fontWeight: 600 }}>{infoAdicional.firmadoCargo?.toUpperCase()}</div>
                <div style={{ color: '#777', fontSize: 9, fontFamily: 'DM Mono', marginTop: 2 }}>{infoAdicional.firmadoCedula}</div>
              </>
            )}
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
    setPreselectedProjectId,
    tareas,
    setTareas
  } = useAppContext();

  const [tab, setTab] = useState('agrupado'); // 'agrupado' | 'nuevo' | 'ver' | 'catalogo'
  const [viendoId, setViendoId] = useState(null);
  const [q, setQ] = useState('');
  const [expandedProyecto, setExpandedProyecto] = useState(null);

  // Network services hook integration
  const { crearPresupuesto } = usePresupuestos(setPresupuestos, session);

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
  const handleAjustar = (budget) => {
    const nextVer = incrementVersion(budget.version);
    const clon = {
      ...budget,
      id: `PRES-${String(Date.now()).slice(-4)}`,
      version: nextVer,
      estado: 'Borrador',
      isBaseline: false,
      fecha: fmt(hoy),
      conceptos: budget.conceptos ? budget.conceptos.map(c => ({
        ...c,
        id: `conc-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      })) : []
    };

    setPresupuestos(prev => [clon, ...prev]);
    setViendoId(clon.id);
    setTab('ver');
  };

  // Save changes to draft budgets
  const handleGuardarCambios = (updated) => {
    setPresupuestos(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  // Update budget status and trigger automatic task generation on approval
  const handleCambiarEstatus = (id, nuevoEstatus) => {
    setPresupuestos(prev => prev.map(b => {
      if (b.id === id) {
        if (nuevoEstatus === 'Aprobado') {
          const newTasks = [];
          if (b.conceptos && b.conceptos.length > 0) {
            b.conceptos.forEach(c => {
              if (c.empleadoAsignadoId) {
                const alreadyExists = tareas.some(t => t.conceptoOrigenId === c.id);
                if (!alreadyExists) {
                  newTasks.push({
                    id: `task-${Date.now()}-${c.no}`,
                    titulo: `[${c.etapa}] ${c.concepto}`,
                    proyectoId: b.proyectoId,
                    conceptoOrigenId: c.id,
                    asignadoA: c.empleadoAsignadoId,
                    fecha: b.fecha || fmt(new Date()),
                    prioridad: 'media',
                    hecho: false,
                    estado: 'Por hacer'
                  });
                }
              }
            });
          }
          if (newTasks.length > 0) {
            setTareas(prevTareas => [...prevTareas, ...newTasks]);
            alert(`Se han creado y asignado ${newTasks.length} tareas de gestoría basadas en el presupuesto aprobado.`);
          }
        }
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
        onGuardarCambios={handleGuardarCambios}
      />
    );
  }

  // Filter projects or budgets based on query
  const filteredProjects = proyectos.filter(p => {
    if (session.rol === 'cliente') {
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
                      Cliente: {clientes.find(c => c.id === proj.clienteId)?.nombre || '—'} · Ubicación: {proj.ubicacion || 'No especificada'}
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
                            {associatedBudgets.sort((a, b) => b.version.localeCompare(a.version)).map(b => {
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

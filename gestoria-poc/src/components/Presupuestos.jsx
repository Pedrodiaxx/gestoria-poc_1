import React, { useState, useEffect } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { money } from '../data/mockData';

const hoy = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const emptyCosto = () => ({
  planos: { cantidad: '', precioUnitario: '' },
  hrsHombre: { horas: '', precioPorHora: '' },
  oficina: { horas: '', precioPorHora: '' },
});

const emptyDerechos = () => ({
  derecho1: { nombre: '', costo: '' },
  derecho2: { nombre: '', costo: '' },
  derecho3: { nombre: '', costo: '' },
});

const calcSeccion = (s) => {
  const planos = (parseFloat(s.planos.cantidad) || 0) * (parseFloat(s.planos.precioUnitario) || 0);
  const hrs = (parseFloat(s.hrsHombre.horas) || 0) * (parseFloat(s.hrsHombre.precioPorHora) || 0);
  const oficina = (parseFloat(s.oficina.horas) || 0) * (parseFloat(s.oficina.precioPorHora) || 0);
  return { planos, hrs, oficina, subtotal: planos + hrs + oficina };
};

const calcDerechos = (d) => {
  if (!d) return { derecho1: 0, derecho2: 0, derecho3: 0, subtotal: 0, lbl1: '', lbl2: '', lbl3: '' };

  // Retrocompatibilidad con la estructura anterior
  if (d.planos && d.hrsHombre && d.oficina) {
    const planos = (parseFloat(d.planos.cantidad) || 0) * (parseFloat(d.planos.precioUnitario) || 0);
    const hrs = (parseFloat(d.hrsHombre.horas) || 0) * (parseFloat(d.hrsHombre.precioPorHora) || 0);
    const oficina = (parseFloat(d.oficina.horas) || 0) * (parseFloat(d.oficina.precioPorHora) || 0);
    return {
      derecho1: planos,
      derecho2: hrs,
      derecho3: oficina,
      subtotal: planos + hrs + oficina,
      lbl1: 'Planos',
      lbl2: 'Hrs. Hombre',
      lbl3: 'Oficina'
    };
  }

  const c1 = parseFloat(d.derecho1?.costo) || 0;
  const c2 = parseFloat(d.derecho2?.costo) || 0;
  const c3 = parseFloat(d.derecho3?.costo) || 0;
  return {
    derecho1: c1,
    derecho2: c2,
    derecho3: c3,
    subtotal: c1 + c2 + c3,
    lbl1: d.derecho1?.nombre || 'Derecho 1',
    lbl2: d.derecho2?.nombre || 'Derecho 2',
    lbl3: d.derecho3?.nombre || 'Derecho 3'
  };
};

function CalcBloque({ titulo, color, datos, onChange }) {
  const res = calcSeccion(datos);
  const upd = (campo, key, val) => onChange({ ...datos, [campo]: { ...datos[campo], [key]: val } });
  const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', fontFamily: 'DM Mono', fontSize: 13, outline: 'none', background: 'var(--surface)' };
  const labelStyle = { fontSize: 11, color: 'var(--text-3)', marginBottom: 3, display: 'block', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const resultBox = (label, val) => (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', minWidth: 120 }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 14, color: val > 0 ? color : 'var(--text-3)', marginTop: 2 }}>{money(val)}</div>
    </div>
  );

  return (
    <div style={{ border: `1px solid ${color}33`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ background: `${color}11`, borderBottom: `1px solid ${color}22`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <span style={{ fontWeight: 600, fontSize: 13, color }}>{titulo}</span>
      </div>
      <div style={{ padding: '16px' }}>
        {/* Planos */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📐</span> Planos
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <div><label style={labelStyle}>Cantidad</label><input style={inputStyle} type="number" placeholder="0" value={datos.planos.cantidad} onChange={e => upd('planos', 'cantidad', e.target.value)} /></div>
            <div><label style={labelStyle}>Precio Unitario</label><input style={inputStyle} type="number" placeholder="$0.00" value={datos.planos.precioUnitario} onChange={e => upd('planos', 'precioUnitario', e.target.value)} /></div>
            {resultBox('= Total Planos', res.planos)}
          </div>
        </div>

        {/* Hrs Hombre */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>👥</span> Hrs. Hombre
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <div><label style={labelStyle}>Horas</label><input style={inputStyle} type="number" placeholder="0 hrs" value={datos.hrsHombre.horas} onChange={e => upd('hrsHombre', 'horas', e.target.value)} /></div>
            <div><label style={labelStyle}>Precio × Hora</label><input style={inputStyle} type="number" placeholder="$0.00/hr" value={datos.hrsHombre.precioPorHora} onChange={e => upd('hrsHombre', 'precioPorHora', e.target.value)} /></div>
            {resultBox('= Total Hrs', res.hrs)}
          </div>
        </div>

        {/* Oficina */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🏢</span> Oficina
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
            <div><label style={labelStyle}>Horas</label><input style={inputStyle} type="number" placeholder="0 hrs" value={datos.oficina.horas} onChange={e => upd('oficina', 'horas', e.target.value)} /></div>
            <div><label style={labelStyle}>Precio × Hora</label><input style={inputStyle} type="number" placeholder="$0.00/hr" value={datos.oficina.precioPorHora} onChange={e => upd('oficina', 'precioPorHora', e.target.value)} /></div>
            {resultBox('= Total Oficina', res.oficina)}
          </div>
        </div>

        {/* Subtotal bloque */}
        <div style={{ background: color, borderRadius: 'var(--radius-sm)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Subtotal {titulo}</span>
          <span style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 18, color: '#fff' }}>{money(res.subtotal)}</span>
        </div>
      </div>
    </div>
  );
}

function CalcDerechos({ color, datos, onChange }) {
  const res = calcDerechos(datos);
  const upd = (campo, key, val) => onChange({ ...datos, [campo]: { ...datos[campo], [key]: val } });
  const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 13, outline: 'none', background: 'var(--surface)' };
  const labelStyle = { fontSize: 11, color: 'var(--text-3)', marginBottom: 3, display: 'block', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const resultBox = (label, val) => (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', minWidth: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 14, color: val > 0 ? color : 'var(--text-3)', marginTop: 2 }}>{money(val)}</div>
    </div>
  );

  return (
    <div style={{ border: `1px solid ${color}33`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ background: `${color}11`, borderBottom: `1px solid ${color}22`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <span style={{ fontWeight: 600, fontSize: 13, color }}>Derechos</span>
      </div>
      <div style={{ padding: '16px' }}>
        {/* Derecho 1 */}
        <div style={{ marginBottom: 14, padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🏛️</span> Derecho 1
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: 8, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Nombre del Derecho</label>
              <input style={inputStyle} type="text" placeholder="Ej: Pago de Licencia" value={datos.derecho1?.nombre || ''} onChange={e => upd('derecho1', 'nombre', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Costo</label>
              <input style={{ ...inputStyle, fontFamily: 'DM Mono' }} type="number" placeholder="$0.00" value={datos.derecho1?.costo || ''} onChange={e => upd('derecho1', 'costo', e.target.value)} />
            </div>
            {resultBox('= Total D1', res.derecho1)}
          </div>
        </div>

        {/* Derecho 2 */}
        <div style={{ marginBottom: 14, padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🏛️</span> Derecho 2
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: 8, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Nombre del Derecho</label>
              <input style={inputStyle} type="text" placeholder="Ej: Derechos Municipales" value={datos.derecho2?.nombre || ''} onChange={e => upd('derecho2', 'nombre', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Costo</label>
              <input style={{ ...inputStyle, fontFamily: 'DM Mono' }} type="number" placeholder="$0.00" value={datos.derecho2?.costo || ''} onChange={e => upd('derecho2', 'costo', e.target.value)} />
            </div>
            {resultBox('= Total D2', res.derecho2)}
          </div>
        </div>

        {/* Derecho 3 */}
        <div style={{ marginBottom: 14, padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🏛️</span> Derecho 3
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: 8, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Nombre del Derecho</label>
              <input style={inputStyle} type="text" placeholder="Ej: Inscripción de Obra" value={datos.derecho3?.nombre || ''} onChange={e => upd('derecho3', 'nombre', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Costo</label>
              <input style={{ ...inputStyle, fontFamily: 'DM Mono' }} type="number" placeholder="$0.00" value={datos.derecho3?.costo || ''} onChange={e => upd('derecho3', 'costo', e.target.value)} />
            </div>
            {resultBox('= Total D3', res.derecho3)}
          </div>
        </div>

        {/* Subtotal bloque */}
        <div style={{ background: color, borderRadius: 'var(--radius-sm)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Subtotal Derechos</span>
          <span style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 18, color: '#fff' }}>{money(res.subtotal)}</span>
        </div>
      </div>
    </div>
  );
}

function FormNuevoPresupuesto({ onGuardar, onCancelar, clientes }) {
  const [titulo, setTitulo] = useState('');
  const [documentacion, setDocumentacion] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [proceso, setProceso] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [honorarios, setHonorarios] = useState(emptyCosto());
  const [derechos, setDerechos] = useState(emptyDerechos());
  const [guardado, setGuardado] = useState(false);

  const resH = calcSeccion(honorarios);
  const resD = calcDerechos(derechos);
  const totalGeneral = resH.subtotal + resD.subtotal;

  const isValidDerecho = (der) => der && der.nombre?.trim() !== '' && der.costo?.trim() !== '';
  const hasAtLeastOneDerecho = isValidDerecho(derechos.derecho1) || isValidDerecho(derechos.derecho2) || isValidDerecho(derechos.derecho3);
  const canSave = titulo && hasAtLeastOneDerecho;

  const handleGuardar = () => {
    if (!canSave) return;
    const nuevo = {
      id: `PRES-${String(Date.now()).slice(-4)}`,
      titulo, documentacion, requisitos, proceso,
      clienteId: clienteId ? parseInt(clienteId) : null,
      honorarios, derechos,
      fecha: fmt(hoy),
    };
    onGuardar(nuevo);
    setGuardado(true);
    setTimeout(() => onCancelar(), 1600);
  };

  const sectionTitle = (emoji, txt) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid var(--border)' }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{txt}</span>
    </div>
  );

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Nuevo Presupuesto</div>
          <div className="page-subtitle">Completa la información y los costos se calcularán automáticamente</div>
        </div>
        <button className="btn btn-secondary" onClick={onCancelar}>← Volver</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        <div>
          {/* Datos generales */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('📋', 'Datos Generales')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ gridColumn: '1/-1', marginBottom: 0 }}>
                <label className="form-label">Título del Presupuesto *</label>
                <input className="form-control" placeholder="Ej: Licencia de Construcción Comercial — El Nogal" value={titulo} onChange={e => setTitulo(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cliente (opcional)</label>
                <select className="form-control" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                  <option value="">— Sin asignar —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fecha</label>
                <input className="form-control" type="text" value={fmt(hoy)} readOnly style={{ color: 'var(--text-3)' }} />
              </div>
            </div>
          </div>

          {/* Proceso */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('🔄', 'Proceso del Trámite')}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Describe el proceso general</label>
              <textarea className="form-control" rows={3} placeholder="Describe los pasos del trámite, tiempos estimados, dependencias involucradas…" value={proceso} onChange={e => setProceso(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>

          {/* Documentación y Requisitos */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('📁', 'Documentación y Requisitos')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Documentación necesaria <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(un ítem por línea)</span></label>
                <textarea className="form-control" rows={6} placeholder={"Identificación oficial\nEscritura del predio\nPlanos arquitectónicos firmados\nMemoria de cálculo"} value={documentacion} onChange={e => setDocumentacion(e.target.value)} style={{ resize: 'vertical', fontFamily: 'DM Mono', fontSize: 12 }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Requisitos previos <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(un ítem por línea)</span></label>
                <textarea className="form-control" rows={6} placeholder={"Pago de predial al corriente\nUso de suelo vigente\nFactibilidad de servicios"} value={requisitos} onChange={e => setRequisitos(e.target.value)} style={{ resize: 'vertical', fontFamily: 'DM Mono', fontSize: 12 }} />
              </div>
            </div>
            {(documentacion || requisitos) && (
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(42,95,63,0.2)', fontSize: 12, color: 'var(--accent-text)' }}>
                <Icon name="check" size={12} style={{ marginRight: 6 }} />
                Al guardar se generará un checklist con <strong>{documentacion.split('\n').filter(l => l.trim()).length}</strong> ítems de documentación y <strong>{requisitos.split('\n').filter(l => l.trim()).length}</strong> requisitos.
              </div>
            )}
          </div>

          {/* Calculadora Honorarios */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('💼', 'Costo de Honorarios')}
            <CalcBloque titulo="Honorarios" color="#2A5F3F" datos={honorarios} onChange={setHonorarios} />
          </div>

          {/* Calculadora Derechos */}
          <div className="card" style={{ marginBottom: 16 }}>
            {sectionTitle('🏛️', 'Costo de Derechos')}
            <CalcDerechos color="#1A5276" datos={derechos} onChange={setDerechos} />
          </div>
        </div>

        {/* Panel derecho: resumen pegajoso */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>Resumen de Costos</div>

            {/* Honorarios breakdown */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, fontWeight: 600 }}>Honorarios</div>
              {[['💻 Planos', resH.planos], ['👥 Hrs. Hombre', resH.hrs], ['🏢 Oficina', resH.oficina]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--text-2)' }}>
                  <span>{l}</span><span style={{ fontFamily: 'DM Mono' }}>{money(v)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, padding: '6px 0', borderTop: '1px solid var(--border)', marginTop: 4, color: 'var(--accent)' }}>
                <span>Subtotal Honor.</span><span style={{ fontFamily: 'DM Mono' }}>{money(resH.subtotal)}</span>
              </div>
            </div>

            {/* Derechos breakdown */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, fontWeight: 600 }}>Derechos</div>
              {[
                [resD.lbl1, resD.derecho1],
                [resD.lbl2, resD.derecho2],
                [resD.lbl3, resD.derecho3]
              ].map(([l, v], idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--text-2)' }}>
                  <span>{l}</span><span style={{ fontFamily: 'DM Mono' }}>{money(v)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, padding: '6px 0', borderTop: '1px solid var(--border)', marginTop: 4, color: 'var(--blue)' }}>
                <span>Subtotal Derechos</span><span style={{ fontFamily: 'DM Mono' }}>{money(resD.subtotal)}</span>
              </div>
            </div>

            {/* Gran total */}
            <div style={{ background: totalGeneral > 0 ? 'var(--text)' : 'var(--surface2)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: totalGeneral > 0 ? 'rgba(255,255,255,0.5)' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total General</div>
                <div style={{ fontSize: 10, color: totalGeneral > 0 ? 'rgba(255,255,255,0.35)' : 'var(--text-3)' }}>Honor. + Derechos</div>
              </div>
              <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 22, color: totalGeneral > 0 ? '#FFFFFF' : 'var(--text-3)' }}>
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
          {!titulo && <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>Ingresa un título para poder guardar</div>}
          {titulo && !hasAtLeastOneDerecho && <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>Ingresa al menos un derecho (nombre y costo) para poder guardar</div>}
        </div>
      </div>
    </div>
  );
}

function VistaPresupuesto({ p, onCerrar }) {
  const { clientes } = useAppContext();
  const [checkDoc, setCheckDoc] = useState({});
  const [checkReq, setCheckReq] = useState({});
  const resH = calcSeccion(p.honorarios);
  const resD = calcDerechos(p.derechos);
  const total = resH.subtotal + resD.subtotal;
  const cliente = p.clienteId ? clientes.find(c => c.id === p.clienteId) : null;

  const docItems = p.documentacion.split('\n').map(l => l.trim()).filter(Boolean);
  const reqItems = p.requisitos.split('\n').map(l => l.trim()).filter(Boolean);
  const docDone = docItems.filter((_, i) => checkDoc[i]).length;
  const reqDone = reqItems.filter((_, i) => checkReq[i]).length;

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
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-gray">{p.id}</span>
            <span className="badge badge-gray">📅 {p.fecha}</span>
            {cliente && <span className="badge badge-blue">👤 {cliente.nombre}</span>}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onCerrar}>← Volver</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Proceso */}
        {p.proceso && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>🔄 Proceso del Trámite</div>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{p.proceso}</p>
          </div>
        )}

        {/* Checklist Documentación */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>📁 Documentación</div>
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

      {/* Tabla de costos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>💼 Honorarios</div>
          <CostRow label=" Planos" value={resH.planos} />
          <CostRow label=" Hrs. Hombre" value={resH.hrs} />
          <CostRow label=" Oficina" value={resH.oficina} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
            <span>Subtotal</span><span style={{ fontFamily: 'DM Mono' }}>{money(resH.subtotal)}</span>
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>🏛️ Derechos</div>
          <CostRow label={resD.lbl1} value={resD.derecho1} />
          <CostRow label={resD.lbl2} value={resD.derecho2} />
          <CostRow label={resD.lbl3} value={resD.derecho3} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, fontSize: 14, color: 'var(--blue)' }}>
            <span>Subtotal</span><span style={{ fontFamily: 'DM Mono' }}>{money(resD.subtotal)}</span>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--text)', border: 'none', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Total General</div>
          <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 28, color: '#FFFFFF', lineHeight: 1 }}>{money(total)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Honorarios + Derechos</div>
        </div>
      </div>
    </div>
  );
}

export function Presupuestos({ budgetRepository }) {
  const { clientes, session, conceptos } = useAppContext();
  const [tab, setTab] = useState('catalogo');  // 'catalogo' | 'nuevo' | 'ver'
  
  const [presupuestos, setPresupuestos] = useState(() => {
    return budgetRepository.getAll();
  });
  
  const [viendoId, setViendoId] = useState(null);
  const [q, setQ] = useState('');

  const getCliente = (id) => clientes.find(c => c.id === id);

  useEffect(() => {
    budgetRepository.save(presupuestos);
  }, [presupuestos, budgetRepository]);

  const verPres = presupuestos.find(p => p.id === viendoId);

  const guardarNuevo = (p) => {
    setPresupuestos(prev => [p, ...prev]);
  };

  if (tab === 'nuevo') return <FormNuevoPresupuesto onGuardar={guardarNuevo} onCancelar={() => setTab('catalogo')} clientes={clientes} />;
  if (tab === 'ver' && verPres) return <VistaPresupuesto p={verPres} onCerrar={() => setTab('catalogo')} />;

  const filtrados = presupuestos.filter(p => {
    if (session.rol === 'cliente' && p.clienteId !== session.clienteId) return false;
    const cli = p.clienteId ? getCliente(p.clienteId) : null;
    const clientName = cli ? cli.nombre.toLowerCase() : '';
    return p.titulo.toLowerCase().includes(q.toLowerCase()) ||
      p.id.toLowerCase().includes(q.toLowerCase()) ||
      clientName.includes(q.toLowerCase());
  });

  const catalogoFiltrado = conceptos.filter(c =>
    c.clave.toLowerCase().includes(q.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">{session.rol === 'cliente' ? 'Mis Presupuestos' : 'Presupuestos'}</div>
          <div className="page-subtitle">Catálogo de conceptos y presupuestos detallados con calculadora de costos</div>
        </div>
        {session.rol !== 'cliente' && (
          <button className="btn btn-primary" onClick={() => setTab('nuevo')}>
            <Icon name="plus" size={14} /> Nuevo Presupuesto
          </button>
        )}
      </div>

      {/* Buscador global */}
      <div className="search-wrap mb-6" style={{ maxWidth: 400 }}>
        <Icon name="search" size={14} />
        <input className="form-control search-input" placeholder="Buscar en presupuestos y catálogo…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {/* Presupuestos guardados */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="receipt" size={15} style={{ color: 'var(--text-3)' }} />
          Presupuestos Guardados
          <span className="badge badge-gray">{filtrados.length}</span>
        </div>
        {filtrados.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
            <Icon name="file" size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <div>No hay presupuestos aún</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 14 }}>
            {filtrados.map(p => {
              const resH = calcSeccion(p.honorarios);
              const resD = calcDerechos(p.derechos);
              const total = resH.subtotal + resD.subtotal;
              const cli = p.clienteId ? getCliente(p.clienteId) : null;
              const docItems = p.documentacion.split('\n').filter(Boolean).length;
              const reqItems = p.requisitos.split('\n').filter(Boolean).length;
              return (
                <div key={p.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                  onClick={() => { setViendoId(p.id); setTab('ver') }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{p.id}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.fecha}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{p.titulo}</div>
                  {cli && <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>👤 {cli.nombre}</div>}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    {docItems > 0 && <span className="badge badge-blue">{docItems} docs</span>}
                    {reqItems > 0 && <span className="badge badge-amber">{reqItems} req.</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Total estimado</div>
                    <div style={{ fontFamily: 'DM Mono', fontWeight: 700, fontSize: 16, color: total > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                      {total > 0 ? money(total) : '$ —'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Catálogo de conceptos */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="list" size={15} style={{ color: 'var(--text-3)' }} />
          Catálogo de Conceptos
          <span className="badge badge-gray">{catalogoFiltrado.length}</span>
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
              {catalogoFiltrado.map((c, i) => (
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
    </div>
  );
}
export default Presupuestos;

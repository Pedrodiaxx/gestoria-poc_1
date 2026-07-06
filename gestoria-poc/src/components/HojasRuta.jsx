import React, { useState } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { 
  TRAMITES_MOCK, 
  TRAMITES_TIPOS, 
  COLOR_MAP, 
  BG_MAP, 
  EQUIPO 
} from '../data/mockData';

export function HojasRuta() {
  const { session, clientes } = useAppContext();
  
  const getCliente = (id) => clientes.find(c => c.id === id);

  const clientTramitesList = session.rol === 'cliente'
    ? TRAMITES_MOCK.filter(t => t.clienteId === session.clienteId)
    : TRAMITES_MOCK;

  const [selectedTramite, setSelectedTramite] = useState(clientTramitesList[0] || null);
  const [pasoActual, setPasoActual] = useState(clientTramitesList[0]?.pasoActual || 0);

  const seleccionar = (t) => {
    setSelectedTramite(t);
    setPasoActual(t.pasoActual);
  };

  if (!selectedTramite) {
    return (
      <div>
        <div className="page-header">
          <div className="page-title">{session.rol === 'cliente' ? 'Mis Trámites' : 'Hojas de Ruta por Trámite'}</div>
          <div className="page-subtitle">{session.rol === 'cliente' ? 'No tienes ningún trámite en proceso actualmente.' : 'Seguimiento de requisitos y pasos predefinidos para cada gestión'}</div>
        </div>
      </div>
    );
  }

  const tipo = TRAMITES_TIPOS[selectedTramite.tipo];
  const col = COLOR_MAP[tipo.color];
  const bgCol = BG_MAP[tipo.color];
  const cli = getCliente(selectedTramite.clienteId);
  const equipo = EQUIPO.find(e => e.id === selectedTramite.asignadoA);
  const pct = Math.round((pasoActual / tipo.pasos.length) * 100);

  const avanzar = () => {
    if (pasoActual < tipo.pasos.length) setPasoActual(p => p + 1);
  };

  const retroceder = () => {
    if (pasoActual > 0) setPasoActual(p => p - 1);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{session.rol === 'cliente' ? 'Mis Trámites' : 'Hojas de Ruta por Trámite'}</div>
        <div className="page-subtitle">{session.rol === 'cliente' ? 'Consulta el avance de tus gestiones de construcción' : 'Seguimiento de requisitos y pasos predefinidos para cada gestión'}</div>
      </div>

      <div className="cotizacion-form-layout">
        <div>
          {clientTramitesList.map(t => {
            const tp = TRAMITES_TIPOS[t.tipo];
            const c = COLOR_MAP[tp.color];
            const bg = BG_MAP[tp.color];
            const pct2 = Math.round((t.pasoActual / tp.pasos.length) * 100);
            const isActive = selectedTramite.id === t.id;
            return (
              <div key={t.id} onClick={() => seleccionar(t)} style={{
                background: isActive ? bg : 'var(--surface)',
                border: `1px solid ${isActive ? c : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: 10,
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: isActive ? `0 0 0 2px ${c}22` : 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, fontWeight: 600, color: c }}>{t.id}</span>
                  <span className={`badge badge-${t.prioridad === 'alta' ? 'red' : t.prioridad === 'media' ? 'amber' : 'gray'}`} style={{ fontSize: 10 }}>
                    {t.prioridad}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{tp.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{getCliente(t.clienteId)?.nombre}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct2}%`, background: c }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>{t.pasoActual}/{tp.pasos.length} pasos · {pct2}%</div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{tipo.icono}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>{tipo.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Folio: {selectedTramite.folio}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <span className="badge badge-blue">{cli?.nombre}</span>
                {equipo && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: equipo.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700 }}>{equipo.avatar}</span>
                    {equipo.nombre}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: col, fontFamily: 'DM Mono' }}>{pct}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>completado</div>
            </div>
          </div>

          <div className="progress-bar" style={{ height: 8, marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: `${pct}%`, background: col, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 24 }}>Paso {pasoActual} de {tipo.pasos.length}</div>

          {selectedTramite.notas && (
            <div className="alert alert-amber" style={{ marginBottom: 20 }}>
              <Icon name="alert" size={14} style={{ flexShrink: 0 }} />
              <span>{selectedTramite.notes || selectedTramite.notas}</span>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            {tipo.pasos.map((paso, i) => {
              const idx = i + 1;
              const hecho = idx < pasoActual;
              const actual = idx === pasoActual;
              const pendiente = idx > pasoActual;
              return (
                <div key={i} className="roadmap-step">
                  <div className="step-num" style={{
                    background: hecho ? col : actual ? bgCol : 'var(--surface2)',
                    color: hecho ? '#fff' : actual ? col : 'var(--text-3)',
                    border: actual ? `2px solid ${col}` : '1px solid var(--border)',
                  }}>
                    {hecho ? <Icon name="check" size={11} /> : idx}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: actual ? 600 : 400,
                      color: pendiente ? 'var(--text-3)' : hecho ? 'var(--text-2)' : 'var(--text)',
                      textDecoration: hecho ? 'line-through' : 'none',
                    }}>
                      {paso}
                    </div>
                    {actual && <div style={{ fontSize: 11, color: col, fontWeight: 500, marginTop: 2 }}>← Paso actual</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {session.rol !== 'cliente' ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={retroceder} disabled={pasoActual === 0} style={{ opacity: pasoActual === 0 ? 0.4 : 1 }}>
                ← Paso anterior
              </button>
              <button className="btn btn-primary" onClick={avanzar} disabled={pasoActual >= tipo.pasos.length} style={{ opacity: pasoActual >= tipo.pasos.length ? 0.4 : 1 }}>
                {pasoActual >= tipo.pasos.length ? 'Trámite completado' : 'Siguiente paso →'}
              </button>
            </div>
          ) : (
            <div className="alert alert-green" style={{ display: 'flex', alignItems: 'center' }}>
              <Icon name="shield" size={14} style={{ marginRight: 6 }} />
              <span>El progreso de este trámite es actualizado por el gestor asignado.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default HojasRuta;

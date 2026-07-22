import React, { useState } from 'react';
import Swal from 'sweetalert2';
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
  const { session = {}, clientes = [], usuarios = [] } = useAppContext();

  const getCliente = (id) => (clientes || []).find(c => c?.id === id);

  const resolveUser = (id) => {
    if (!id) return null;
    const found = (usuarios || []).find(u => String(u?.id) === String(id) || u?.email === id || String(u?.idNumerico) === String(id));
    if (found) {
      return {
        id: found.id,
        nombre: found.nombre,
        avatar: found.avatar || (found.nombre ? found.nombre.slice(0, 2).toUpperCase() : 'U'),
        color: found.color || 'var(--blue)'
      };
    }
    const staffUser = (usuarios || []).find(u => u?.rol !== 'cliente');
    if (staffUser) {
      return {
        id: staffUser.id,
        nombre: staffUser.nombre,
        avatar: staffUser.avatar || (staffUser.nombre ? staffUser.nombre.slice(0, 2).toUpperCase() : 'U'),
        color: staffUser.color || 'var(--blue)'
      };
    }
    const mockFound = EQUIPO.find(e => String(e?.id) === String(id));
    if (mockFound) return mockFound;
    return { id, nombre: 'Gestor Asignado', avatar: 'GA', color: 'var(--blue)' };
  };

  const isClient = session?.rol === 'cliente';
  const initialList = isClient
    ? TRAMITES_MOCK.filter(t => t?.clienteId === session?.clienteId)
    : TRAMITES_MOCK;

  const [tramitesList, setTramitesList] = useState(initialList);
  const [selectedTramite, setSelectedTramite] = useState(initialList[0] || null);
  const [pasoActual, setPasoActual] = useState(initialList[0]?.pasoActual || 1);

  const seleccionar = (t) => {
    setSelectedTramite(t);
    setPasoActual(t?.pasoActual || 1);
  };

  if (!selectedTramite) {
    return (
      <div>
        <div className="page-header">
          <div className="page-title">{isClient ? 'Mis Trámites' : 'Hojas de Ruta por Trámite'}</div>
          <div className="page-subtitle">{isClient ? 'No tienes ningún trámite en proceso actualmente.' : 'Seguimiento de requisitos y pasos predefinidos para cada gestión'}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
          <Icon name="map" size={32} style={{ opacity: 0.5, marginBottom: 12 }} />
          <div>No hay hojas de ruta disponibles en este momento.</div>
        </div>
      </div>
    );
  }

  const tipo = TRAMITES_TIPOS[selectedTramite?.tipo] || TRAMITES_TIPOS['licencia-const'] || { nombre: 'Trámite', color: 'blue', icono: '📋', pasos: [] };
  const col = COLOR_MAP[tipo?.color] || '#1A5276';
  const bgCol = BG_MAP[tipo?.color] || '#EAF2F8';
  const cli = getCliente(selectedTramite?.clienteId);
  const equipo = resolveUser(selectedTramite?.asignadoA);
  const pasosList = tipo?.pasos || [];
  const totalPasos = pasosList.length || 1;

  const isCompletado = pasoActual > totalPasos;
  const pct = isCompletado
    ? 100
    : Math.min(100, Math.round(((pasoActual - 1) / totalPasos) * 100));

  const avanzar = () => {
    if (pasoActual <= totalPasos) {
      const nuevoPaso = pasoActual + 1;
      setPasoActual(nuevoPaso);
      setSelectedTramite(prev => ({ ...prev, pasoActual: nuevoPaso }));
      setTramitesList(prev => prev.map(t => t.id === selectedTramite.id ? { ...t, pasoActual: nuevoPaso } : t));

      if (nuevoPaso > totalPasos) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: '🎉 ¡Trámite completado al 100%!',
          showConfirmButton: false,
          timer: 2000,
          background: 'var(--surface)',
          color: 'var(--text)'
        });
      }
    }
  };

  const retroceder = () => {
    if (pasoActual > 1) {
      const nuevoPaso = pasoActual - 1;
      setPasoActual(nuevoPaso);
      setSelectedTramite(prev => ({ ...prev, pasoActual: nuevoPaso }));
      setTramitesList(prev => prev.map(t => t.id === selectedTramite.id ? { ...t, pasoActual: nuevoPaso } : t));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{isClient ? 'Mis Trámites' : 'Hojas de Ruta por Trámite'}</div>
        <div className="page-subtitle">{isClient ? 'Consulta el avance de tus gestiones de construcción' : 'Seguimiento de requisitos y pasos predefinidos para cada gestión'}</div>
      </div>

      <div className="cotizacion-form-layout">
        <div>
          {tramitesList.map(t => {
            const tp = TRAMITES_TIPOS[t?.tipo] || TRAMITES_TIPOS['licencia-const'] || { nombre: 'Trámite', color: 'blue', pasos: [] };
            const c = COLOR_MAP[tp?.color] || '#1A5276';
            const bg = BG_MAP[tp?.color] || '#EAF2F8';
            const tPasosLen = tp?.pasos?.length || 1;
            const tPaso = t?.pasoActual || 1;
            const tCompletado = tPaso > tPasosLen;
            const pct2 = tCompletado ? 100 : Math.min(100, Math.round(((tPaso - 1) / tPasosLen) * 100));
            const isActive = selectedTramite?.id === t?.id;
            return (
              <div key={t?.id || Math.random()} onClick={() => seleccionar(t)} style={{
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
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, fontWeight: 600, color: c }}>{t?.id}</span>
                  <span className={`badge badge-${tCompletado ? 'green' : t?.prioridad === 'alta' ? 'red' : t?.prioridad === 'media' ? 'amber' : 'gray'}`} style={{ fontSize: 10 }}>
                    {tCompletado ? 'completado' : t?.prioridad || 'media'}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{tp?.nombre || 'Gestión'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{getCliente(t?.clienteId)?.nombre || 'Sin cliente'}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct2}%`, background: c }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                  {tCompletado ? `${tPasosLen}/${tPasosLen} pasos · 100%` : `${Math.min(tPaso, tPasosLen)}/${tPasosLen} pasos · ${pct2}%`}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{tipo?.icono || '📋'}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>{tipo?.nombre || 'Trámite'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Folio: {selectedTramite?.folio || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <span className="badge badge-blue">{cli?.nombre || 'Cliente General'}</span>
                {equipo && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: equipo.color || 'var(--blue)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700 }}>{equipo.avatar || 'U'}</span>
                    {equipo.nombre}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: isCompletado ? 'var(--green)' : col, fontFamily: 'DM Mono' }}>{pct}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{isCompletado ? 'completado' : 'avance global'}</div>
            </div>
          </div>

          <div className="progress-bar" style={{ height: 8, marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: `${pct}%`, background: isCompletado ? 'var(--green)' : col, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 20 }}>
            {isCompletado ? `Todos los ${totalPasos} pasos han sido completados` : `Paso ${Math.min(pasoActual, totalPasos)} de ${totalPasos}`}
          </div>

          {(selectedTramite?.notas || selectedTramite?.notes) && (
            <div className="alert alert-amber" style={{ marginBottom: 20 }}>
              <Icon name="alert" size={14} style={{ flexShrink: 0 }} />
              <span>{selectedTramite.notes || selectedTramite.notas}</span>
            </div>
          )}

          {isCompletado && (
            <div className="alert alert-green" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="check" size={16} />
              <span><strong>¡Trámite Finalizado!</strong> Todas las gestiones e inspecciones han sido aprobadas exitosamente.</span>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            {pasosList.map((paso, i) => {
              const idx = i + 1;
              const hecho = isCompletado || idx < pasoActual;
              const actual = !isCompletado && idx === pasoActual;
              const pendiente = !isCompletado && idx > pasoActual;
              return (
                <div key={i} className="roadmap-step" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div className="step-num" style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    background: hecho ? (isCompletado ? 'var(--green)' : col) : actual ? bgCol : 'var(--surface2)',
                    color: hecho ? '#fff' : actual ? col : 'var(--text-3)',
                    border: actual ? `2px solid ${col}` : '1px solid var(--border)',
                    flexShrink: 0
                  }}>
                    {hecho ? <Icon name="check" size={12} /> : idx}
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
                    {actual && <div style={{ fontSize: 11, color: col, fontWeight: 600, marginTop: 2 }}>← Paso actual en proceso</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {!isClient ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={retroceder}
                disabled={pasoActual <= 1}
                style={{ opacity: pasoActual <= 1 ? 0.4 : 1 }}
              >
                ← Paso anterior
              </button>

              {isCompletado ? (
                <button
                  className="btn"
                  disabled
                  style={{
                    background: 'var(--green)',
                    color: '#fff',
                    border: 'none',
                    opacity: 1,
                    cursor: 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Icon name="check" size={14} /> Trámite Completado (100%)
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={avanzar}
                  style={{
                    background: pasoActual === totalPasos ? 'var(--green)' : undefined,
                    borderColor: pasoActual === totalPasos ? 'var(--green)' : undefined,
                  }}
                >
                  {pasoActual === totalPasos ? '✔ Finalizar y Marcar Completado' : 'Siguiente paso →'}
                </button>
              )}
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

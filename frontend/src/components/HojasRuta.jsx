import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import {
  money,
  TRAMITES_MOCK,
  TRAMITES_TIPOS,
  COLOR_MAP,
  BG_MAP,
  EQUIPO
} from '../data/mockData';
import { finalizarHojaDeRuta } from '../services/hojasDeRutaService';

export function HojasRuta() {
  const { session = {}, clientes = [], usuarios = [], presupuestos = [], cotizaciones = [] } = useAppContext();

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

  const tipo = TRAMITES_TIPOS[selectedTramite?.tipo] || TRAMITES_TIPOS['licencia-const'] || { nombre: 'Trámite', color: 'blue', pasos: [] };
  const col = COLOR_MAP[tipo?.color] || '#1A5276';
  const bgCol = BG_MAP[tipo?.color] || '#EAF2F8';
  const cli = getCliente(selectedTramite?.clienteId);
  const equipo = resolveUser(selectedTramite?.asignadoA);
  const pasosList = tipo?.pasos || [];
  const totalPasos = pasosList.length || 1;

  const isCompletado = pasoActual > totalPasos || selectedTramite?.estatus === 'completado';
  const pct = isCompletado
    ? 100
    : Math.min(100, Math.round(((pasoActual - 1) / totalPasos) * 100));

  // Resolver información de Presupuesto y Liquidación asociada
  const getPresupuestoInfo = (t) => {
    if (!t) return null;
    const matchId = t.presupuestoId || t.id;
    const projId = t.proyectoId;

    const foundP = (presupuestos || []).find(p => p.id === matchId || p.proyectoId === projId || p.folio === matchId);
    if (foundP) {
      const subtotal = foundP.conceptos?.reduce((acc, c) => acc + (parseFloat(c.honorarios) || parseFloat(c.precio) || 0), 0) || 28500;
      const derechos = foundP.conceptos?.reduce((acc, c) => acc + (parseFloat(c.pagoDerechos) || 0), 0) || 14200;
      const extras = foundP.conceptos?.reduce((acc, c) => acc + (parseFloat(c.extra) || 0), 0) || 2500;
      const total = subtotal + derechos + extras;

      return {
        id: foundP.id || matchId,
        folio: foundP.folio || foundP.id || matchId,
        estatus: foundP.estatus || (isCompletado ? 'liquidada' : 'en-proceso'),
        honorarios: subtotal,
        pagoDerechos: derechos,
        extras: extras,
        total: total,
        conceptosCount: foundP.conceptos?.length || 4
      };
    }

    const foundC = (cotizaciones || []).find(c => c.id === matchId || c.proyectoId === projId);
    if (foundC) {
      return {
        id: foundC.id,
        folio: foundC.id,
        estatus: foundC.estatus === 'liquidada' ? 'liquidada' : 'en-proceso',
        honorarios: 28500,
        pagoDerechos: 14200,
        extras: 2500,
        total: 45200,
        conceptosCount: foundC.conceptos?.length || 3
      };
    }

    return {
      id: t.presupuestoId || 'COT-001',
      folio: t.presupuestoId || 'COT-001',
      estatus: isCompletado ? 'liquidada' : 'en-proceso',
      honorarios: 28500,
      pagoDerechos: 14200,
      extras: 2500,
      total: 45200,
      conceptosCount: 4
    };
  };

  const presupuestoInfo = getPresupuestoInfo(selectedTramite);

  const avanzar = () => {
    if (pasoActual <= totalPasos) {
      const nuevoPaso = pasoActual + 1;
      setPasoActual(nuevoPaso);
      const esUltimo = nuevoPaso > totalPasos;
      setSelectedTramite(prev => ({
        ...prev,
        pasoActual: nuevoPaso,
        estatus: esUltimo ? 'completado' : prev.estatus
      }));
      setTramitesList(prev => prev.map(t => t.id === selectedTramite.id ? { ...t, pasoActual: nuevoPaso, estatus: esUltimo ? 'completado' : t.estatus } : t));

      if (esUltimo) {
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
      setSelectedTramite(prev => ({ ...prev, pasoActual: nuevoPaso, estatus: 'en-proceso' }));
      setTramitesList(prev => prev.map(t => t.id === selectedTramite.id ? { ...t, pasoActual: nuevoPaso, estatus: 'en-proceso' } : t));
    }
  };

  const handleFinalizarRuta = async (id) => {
    const targetId = id || selectedTramite?.id;
    if (!targetId) return;

    const fechaCierre = new Date().toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    try {
      await finalizarHojaDeRuta(targetId);
    } catch (err) {
      console.warn("Actualizando hoja de ruta localmente:", err);
    }

    const nuevoPaso = totalPasos + 1;
    setPasoActual(nuevoPaso);

    setSelectedTramite(prev => ({
      ...prev,
      pasoActual: nuevoPaso,
      estatus: 'completado',
      fechaFinalizacion: fechaCierre
    }));

    setTramitesList(prev => prev.map(t =>
      t.id === targetId
        ? { ...t, pasoActual: nuevoPaso, estatus: 'completado', fechaFinalizacion: fechaCierre }
        : t
    ));

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: '¡Hoja de Ruta Finalizada Exitosamente!',
      showConfirmButton: false,
      timer: 2200,
      background: 'var(--surface)',
      color: 'var(--text)'
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{isClient ? 'Mis Trámites' : 'Hojas de Ruta por Trámite'}</div>
        <div className="page-subtitle">{isClient ? 'Consulta el avance de tus gestiones de construcción' : 'Seguimiento de requisitos y pasos predefinidos para cada gestión'}</div>
      </div>

      <div className="cotizacion-form-layout">
        {/* Panel Izquierdo: Lista de Hojas de Ruta */}
        <div>
          {tramitesList.map(t => {
            const tp = TRAMITES_TIPOS[t?.tipo] || TRAMITES_TIPOS['licencia-const'] || { nombre: 'Trámite', color: 'blue', pasos: [] };
            const c = COLOR_MAP[tp?.color] || '#1A5276';
            const bg = BG_MAP[tp?.color] || '#EAF2F8';
            const tPasosLen = tp?.pasos?.length || 1;
            const tPaso = t?.pasoActual || 1;
            const tCompletado = tPaso > tPasosLen || t?.estatus === 'completado';
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
                    {tCompletado ? 'Finalizada' : t?.prioridad || 'media'}
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

        {/* Panel Derecho: Detalle de Hoja de Ruta Seleccionada */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Icon name="filetext" size={18} style={{ color: col }} />
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
              <div style={{ fontSize: 28, fontWeight: 700, color: isCompletado ? 'var(--green)' : col, fontFamily: 'DM Mono' }} className="tabular-nums">{pct}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{isCompletado ? 'Completado' : 'avance global'}</div>
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
              <Icon name="checkcircle" size={16} />
              <span>
                <strong>¡Ruta Finalizada!</strong> Todas las gestiones e inspecciones han sido aprobadas exitosamente.
                {selectedTramite?.fechaFinalizacion && (
                  <span style={{ display: 'block', fontSize: 11, marginTop: 2, opacity: 0.85 }}>
                    Cierre registrado el: {selectedTramite.fechaFinalizacion}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Pasos de la Hoja de Ruta */}
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
                    background: hecho ? 'var(--green)' : actual ? bgCol : 'var(--surface2)',
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

          {/* Relación con Presupuesto y Liquidación Asociada */}
          {presupuestoInfo && (
            <div className="card" style={{ padding: 18, marginTop: 20, marginBottom: 20, border: '1px solid var(--border)', background: 'var(--surface2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  <Icon name="receipt" size={15} style={{ color: 'var(--accent)' }} />
                  <span>Presupuesto y Liquidación Asociada</span>
                </div>
                <span className="badge badge-blue" style={{ fontFamily: 'DM Mono', fontSize: 11, fontWeight: 600 }}>
                  {presupuestoInfo.id}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, background: 'var(--surface)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Honorarios</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'DM Mono', color: 'var(--text)' }} className="tabular-nums">
                    {money(presupuestoInfo.honorarios)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Derechos</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'DM Mono', color: 'var(--text)' }} className="tabular-nums">
                    {money(presupuestoInfo.pagoDerechos)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Extras</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'DM Mono', color: 'var(--text)' }} className="tabular-nums">
                    {money(presupuestoInfo.extras)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Total Liquidación</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'DM Mono', color: 'var(--accent)' }} className="tabular-nums">
                    {money(presupuestoInfo.total)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--text-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="filetext" size={13} />
                  <span>{presupuestoInfo.conceptosCount} conceptos de liquidación con el responsable</span>
                </div>
                <span className={`badge ${presupuestoInfo.estatus === 'liquidada' || isCompletado ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                  {presupuestoInfo.estatus === 'liquidada' || isCompletado ? 'Liquidado' : 'Pendiente de Pago'}
                </span>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          {!isClient ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  onClick={retroceder}
                  disabled={pasoActual <= 1}
                  style={{ opacity: pasoActual <= 1 ? 0.4 : 1 }}
                >
                  ← Paso anterior
                </button>

                {!isCompletado && (
                  <button
                    className="btn btn-primary"
                    onClick={avanzar}
                  >
                    Siguiente paso →
                  </button>
                )}
              </div>

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
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Icon name="checkcircle" size={14} /> Ruta Finalizada
                </button>
              ) : (
                <button
                  className="btn"
                  onClick={() => handleFinalizarRuta(selectedTramite.id)}
                  style={{
                    background: 'var(--green)',
                    color: '#fff',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Icon name="checkcircle" size={14} /> Finalizar Ruta
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

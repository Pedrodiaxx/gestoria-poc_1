import React, { useState, useEffect } from 'react';
import { Icon } from './common/Icon';
import { EQUIPO, TRAMITES_MOCK, TRAMITES_TIPOS } from '../data/mockData';
import { useAppContext } from '../core/context';
import { useTareas } from '../hooks/useTareas';

const hoy = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const todayStr = fmt(hoy);

const resolveUser = (id, usuariosList = []) => {
  if (!id) return null;
  const found = (usuariosList || []).find(u =>
    String(u?.id) === String(id) ||
    u?.email === id ||
    String(u?.idNumerico) === String(id) ||
    (u?.nombre && u.nombre.toLowerCase() === id.toLowerCase())
  );
  if (found) {
    return {
      id: found.id,
      nombre: found.nombre,
      avatar: found.avatar || (found.nombre ? found.nombre.slice(0, 2).toUpperCase() : 'U'),
      color: found.color || 'var(--accent)'
    };
  }
  const staffUser = (usuariosList || []).find(u => u?.rol !== 'cliente');
  if (staffUser) {
    return {
      id: staffUser.id,
      nombre: id !== 'Responsable' ? id : staffUser.nombre,
      avatar: id !== 'Responsable' ? id.slice(0, 2).toUpperCase() : (staffUser.avatar || 'GA'),
      color: staffUser.color || 'var(--accent)'
    };
  }
  const mockFound = EQUIPO.find(e => String(e?.id) === String(id));
  if (mockFound) return mockFound;
  return { id, nombre: id || 'Gestor Asignado', avatar: (id || 'GA').slice(0, 2).toUpperCase(), color: 'var(--accent)' };
};

const getTeamMembers = (usuariosList = []) => {
  const staff = (usuariosList || []).filter(u => u?.rol !== 'cliente');
  if (staff.length > 0) return staff;
  return (usuariosList && usuariosList.length > 0) ? usuariosList : EQUIPO;
};

// ──────────────────────────────────────────────────────────────────────
// VISTA PLANNER: Acordeones por Proyecto con checklist por Etapa (GIU Style)
// ──────────────────────────────────────────────────────────────────────
function PlannerView({ tareas, proyectos, usuarios, actualizarTarea, setTareas }) {
  const [expanded, setExpanded] = useState({});

  // Agrupar tareas por proyectoId
  const grupos = React.useMemo(() => {
    const map = {};
    (tareas || []).forEach(t => {
      const key = t.proyectoId || t.ProyectoId || 'sin-proyecto';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [tareas]);

  // Auto-expandir todos los grupos por defecto
  useEffect(() => {
    const initialExpanded = {};
    grupos.forEach(([key]) => {
      initialExpanded[key] = true;
    });
    setExpanded(prev => ({ ...initialExpanded, ...prev }));
  }, [grupos.length]);

  const resolveProyectoInfo = (proyectoId) => {
    if (!proyectoId || proyectoId === 'sin-proyecto') {
      return { id: 'Sin Proyecto', nombre: 'Tareas Generales' };
    }
    const proy = (proyectos || []).find(p =>
      `PRY-${String(p.id).padStart(3, '0')}` === proyectoId ||
      String(p.id) === String(proyectoId) ||
      p.folio === proyectoId
    );
    if (proy) {
      return {
        id: proyectoId.startsWith('PRY-') ? proyectoId : `PRY-${String(proy.id).padStart(3, '0')}`,
        nombre: proy.nombre || proy.Nombre || 'Proyecto de Gestión'
      };
    }
    return { id: proyectoId, nombre: 'Proyecto de Gestión' };
  };

  const toggle = async (tarea) => {
    const updatedTask = {
      id: tarea.id,
      titulo: tarea.titulo,
      prioridad: tarea.prioridad || 'media',
      hecho: !tarea.hecho,
      fecha: tarea.fecha ? new Date(tarea.fecha).toISOString() : new Date().toISOString(),
      asignadoA: tarea.asignadoA || 'Responsable',
      etapa: tarea.etapa || '',
      presupuestoId: tarea.presupuestoId || null,
      proyectoId: tarea.proyectoId || ''
    };

    // Optimistic update
    setTareas(prev => prev.map(t => t.id === tarea.id ? { ...t, hecho: !t.hecho, completada: !t.hecho } : t));

    try {
      await actualizarTarea(tarea.id, updatedTask);
    } catch {
      // Revert
      setTareas(prev => prev.map(t => t.id === tarea.id ? { ...t, hecho: !t.hecho, completada: !t.hecho } : t));
    }
  };

  if (grupos.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
        <Icon name="task" size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>No hay tareas en el Planner</div>
        <div style={{ fontSize: 13, marginTop: 6, color: 'var(--text-2)', maxWidth: 440, margin: '6px auto 0' }}>
          Aprueba un Presupuesto para generar automáticamente las tareas operativas vinculadas al Proyecto.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {grupos.map(([proyectoId, tareasGrupo]) => {
        const totalTareas = tareasGrupo.length;
        const completadas = tareasGrupo.filter(t => t.hecho || t.completada).length;
        const pct = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;
        const isExpanded = !!expanded[proyectoId];

        // Sub-agrupar por etapa dentro del proyecto
        const etapas = {};
        tareasGrupo.forEach(t => {
          const etapa = t.etapa || t.Etapa || 'General';
          if (!etapas[etapa]) etapas[etapa] = [];
          etapas[etapa].push(t);
        });

        const proyInfo = resolveProyectoInfo(proyectoId);

        return (
          <div key={proyectoId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header del Proyecto */}
            <div
              onClick={() => setExpanded(prev => ({ ...prev, [proyectoId]: !prev[proyectoId] }))}
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                cursor: 'pointer',
                background: 'var(--surface)',
                borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s ease',
                flexWrap: 'wrap'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              {/* Left: Chevron + Project Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, flex: 1 }}>
                <div style={{
                  color: 'var(--text-3)',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                }}>
                  <Icon name="chevronright" size={14} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className={proyInfo.id === 'Sin Proyecto' ? 'badge badge-gray' : 'badge badge-green'}>
                      {proyInfo.id}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                      {proyInfo.nombre}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                    {completadas} de {totalTareas} tareas completadas
                  </div>
                </div>
              </div>

              {/* Right: Progress Bar GIU */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div className="progress-bar" style={{ width: 120 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: pct === 100 ? 'var(--accent)' : 'var(--accent)'
                    }}
                  />
                </div>
                <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 600, color: pct === 100 ? 'var(--accent)' : 'var(--text)', minWidth: 36, textAlign: 'right' }}>
                  {pct}%
                </span>
              </div>
            </div>

            {/* Contenido expandido: Secciones por Etapa */}
            {isExpanded && (
              <div>
                {Object.entries(etapas).map(([etapa, items], idx) => {
                  const completadasEtapa = items.filter(t => t.hecho || t.completada).length;
                  const totalEtapa = items.length;

                  return (
                    <div key={etapa} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                      {/* Encabezado de Etapa */}
                      <div style={{
                        background: 'var(--surface2)',
                        borderBottom: '1px solid var(--border)',
                        padding: '8px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-2)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.6px'
                        }}>
                          {etapa}
                        </span>
                        <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>
                          {completadasEtapa}/{totalEtapa}
                        </span>
                      </div>

                      {/* Lista de Filas */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {items.map((t, tIdx) => {
                          const hecho = t.hecho || t.completada;
                          const gestor = resolveUser(t.asignadoA, usuarios);

                          return (
                            <div
                              key={t.id}
                              onClick={() => toggle(t)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 16,
                                padding: '11px 20px',
                                minHeight: 46,
                                background: 'var(--surface)',
                                borderBottom: tIdx < items.length - 1 ? '1px solid var(--border)' : 'none',
                                transition: 'background 0.15s ease',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}
                            >
                              {/* Left: Checkmark + Título */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    border: `2px solid ${hecho ? 'var(--accent)' : 'var(--border-strong)'}`,
                                    background: hecho ? 'var(--accent)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {hecho && <Icon name="check" size={10} style={{ color: '#FFFFFF' }} />}
                                </div>

                                <span style={{
                                  fontSize: 13.5,
                                  fontWeight: 500,
                                  color: hecho ? 'var(--text-3)' : 'var(--text)',
                                  textDecoration: hecho ? 'line-through' : 'none',
                                  lineHeight: 1.35,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {t.titulo}
                                </span>
                              </div>

                              {/* Right: Fecha + Responsable */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                                {t.fecha && (
                                  <span className="tabular-nums" style={{
                                    fontSize: 12,
                                    color: t.fecha < todayStr && !hecho ? 'var(--red)' : 'var(--text-3)',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {t.fecha}
                                  </span>
                                )}

                                {gestor && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 110, justifyContent: 'flex-end' }}>
                                    <span style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      background: gestor.color || 'var(--accent)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#FFFFFF',
                                      fontSize: 9,
                                      fontWeight: 700,
                                      flexShrink: 0
                                    }}>
                                      {(gestor.avatar || 'GA').slice(0, 2)}
                                    </span>
                                    <span style={{
                                      fontSize: 12,
                                      color: 'var(--text-2)',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: 120
                                    }}>
                                      {gestor.nombre}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────────────────────────────
export default function TareasDiarias() {
  const { tareas = [], setTareas, usuarios = [], proyectos = [] } = useAppContext();
  const teamMembers = getTeamMembers(usuarios);

  // Tabs: planner | diarias
  const [activeTab, setActiveTab] = useState('planner');
  const [filtroUser, setFiltroUser] = useState('todos');
  const [showNueva, setShowNueva] = useState(false);
  const [nueva, setNueva] = useState({
    titulo: '', tramiteId: 'TRM-001',
    asignadoA: teamMembers[0]?.id || 'u1',
    prioridad: 'media', fecha: fmt(hoy)
  });

  useEffect(() => {
    localStorage.removeItem('tarea_draft');
    localStorage.removeItem('giu_tarea_en_progreso');
  }, []);

  const { crearTarea, actualizarTarea } = useTareas(setTareas);

  const toggle = async (id) => {
    const task = tareas.find(t => t.id === id);
    if (!task) return;
    const updatedTask = {
      id: task.id, titulo: task.titulo, prioridad: task.prioridad,
      hecho: !task.hecho,
      fecha: task.fecha ? new Date(task.fecha).toISOString() : new Date().toISOString(),
      asignadoA: task.asignadoA,
      etapa: task.etapa || '',
      presupuestoId: task.presupuestoId || null,
      proyectoId: task.proyectoId || ''
    };
    setTareas(prev => prev.map(t => t.id === id ? { ...t, completada: !t.completada, hecho: !t.hecho } : t));
    try {
      await actualizarTarea(id, updatedTask);
    } catch {
      setTareas(prev => prev.map(t => t.id === id ? { ...t, completada: !t.completada, hecho: !t.hecho } : t));
    }
  };

  const filtered = tareas.filter(t => filtroUser === 'todos' || String(t.asignadoA) === String(filtroUser));
  const col1 = filtered.filter(t => t.columna === 'hoy');
  const col2 = filtered.filter(t => t.columna === 'completada' || t.completada || t.hecho);
  const col3 = filtered.filter(t => t.columna === 'atrasada' && !t.completada && !t.hecho);

  const guardarNueva = async () => {
    if (!nueva.titulo) return;
    const datosParaBackend = {
      titulo: nueva.titulo, prioridad: nueva.prioridad || 'media', hecho: false,
      fecha: nueva.fecha ? new Date(nueva.fecha).toISOString() : new Date().toISOString(),
      asignadoA: nueva.asignadoA || teamMembers[0]?.id || 'u1'
    };
    try {
      const creada = await crearTarea(datosParaBackend);
      setTareas(prev => [...prev, creada]);
      setShowNueva(false);
      setNueva({ titulo: '', tramiteId: 'TRM-001', asignadoA: teamMembers[0]?.id || 'u1', prioridad: 'media', fecha: fmt(hoy) });
    } catch {
      alert('No se pudo conectar con el servidor backend.');
    }
  };

  const PrioColors = { alta: 'badge-red', media: 'badge-amber', baja: 'badge-gray' };

  const TCard = ({ t }) => {
    const eq = resolveUser(t.asignadoA, usuarios);
    return (
      <div className="task-card" onClick={() => toggle(t.id)} style={{ opacity: t.hecho ? 0.65 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            border: `2px solid ${t.hecho ? 'var(--accent)' : 'var(--border-strong)'}`,
            background: t.hecho ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1
          }}>
            {t.hecho && <Icon name="check" size={10} style={{ color: '#fff' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div className="task-card-title" style={{ textDecoration: t.hecho ? 'line-through' : 'none' }}>
              {t.titulo}
            </div>
            <div className="task-card-meta" style={{ flexWrap: 'wrap', gap: 6 }}>
              <span className={`badge ${PrioColors[t.prioridad] || 'badge-gray'}`} style={{ fontSize: 10 }}>
                {t.prioridad}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                {t.tramiteId || t.proyectoId}
              </span>
              {eq && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: eq.color || 'var(--blue)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 700 }}>
                    {eq.avatar || 'U'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{eq.nombre}</span>
                </span>
              )}
              {t.fecha && t.fecha !== todayStr && !t.hecho && (
                <span style={{ fontSize: 11, color: t.fecha < todayStr ? 'var(--red)' : 'var(--text-3)', fontWeight: 500 }}>
                  vence: {t.fecha}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="module-container">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Tareas del Equipo</div>
          <div className="page-subtitle">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {activeTab === 'diarias' && (
            <select className="form-control" style={{ width: 'auto' }} value={filtroUser} onChange={e => setFiltroUser(e.target.value)}>
              <option value="todos">Todo el equipo</option>
              {teamMembers.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          )}
          <button className="btn btn-primary" onClick={() => setShowNueva(true)}>
            <Icon name="plus" size={14} /> Nueva Tarea
          </button>
        </div>
      </div>

      {/* Tabs nativos de GIU */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
          onClick={() => setActiveTab('planner')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="check" size={13} />
          Planner (Por Proyecto)
          <span className="badge badge-green" style={{ fontSize: 10, padding: '1px 6px' }}>
            {tareas.length}
          </span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'diarias' ? 'active' : ''}`}
          onClick={() => setActiveTab('diarias')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="clock" size={13} />
          Tablero Diario (Kanban)
        </button>
      </div>

      {/* VISTA PLANNER */}
      {activeTab === 'planner' && (
        <PlannerView
          tareas={tareas}
          proyectos={proyectos}
          usuarios={usuarios}
          actualizarTarea={actualizarTarea}
          setTareas={setTareas}
        />
      )}

      {/* VISTA DIARIAS (Kanban) */}
      {activeTab === 'diarias' && (
        <div className="three-col">
          <div className="task-col">
            <div className="task-col-header">
              <div className="task-col-title" style={{ color: 'var(--blue)' }}>
                <Icon name="clock" size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Para Hoy
              </div>
              <span className="task-col-count" style={{ background: 'var(--blue-light)', color: 'var(--blue-text)' }}>{col1.length}</span>
            </div>
            {col1.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>Todo al día</div>}
            {col1.map(t => <TCard key={t.id} t={t} />)}
          </div>

          <div className="task-col">
            <div className="task-col-header">
              <div className="task-col-title" style={{ color: 'var(--accent)' }}>
                <Icon name="check" size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Ya se Hizo
              </div>
              <span className="task-col-count" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>{col2.length}</span>
            </div>
            {col2.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>Sin completadas aún</div>}
            {col2.map(t => <TCard key={t.id} t={t} />)}
          </div>

          <div className="task-col" style={{ borderColor: 'var(--red)' }}>
            <div className="task-col-header">
              <div className="task-col-title" style={{ color: 'var(--red)' }}>
                <Icon name="alert" size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Falta por Hacer
              </div>
              <span className="task-col-count" style={{ background: 'var(--red-light)', color: 'var(--red-text)' }}>{col3.length}</span>
            </div>
            {col3.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>Sin pendientes atrasados</div>}
            {col3.map(t => <TCard key={t.id} t={t} />)}
          </div>
        </div>
      )}

      {/* Modal: Nueva Tarea */}
      {showNueva && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNueva(false)}>
          <div className="modal">
            <div className="modal-title">Nueva Tarea</div>
            <div className="form-group">
              <label className="form-label">Descripción de la tarea</label>
              <input
                className="form-control"
                placeholder="Ej: Entregar expediente al Ayuntamiento"
                value={nueva.titulo}
                onChange={e => setNueva(n => ({ ...n, titulo: e.target.value }))}
              />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Trámite relacionado</label>
                <select className="form-control" value={nueva.tramiteId} onChange={e => setNueva(n => ({ ...n, tramiteId: e.target.value }))}>
                  {TRAMITES_MOCK.map(t => <option key={t.id} value={t.id}>{t.id} — {TRAMITES_TIPOS[t.tipo]?.nombre || t.tipo}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Asignar a</label>
                <select className="form-control" value={nueva.asignadoA} onChange={e => setNueva(n => ({ ...n, asignadoA: e.target.value }))}>
                  {teamMembers.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Prioridad</label>
                <select className="form-control" value={nueva.prioridad} onChange={e => setNueva(n => ({ ...n, prioridad: e.target.value }))}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha límite</label>
                <input className="form-control" type="date" value={nueva.fecha} onChange={e => setNueva(n => ({ ...n, fecha: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowNueva(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarNueva} disabled={!nueva.titulo} style={{ opacity: !nueva.titulo ? 0.5 : 1 }}>
                <Icon name="check" size={14} /> Agregar Tarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


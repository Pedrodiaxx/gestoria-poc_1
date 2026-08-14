import React, { useState, useEffect } from 'react';
import { Icon } from './common/Icon';
import { EQUIPO, TRAMITES_MOCK, TRAMITES_TIPOS } from '../data/mockData';
import { useAppContext } from '../core/context';
import { useTareas } from '../hooks/useTareas';

const hoy = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const todayStr = fmt(hoy);

const ETAPA_COLORS = {
  'uso de suelo':          { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  'licencia de construcción': { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
  'fin de obra':           { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  'funcionamiento':        { bg: '#FAF5FF', border: '#E9D5FF', text: '#7E22CE' },
  'general':               { bg: '#F4F4F5', border: '#D4D4D8', text: '#52525B' },
};

const getEtapaStyle = (etapa = '') => {
  const key = etapa.toLowerCase().trim();
  return ETAPA_COLORS[key] || ETAPA_COLORS['general'];
};

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
      color: found.color || '#2A5F3F'
    };
  }
  const staffUser = (usuariosList || []).find(u => u?.rol !== 'cliente');
  if (staffUser) {
    return {
      id: staffUser.id,
      nombre: id !== 'Responsable' ? id : staffUser.nombre,
      avatar: id !== 'Responsable' ? id.slice(0, 2).toUpperCase() : (staffUser.avatar || 'GA'),
      color: staffUser.color || '#2A5F3F'
    };
  }
  const mockFound = EQUIPO.find(e => String(e?.id) === String(id));
  if (mockFound) return mockFound;
  return { id, nombre: id || 'Gestor Asignado', avatar: (id || 'GA').slice(0, 2).toUpperCase(), color: '#2A5F3F' };
};

const getTeamMembers = (usuariosList = []) => {
  const staff = (usuariosList || []).filter(u => u?.rol !== 'cliente');
  if (staff.length > 0) return staff;
  return (usuariosList && usuariosList.length > 0) ? usuariosList : EQUIPO;
};

// ──────────────────────────────────────────────────────────────────────
// VISTA PLANNER: Acordeones por Proyecto con checklist por Etapa
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

  const resolveProyectoNombre = (proyectoId) => {
    if (!proyectoId || proyectoId === 'sin-proyecto') return 'Sin Proyecto Asignado';
    const proy = (proyectos || []).find(p =>
      `PRY-${String(p.id).padStart(3, '0')}` === proyectoId ||
      String(p.id) === proyectoId ||
      p.folio === proyectoId
    );
    if (proy) return `${proyectoId} — ${proy.nombre || proy.Nombre || ''}`;
    return proyectoId;
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
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>✓</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>No hay tareas en el Planner</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          Aprueba un Presupuesto para generar automáticamente las tareas operativas vinculadas al Proyecto.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

        const nombreProyecto = resolveProyectoNombre(proyectoId);

        return (
          <div
            key={proyectoId}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E4E4E7',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.15s ease'
            }}
          >
            {/* Header del grupo */}
            <div
              onClick={() => setExpanded(prev => ({ ...prev, [proyectoId]: !prev[proyectoId] }))}
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                background: isExpanded ? '#FAFAFA' : '#FFFFFF',
                borderBottom: isExpanded ? '1px solid #F0F0F2' : 'none',
                transition: 'background 0.15s ease'
              }}
            >
              {/* Chevron */}
              <div style={{
                width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-3)', transition: 'transform 0.2s ease',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
              }}>
                <Icon name="chevronright" size={14} />
              </div>

              {/* Nombre del proyecto */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#18181B', lineHeight: 1.3 }}>
                  {nombreProyecto}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{completadas} de {totalTareas} conceptos completados</span>
                  <span style={{
                    background: pct === 100 ? '#D1FAE5' : pct > 50 ? '#FEF3C7' : '#FEE2E2',
                    color: pct === 100 ? '#065F46' : pct > 50 ? '#92400E' : '#991B1B',
                    padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700
                  }}>{pct}%</span>
                </div>
              </div>

              {/* Barra de progreso */}
              <div style={{ width: 100, flexShrink: 0 }}>
                <div style={{ height: 6, background: '#E4E4E7', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: pct === 100
                      ? 'linear-gradient(90deg, #10B981, #059669)'
                      : 'linear-gradient(90deg, #2A5F3F, #1E5631)',
                    borderRadius: 99,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>

              {/* Contador badge */}
              <div style={{
                background: '#F4F4F5', color: '#52525B',
                borderRadius: 99, fontSize: 11, fontWeight: 600,
                padding: '2px 10px', flexShrink: 0
              }}>
                {completadas}/{totalTareas}
              </div>
            </div>

            {/* Contenido expandido: etapas + conceptos */}
            {isExpanded && (
              <div style={{ padding: '8px 18px 14px' }}>
                {Object.entries(etapas).map(([etapa, items]) => {
                  const estilo = getEtapaStyle(etapa);
                  const completadasEtapa = items.filter(t => t.hecho || t.completada).length;

                  return (
                    <div key={etapa} style={{ marginTop: 14 }}>
                      {/* Header de etapa */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                        paddingBottom: 6, borderBottom: `1px solid ${estilo.border}`
                      }}>
                        <span style={{
                          background: estilo.bg, color: estilo.text, border: `1px solid ${estilo.border}`,
                          padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: 0.3
                        }}>
                          {etapa}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {completadasEtapa}/{items.length}
                        </span>
                      </div>

                      {/* Lista de conceptos */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {items.map(t => {
                          const hecho = t.hecho || t.completada;
                          const gestor = resolveUser(t.asignadoA, usuarios);

                          return (
                            <div
                              key={t.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 10px', borderRadius: 7,
                                background: hecho ? '#F9FAFB' : '#FFFFFF',
                                border: '1px solid',
                                borderColor: hecho ? '#E4E4E7' : '#EBEBEB',
                                transition: 'all 0.15s ease',
                                cursor: 'pointer',
                                opacity: hecho ? 0.75 : 1
                              }}
                              onClick={() => toggle(t)}
                            >
                              {/* Checkbox */}
                              <div style={{
                                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                border: `2px solid ${hecho ? '#10B981' : '#D4D4D8'}`,
                                background: hecho ? '#10B981' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s ease'
                              }}>
                                {hecho && <Icon name="check" size={11} style={{ color: '#fff' }} />}
                              </div>

                              {/* Título */}
                              <div style={{
                                flex: 1, fontSize: 13, fontWeight: 500, color: hecho ? '#71717A' : '#18181B',
                                textDecoration: hecho ? 'line-through' : 'none',
                                transition: 'color 0.2s ease'
                              }}>
                                {t.titulo}
                              </div>

                              {/* Gestor */}
                              {gestor && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                  <div style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: gestor.color || '#2A5F3F',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 9, fontWeight: 700
                                  }}>
                                    {(gestor.avatar || 'G').slice(0, 2)}
                                  </div>
                                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{gestor.nombre}</span>
                                </div>
                              )}

                              {/* Fecha */}
                              {t.fecha && (
                                <span style={{
                                  fontSize: 10, color: t.fecha < todayStr && !hecho ? '#EF4444' : 'var(--text-3)',
                                  fontFamily: 'DM Mono', flexShrink: 0
                                }}>
                                  {t.fecha}
                                </span>
                              )}
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
              <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--text-3)' }}>
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
    <div>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid #E4E4E7' }}>
        {[
          { key: 'planner', label: 'Planner (Por Proyecto)', icon: 'check' },
          { key: 'diarias', label: 'Tablero Diario (Kanban)', icon: 'clock' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? '#18181B' : 'var(--text-3)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #1E5631' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
              marginBottom: -1
            }}
          >
            <Icon name={tab.icon} size={13} />
            {tab.label}
            {tab.key === 'planner' && (
              <span style={{
                background: '#D1FAE5',
                color: '#065F46',
                fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99
              }}>
                {tareas.length}
              </span>
            )}
          </button>
        ))}
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

      {/* VISTA DIARIAS (Kanban original) */}
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

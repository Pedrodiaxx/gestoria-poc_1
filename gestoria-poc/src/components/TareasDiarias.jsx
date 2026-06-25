import React, { useState, useEffect } from 'react';
import { Icon } from './common/Icon';
import { EQUIPO, TRAMITES_MOCK, TRAMITES_TIPOS, TAREAS_MOCK } from '../data/mockData';

const hoy = new Date();
const fmt = (d) => d.toISOString().split('T')[0];

export default function TareasDiarias() {
  const [tareas, setTareas] = useState(() => {
    const saved = localStorage.getItem('giu_tareas');
    return saved ? JSON.parse(saved) : TAREAS_MOCK;
  });
  const [filtroUser, setFiltroUser] = useState('todos');
  const [showNueva, setShowNueva] = useState(false);
  const [nueva, setNueva] = useState({ titulo: '', tramiteId: 'TRM-001', asignadoA: 'u1', prioridad: 'media', fecha: fmt(hoy) });

  useEffect(() => {
    localStorage.setItem('giu_tareas', JSON.stringify(tareas));
  }, [tareas]);

  const toggle = (id) => setTareas(prev => prev.map(t => t.id === id ? { ...t, hecho: !t.hecho } : t));

  const filtered = tareas.filter(t => filtroUser === 'todos' || t.asignadoA === filtroUser);

  const todayStr = fmt(hoy);
  const col1 = filtered.filter(t => !t.hecho && t.fecha === todayStr);
  const col2 = filtered.filter(t => t.hecho);
  const col3 = filtered.filter(t => !t.hecho && t.fecha < todayStr);

  const guardarNueva = () => {
    if (!nueva.titulo) return;
    setTareas(prev => [...prev, { ...nueva, id: `t${Date.now()}`, hecho: false }]);
    setShowNueva(false);
    setNueva({ titulo: '', tramiteId: 'TRM-001', asignadoA: 'u1', prioridad: 'media', fecha: fmt(hoy) });
  };

  const PrioColors = { alta: 'badge-red', media: 'badge-amber', baja: 'badge-gray' };

  const TCard = ({ t }) => {
    const eq = EQUIPO.find(e => e.id === t.asignadoA);
    return (
      <div className="task-card" onClick={() => toggle(t.id)} style={{ opacity: t.hecho ? 0.65 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', border: `2px solid ${t.hecho ? 'var(--accent)' : 'var(--border-strong)'}`,
            background: t.hecho ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
          }}>
            {t.hecho && <Icon name="check" size={10} style={{ color: '#fff' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div className="task-card-title" style={{ textDecoration: t.hecho ? 'line-through' : 'none' }}>{t.titulo}</div>
            <div className="task-card-meta">
              <span className={`badge ${PrioColors[t.prioridad]}`} style={{ fontSize: 10 }}>{t.prioridad}</span>
              <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--text-3)' }}>{t.tramiteId}</span>
              {eq && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: eq.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 700 }}>{eq.avatar}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{eq.nombre}</span>
                </span>
              )}
              {t.fecha !== todayStr && !t.hecho && <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 500 }}>vence: {t.fecha}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Tareas Diarias del Equipo</div>
          <div className="page-subtitle">Organización diaria · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="form-control" style={{ width: 'auto' }} value={filtroUser} onChange={e => setFiltroUser(e.target.value)}>
            <option value="todos">Todo el equipo</option>
            {EQUIPO.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowNueva(true)}>
            <Icon name="plus" size={14} /> Nueva Tarea
          </button>
        </div>
      </div>

      <div className="three-col">
        <div className="task-col">
          <div className="task-col-header">
            <div className="task-col-title" style={{ color: 'var(--blue)' }}>
              <Icon name="clock" size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Para Hoy
            </div>
            <span className="task-col-count" style={{ background: 'var(--blue-light)', color: 'var(--blue-text)' }}>{col1.length}</span>
          </div>
          {col1.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>¡Todo al día! ✓</div>}
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

      {showNueva && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNueva(false)}>
          <div className="modal">
            <div className="modal-title">Nueva Tarea</div>
            <div className="form-group">
              <label className="form-label">Descripción de la tarea</label>
              <input className="form-control" placeholder="Ej: Entregar expediente al Ayuntamiento" value={nueva.titulo} onChange={e => setNueva(n => ({ ...n, titulo: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Trámite relacionado</label>
                <select className="form-control" value={nueva.tramiteId} onChange={e => setNueva(n => ({ ...n, tramiteId: e.target.value }))}>
                  {TRAMITES_MOCK.map(t => <option key={t.id} value={t.id}>{t.id} — {TRAMITES_TIPOS[t.tipo].nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Asignar a</label>
                <select className="form-control" value={nueva.asignadoA} onChange={e => setNueva(n => ({ ...n, asignadoA: e.target.value }))}>
                  {EQUIPO.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
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

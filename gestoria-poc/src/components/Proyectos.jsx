import React, { useState } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import {
  PROYECTOS_MOCK,
  TRAMITES_TIPOS,
  COLOR_MAP,
  BG_MAP,
  EQUIPO,
  money
} from '../data/mockData';

const ESTATUS_CONFIG = {
  'en-proceso': { label: 'En Proceso', color: '#1A5276', badge: 'badge-blue' },
  'completado':  { label: 'Completado', color: '#2A5F3F', badge: 'badge-green' },
  'pendiente':   { label: 'Pendiente', color: '#B87A0A', badge: 'badge-amber' },
  'pausado':     { label: 'Pausado', color: '#9C9A94', badge: 'badge-gray' },
};

export function Proyectos() {
  const { clientes, setActive } = useAppContext();
  const [q, setQ] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [vista, setVista] = useState('grid'); // 'grid' | 'lista'

  const getCliente = (id) => clientes.find(c => c.id === id);

  // Load from localStorage (added projects) + mock data
  const storedProyectos = (() => {
    try {
      const saved = localStorage.getItem('giu_proyectos');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  })();

  const allProyectos = [...PROYECTOS_MOCK, ...storedProyectos];

  const filtered = allProyectos.filter(p => {
    const cli = getCliente(p.clienteId);
    const matchQ = q === '' ||
      p.nombre.toLowerCase().includes(q.toLowerCase()) ||
      p.id.toLowerCase().includes(q.toLowerCase()) ||
      cli?.nombre.toLowerCase().includes(q.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(q.toLowerCase());
    const matchEstatus = filtroEstatus === 'todos' || p.estatus === filtroEstatus;
    const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo;
    return matchQ && matchEstatus && matchTipo;
  });

  // Stats
  const total = allProyectos.length;
  const enProceso = allProyectos.filter(p => p.estatus === 'en-proceso').length;
  const completados = allProyectos.filter(p => p.estatus === 'completado').length;
  const montoTotal = allProyectos.reduce((s, p) => s + (p.monto || 0), 0);

  const tiposUnicos = [...new Set(allProyectos.map(p => p.tipo))];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Proyectos</div>
          <div className="page-subtitle">Todos los proyectos y gestiones en curso · actualizado al {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setActive('tramites')}
        >
          <Icon name="map" size={14} /> Ver Hojas de Ruta
        </button>
      </div>

      {/* Metric Cards */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="metric-card">
          <div className="metric-label">Total Proyectos</div>
          <div className="metric-value" style={{ color: 'var(--blue)' }}>{total}</div>
          <div className="metric-sub">registrados</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">En Proceso</div>
          <div className="metric-value" style={{ color: 'var(--amber)' }}>{enProceso}</div>
          <div className="metric-sub">en ejecución activa</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Completados</div>
          <div className="metric-value" style={{ color: 'var(--accent)' }}>{completados}</div>
          <div className="metric-sub">finalizados con éxito</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Valor Total</div>
          <div className="metric-value" style={{ color: 'var(--text)', fontSize: 20 }}>{money(montoTotal)}</div>
          <div className="metric-sub">en honorarios y derechos</div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 220, maxWidth: 380 }}>
          <Icon name="search" size={14} />
          <input
            className="form-control search-input"
            placeholder="Buscar por nombre, ID, cliente..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          value={filtroEstatus}
          onChange={e => setFiltroEstatus(e.target.value)}
          style={{ width: 160 }}
        >
          <option value="todos">Todos los Estatus</option>
          {Object.entries(ESTATUS_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <select
          className="form-control"
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          style={{ width: 200 }}
        >
          <option value="todos">Todos los Tipos</option>
          {tiposUnicos.map(tipo => (
            <option key={tipo} value={tipo}>{TRAMITES_TIPOS[tipo]?.nombre || tipo}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 'var(--radius-md)', padding: 4 }}>
          <button
            className={`btn btn-sm ${vista === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setVista('grid')}
            title="Vista en cuadrícula"
            style={{ padding: '4px 10px' }}
          >
            ⊞
          </button>
          <button
            className={`btn btn-sm ${vista === 'lista' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setVista('lista')}
            title="Vista en lista"
            style={{ padding: '4px 10px' }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
        Mostrando <strong style={{ color: 'var(--text-2)' }}>{filtered.length}</strong> de {total} proyectos
        {q && <> · búsqueda: "<em>{q}</em>"</>}
      </div>

      {/* Grid / Lista */}
      {vista === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(p => <ProyectoCard key={p.id} proyecto={p} clientes={clientes} setActive={setActive} />)}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                <th style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-2)', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>ID / Nombre</th>
                <th style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-2)', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Cliente</th>
                <th style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-2)', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Tipo</th>
                <th style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-2)', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Estatus</th>
                <th style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-2)', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Avance</th>
                <th style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-2)', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const cli = clientes.find(c => c.id === p.clienteId);
                const tipo = TRAMITES_TIPOS[p.tipo];
                const col = COLOR_MAP[tipo?.color] || '#777';
                const est = ESTATUS_CONFIG[p.estatus] || { label: p.estatus, badge: 'badge-gray' };
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: col, fontWeight: 600 }}>{p.id}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginTop: 2 }}>{p.nombre}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-2)' }}>{cli?.nombre || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, background: BG_MAP[tipo?.color] || '#eee', color: col, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>
                        {tipo?.icono} {tipo?.nombre}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span className={`badge ${est.badge}`}>{est.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', minWidth: 120 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${p.avance}%`, background: col }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{p.avance}%</div>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {money(p.monto || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
              No se encontraron proyectos con ese criterio.
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && vista === 'grid' && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗂️</div>
          No se encontraron proyectos con ese criterio de búsqueda.
        </div>
      )}
    </div>
  );
}

function ProyectoCard({ proyecto: p, clientes, setActive }) {
  const cli = clientes.find(c => c.id === p.clienteId);
  const tipo = TRAMITES_TIPOS[p.tipo];
  const col = COLOR_MAP[tipo?.color] || '#777';
  const bgCol = BG_MAP[tipo?.color] || '#f5f5f5';
  const est = ESTATUS_CONFIG[p.estatus] || { label: p.estatus, badge: 'badge-gray' };
  const equipo = EQUIPO.find(e => e.id === p.responsable);

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        borderTop: `3px solid ${col}`,
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'pointer'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Card Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: col, fontWeight: 700, letterSpacing: 0.5 }}>{p.id}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 4, lineHeight: 1.3 }}>{p.nombre}</div>
          </div>
          <span className={`badge ${est.badge}`} style={{ flexShrink: 0, marginLeft: 8 }}>{est.label}</span>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11,
            background: bgCol,
            color: col,
            padding: '2px 8px',
            borderRadius: 10,
            fontWeight: 500
          }}>
            {tipo?.icono} {tipo?.nombre}
          </span>
          {cli && (
            <span style={{
              fontSize: 11,
              background: 'var(--surface2)',
              color: 'var(--text-2)',
              padding: '2px 8px',
              borderRadius: 10
            }}>
              👤 {cli.nombre}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '12px 16px' }}>
        {p.descripcion && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 14 }}>
            {p.descripcion}
          </div>
        )}

        {/* Progress */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Avance del proyecto</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: col, fontFamily: 'DM Mono' }}>{p.avance}%</span>
          </div>
          <div className="progress-bar" style={{ height: 6 }}>
            <div className="progress-fill" style={{ width: `${p.avance}%`, background: col, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Footer info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{money(p.monto || 0)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {equipo && (
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: equipo.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 9, fontWeight: 700
              }} title={`Responsable: ${equipo.nombre}`}>
                {equipo.avatar}
              </div>
            )}
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {p.fechaEstimada ? `Est: ${p.fechaEstimada}` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Proyectos;

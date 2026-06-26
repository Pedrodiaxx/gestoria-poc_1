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
  const {
    clientes,
    setActive,
    proyectos,
    addProyecto,
    presupuestos,
    setPreselectedProjectId
  } = useAppContext();

  const [q, setQ] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [vista, setVista] = useState('grid'); // 'grid' | 'lista'

  // Modal / Drawer state
  const [proyectoDetalle, setProyectoDetalle] = useState(null);
  const [mostrarNuevoProyecto, setMostrarNuevoProyecto] = useState(false);

  const getCliente = (id) => clientes.find(c => c.id === id);

  const filtered = proyectos.filter(p => {
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

  // Calculate budget total (handles both old and new schema)
  const getBudgetTotal = (b) => {
    if (!b) return 0;
    if (b.honorarios && b.derechos) {
      const planos = (parseFloat(b.honorarios.planos?.cantidad) || 0) * (parseFloat(b.honorarios.planos?.precioUnitario) || 0);
      const hrs = (parseFloat(b.honorarios.hrsHombre?.horas) || 0) * (parseFloat(b.honorarios.hrsHombre?.precioPorHora) || 0);
      const ofi = (parseFloat(b.honorarios.oficina?.horas) || 0) * (parseFloat(b.honorarios.oficina?.precioPorHora) || 0);
      const hTotal = planos + hrs + ofi;

      const d1 = parseFloat(b.derechos.derecho1?.costo) || 0;
      const d2 = parseFloat(b.derechos.derecho2?.costo) || 0;
      const d3 = parseFloat(b.derechos.derecho3?.costo) || 0;
      const dTotal = d1 + d2 + d3;
      return hTotal + dTotal;
    }

    const directos = (parseFloat(b.costosDirectos?.materiales) || 0) +
                     (parseFloat(b.costosDirectos?.manoDeObra) || 0) +
                     (parseFloat(b.costosDirectos?.equipos) || 0) +
                     (parseFloat(b.costosDirectos?.subcontratistas) || 0);

    const indirectos = (parseFloat(b.costosIndirectos?.oficina) || 0) +
                       (parseFloat(b.costosIndirectos?.seguros) || 0) +
                       (parseFloat(b.costosIndirectos?.permisos) || 0) +
                       (parseFloat(b.costosIndirectos?.administracion) || 0);

    const subtotal = directos + indirectos;
    const contingencia = subtotal * ((parseFloat(b.contingenciaPorcentaje) || 0) / 100);
    return subtotal + contingencia;
  };

  // Get project cost from its baseline budget, otherwise fallback to project.monto
  const getProyectoMontoReal = (p) => {
    const associated = presupuestos.filter(b => b.proyectoId === p.id);
    const baseline = associated.find(b => b.isBaseline);
    if (baseline) {
      return getBudgetTotal(baseline);
    }
    return p.monto || 0;
  };

  // Stats
  const total = proyectos.length;
  const enProceso = proyectos.filter(p => p.estatus === 'en-proceso').length;
  const completados = proyectos.filter(p => p.estatus === 'completado').length;
  const montoTotal = proyectos.reduce((s, p) => s + getProyectoMontoReal(p), 0);

  const tiposUnicos = [...new Set(proyectos.map(p => p.tipo))];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Proyectos</div>
          <div className="page-subtitle">Todos los proyectos y gestiones en curso · actualizado al {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setActive('tramites')}
          >
            <Icon name="map" size={14} /> Ver Hojas de Ruta
          </button>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setMostrarNuevoProyecto(true)}
          >
            <Icon name="plus" size={14} /> Nuevo Proyecto
          </button>
        </div>
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
          <div className="metric-label">Valor Total (Línea Base)</div>
          <div className="metric-value" style={{ color: 'var(--text)', fontSize: 20 }}>{money(montoTotal)}</div>
          <div className="metric-sub">costos presupuestados oficiales</div>
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
          {filtered.map(p => (
            <ProyectoCard
              key={p.id}
              proyecto={p}
              clientes={clientes}
              setActive={setActive}
              onClick={() => setProyectoDetalle(p)}
              montoReal={getProyectoMontoReal(p)}
            />
          ))}
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
                const monto = getProyectoMontoReal(p);
                return (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s', cursor: 'pointer' }}
                    onClick={() => setProyectoDetalle(p)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
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
                      {money(monto)}
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

      {/* DETAIL MODAL DRAWER */}
      {proyectoDetalle && (
        <ModalProyectoDetalle
          proyecto={proyectoDetalle}
          clientes={clientes}
          presupuestos={presupuestos}
          getBudgetTotal={getBudgetTotal}
          onClose={() => setProyectoDetalle(null)}
          onCrearPresupuesto={(pid) => {
            setPreselectedProjectId(pid);
            setActive('presupuestos');
            setProyectoDetalle(null);
          }}
        />
      )}

      {/* NEW PROJECT MODAL */}
      {mostrarNuevoProyecto && (
        <ModalNuevoProyecto
          onClose={() => setMostrarNuevoProyecto(false)}
          onGuardar={(nuevo) => {
            addProyecto(nuevo);
            setMostrarNuevoProyecto(false);
          }}
          clientes={clientes}
        />
      )}
    </div>
  );
}

// ─── PROYECTO CARD COMPONENT ──────────────────────────────────────────────────
function ProyectoCard({ proyecto: p, clientes, setActive, onClick, montoReal }) {
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
      onClick={onClick}
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
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 14, height: '36px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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
            <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{money(montoReal)}</span>
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

// ─── MODAL PROYECTO DETALLE COMPONENT ─────────────────────────────────────────
function ModalProyectoDetalle({ proyecto: p, clientes, presupuestos, getBudgetTotal, onClose, onCrearPresupuesto }) {
  const cli = clientes.find(c => c.id === p.clienteId);
  const tipo = TRAMITES_TIPOS[p.tipo];
  const col = COLOR_MAP[tipo?.color] || '#777';
  const est = ESTATUS_CONFIG[p.estatus] || { label: p.estatus, badge: 'badge-gray' };
  const equipo = EQUIPO.find(e => e.id === p.responsable);

  // Budgets linked to this project, sorted by version/date
  const asociados = presupuestos.filter(b => b.proyectoId === p.id);
  const baseline = asociados.find(b => b.isBaseline);

  // Group budgets by version code to sort or display cost history
  const sortedBudgets = [...asociados].sort((a, b) => {
    return (a.version || '').localeCompare(b.version || '');
  });

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', justifyContent: 'flex-end',
      backdropFilter: 'blur(3px)', transition: 'opacity 0.2s'
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', maxWidth: '640px', background: 'var(--surface)',
          height: '100%', display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.3s ease-out', padding: '24px 32px',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'DM Mono', fontSize: 11, background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, color: col, fontWeight: 700 }}>{p.id}</span>
              <span className={`badge ${est.badge}`}>{est.label}</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{p.nombre}</h2>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 6, borderRadius: '50%', minWidth: 'auto' }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Cliente</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>👤 {cli?.nombre || 'Sin cliente'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Responsable</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {equipo && (
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: equipo.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 700
                }}>
                  {equipo.avatar}
                </div>
              )}
              <span style={{ fontSize: 13, fontWeight: 500 }}>{equipo?.nombre || 'Sin asignar'}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tipo de Gestión</div>
            <span style={{ fontSize: 11, background: BG_MAP[tipo?.color] || '#eee', color: col, padding: '3px 8px', borderRadius: 10, fontWeight: 600, display: 'inline-block' }}>
              {tipo?.icono} {tipo?.nombre}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Ubicación</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>📍 {p.ubicacion || 'No especificada'}</div>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Alcance del Proyecto</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, background: 'var(--surface2)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              {p.alcance || p.descripcion || 'Sin descripción detallada del alcance.'}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Avance General</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: col, fontFamily: 'DM Mono' }}>{p.avance}%</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${p.avance}%`, background: col }} />
          </div>
        </div>

        {/* Baseline Widget */}
        <div style={{
          background: 'var(--surface2)', borderRadius: 'var(--radius-lg)',
          padding: 16, border: '1px solid var(--border)', marginBottom: 24
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Presupuesto Oficial (Línea Base)</span>
            <span style={{
              fontSize: 10, background: baseline ? 'var(--accent-light)' : 'rgba(184,122,10,0.1)',
              color: baseline ? 'var(--accent-text)' : '#B87A0A', padding: '2px 8px', borderRadius: 10, fontWeight: 600
            }}>
              {baseline ? '✓ Establecido' : '⚠️ Pendiente de Aprobación'}
            </span>
          </div>
          {baseline ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{baseline.titulo}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Versión {baseline.version} · Aprobado el {baseline.fecha}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', fontFamily: 'DM Mono' }}>
                {money(getBudgetTotal(baseline))}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>
              No se ha establecido un presupuesto aprobado como "Línea Base" para controlar los costos.
            </div>
          )}
        </div>

        {/* Budgets Version History */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Versiones del Presupuesto</span>
            <button
              className="btn btn-sm btn-ghost"
              style={{ fontSize: 11, padding: '4px 8px', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => onCrearPresupuesto(p.id)}
            >
              <Icon name="plus" size={12} /> Nuevo
            </button>
          </div>

          {sortedBudgets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-3)', fontSize: 12 }}>
              No hay presupuestos para este proyecto. Pulsa "Nuevo" para crear uno.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedBudgets.map(b => {
                const total = getBudgetTotal(b);
                const isApproved = b.estado === 'Aprobado';
                return (
                  <div
                    key={b.id}
                    style={{
                      border: b.isBaseline ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: b.isBaseline ? 'rgba(76,166,106,0.02)' : 'var(--surface)',
                      borderRadius: 'var(--radius-md)', padding: 12,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      position: 'relative'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'DM Mono', fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>{b.version}</span>
                        <span style={{ fontSize: 10, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, color: 'var(--text-3)', fontFamily: 'DM Mono' }}>{b.id}</span>
                        <span style={{
                          fontSize: 10,
                          background: b.estado === 'Aprobado' ? 'var(--accent-light)' : b.estado === 'Enviado' ? 'var(--blue-light)' : b.estado === 'Rechazado' ? 'rgba(192,57,43,0.1)' : 'var(--surface2)',
                          color: b.estado === 'Aprobado' ? 'var(--accent-text)' : b.estado === 'Enviado' ? 'var(--blue)' : b.estado === 'Rechazado' ? '#C0392B' : 'var(--text-3)',
                          padding: '1px 6px', borderRadius: 4, fontWeight: 500
                        }}>{b.estado}</span>
                        {b.isBaseline && <span className="badge badge-green" style={{ fontSize: 9, padding: '1px 4px' }}>Línea Base</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{b.titulo}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Creado el {b.fecha}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 14, fontWeight: 700, color: b.isBaseline ? 'var(--accent)' : 'var(--text-2)' }}>
                        {money(total)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cost Evolution Line Graph (Visual Progression) */}
        {sortedBudgets.length > 1 && (
          <div style={{ marginBottom: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 16 }}>Evolución del Costo</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', position: 'relative' }}>
              {/* Connecting Line */}
              <div style={{ position: 'absolute', height: 2, background: 'var(--border)', top: 12, left: '10%', right: '10%', zIndex: 1 }} />
              {sortedBudgets.map((b, idx) => {
                const total = getBudgetTotal(b);
                return (
                  <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: b.isBaseline ? 'var(--accent)' : 'var(--surface)',
                      border: `2px solid ${b.isBaseline ? 'var(--accent)' : 'var(--border-strong)'}`,
                      color: b.isBaseline ? '#fff' : 'var(--text-2)',
                      fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'DM Mono', boxShadow: 'var(--shadow-sm)'
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, marginTop: 6, color: 'var(--text)' }}>{b.version}</span>
                    <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: b.isBaseline ? 'var(--accent)' : 'var(--text-3)', marginTop: 2 }}>{money(total)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── MODAL NUEVO PROYECTO COMPONENT ───────────────────────────────────────────
function ModalNuevoProyecto({ onClose, onGuardar, clientes }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('licencia-const');
  const [clienteId, setClienteId] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [estatus, setEstatus] = useState('pendiente');
  const [avance, setAvance] = useState(0);
  const [responsable, setResponsable] = useState(EQUIPO[0]?.id || 'u1');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [alcance, setAlcance] = useState('');

  const handleSave = () => {
    if (!nombre) return;
    const nuevo = {
      id: `PRY-${String(Date.now()).slice(-3)}`,
      nombre,
      tipo,
      clienteId: clienteId ? parseInt(clienteId) : null,
      estatus,
      prioridad,
      avance: parseInt(avance) || 0,
      descripcion,
      fechaInicio: new Date().toISOString().split('T')[0],
      responsable,
      monto: 0, // Will be updated by baseline budget
      ubicacion,
      alcance
    };
    onGuardar(nuevo);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(3px)'
    }} onClick={onClose}>
      <div
        className="card"
        style={{
          width: '100%', maxWidth: '580px', background: 'var(--surface)',
          padding: '24px 28px', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)', overflowY: 'auto', maxHeight: '90vh'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Nuevo Proyecto de Gestión</h3>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4, minWidth: 'auto', borderRadius: '50%' }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Nombre del Proyecto *</label>
            <input className="form-control" placeholder="Ej: Condominio Los Encinos - Fase II" value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Gestión</label>
            <select className="form-control" value={tipo} onChange={e => setTipo(e.target.value)}>
              {Object.entries(TRAMITES_TIPOS).map(([key, val]) => (
                <option key={key} value={key}>{val.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Cliente Asociado</label>
            <select className="form-control" value={clienteId} onChange={e => setClienteId(e.target.value)}>
              <option value="">— Seleccionar cliente —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Responsable del Trámite</label>
            <select className="form-control" value={responsable} onChange={e => setResponsable(e.target.value)}>
              {EQUIPO.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Estatus del Trámite</label>
            <select className="form-control" value={estatus} onChange={e => setEstatus(e.target.value)}>
              <option value="pendiente">Pendiente</option>
              <option value="en-proceso">En Proceso</option>
              <option value="completado">Completado</option>
              <option value="pausado">Pausado</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Prioridad</label>
            <select className="form-control" value={prioridad} onChange={e => setPrioridad(e.target.value)}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Avance Inicial (%)</label>
            <input className="form-control" type="number" min="0" max="100" value={avance} onChange={e => setAvance(e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">📍 Ubicación Física de la Obra</label>
            <input className="form-control" placeholder="Ej: Av. Juárez #204, Col. Centro" value={ubicacion} onChange={e => setUbicacion(e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Alcance y Descripción Detallada</label>
            <textarea className="form-control" rows={3} placeholder="Define el alcance del proyecto (ej: número de niveles, metros cuadrados c/u, permisos específicos requeridos...)" value={alcance} onChange={e => setAlcance(e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Resumen de Descripción Corta</label>
            <input className="form-control" placeholder="Resumen breve para listados..." value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!nombre} style={{ opacity: !nombre ? 0.5 : 1 }}>Crear Proyecto</button>
        </div>
      </div>
    </div>
  );
}

export default Proyectos;

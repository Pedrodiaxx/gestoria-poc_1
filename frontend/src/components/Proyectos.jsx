import React, { useState, useEffect, Component } from 'react';
import Swal from 'sweetalert2';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { useProyectos } from '../hooks/useProyectos';
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
  'completado': { label: 'Completado', color: '#2A5F3F', badge: 'badge-green' },
  'pendiente': { label: 'Pendiente', color: '#B87A0A', badge: 'badge-amber' },
  'pausado': { label: 'Pausado', color: '#9C9A94', badge: 'badge-gray' },
};

// ─── ERROR BOUNDARY COMPONENT ────────────────────────────────────────────────
class ProyectosErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado en ProyectosErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 24px', textAlign: 'center', background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)', margin: '20px auto', maxWidth: '600px',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)'
        }}>
          <Icon name="alert-circle" size={40} style={{ color: 'var(--amber)', marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: 'var(--text)' }}>
            Ocurrió un problema al mostrar los proyectos
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
            Se detectó un error inesperado al renderizar el módulo. Los datos están seguros.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reintentar y cargar de nuevo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper para calcular total de presupuesto de forma segura
const calcBudgetTotal = (b) => {
  if (!b) return 0;
  if (typeof b.totalDirecto === 'number' && typeof b.totalIndirecto === 'number') {
    return b.totalDirecto + b.totalIndirecto;
  }
  const conceptos = b.conceptos || [];
  const directos = conceptos.reduce((s, c) => s + (parseFloat(c.pagoDerechos || 0) + parseFloat(c.honorarios || 0) + parseFloat(c.extra || 0)), 0);
  return directos;
};

// Helper para resolver usuario real desde Control de Usuarios (DbContext) con fallback
const resolveUser = (id, usuariosList = []) => {
  if (!id) return null;
  const found = (usuariosList || []).find(u => String(u?.id) === String(id) || u?.email === id || String(u?.idNumerico) === String(id));
  if (found) {
    return {
      id: found.id,
      nombre: found.nombre,
      avatar: found.avatar || (found.nombre ? found.nombre.slice(0, 2).toUpperCase() : 'U'),
      color: found.color || 'var(--blue)',
      rol: found.rol
    };
  }
  const staffUser = (usuariosList || []).find(u => u?.rol !== 'cliente');
  if (staffUser) {
    return {
      id: staffUser.id,
      nombre: staffUser.nombre,
      avatar: staffUser.avatar || (staffUser.nombre ? staffUser.nombre.slice(0, 2).toUpperCase() : 'U'),
      color: staffUser.color || 'var(--blue)',
      rol: staffUser.rol
    };
  }
  const mockFound = EQUIPO.find(e => String(e?.id) === String(id));
  if (mockFound) return mockFound;
  return { id, nombre: 'Gestor Asignado', avatar: 'GA', color: 'var(--blue)' };
};

const getTeamMembers = (usuariosList = []) => {
  const staff = (usuariosList || []).filter(u => u?.rol !== 'cliente');
  if (staff.length > 0) return staff;
  return (usuariosList && usuariosList.length > 0) ? usuariosList : EQUIPO;
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function Proyectos() {
  return (
    <ProyectosErrorBoundary>
      <ProyectosContent />
    </ProyectosErrorBoundary>
  );
}

function ProyectosContent() {
  const {
    clientes = [],
    setActive,
    proyectos = [],
    addProyecto,
    deleteProyecto,
    presupuestos = [],
    setPreselectedProjectId,
    setPreselectedBudgetId,
    setProyectos,
    session,
    usuarios = []
  } = useAppContext();

  const [q, setQ] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [vista, setVista] = useState('grid'); // 'grid' | 'lista'

  // Hook: carga, creación y eliminación de proyectos delegada a la capa de servicios
  const { crearProyecto, eliminarProyecto } = useProyectos(setProyectos, session);

  // Modal / Drawer state
  const [proyectoDetalle, setProyectoDetalle] = useState(null);
  const [mostrarNuevoProyecto, setMostrarNuevoProyecto] = useState(false);

  const getCliente = (id) => (clientes || []).find(c => c?.id === id);

  const safeProyectos = Array.isArray(proyectos) ? proyectos : [];

  const filtered = safeProyectos.filter(p => {
    if (!p) return false;
    const cli = getCliente(p.clienteId);
    const nombre = p.nombre || '';
    const idStr = p.id ? String(p.id) : '';
    const cliNombre = cli?.nombre || '';
    const desc = p.descripcion || '';

    const matchQ = q === '' ||
      nombre.toLowerCase().includes(q.toLowerCase()) ||
      idStr.toLowerCase().includes(q.toLowerCase()) ||
      cliNombre.toLowerCase().includes(q.toLowerCase()) ||
      desc.toLowerCase().includes(q.toLowerCase());

    const matchEstatus = filtroEstatus === 'todos' || p.estatus === filtroEstatus;
    const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo;
    return matchQ && matchEstatus && matchTipo;
  });

  const handleEliminarProyecto = async (id, idNumerico) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#C0392B',
      cancelButtonColor: '#7F8C8D',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--surface)',
      color: 'var(--text)'
    });

    if (!result.isConfirmed) return;

    try {
      const targetId = idNumerico || id;
      if (eliminarProyecto) {
        await eliminarProyecto(id, idNumerico);
      } else if (deleteProyecto) {
        await deleteProyecto(id, idNumerico);
      } else {
        setProyectos(prev => prev.filter(p => p.id !== id && p.idNumerico !== targetId));
      }

      if (proyectoDetalle && (proyectoDetalle.id === id || proyectoDetalle.idNumerico === targetId)) {
        setProyectoDetalle(null);
      }

      Swal.fire({
        title: 'Eliminado',
        text: 'El proyecto ha sido eliminado con éxito.',
        icon: 'success',
        background: 'var(--surface)',
        color: 'var(--text)'
      });
    } catch (error) {
      console.error("Error al eliminar proyecto:", error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al eliminar el proyecto en el servidor.',
        icon: 'error',
        background: 'var(--surface)',
        color: 'var(--text)'
      });
    }
  };

  // Stats (monto ya procesado en el servidor)
  const total = safeProyectos.length;
  const enProceso = safeProyectos.filter(p => p?.estatus === 'en-proceso').length;
  const completados = safeProyectos.filter(p => p?.estatus === 'completado').length;
  const montoTotal = safeProyectos.reduce((s, p) => s + (p?.monto || 0), 0);

  const tiposUnicos = [...new Set(safeProyectos.map(p => p?.tipo).filter(Boolean))];

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
            onClick={() => setActive && setActive('tramites')}
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
      <div className="metric-grid metric-grid-4">
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
            <Icon name="grid" size={13} />
          </button>
          <button
            className={`btn btn-sm ${vista === 'lista' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setVista('lista')}
            title="Vista en lista"
            style={{ padding: '4px 10px' }}
          >
            <Icon name="list" size={13} />
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
              key={p.id || p.idNumerico || Math.random()}
              proyecto={p}
              clientes={clientes}
              setActive={setActive}
              onClick={() => setProyectoDetalle(p)}
              onEliminar={handleEliminarProyecto}
              montoReal={p.monto || 0}
              session={session}
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
                <th style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-2)', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const cli = (clientes || []).find(c => c?.id === p?.clienteId);
                const tipo = TRAMITES_TIPOS[p?.tipo];
                const col = COLOR_MAP[tipo?.color] || '#777';
                const est = ESTATUS_CONFIG[p?.estatus] || { label: p?.estatus || 'Sin estatus', badge: 'badge-gray' };
                const monto = p?.monto || 0;
                return (
                  <tr
                    key={p.id || p.idNumerico || Math.random()}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s', cursor: 'pointer' }}
                    onClick={() => setProyectoDetalle(p)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: col, fontWeight: 600 }}>{p.id || 'PRY-???'}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginTop: 2 }}>{p.nombre || 'Sin nombre'}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-2)' }}>{cli?.nombre || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, background: BG_MAP[tipo?.color] || '#eee', color: col, padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>
                        {tipo?.icono || '📁'} {tipo?.nombre || 'Gestión General'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span className={`badge ${p.estatusBadge || est.badge}`}>{p.estatusLabel || est.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', minWidth: 120 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${p.avance || 0}%`, background: col }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{p.avance || 0}%</div>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {money(monto)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {session?.rol !== 'cliente' && (
                        <button
                          className="btn btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarProyecto(p.id, p.idNumerico);
                          }}
                          style={{ padding: 6, minWidth: 'auto', color: 'var(--red)', borderRadius: 4 }}
                          title="Eliminar Proyecto"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      )}
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
          No se encontraron proyectos con ese criterio de búsqueda.
        </div>
      )}

      {/* DETAIL MODAL DRAWER */}
      {proyectoDetalle && (
        <ModalProyectoDetalle
          proyecto={proyectoDetalle}
          clientes={clientes}
          presupuestos={presupuestos}
          getBudgetTotal={calcBudgetTotal}
          onClose={() => setProyectoDetalle(null)}
          onEliminar={handleEliminarProyecto}
          onCrearPresupuesto={(pid) => {
            setPreselectedProjectId && setPreselectedProjectId(pid);
            setActive && setActive('presupuestos');
            setProyectoDetalle(null);
          }}
          onVerPresupuesto={(budgetId) => {
            if (!budgetId) return;
            setPreselectedBudgetId && setPreselectedBudgetId(budgetId);
            setActive && setActive('presupuestos');
            setProyectoDetalle(null);
          }}
          session={session}
        />
      )}

      {/* NEW PROJECT MODAL */}
      {mostrarNuevoProyecto && (
        <ModalNuevoProyecto
          onClose={() => setMostrarNuevoProyecto(false)}
          onGuardar={(nuevo) => {
            addProyecto && addProyecto(nuevo);
            setMostrarNuevoProyecto(false);
          }}
          clientes={clientes}
          crearProyecto={crearProyecto}
        />
      )}
    </div>
  );
}

// ─── PROYECTO CARD COMPONENT ──────────────────────────────────────────────────
function ProyectoCard({ proyecto: p, clientes, setActive, onClick, onEliminar, montoReal, session }) {
  if (!p) return null;

  const { usuarios = [] } = useAppContext();
  const cli = (clientes || []).find(c => c?.id === p?.clienteId);
  const tipo = TRAMITES_TIPOS[p?.tipo];
  const col = COLOR_MAP[tipo?.color] || '#777';
  const bgCol = BG_MAP[tipo?.color] || '#f5f5f5';
  const est = ESTATUS_CONFIG[p?.estatus] || { label: p?.estatus || 'Sin estatus', badge: 'badge-gray' };
  const equipo = resolveUser(p?.responsable, usuarios);

  const avance = p?.avance || 0;

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
            <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: col, fontWeight: 700, letterSpacing: 0.5 }}>{p.id || 'PRY-???'}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 4, lineHeight: 1.3 }}>{p.nombre || 'Sin nombre'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`badge ${p.estatusBadge || est.badge}`} style={{ flexShrink: 0 }}>{p.estatusLabel || est.label}</span>
            {session?.rol !== 'cliente' && (
              <button
                className="btn btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminar && onEliminar(p.id, p.idNumerico);
                }}
                style={{ padding: 4, minWidth: 'auto', color: 'var(--red)', borderRadius: 4 }}
                title="Eliminar Proyecto"
              >
                <Icon name="trash" size={14} />
              </button>
            )}
          </div>
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
            {tipo?.icono || '📁'} {tipo?.nombre || 'Gestión General'}
          </span>
          {cli && (
            <span style={{
              fontSize: 11,
              background: 'var(--surface2)',
              color: 'var(--text-2)',
              padding: '2px 8px',
              borderRadius: 10
            }}>
              {cli.nombre}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '12px 16px' }}>
        {p.descripcion ? (
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 14, height: '36px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {p.descripcion}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', marginBottom: 14, height: '36px' }}>
            Sin descripción registrada.
          </div>
        )}

        {/* Progress */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Avance del proyecto</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: col, fontFamily: 'DM Mono' }}>{avance}%</span>
          </div>
          <div className="progress-bar" style={{ height: 6 }}>
            <div className="progress-fill" style={{ width: `${avance}%`, background: col, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Footer info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{money(montoReal || p?.monto || 0)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {equipo ? (
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: equipo.color || 'var(--blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 9, fontWeight: 700
              }} title={`Responsable: ${equipo.nombre}`}>
                {equipo.avatar || 'U'}
              </div>
            ) : (
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontStyle: 'italic' }}>Sin asignado</span>
            )}
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {p?.fechaEstimada ? `Est: ${p.fechaEstimada}` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL PROYECTO DETALLE COMPONENT ─────────────────────────────────────────
function ModalProyectoDetalle({ proyecto: initialProyecto, clientes = [], presupuestos = [], getBudgetTotal, onClose, onEliminar, onCrearPresupuesto, onVerPresupuesto, session }) {
  const { proyectos = [], updateProyecto, tareas = [], usuarios = [] } = useAppContext();

  // Guard previas si no existe initialProyecto
  if (!initialProyecto) {
    return (
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', justifyContent: 'flex-end',
        backdropFilter: 'blur(3px)'
      }} onClick={onClose}>
        <div style={{
          width: '100%', maxWidth: '640px', background: 'var(--surface)',
          height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', padding: 32
        }} onClick={e => e.stopPropagation()}>
          <Icon name="alert-circle" size={32} style={{ color: 'var(--amber)', marginBottom: 12 }} />
          <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: 'var(--text)' }}>
            Cargando información del proyecto...
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
            No se encontraron los datos para desplegar los detalles.
          </p>
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    );
  }

  const safeProyectos = Array.isArray(proyectos) ? proyectos : [];
  const p = safeProyectos.find(proj => proj?.id === initialProyecto?.id || proj?.idNumerico === initialProyecto?.idNumerico) || initialProyecto;

  const cli = (clientes || []).find(c => c?.id === p?.clienteId);
  const tipo = TRAMITES_TIPOS[p?.tipo];
  const col = COLOR_MAP[tipo?.color] || '#777';
  const est = ESTATUS_CONFIG[p?.estatus] || { label: p?.estatus || 'Sin estatus', badge: 'badge-gray' };
  
  // Resolver usuario real de la lista de Control de Usuarios
  const equipo = resolveUser(p?.responsable, usuarios);
  const teamMembers = getTeamMembers(usuarios);

  // Helper para calculo seguro del presupuesto
  const safeGetBudgetTotal = getBudgetTotal || calcBudgetTotal;

  // Presupuestos vinculados
  const safePresupuestos = Array.isArray(presupuestos) ? presupuestos : [];
  const asociados = safePresupuestos.filter(b => b?.proyectoId === p?.id || (b?.proyectoId && p?.idNumerico && b?.proyectoId === p?.idNumerico));
  const baseline = asociados.find(b => b?.isBaseline);

  // Tareas asociadas al proyecto o asignadas
  const safeTareas = Array.isArray(tareas) ? tareas : [];
  const tareasAsociadas = safeTareas.filter(t => t?.proyectoId === p?.id || (p?.idNumerico && t?.proyectoId === p?.idNumerico));

  // Ordenar presupuestos por versión
  const sortedBudgets = [...asociados].sort((a, b) => {
    return (a?.version || '').localeCompare(b?.version || '');
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState(p?.nombre || '');
  const [editEstatus, setEditEstatus] = useState(p?.estatus || 'pendiente');
  const [editPrioridad, setEditPrioridad] = useState(p?.prioridad || 'media');
  const [editResponsable, setEditResponsable] = useState(p?.responsable || (teamMembers[0]?.id || 'u1'));
  const [editUbicacion, setEditUbicacion] = useState(p?.ubicacion || '');
  const [editAlcance, setEditAlcance] = useState(p?.alcance || '');
  const [editDescripcion, setEditDescripcion] = useState(p?.descripcion || '');
  const [editUsoPrincipal, setEditUsoPrincipal] = useState(p?.usoPrincipal || '');
  const [editUsoComplementario, setEditUsoComplementario] = useState(p?.usoComplementario || '');
  const [editImpactoPrincipal, setEditImpactoPrincipal] = useState(p?.impactoPrincipal || '');
  const [editImpactoComplementario, setEditImpactoComplementario] = useState(p?.impactoComplementario || '');
  const [editVialidadPrincipal, setEditVialidadPrincipal] = useState(p?.vialidadPrincipal || '');
  const [editVialidadComplementaria, setEditVialidadComplementaria] = useState(p?.vialidadComplementaria || '');
  const [editDireccionesComp, setEditDireccionesComp] = useState(p?.direccionesComplementarias || []);

  useEffect(() => {
    if (!p) return;
    setEditNombre(p?.nombre || '');
    setEditEstatus(p?.estatus || 'pendiente');
    setEditPrioridad(p?.prioridad || 'media');
    setEditResponsable(p?.responsable || (teamMembers[0]?.id || 'u1'));
    setEditUbicacion(p?.ubicacion || '');
    setEditAlcance(p?.alcance || '');
    setEditDescripcion(p?.descripcion || '');
    setEditUsoPrincipal(p?.usoPrincipal || '');
    setEditUsoComplementario(p?.usoComplementario || '');
    setEditImpactoPrincipal(p?.impactoPrincipal || '');
    setEditImpactoComplementario(p?.impactoComplementario || '');
    setEditVialidadPrincipal(p?.vialidadPrincipal || '');
    setEditVialidadComplementaria(p?.vialidadComplementaria || '');
    setEditDireccionesComp(p?.direccionesComplementarias || []);
  }, [p]);

  const handleSaveEdit = () => {
    if (!editNombre) return;
    const updated = {
      ...p,
      nombre: editNombre,
      estatus: editEstatus,
      prioridad: editPrioridad,
      responsable: editResponsable,
      ubicacion: editUbicacion,
      alcance: editAlcance,
      descripcion: editDescripcion,
      usoPrincipal: editUsoPrincipal,
      usoComplementario: editUsoComplementario,
      impactoPrincipal: editImpactoPrincipal,
      impactoComplementario: editImpactoComplementario,
      vialidadPrincipal: editVialidadPrincipal,
      vialidadComplementaria: editVialidadComplementaria,
      direccionesComplementarias: editDireccionesComp.filter(d => d && typeof d === 'string' && d.trim() !== '')
    };
    updateProyecto && updateProyecto(updated);
    setIsEditing(false);
  };

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
          <div style={{ flex: 1, marginRight: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'DM Mono', fontSize: 11, background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, color: col, fontWeight: 700 }}>{p?.id || 'PRY-???'}</span>
              {!isEditing && <span className={`badge ${p?.estatusBadge || est.badge}`}>{p?.estatusLabel || est.label}</span>}
            </div>
            {isEditing ? (
              <input
                className="form-control"
                style={{ fontSize: 16, fontWeight: 600, width: '100%', marginTop: 4 }}
                value={editNombre}
                onChange={e => setEditNombre(e.target.value)}
                placeholder="Nombre del Proyecto"
              />
            ) : (
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{p?.nombre || 'Proyecto sin nombre'}</h2>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {isEditing ? (
              <>
                <button className="btn btn-sm btn-ghost" onClick={() => setIsEditing(false)} style={{ padding: '6px 12px' }}>
                  Cancelar
                </button>
                <button className="btn btn-sm btn-primary" onClick={handleSaveEdit} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="check" size={12} /> Guardar
                </button>
              </>
            ) : (
              <>
                {session?.rol !== 'cliente' && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => onEliminar && onEliminar(p?.id, p?.idNumerico)}
                    style={{ padding: 6, borderRadius: '50%', minWidth: 'auto', color: 'var(--red)' }}
                    title="Eliminar Proyecto"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={() => setIsEditing(true)}
                  style={{ padding: 6, borderRadius: '50%', minWidth: 'auto' }}
                  title="Editar Proyecto"
                >
                  <Icon name="edit" size={16} />
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={onClose}
                  style={{ padding: 6, borderRadius: '50%', minWidth: 'auto' }}
                >
                  <Icon name="x" size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          /* Formulario de Edición */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Estatus del Trámite</label>
                <select className="form-control" value={editEstatus} onChange={e => setEditEstatus(e.target.value)}>
                  <option value="pendiente">Pendiente</option>
                  <option value="en-proceso">En Proceso</option>
                  <option value="completado">Completado</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Prioridad</label>
                <select className="form-control" value={editPrioridad} onChange={e => setEditPrioridad(e.target.value)}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Responsable del Trámite</label>
                <select className="form-control" value={editResponsable} onChange={e => setEditResponsable(e.target.value)}>
                  {teamMembers.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.nombre} {e.rol ? `(${e.rol})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Dirección Principal (Ubicación)</label>
              <input className="form-control" value={editUbicacion} onChange={e => setEditUbicacion(e.target.value)} />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Direcciones Complementarias (Máx 3)</label>
                {editDireccionesComp.length < 3 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setEditDireccionesComp([...editDireccionesComp, ''])}
                    style={{ padding: '2px 8px', fontSize: 11, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Icon name="plus" size={10} /> Agregar
                  </button>
                )}
              </div>
              {editDireccionesComp.map((dir, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', minWidth: 80 }}>Comp. {idx + 1}:</span>
                  <input
                    className="form-control"
                    style={{ flex: 1 }}
                    placeholder={`Ej: Entrada Secundaria`}
                    value={dir}
                    onChange={e => {
                      const updated = [...editDireccionesComp];
                      updated[idx] = e.target.value;
                      setEditDireccionesComp(updated);
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setEditDireccionesComp(editDireccionesComp.filter((_, i) => i !== idx))}
                    style={{ padding: 6, minWidth: 'auto', color: 'var(--red)' }}
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Uso Principal</label>
                <input className="form-control" value={editUsoPrincipal} onChange={e => setEditUsoPrincipal(e.target.value)} placeholder="Ej: Habitacional" />
              </div>
              <div className="form-group">
                <label className="form-label">Uso Complementario</label>
                <input className="form-control" value={editUsoComplementario} onChange={e => setEditUsoComplementario(e.target.value)} placeholder="Ej: Comercial" />
              </div>

              <div className="form-group">
                <label className="form-label">Impacto Principal</label>
                <input className="form-control" value={editImpactoPrincipal} onChange={e => setEditImpactoPrincipal(e.target.value)} placeholder="Ej: Urbano" />
              </div>
              <div className="form-group">
                <label className="form-label">Impacto Complementario</label>
                <input className="form-control" value={editImpactoComplementario} onChange={e => setEditImpactoComplementario(e.target.value)} placeholder="Ej: Ambiental" />
              </div>

              <div className="form-group">
                <label className="form-label">Vialidad Principal</label>
                <input className="form-control" value={editVialidadPrincipal} onChange={e => setEditVialidadPrincipal(e.target.value)} placeholder="Ej: Av. Juárez" />
              </div>
              <div className="form-group">
                <label className="form-label">Vialidad Complementaria</label>
                <input className="form-control" value={editVialidadComplementaria} onChange={e => setEditVialidadComplementaria(e.target.value)} placeholder="Ej: Calle 5" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Alcance del Proyecto</label>
              <textarea className="form-control" rows={3} value={editAlcance} onChange={e => setEditAlcance(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Resumen Corto (Descripción)</label>
              <input className="form-control" value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} />
            </div>
          </div>
        ) : (
          /* Vista de Detalle Estándar */
          <>
            {/* Info Grid */}
            <div className="form-grid-2" style={{ marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Cliente</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cli?.nombre || 'Sin cliente asignado'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Responsable</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {equipo ? (
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: equipo.color || 'var(--blue)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 700
                    }}>
                      {equipo.avatar || 'U'}
                    </div>
                  ) : null}
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{equipo?.nombre || 'Sin asignar'}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tipo de Gestión</div>
                <span style={{ fontSize: 11, background: BG_MAP[tipo?.color] || '#eee', color: col, padding: '3px 8px', borderRadius: 10, fontWeight: 600, display: 'inline-block' }}>
                  {tipo?.icono || '📁'} {tipo?.nombre || 'Gestión General'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Prioridad</div>
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize', color: p?.prioridad === 'alta' ? 'var(--red)' : p?.prioridad === 'media' ? 'var(--amber)' : 'var(--text-3)' }}>
                  ⚡ {p?.prioridad || 'Media'}
                </span>
              </div>

              {/* Ubicación */}
              <div style={{ gridColumn: '1/-1', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Dirección Principal</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{p?.ubicacion || 'Sin ubicación registrada'}</div>
              </div>

              {p?.direccionesComplementarias && p.direccionesComplementarias.length > 0 && (
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Direcciones Complementarias</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {p.direccionesComplementarias.map((dir, idx) => (
                      <div key={idx} style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--surface2)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>Comp. {idx + 1}:</span> {dir || 'N/A'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Uso Principal</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{p?.usoPrincipal || 'No especificado'}</div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Uso Complementario</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{p?.usoComplementario || 'Ninguno'}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Impacto Principal</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{p?.impactoPrincipal || 'No especificado'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Impacto Complementario</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{p?.impactoComplementario || 'Ninguno'}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Vialidad Principal</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{p?.vialidadPrincipal || 'No especificada'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Vialidad Complementaria</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{p?.vialidadComplementaria || 'Ninguna'}</div>
              </div>

              <div style={{ gridColumn: '1/-1', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Alcance del Proyecto</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, background: 'var(--surface2)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  {p?.alcance || p?.descripcion || 'Sin descripción o alcance detallado para este proyecto.'}
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Avance General</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: col, fontFamily: 'DM Mono' }}>{p?.avance || 0}%</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${p?.avance || 0}%`, background: col }} />
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
                  {baseline ? 'Establecido' : 'Pendiente de Aprobación'}
                </span>
              </div>
              {baseline ? (
                <div
                  onClick={() => onVerPresupuesto && onVerPresupuesto(baseline.id || baseline.idNumerico)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '6px 8px', borderRadius: 'var(--radius-sm)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                  title="Haz clic para ver el detalle de este presupuesto de Línea Base"
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {baseline.titulo || 'Presupuesto Línea Base'}
                      <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 500 }}>Ver →</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Versión {baseline.version || '1.0'} · Aprobado el {baseline.fecha || 'N/A'}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', fontFamily: 'DM Mono' }}>
                    {money(safeGetBudgetTotal(baseline))}
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
                  onClick={() => onCrearPresupuesto && onCrearPresupuesto(p?.id)}
                >
                  <Icon name="plus" size={12} /> Nuevo
                </button>
              </div>

              {sortedBudgets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 16px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface2)', color: 'var(--text-3)', fontSize: 12 }}>
                  <Icon name="file-text" size={20} style={{ marginBottom: 6, opacity: 0.5, display: 'block', margin: '0 auto 6px' }} />
                  Sin presupuestos registrados para este proyecto.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sortedBudgets.map(b => {
                    const totalB = safeGetBudgetTotal(b);
                    return (
                      <div
                        key={b.id || Math.random()}
                        onClick={() => onVerPresupuesto && onVerPresupuesto(b.id || b.idNumerico)}
                        style={{
                          border: b.isBaseline ? '1px solid var(--accent)' : '1px solid var(--border)',
                          background: b.isBaseline ? 'rgba(76,166,106,0.02)' : 'var(--surface)',
                          borderRadius: 'var(--radius-md)', padding: 12,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--blue)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = b.isBaseline ? 'var(--accent)' : 'var(--border)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        title="Haz clic para ver el detalle de esta versión de presupuesto"
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontFamily: 'DM Mono', fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>{b.version || 'v1.0'}</span>
                            <span style={{ fontSize: 10, background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, color: 'var(--text-3)', fontFamily: 'DM Mono' }}>{b.id || 'PRES-???'}</span>
                            <span className={`badge ${b.estadoBadge || 'badge-amber'}`} style={{ fontSize: 10 }}>{b.estadoLabel || b.estado || 'Borrador'}</span>
                            {b.isBaseline && <span className="badge badge-green" style={{ fontSize: 9, padding: '1px 4px' }}>Línea Base</span>}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{b.titulo || 'Presupuesto'}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Creado el {b.fecha || 'N/A'}</div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div>
                            <div style={{ fontFamily: 'DM Mono', fontSize: 14, fontWeight: 700, color: b.isBaseline ? 'var(--accent)' : 'var(--text-2)' }}>
                              {money(totalB)}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--blue)', fontWeight: 500, marginTop: 2 }}>
                              Ver detalle →
                            </div>
                          </div>
                          <Icon name="chevron-right" size={14} style={{ color: 'var(--text-3)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tareas Diarias Asociadas */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tareas Diarias Asociadas</span>
              </div>

              {tareasAsociadas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 16px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface2)', color: 'var(--text-3)', fontSize: 12 }}>
                  <Icon name="check-square" size={20} style={{ marginBottom: 6, opacity: 0.5, display: 'block', margin: '0 auto 6px' }} />
                  No hay tareas asociadas a este proyecto aún.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tareasAsociadas.map(t => (
                    <div key={t.id || Math.random()} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <Icon name={t.hecho ? "check-circle" : "circle"} size={14} style={{ color: t.hecho ? 'var(--green)' : 'var(--text-3)' }} />
                      <span style={{ fontSize: 12, color: t.hecho ? 'var(--text-3)' : 'var(--text)', textDecoration: t.hecho ? 'line-through' : 'none', flex: 1 }}>
                        {t.titulo || 'Tarea sin título'}
                      </span>
                      <span className={`badge ${t.hecho ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 9 }}>
                        {t.hecho ? 'Completada' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cost Evolution Line Graph */}
            {sortedBudgets.length > 1 && (
              <div style={{ marginBottom: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 16 }}>Evolución del Costo</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', position: 'relative' }}>
                  <div style={{ position: 'absolute', height: 2, background: 'var(--border)', top: 12, left: '10%', right: '10%', zIndex: 1 }} />
                  {sortedBudgets.map((b, idx) => {
                    const totalB = safeGetBudgetTotal(b);
                    return (
                      <div
                        key={b.id || idx}
                        onClick={() => onVerPresupuesto && onVerPresupuesto(b.id || b.idNumerico)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, cursor: 'pointer' }}
                        title={`Ver detalle de versión ${b.version || 'v1.0'}`}
                      >
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
                        <span style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, marginTop: 6, color: 'var(--text)' }}>{b.version || 'v1.0'}</span>
                        <span style={{ fontSize: 10, fontFamily: 'DM Mono', color: b.isBaseline ? 'var(--accent)' : 'var(--text-3)', marginTop: 2 }}>{money(totalB)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

// ─── MODAL NUEVO PROYECTO COMPONENT ───────────────────────────────────────────
function ModalNuevoProyecto({ onClose, onGuardar, clientes = [], crearProyecto }) {
  const { usuarios = [] } = useAppContext();
  const teamMembers = getTeamMembers(usuarios);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('licencia-const');
  const [clienteId, setClienteId] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [estatus, setEstatus] = useState('pendiente');
  const [avance, setAvance] = useState(0);
  const [responsable, setResponsable] = useState(teamMembers[0]?.id || 'u1');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [alcance, setAlcance] = useState('');

  // Campos complementarios
  const [usoPrincipal, setUsoPrincipal] = useState('');
  const [usoComplementario, setUsoComplementario] = useState('');
  const [impactoPrincipal, setImpactoPrincipal] = useState('');
  const [impactoComplementario, setImpactoComplementario] = useState('');
  const [vialidadPrincipal, setVialidadPrincipal] = useState('');
  const [vialidadComplementaria, setVialidadComplementaria] = useState('');
  const [direccionesComplementarias, setDireccionesComplementarias] = useState([]);

  const handleAddDireccionComp = () => {
    if (direccionesComplementarias.length < 3) {
      setDireccionesComplementarias([...direccionesComplementarias, '']);
    }
  };

  const handleUpdateDireccionComp = (index, value) => {
    const updated = [...direccionesComplementarias];
    updated[index] = value;
    setDireccionesComplementarias(updated);
  };

  const handleRemoveDireccionComp = (index) => {
    setDireccionesComplementarias(direccionesComplementarias.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!nombre || isSubmitting) return;

    setIsSubmitting(true);

    const datosParaBackend = {
      nombre,
      clienteId: clienteId ? parseInt(clienteId) : 0,
      estatus,
      prioridad,
      avance: parseInt(avance) || 0,
      fechaInicio: new Date().toISOString()
    };

    try {
      // Delegamos la creación al hook → servicio de red → backend
      const proyectoCreado = await crearProyecto(datosParaBackend);

      const nuevo = {
        ...proyectoCreado,
        tipo,
        descripcion,
        responsable,
        ubicacion,
        alcance,
        usoPrincipal,
        usoComplementario,
        impactoPrincipal,
        impactoComplementario,
        vialidadPrincipal,
        vialidadComplementaria,
        direccionesComplementarias: direccionesComplementarias.filter(d => d && typeof d === 'string' && d.trim() !== '')
      };

      if (onGuardar) {
        onGuardar(nuevo);
      }
    } catch (error) {
      console.error("Hubo un problema al conectar con el Backend:", error);
      alert("No se pudo conectar con el servidor. Revisa la consola o tu conexión de red.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(3px)'
    }} onClick={() => !isSubmitting && onClose && onClose()}>
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
          <button
            className="btn btn-ghost"
            onClick={() => !isSubmitting && onClose && onClose()}
            disabled={isSubmitting}
            style={{ padding: 4, minWidth: 'auto', borderRadius: '50%' }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="form-grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Nombre del Proyecto *</label>
            <input
              className="form-control"
              placeholder="Ej: Condominio Los Encinos - Fase II"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Gestión</label>
            <select className="form-control" value={tipo} onChange={e => setTipo(e.target.value)} disabled={isSubmitting}>
              {Object.entries(TRAMITES_TIPOS).map(([key, val]) => (
                <option key={key} value={key}>{val.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Cliente Asociado</label>
            <select className="form-control" value={clienteId} onChange={e => setClienteId(e.target.value)} disabled={isSubmitting}>
              <option value="">— Seleccionar cliente —</option>
              {(clientes || []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Responsable del Trámite</label>
            <select className="form-control" value={responsable} onChange={e => setResponsable(e.target.value)} disabled={isSubmitting}>
              {teamMembers.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nombre} {e.rol ? `(${e.rol})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Estatus del Trámite</label>
            <select className="form-control" value={estatus} onChange={e => setEstatus(e.target.value)} disabled={isSubmitting}>
              <option value="pendiente">Pendiente</option>
              <option value="en-proceso">En Proceso</option>
              <option value="completado">Completado</option>
              <option value="pausado">Pausado</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Prioridad</label>
            <select className="form-control" value={prioridad} onChange={e => setPrioridad(e.target.value)} disabled={isSubmitting}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Avance Inicial (%)</label>
            <input className="form-control" type="number" min="0" max="100" value={avance} onChange={e => setAvance(e.target.value)} disabled={isSubmitting} />
          </div>

          {/* Ubicación e Info Territorial */}
          <div className="form-group" style={{ gridColumn: '1/-1', borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 6 }}>
            <label className="form-label">Dirección Principal (Ubicación) *</label>
            <input className="form-control" placeholder="Ej: Av. Juárez #204, Col. Centro" value={ubicacion} onChange={e => setUbicacion(e.target.value)} disabled={isSubmitting} />
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Direcciones Complementarias (Máx 3)</label>
              {direccionesComplementarias.length < 3 && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={handleAddDireccionComp}
                  disabled={isSubmitting}
                  style={{ padding: '2px 8px', fontSize: 11, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Icon name="plus" size={10} /> Agregar
                </button>
              )}
            </div>
            {direccionesComplementarias.map((dir, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', minWidth: 80 }}>Comp. {idx + 1}:</span>
                <input
                  className="form-control"
                  style={{ flex: 1 }}
                  placeholder={`Ej: Entrada de Proveedores`}
                  value={dir}
                  onChange={e => handleUpdateDireccionComp(idx, e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleRemoveDireccionComp(idx)}
                  disabled={isSubmitting}
                  style={{ padding: 6, minWidth: 'auto', color: 'var(--red)' }}
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Uso Principal</label>
            <input className="form-control" placeholder="Ej: Habitacional" value={usoPrincipal} onChange={e => setUsoPrincipal(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label className="form-label">Uso Complementario</label>
            <input className="form-control" placeholder="Ej: Comercial" value={usoComplementario} onChange={e => setUsoComplementario(e.target.value)} disabled={isSubmitting} />
          </div>

          <div className="form-group">
            <label className="form-label">Impacto Principal</label>
            <input className="form-control" placeholder="Ej: Urbano" value={impactoPrincipal} onChange={e => setImpactoPrincipal(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label className="form-label">Impacto Complementario</label>
            <input className="form-control" placeholder="Ej: Ambiental" value={impactoComplementario} onChange={e => setImpactoComplementario(e.target.value)} disabled={isSubmitting} />
          </div>

          <div className="form-group">
            <label className="form-label">Vialidad Principal</label>
            <input className="form-control" placeholder="Ej: Av. Juárez" value={vialidadPrincipal} onChange={e => setVialidadPrincipal(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label className="form-label">Vialidad Complementaria</label>
            <input className="form-control" placeholder="Ej: Calle 5" value={vialidadComplementaria} onChange={e => setVialidadComplementaria(e.target.value)} disabled={isSubmitting} />
          </div>

          {/* Detalles final */}
          <div className="form-group" style={{ gridColumn: '1/-1', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <label className="form-label">Alcance y Descripción Detallada</label>
            <textarea className="form-control" rows={3} placeholder="Define el alcance del proyecto..." value={alcance} onChange={e => setAlcance(e.target.value)} disabled={isSubmitting} />
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Resumen de Descripción Corta</label>
            <input className="form-control" placeholder="Resumen breve para listados..." value={descripcion} onChange={e => setDescripcion(e.target.value)} disabled={isSubmitting} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <button className="btn btn-secondary" onClick={() => !isSubmitting && onClose && onClose()} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!nombre || isSubmitting}
            style={{ opacity: (!nombre || isSubmitting) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isSubmitting ? (
              <>
                <Icon name="clock" size={14} className="spin" />
                <span>Guardando...</span>
              </>
            ) : (
              'Crear Proyecto'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Proyectos;

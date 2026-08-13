import React from 'react';
import { useAppContext } from '../core/context';
import { 
  TRAMITES_MOCK, 
  TRAMITES_TIPOS, 
  COLOR_MAP, 
  money
} from '../data/mockData';

const hoy = new Date();
const fmt = (d) => d.toISOString().split('T')[0];

export function Dashboard() {
  const { session, presupuestos, proyectos, clientes, tareas, setActive } = useAppContext();

  const getCliente = (id) => clientes.find(c => c.id === id);

  const clientPresupuestos = session.rol === 'cliente'
    ? presupuestos.filter(p => p.clienteId === session.clienteId)
    : presupuestos;

  const clientTramites = session.rol === 'cliente'
    ? TRAMITES_MOCK.filter(t => t.clienteId === session.clienteId)
    : TRAMITES_MOCK;

  const totalPresupuestos = clientPresupuestos.length;
  const aprobados = clientPresupuestos.filter(p => p.estado === 'aprobado' || !p.isBorrador).length;
  const totalProyectos = proyectos.length;
  const tareasHoy = session.rol === 'cliente' ? 0 : (tareas || []).filter(t => t.fecha === fmt(hoy) && !t.completada).length;
  const tramitesActivos = clientTramites.length;

  return (
    <div className="module-container">
      <div className="page-header">
        <div className="page-title">{session.rol === 'cliente' ? 'Mi Portal de Gestiones' : 'Dashboard General'}</div>
        <div className="page-subtitle">{session.rol === 'cliente' ? 'Consulta el estatus de tus trámites y presupuestos' : 'Vista ejecutiva'} · {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      <div className="metric-grid metric-grid-4">
        <div className="metric-card">
          <div className="metric-label">Total Presupuestos</div>
          <div className="metric-value" style={{ color: 'var(--text)' }}>{totalPresupuestos}</div>
          <div className="metric-sub">registrados en la plataforma</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Presupuestos Aprobados</div>
          <div className="metric-value text-green">{aprobados}</div>
          <div className="metric-sub">vínculados a proyectos</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Proyectos</div>
          <div className="metric-value text-amber">{totalProyectos}</div>
          <div className="metric-sub">en seguimiento</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Trámites Activos</div>
          <div className="metric-value" style={{ color: 'var(--blue)' }}>{tramitesActivos}</div>
          <div className="metric-sub">{session.rol === 'cliente' ? 'en gestión' : `${tareasHoy} tareas hoy`}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">Presupuestos Recientes</div>
          {clientPresupuestos.slice(0, 5).map(p => {
            const cli = getCliente(p.clienteId);
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.id} - {p.titulo}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{cli?.nombre || p.propietario || 'Cliente General'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${p.isBorrador ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 10 }}>
                    {p.isBorrador ? 'Borrador' : 'Aprobado'}
                  </span>
                </div>
              </div>
            );
          })}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setActive('presupuestos')}>
            {session.rol === 'cliente' ? 'Ver mis presupuestos →' : 'Ver todos →'}
          </button>
        </div>

        <div className="card">
          <div className="card-title">Trámites en Curso</div>
          {clientTramites.map(t => {
            const tipo = TRAMITES_TIPOS[t.tipo];
            const total = tipo.pasos.length;
            const pct = Math.round((t.pasoActual / total) * 100);
            const col = COLOR_MAP[tipo.color];
            return (
              <div key={t.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{t.id}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>{tipo.nombre}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.pasoActual}/{total} pasos</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: col }} />
                </div>
              </div>
            );
          })}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => setActive('proyectos')}>
            Ver todos los proyectos →
          </button>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;

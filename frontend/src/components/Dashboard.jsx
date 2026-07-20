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
  const { session, cotizaciones, conceptos, clientes, tareas, setActive } = useAppContext();

  const getConcepto = (clave) => conceptos.find(c => c.clave === clave);
  const getCliente = (id) => clientes.find(c => c.id === id);

  const cotTotal = (cot) => cot.conceptos.reduce((s, c) => {
    const con = getConcepto(c.clave);
    return s + (con ? con.precio * c.cantidad : 0);
  }, 0);

  const cotAbonado = (cot) => cot.abonos.reduce((s, a) => s + a, 0);
  const cotSaldo = (cot) => cotTotal(cot) - cotAbonado(cot);

  const clientCotizaciones = session.rol === 'cliente'
    ? cotizaciones.filter(c => c.clienteId === session.clienteId)
    : cotizaciones;

  const clientTramites = session.rol === 'cliente'
    ? TRAMITES_MOCK.filter(t => t.clienteId === session.clienteId)
    : TRAMITES_MOCK;

  const totalCotizado = clientCotizaciones.reduce((s, c) => s + cotTotal(c), 0);
  const totalAbonado = clientCotizaciones.reduce((s, c) => s + cotAbonado(c), 0);
  const pendienteCobro = clientCotizaciones.reduce((s, c) => s + Math.max(0, cotSaldo(c)), 0);
  const tareasHoy = session.rol === 'cliente' ? 0 : (tareas || []).filter(t => t.fecha === fmt(hoy) && !t.completada).length;
  const tramitesActivos = clientTramites.length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{session.rol === 'cliente' ? 'Mi Portal de Gestiones' : 'Dashboard General'}</div>
        <div className="page-subtitle">{session.rol === 'cliente' ? 'Consulta el estatus de tus trámites y pagos' : 'Vista ejecutiva'} · {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      <div className="metric-grid metric-grid-4">
        <div className="metric-card">
          <div className="metric-label">Total Cotizado</div>
          <div className="metric-value" style={{ color: 'var(--text)' }}>{money(totalCotizado)}</div>
          <div className="metric-sub">{clientCotizaciones.length} cotizaciones</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Abonado</div>
          <div className="metric-value text-green">{money(totalAbonado)}</div>
          <div className="metric-sub">{totalCotizado > 0 ? Math.round(totalAbonado / totalCotizado * 100) : 0}% del total</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Saldo Pendiente</div>
          <div className="metric-value text-amber">{money(pendienteCobro)}</div>
          <div className="metric-sub">por liquidar</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Trámites Activos</div>
          <div className="metric-value" style={{ color: 'var(--blue)' }}>{tramitesActivos}</div>
          <div className="metric-sub">{session.rol === 'cliente' ? 'en gestión' : `${tareasHoy} tareas hoy`}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">Cotizaciones Recientes</div>
          {clientCotizaciones.slice(0, 5).map(c => {
            const cli = getCliente(c.clienteId);
            const saldo = cotSaldo(c);
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.id}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{cli?.nombre}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{money(cotTotal(c))}</div>
                  <span className={`badge ${saldo <= 0 ? 'badge-green' : saldo < cotTotal(c) ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: 10 }}>
                    {saldo <= 0 ? 'Liquidada' : saldo < cotTotal(c) ? 'Parcial' : 'Sin abono'}
                  </span>
                </div>
              </div>
            );
          })}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setActive('cotizaciones')}>
            {session.rol === 'cliente' ? 'Ver mis cotizaciones →' : 'Ver todas →'}
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

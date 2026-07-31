import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../core/context';
import { descargarPresupuestoPDF } from '../utils/pdfExporter';
import { fetchHojasDeRuta } from '../services/hojasDeRutaService';
import { updatePresupuesto } from '../services/presupuestosService';
import Icon from './common/Icon';
import logoImg from '../logo.png';

// ── Helpers ──────────────────────────────────────────────────────────────────
const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const calcBudgetTotal = (p) => {
  if (!p) return 0;
  if (p.totalGeneral) return p.totalGeneral;
  if (p.total) return p.total;

  const conceptos = p.conceptos || [];
  if (conceptos.length > 0) {
    const subtotalHonorarios = conceptos.reduce((a, c) => a + (parseFloat(c.honorarios || c.precioUnitario) || 0), 0);
    const iva = subtotalHonorarios * 0.16;
    const derechos = conceptos.reduce((a, c) => a + (parseFloat(c.pagoDerechos) || 0), 0);
    const extras = conceptos.reduce((a, c) => a + (parseFloat(c.extra) || 0), 0);
    return subtotalHonorarios + iva + derechos + extras;
  }

  if (p.subtotalHonorarios) {
    const sub = parseFloat(p.subtotalHonorarios) || 0;
    const der = parseFloat(p.totalDerechos) || 0;
    const ext = parseFloat(p.totalExtras) || 0;
    return (sub * 1.16) + der + ext;
  }

  return 0;
};

const badgeClass = (estatus = '') => {
  const s = estatus.toLowerCase();
  if (['activo', 'en proceso', 'aprobado'].includes(s)) return 'badge badge-green';
  if (['pendiente', 'borrador', 'en preparación', 'en ventanilla única'].includes(s)) return 'badge badge-amber';
  if (['finalizado', 'completado'].includes(s)) return 'badge badge-blue';
  if (['cancelado', 'rechazado'].includes(s)) return 'badge badge-red';
  return 'badge badge-gray';
};

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_PROYECTO = {
  id: 'demo-pry-001',
  nombre: 'Residencial Los Aluxes - Etapa 1',
  estatus: 'En Proceso',
  prioridad: 'alta',
  avance: 38,
  fechaInicio: '2026-01-15',
  monto: 3200000,
  descripcion: 'Desarrollo residencial de 24 unidades en Mérida, Yucatán.',
};
const DEMO_PRESUPUESTO = {
  id: 'demo-pres-001',
  folio: 'PRES-2026-008',
  titulo: 'Gestión Integral - Residencial Los Aluxes',
  estatus: 'Pendiente',
  subtotalHonorarios: 42500,
  conceptos: [
    { id: 1, concepto: 'Licencia de Uso de Suelo', etapa: 'ETAPA 1: USO DE SUELO', unidad: 'GESTIÓN', honorarios: 15000, pagoDerechos: 5800, extra: 0, comentarios: '' },
    { id: 2, concepto: 'Manifestación de Impacto Urbano', etapa: 'ETAPA 1: USO DE SUELO', unidad: 'TRAMITE', honorarios: 18000, pagoDerechos: 3200, extra: 0, comentarios: '' },
    { id: 3, concepto: 'Dictamen de Alineamiento', etapa: 'ETAPA 1: USO DE SUELO', unidad: 'GESTIÓN', honorarios: 9500, pagoDerechos: 1200, extra: 0, comentarios: '' },
  ],
};
const DEMO_HOJAS = [
  { id: 'demo-hr-001', nombre: 'Licencia de Uso de Suelo', estatus: 'En Ventanilla Única', avance: 45, fechaEstimada: '2026-09-15', gestor: 'Arq. Gabriel López' },
  { id: 'demo-hr-002', nombre: 'Licencia de Construcción', estatus: 'En Preparación', avance: 10, fechaEstimada: '2026-11-30', gestor: 'Arq. Gabriel López' },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function PortalCliente() {
  const {
    session,
    clientes,
    proyectos,
    presupuestos,
    setPresupuestos,
    handleLogout,
  } = useAppContext();

  const [hojasDeRuta, setHojasDeRuta] = useState([]);
  const [demoMode, setDemoMode] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    fetchHojasDeRuta()
      .then(data => setHojasDeRuta(data || []))
      .catch(() => setHojasDeRuta([]));
  }, []);

  const clienteInfo = useMemo(() => {
    if (!session) return null;
    // 1. Direct ID match
    if (session.clienteId) {
      const byId = (clientes || []).find(c => String(c.id) === String(session.clienteId));
      if (byId) return byId;
    }
    // 2. Exact Name or Contact match
    const nameClean = (session.nombre || '').trim().toLowerCase();
    if (nameClean) {
      const byName = (clientes || []).find(c =>
        (c.nombre && c.nombre.trim().toLowerCase() === nameClean) ||
        (c.contacto && c.contacto.trim().toLowerCase() === nameClean)
      );
      if (byName) return byName;
    }
    // 4. Prefix / Fuzzy Name match (e.g. "pedrini" vs "Pedro")
    if (nameClean && nameClean.length >= 3) {
      const prefix = nameClean.slice(0, 3);
      const byFuzzy = (clientes || []).find(c =>
        (c.nombre && c.nombre.trim().toLowerCase().startsWith(prefix)) ||
        (c.contacto && c.contacto.trim().toLowerCase().startsWith(prefix))
      );
      if (byFuzzy) return byFuzzy;
    }
    // 5. Fallback if there is only 1 client record in system
    if ((clientes || []).length === 1) return clientes[0];

    return null;
  }, [clientes, session]);

  const clienteId = session?.clienteId || clienteInfo?.id;

  const misProyectos = useMemo(() => {
    if (demoMode) return [DEMO_PROYECTO];

    const targetIds = [
      clienteId ? String(clienteId) : null,
      clienteInfo?.id ? String(clienteInfo.id) : null
    ].filter(Boolean);

    const clientName = (clienteInfo?.nombre || session?.nombre || '').trim().toLowerCase();
    const prefixName = clientName.length >= 3 ? clientName.slice(0, 3) : clientName;

    return (proyectos || []).filter(p => {
      const matchId = targetIds.includes(String(p.clienteId));
      const matchCliNombre = prefixName && p.clienteNombre && p.clienteNombre.toLowerCase().includes(prefixName);
      const matchCliObj = prefixName && p.cliente && (typeof p.cliente === 'string' ? p.cliente : p.cliente.nombre)?.toLowerCase().includes(prefixName);
      const matchProp = prefixName && p.propietario && p.propietario.toLowerCase().includes(prefixName);
      return matchId || matchCliNombre || matchCliObj || matchProp;
    });
  }, [proyectos, clienteId, clienteInfo, session, demoMode]);

  const misPresupuestos = useMemo(() => {
    if (demoMode) return [DEMO_PRESUPUESTO];

    const targetIds = [
      clienteId ? String(clienteId) : null,
      clienteInfo?.id ? String(clienteInfo.id) : null
    ].filter(Boolean);

    const clientName = (clienteInfo?.nombre || session?.nombre || '').trim().toLowerCase();
    const prefixName = clientName.length >= 3 ? clientName.slice(0, 3) : clientName;

    return (presupuestos || []).filter(p => {
      const matchId = targetIds.includes(String(p.clienteId));
      const matchProj = misProyectos.some(proj =>
        String(proj.id) === String(p.proyectoId) ||
        String(proj.idNumerico) === String(p.proyectoId) ||
        (proj.nombre && p.proyectoNombre && proj.nombre.trim().toLowerCase() === p.proyectoNombre.trim().toLowerCase())
      );
      const matchProp = prefixName && p.propietario && p.propietario.toLowerCase().includes(prefixName);
      return matchId || matchProj || matchProp;
    });
  }, [presupuestos, clienteId, clienteInfo, session, misProyectos, demoMode]);

  const misHojas = useMemo(() => {
    if (demoMode) return DEMO_HOJAS;
    if (misProyectos.length === 0) return [];
    return (hojasDeRuta || []).filter(h =>
      misProyectos.some(p => String(p.id) === String(h.proyectoId) || String(p.idNumerico) === String(h.proyectoId))
    );
  }, [hojasDeRuta, misProyectos, demoMode]);

  const kpis = useMemo(() => {
    const activos = misProyectos.filter(p => ['activo', 'en proceso', 'en-proceso', 'pendiente'].includes((p.estatus || p.estado || '').toLowerCase())).length;
    const pendientes = misPresupuestos.filter(p => ['pendiente', 'borrador', 'enviado', 'en-revision'].includes((p.estado || p.estatus || '').toLowerCase())).length;
    const tramites = misHojas.filter(h => !['finalizado', 'completado'].includes((h.estatus || h.estado || '').toLowerCase())).length;
    const avance = misProyectos.length > 0
      ? Math.round(misProyectos.reduce((a, p) => a + (parseFloat(p.avance) || 0), 0) / misProyectos.length)
      : 0;
    return { activos, pendientes, tramites, avance };
  }, [misProyectos, misPresupuestos, misHojas]);

  const handleAprobar = async (pres) => {
    setApprovingId(pres.id);
    try {
      const updated = { ...pres, estatus: 'Aprobado' };
      await updatePresupuesto(pres.id, updated);
      setPresupuestos(prev => prev.map(p => p.id === pres.id ? updated : p));
    } catch {
      alert('No se pudo aprobar el presupuesto. Intenta más tarde.');
    } finally {
      setApprovingId(null);
    }
  };

  const nombreCliente = clienteInfo?.nombre || session?.nombre || 'Cliente';
  const rawContacto = clienteInfo?.contacto || session?.nombre || '';
  const contactoCliente = (rawContacto && rawContacto !== 'S/N' && rawContacto !== 'N/A') ? rawContacto : nombreCliente;
  const noHayDatos = !demoMode && misProyectos.length === 0 && misPresupuestos.length === 0;

  const navItems = [
    { id: 'overview',      label: 'Resumen',          icon: 'list'      },
    { id: 'proyectos',     label: 'Mis Proyectos',     icon: 'map'       },
    { id: 'presupuestos',  label: 'Mis Presupuestos',  icon: 'dollar'    },
    { id: 'tramites',      label: 'Trámites',          icon: 'task'      },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── TOPBAR ── */}
      <header style={{
        height: 56,
        background: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        gap: 16,
      }}>
        {/* Logo */}
        <img
          src={logoImg}
          alt="GIU Gestión Integral Urbana"
          style={{ height: 34, borderRadius: 4 }}
        />

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeSection === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeSection === item.id ? '#ffffff' : 'rgba(255,255,255,0.5)',
                fontWeight: activeSection === item.id ? 600 : 400,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
                borderLeft: activeSection === item.id ? '2px solid #4CA66A' : '2px solid transparent',
              }}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User widget */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: session?.color || 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff',
              flexShrink: 0,
            }}
          >
            {session?.avatar || (session?.nombre || 'C').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{session?.nombre || 'Cliente'}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Portal del Cliente</span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}
          >
            <Icon name="lock" size={13} />
          </button>
        </div>
      </header>

      {/* ── CONTENT AREA ── */}
      <div className="main-content">
        <div className="module-container">

          {/* Welcome banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #2D6A4F 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 28px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            boxShadow: '0 4px 20px rgba(42,95,63,0.2)',
          }}>
            <div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
                Bienvenido al portal exclusivo de
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                {contactoCliente || nombreCliente}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {nombreCliente}
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#facc15', fontFamily: 'DM Mono, monospace' }}>
                {kpis.avance}%
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
                Avance Global
              </div>
            </div>
          </div>

          {/* Demo banner */}
          {noHayDatos && (
            <div style={{
              background: 'var(--amber-light)',
              border: '1px dashed var(--amber)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--amber-text)', fontSize: 13 }}>Sin datos disponibles aún</div>
                <div style={{ fontSize: 12, color: 'var(--amber-text)', opacity: 0.8, marginTop: 2 }}>
                  Carga la demo de "Inmobiliaria Maya S.A. de C.V." para explorar el portal.
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setDemoMode(true)}
              >
                <Icon name="plus" size={12} /> Cargar Demo
              </button>
            </div>
          )}

          {demoMode && (
            <div style={{
              background: 'var(--accent-light)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 16px',
              marginBottom: 18,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12.5,
              color: 'var(--accent-text)',
              fontWeight: 500,
            }}>
              <span>✓ Modo Demo — Inmobiliaria Maya S.A. de C.V. / Residencial Los Aluxes</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDemoMode(false)}
                style={{ fontSize: 11 }}
              >
                Desactivar
              </button>
            </div>
          )}

          {/* ── TAB SECTIONS ── */}

          {/* OVERVIEW */}
          {activeSection === 'overview' && (
            <>
              {/* KPI metrics */}
              <div className="metric-grid metric-grid-4" style={{ marginBottom: 24 }}>
                <div className="metric-card">
                  <div className="metric-label">Proyectos Activos</div>
                  <div className="metric-value text-green">{kpis.activos}</div>
                  <div className="metric-sub">{misProyectos.length} total asignados</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Pend. Aprobación</div>
                  <div className="metric-value" style={{ color: 'var(--amber)' }}>{kpis.pendientes}</div>
                  <div className="metric-sub">presupuestos esperando</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Trámites en Curso</div>
                  <div className="metric-value" style={{ color: 'var(--blue)' }}>{kpis.tramites}</div>
                  <div className="metric-sub">hojas de ruta activas</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Avance Global</div>
                  <div className="metric-value" style={{ color: 'var(--accent)' }}>{kpis.avance}%</div>
                  <div className="metric-sub">promedio de proyectos</div>
                </div>
              </div>

              <div className="two-col" style={{ marginBottom: 0 }}>
                {/* Proyectos */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div className="card-title" style={{ marginBottom: 0 }}>Mis Proyectos</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setActiveSection('proyectos')}>
                      Ver todos →
                    </button>
                  </div>
                  {misProyectos.slice(0, 3).map(p => (
                    <ProyectoItem key={p.id} proyecto={p} />
                  ))}
                  {misProyectos.length === 0 && <EmptyState msg="Sin proyectos asignados." />}
                </div>

                {/* Presupuestos */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div className="card-title" style={{ marginBottom: 0 }}>Últimos Presupuestos</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setActiveSection('presupuestos')}>
                      Ver todos →
                    </button>
                  </div>
                  {misPresupuestos.slice(0, 4).map((p, i) => (
                    <PresupuestoItem
                      key={p.id}
                      pres={p}
                      isLast={i === Math.min(misPresupuestos.length, 4) - 1}
                      onAprobar={() => handleAprobar(p)}
                      isApproving={approvingId === p.id}
                    />
                  ))}
                  {misPresupuestos.length === 0 && <EmptyState msg="Sin presupuestos disponibles." />}
                </div>
              </div>
            </>
          )}

          {/* PROYECTOS */}
          {activeSection === 'proyectos' && (
            <>
              <div className="page-header">
                <div className="page-title">Mis Proyectos</div>
                <div className="page-subtitle">{misProyectos.length} proyecto(s) asignados a tu cuenta</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {misProyectos.map(p => (
                  <ProyectoCard key={p.id} proyecto={p} />
                ))}
                {misProyectos.length === 0 && <EmptyState msg="No tienes proyectos asignados aún." />}
              </div>
            </>
          )}

          {/* PRESUPUESTOS */}
          {activeSection === 'presupuestos' && (
            <>
              <div className="page-header">
                <div className="page-title">Mis Presupuestos</div>
                <div className="page-subtitle">{misPresupuestos.length} presupuesto(s) en tu portal</div>
              </div>
              <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th>Folio / Título</th>
                      <th>Estatus</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {misPresupuestos.map(p => {
                      const total = calcBudgetTotal(p);
                      const isPending = ['pendiente', 'borrador'].includes((p.estatus || '').toLowerCase());
                      return (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.titulo || p.folio || `Presupuesto #${p.id}`}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{p.folio || p.id}</div>
                          </td>
                          <td>
                            <span className={badgeClass(p.estatus || 'borrador')}>{p.estatus || 'Borrador'}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'DM Mono, monospace', fontSize: 13 }}>
                            {money(total)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              {isPending && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  disabled={approvingId === p.id}
                                  onClick={() => handleAprobar(p)}
                                >
                                  {approvingId === p.id ? '...' : '✓ Aprobar'}
                                </button>
                              )}
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => { try { descargarPresupuestoPDF(p, p.conceptos || []); } catch { alert('No se pudo generar el PDF.'); } }}
                              >
                                <Icon name="download" size={12} /> PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {misPresupuestos.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-3)', padding: 32 }}>
                          No tienes presupuestos registrados actualmente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TRÁMITES */}
          {activeSection === 'tramites' && (
            <>
              <div className="page-header">
                <div className="page-title">Seguimiento de Trámites</div>
                <div className="page-subtitle">Estado actualizado de tus hojas de ruta y gestiones</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {misHojas.map(h => (
                  <HojaCard key={h.id} hoja={h} />
                ))}
                {misHojas.length === 0 && (
                  <div className="card">
                    <EmptyState msg="No hay hojas de ruta activas para tus proyectos." />
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Sub-components (usando clases del sistema) ────────────────────────────────

function ProyectoItem({ proyecto: p }) {
  const avance = parseFloat(p.avance) || 0;
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.nombre}</div>
        <span className={badgeClass(p.estatus || 'activo')}>{p.estatus || 'Activo'}</span>
      </div>
      <div style={{ background: 'var(--border)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${avance}%`, height: '100%', background: 'var(--accent)', borderRadius: 4, transition: 'width 0.6s' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{avance}% completado</div>
    </div>
  );
}

function ProyectoCard({ proyecto: p }) {
  const avance = parseFloat(p.avance) || 0;
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, flex: 1, paddingRight: 8 }}>
          {p.nombre || 'Proyecto sin nombre'}
        </div>
        <span className={badgeClass(p.estatus || 'activo')}>{p.estatus || 'Activo'}</span>
      </div>
      {p.descripcion && (
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
          {p.descripcion}
        </div>
      )}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Avance de trámites</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{avance}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${avance}%`, background: 'var(--accent)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        {p.fechaInicio && (
          <div style={{ fontSize: 11.5, color: 'var(--text-2)' }}>
            Inicio: <strong>{p.fechaInicio}</strong>
          </div>
        )}
        {p.monto > 0 && (
          <div style={{ fontSize: 11.5, color: 'var(--text-2)' }}>
            Monto obra: <strong style={{ fontFamily: 'DM Mono' }}>
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(p.monto)}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

function PresupuestoItem({ pres: p, isLast, onAprobar, isApproving }) {
  const total = calcBudgetTotal(p);
  const isPending = ['pendiente', 'borrador'].includes((p.estatus || '').toLowerCase());
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      gap: 8,
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {p.titulo || p.folio || `Presupuesto #${p.id}`}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
          {money(total)}
        </div>
      </div>
      <span className={badgeClass(p.estatus || 'borrador')}>{p.estatus || 'Borrador'}</span>
      {isPending && (
        <button className="btn btn-primary btn-sm" onClick={onAprobar} disabled={isApproving}>
          {isApproving ? '...' : '✓ Aprobar'}
        </button>
      )}
    </div>
  );
}

function HojaCard({ hoja: h }) {
  const avance = parseFloat(h.avance) || 0;
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          {h.nombre || h.titulo || 'Trámite sin nombre'}
        </div>
        <span className={badgeClass(h.estatus || 'En Proceso')}>{h.estatus || 'En Proceso'}</span>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Avance del trámite</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{avance}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${avance}%`, background: 'var(--blue)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)' }}>
        {h.fechaEstimada && <span>Estimado: <strong>{h.fechaEstimada}</strong></span>}
        {h.gestor && <span>Gestor: <strong>{h.gestor}</strong></span>}
      </div>
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
      {msg}
    </div>
  );
}

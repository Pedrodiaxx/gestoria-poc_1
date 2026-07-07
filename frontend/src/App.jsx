import React, { useState, useEffect } from 'react';
import { useAppContext } from './core/context';
import {
  Home,
  Sidebar,
  Dashboard,
  Catalogo,
  Cotizaciones,
  Presupuestos,
  HojasRuta,
  Proyectos,
  Clientes,
  TareasDiarias,
  Administracion,
  Login
} from './components';
import { TAREAS_MOCK, getDefaultModulos } from './data/mockData';

export default function App() {
  const {
    active,
    setActive,
    session,
    clientes,
    usuarios,
    conceptos,
    cotizaciones,
    handleLogin,
    handleLogout
  } = useAppContext();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [active]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Route Guard / Tab permission protection
  useEffect(() => {
    if (session) {
      const allowed = session.modulos && session.modulos.length > 0
        ? session.modulos
        : getDefaultModulos(session.rol);
      const restrictedTabs = ['presupuestos', 'administracion', 'tareas', 'catalogo', 'cotizaciones', 'proyectos', 'clientes'];
      if (restrictedTabs.includes(active) && !allowed.includes(active)) {
        const nextActive = allowed.length > 0 ? allowed[0] : 'dashboard';
        setActive(nextActive);
      }
    }
  }, [active, session, setActive]);

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      {/* Mobile header — only visible ≤768px via CSS */}
      <div className="mobile-header">
        <button className="mobile-header-burger" onClick={() => setSidebarOpen(prev => !prev)} aria-label="Abrir menú">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarOpen
              ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
            }
          </svg>
        </button>
        <div className="mobile-header-logo">
          <div>GIU</div>
          <div className="tagline">Gestoría de Construcción</div>
        </div>
      </div>

      {/* Sidebar overlay for mobile — click to close */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content" style={{ padding: active === 'home' ? '0' : undefined }}>
        {active === 'home' && <Home setActive={setActive} />}
        {active === 'dashboard' && <Dashboard cotizaciones={cotizaciones} tareas={TAREAS_MOCK} setActive={setActive} session={session} />}
        {active === 'catalogo' && <Catalogo />}
        {active === 'cotizaciones' && <Cotizaciones />}
        {active === 'presupuestos' && <Presupuestos />}
        {active === 'tramites' && <HojasRuta session={session} />}
        {active === 'proyectos' && <Proyectos />}
        {active === 'clientes' && <Clientes />}
        {active === 'tareas' && <TareasDiarias />}
        {active === 'administracion' && <Administracion />}
      </main>
    </div>
  );
}

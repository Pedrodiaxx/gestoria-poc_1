import React, { useEffect } from 'react';
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
      <Sidebar active={active} setActive={setActive} session={session} onLogout={handleLogout} />
      <main className="main-content" style={{ padding: active === 'home' ? '0' : '32px 36px' }}>
        {active === 'home' && <Home setActive={setActive} />}
        {active === 'dashboard' && <Dashboard cotizaciones={cotizaciones} tareas={TAREAS_MOCK} setActive={setActive} session={session} />}
        {active === 'catalogo' && <Catalogo />}
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


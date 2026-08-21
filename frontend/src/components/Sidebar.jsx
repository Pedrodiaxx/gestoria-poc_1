import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { getDefaultModulos } from '../data/mockData';
import logoImg from '../assets/logo-metallic-plaque.png';

// ─── Flyout Portal (renderiza en document.body para evitar clipping del sidebar) ──
function PresupuestosFlyout({ anchorRef, visible, onOpen, onClose, allowed, session, clientes, conceptos, proyectos, setActive, setSidebarOpen }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (visible && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      // Posición pegada exactamente al borde derecho del nav-item (con 2px de solape para el puente de hover)
      setPos({ top: rect.top, left: rect.right });
    }
  }, [visible, anchorRef]);

  const handleClick = (e, tab) => {
    e.stopPropagation();
    setActive(tab);
    if (setSidebarOpen) setSidebarOpen(false);
    onClose();
  };

  if (!visible) return null;

  return ReactDOM.createPortal(
    <div
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width: 235,
        paddingLeft: 6, // Puente invisible para que el cursor no pierda el hover al cruzar
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          background: '#FFFFFF',
          border: '1px solid #E2E0D8',
          borderRadius: 12,
          boxShadow: '0 12px 36px -6px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)',
          padding: '10px 8px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(-8px)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header sin icono de rayo */}
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#2A5F3F',
          letterSpacing: '0.6px', padding: '2px 6px 8px',
          borderBottom: '1px solid #E2E0D8', marginBottom: 6,
          textTransform: 'uppercase',
        }}>
          ACCESO RÁPIDO
        </div>

        {/* Clientes */}
        {allowed.includes('clientes') && (
          <FlyoutItem
            icon="user"
            label="Clientes"
            desc="Directorio comercial"
            count={(clientes || []).length}
            onClick={(e) => handleClick(e, 'clientes')}
          />
        )}

        {/* Conceptos */}
        {allowed.includes('catalogo') && (
          <FlyoutItem
            icon="list"
            label="Conceptos"
            desc="Catálogo de servicios"
            count={(conceptos || []).length}
            onClick={(e) => handleClick(e, 'catalogo')}
          />
        )}

        {/* Proyectos */}
        {(session.rol === 'admin' || session.rol === 'empleado' || session.rol === 'gestor') && (
          <FlyoutItem
            icon="folder"
            label="Proyectos"
            desc="Predios y estatus"
            count={(proyectos || []).length}
            onClick={(e) => handleClick(e, 'proyectos')}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

function FlyoutItem({ icon, label, desc, count, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        background: hovered ? 'rgba(42,95,63,0.07)' : 'transparent',
        border: 'none', cursor: 'pointer',
        padding: '7px 8px', borderRadius: 8, textAlign: 'left',
        transition: 'background 0.12s',
      }}
    >
      <span style={{
        width: 30, height: 30, borderRadius: 8,
        background: hovered ? 'rgba(42,95,63,0.15)' : 'rgba(42,95,63,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        transition: 'background 0.12s',
      }}>
        <Icon name={icon} size={13} style={{ color: '#2A5F3F' }} />
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1A1916' }}>{label}</span>
        <span style={{ display: 'block', fontSize: 10, color: '#9C9A94', marginTop: 1 }}>{desc}</span>
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700, color: '#2A5F3F',
        background: '#EBF3EE', padding: '2px 6px', borderRadius: 5,
      }}>
        {count}
      </span>
    </button>
  );
}

// ─── SIDEBAR PRINCIPAL ──────────────────────────────────────────────────────────
export function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { active, setActive, session, handleLogout, clientes = [], conceptos = [], proyectos = [] } = useAppContext();
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const presupuestosRef = useRef(null);
  const closeTimer = useRef(null);

  const handleNavClick = (id) => {
    setActive(id);
    if (setSidebarOpen) setSidebarOpen(false);
    setFlyoutOpen(false);
  };

  const openFlyout = () => {
    clearTimeout(closeTimer.current);
    setFlyoutOpen(true);
  };

  const closeFlyout = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setFlyoutOpen(false), 250);
  };

  if (!session) return null;

  const allowed = session.modulos && session.modulos.length > 0
    ? session.modulos
    : getDefaultModulos(session.rol);

  const dynamicNavItems = (session.rol === 'cliente' ? [
    { id: 'presupuestos', label: 'Mis Presupuestos', icon: 'dollar' },
    { id: 'tramites', label: 'Mis Trámites', icon: 'map' },
  ] : [
    { id: 'presupuestos', label: 'Presupuestos', icon: 'dollar' },
    { id: 'administracion', label: 'Administración', icon: 'shield' },
    { id: 'clientes', label: 'Clientes', icon: 'user' },
    { id: 'catalogo', label: 'Conceptos', icon: 'file' },
    { id: 'proyectos', label: 'Proyectos', icon: 'map' },
    { id: 'tramites', label: 'Hojas de Ruta', icon: 'map' },
    { id: 'tareas', label: 'Tareas Diarias', icon: 'task' },
  ]).filter(item => {
    if (item.id === 'tramites' || item.id === 'clientes') return true;
    return allowed.includes(item.id);
  });

  const getRolLabel = (rolId) => {
    const saved = localStorage.getItem('giu_roles');
    const rolesList = saved ? JSON.parse(saved) : [];
    const found = rolesList.find(r => r.id === rolId);
    if (found) return found.label;
    if (rolId === 'admin') return 'Administrador';
    if (rolId === 'empleado' || rolId === 'gestor') return 'Gestor';
    if (rolId === 'cliente') return 'Cliente';
    return rolId.charAt(0).toUpperCase() + rolId.slice(1);
  };

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div
          className="sidebar-logo"
          onClick={() => { setActive('home'); if (setSidebarOpen) setSidebarOpen(false); }}
          style={{
            cursor: 'pointer', padding: '24px 20px',
            background: 'transparent', border: 'none', boxShadow: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <img src={logoImg} alt="GIU" style={{ maxWidth: '140px', height: 'auto', display: 'block', borderRadius: '4px' }} />
        </div>

        <div className="sidebar-section-label">Módulos</div>

        {dynamicNavItems.map(n => {
          const isPresupuestos = n.id === 'presupuestos';

          return (
            <div
              key={n.id}
              ref={isPresupuestos ? presupuestosRef : undefined}
              className={`nav-item ${active === n.id ? 'active' : ''}`}
              onClick={() => handleNavClick(n.id)}
              onMouseEnter={isPresupuestos && session.rol !== 'cliente' ? openFlyout : undefined}
              onMouseLeave={isPresupuestos && session.rol !== 'cliente' ? closeFlyout : undefined}
            >
              <Icon name={n.icon} size={15} />
              <span>{n.label}</span>
            </div>
          );
        })}

        <div className="sidebar-user-widget">
          <div className="sidebar-user-avatar" style={{ background: session.color }}>
            {session.avatar}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{session.nombre}</div>
            <div className="sidebar-user-role">{getRolLabel(session.rol)}</div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Cerrar Sesión">
            <Icon name="lock" size={14} />
          </button>
        </div>
      </aside>

      {/* Flyout Portal — renderiza fuera del sidebar para evitar overflow clipping */}
      <PresupuestosFlyout
        anchorRef={presupuestosRef}
        visible={flyoutOpen}
        onOpen={openFlyout}
        onClose={closeFlyout}
        allowed={allowed}
        session={session}
        clientes={clientes}
        conceptos={conceptos}
        proyectos={proyectos}
        setActive={setActive}
        setSidebarOpen={setSidebarOpen}
      />
    </>
  );
}

export default Sidebar;

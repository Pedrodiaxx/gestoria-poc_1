import React from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { getDefaultModulos } from '../data/mockData';

export function Sidebar() {
  const { active, setActive, session, handleLogout } = useAppContext();

  const handleSectionClick = (e, targetTab) => {
    e.stopPropagation();
    setActive(targetTab);
  };

  if (!session) return null;

  const allowed = session.modulos && session.modulos.length > 0
    ? session.modulos
    : getDefaultModulos(session.rol);

  const dynamicNavItems = (session.rol === 'cliente' ? [
    { id: 'cotizaciones', label: 'Mis Cotizaciones', icon: 'receipt' },
    { id: 'presupuestos', label: 'Mis Presupuestos', icon: 'dollar' },
    { id: 'tramites', label: 'Mis Trámites', icon: 'map' },
  ] : [
    { id: 'presupuestos', label: 'Presupuestos', icon: 'dollar' },
    { id: 'administracion', label: 'Administración', icon: 'shield' },
    { id: 'clientes', label: 'Clientes', icon: 'user' },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: 'receipt' },
    { id: 'catalogo', label: 'Catálogo', icon: 'file' },
    { id: 'proyectos', label: 'Proyectos', icon: 'map' },
    { id: 'tareas', label: 'Tareas Diarias', icon: 'task' },
  ]).filter(item => {
    if (session.rol === 'cliente' && item.id === 'tramites') return true;
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
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => setActive('home')} style={{ cursor: 'pointer' }}>
        <div className="wordmark">GIU</div>
        <div className="tagline">Gestoría de Construcción</div>
      </div>
      <div className="sidebar-section-label">Módulos</div>
      {dynamicNavItems.map(n => (
        <div key={n.id} className={`nav-item ${active === n.id ? 'active' : ''}`} onClick={() => setActive(n.id)}>
          <Icon name={n.icon} size={15} />
          <span>{n.label}</span>

          {session.rol !== 'cliente' && (
            <div className="hover-card" onClick={(e) => e.stopPropagation()}>
              <div className="hover-card-header">Accesos Rápidos</div>
              <div className="hover-card-sections">
                {allowed.includes('catalogo') && (
                  <div className="hover-section" onClick={(e) => handleSectionClick(e, 'catalogo')}>
                    <div className="hover-section-icon" style={{ color: 'var(--accent)' }}>
                      <Icon name="list" size={13} />
                    </div>
                    <div className="hover-section-content">
                      <div className="hover-section-title">Conceptos</div>
                      <div className="hover-section-desc">Precios y claves</div>
                    </div>
                  </div>
                )}
                {allowed.includes('clientes') && (
                  <div className="hover-section" onClick={(e) => handleSectionClick(e, 'clientes')}>
                    <div className="hover-section-icon" style={{ color: 'var(--blue)' }}>
                      <Icon name="user" size={13} />
                    </div>
                    <div className="hover-section-content">
                      <div className="hover-section-title">Clientes</div>
                      <div className="hover-section-desc">Directorio de contactos</div>
                    </div>
                  </div>
                )}
                {(session.rol === 'admin' || session.rol === 'empleado' || session.rol === 'gestor') && (
                  <div className="hover-section" onClick={(e) => handleSectionClick(e, 'proyectos')}>
                    <div className="hover-section-icon" style={{ color: 'var(--amber)' }}>
                      <Icon name="map" size={13} />
                    </div>
                    <div className="hover-section-content">
                      <div className="hover-section-title">Proyectos</div>
                      <div className="hover-section-desc">Ver todos los proyectos</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
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
  );
}
export default Sidebar;

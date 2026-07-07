import React, { useState } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { Catalogo } from './Catalogo';
import { getDefaultModulos } from '../data/mockData';
import { filterUsersQuery } from '../core/cqrs/queries/userQueries';

export default function Administracion() {
  const {
    conceptos,
    setConceptos,
    usuarios,
    session,
    setSession,
    rolesList,
    setRolesList,
    setActive,
    addUser,
    saveUserEdit,
    deleteUser
  } = useAppContext();

  const [adminTab, setAdminTab] = useState('conceptos');
  const [qUsuarios, setQUsuarios] = useState('');
  const [showAddUsuarioModal, setShowAddUsuarioModal] = useState(false);
  const [showEditUsuarioModal, setShowEditUsuarioModal] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '', email: '', contrasenia: '', rol: 'gestor', modulos: getDefaultModulos('gestor')
  });
  const [editandoUsuario, setEditandoUsuario] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  const [showNuevoPassword, setShowNuevoPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const [showAddRoleInput, setShowAddRoleInput] = useState(false);
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [showAddRoleInputEdit, setShowAddRoleInputEdit] = useState(false);
  const [newRoleLabelEdit, setNewRoleLabelEdit] = useState('');

  const handleCreateRole = () => {
    const label = newRoleLabel.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, '-');
    if (rolesList.some(r => r.id === id)) {
      alert(`El rol "${label}" ya existe.`);
      return;
    }
    const newRole = { id, label };
    setRolesList(prev => [...prev, newRole]);
    setNuevoUsuario(prev => ({
      ...prev,
      rol: id,
      modulos: prev.modulos || getDefaultModulos(id)
    }));
    setShowAddRoleInput(false);
    setNewRoleLabel('');
  };

  const handleCreateRoleEdit = () => {
    const label = newRoleLabelEdit.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, '-');
    if (rolesList.some(r => r.id === id)) {
      alert(`El rol "${label}" ya existe.`);
      return;
    }
    const newRole = { id, label };
    setRolesList(prev => [...prev, newRole]);
    setEditandoUsuario(prev => ({
      ...prev,
      rol: id,
      modulos: prev.modulos || getDefaultModulos(id)
    }));
    setShowAddRoleInputEdit(false);
    setNewRoleLabelEdit('');
  };

  const getRolLabel = (rolId) => {
    const found = rolesList.find(r => r.id === rolId);
    if (found) return found.label;
    if (rolId === 'admin') return 'Administrador';
    if (rolId === 'empleado' || rolId === 'gestor') return 'Gestor';
    if (rolId === 'cliente') return 'Cliente';
    return rolId.charAt(0).toUpperCase() + rolId.slice(1);
  };

  const filteredUsuarios = filterUsersQuery(usuarios || [], qUsuarios, getRolLabel);

  const handleAddUsuario = () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.contrasenia) return;
    const emailClean = nuevoUsuario.email.trim().toLowerCase();

    if (usuarios.some(u => u.email.toLowerCase() === emailClean)) {
      alert(`El correo "${emailClean}" ya está registrado.`);
      return;
    }

    const words = nuevoUsuario.nombre.trim().split(' ');
    const avatar = words.map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'U';
    const colors = ['#2A5F3F', '#1A5276', '#5B2C6F', '#B87A0A', '#8E44AD', '#34495E', '#16A085'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const modulos = nuevoUsuario.modulos || [];
    const rol = nuevoUsuario.rol;

    const nuevo = {
      id: `usr-${Date.now()}`,
      nombre: nuevoUsuario.nombre.trim(),
      email: emailClean,
      contrasenia: nuevoUsuario.contrasenia,
      rol,
      modulos,
      avatar,
      color
    };

    addUser(nuevo);
    setShowAddUsuarioModal(false);
    setNuevoUsuario({ nombre: '', email: '', contrasenia: '', rol: 'gestor', modulos: getDefaultModulos('gestor') });
  };

  const handleEditClick = (u) => {
    setEditandoUsuario({
      ...u,
      modulos: u.modulos || getDefaultModulos(u.rol)
    });
    setShowEditUsuarioModal(true);
  };

  const handleSaveEditUsuario = () => {
    if (!editandoUsuario.nombre || !editandoUsuario.email || !editandoUsuario.contrasenia) return;
    const emailClean = editandoUsuario.email.trim().toLowerCase();

    if (usuarios.some(u => u.email.toLowerCase() === emailClean && u.id !== editandoUsuario.id)) {
      alert(`El correo "${emailClean}" ya está en uso por otro usuario.`);
      return;
    }

    const words = editandoUsuario.nombre.trim().split(' ');
    const avatar = words.map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'U';

    const modulos = editandoUsuario.modulos || [];
    const rol = editandoUsuario.rol;

    const updatedUser = {
      ...editandoUsuario,
      nombre: editandoUsuario.nombre.trim(),
      email: emailClean,
      rol,
      modulos,
      avatar
    };

    saveUserEdit(updatedUser);

    if (session.id === editandoUsuario.id) {
      const updatedSession = {
        ...session,
        nombre: editandoUsuario.nombre.trim(),
        email: emailClean,
        rol,
        modulos,
        avatar
      };
      sessionStorage.setItem('giu_session', JSON.stringify(updatedSession));
      setSession(updatedSession);
    }

    setShowEditUsuarioModal(false);
    setEditandoUsuario(null);
  };

  const handleEliminarUsuario = (u) => {
    if (u.email.toLowerCase() === 'gabrielcoc@gmail.com') {
      alert('No se puede eliminar el administrador principal.');
      return;
    }
    if (u.id === session.id) {
      alert('No puedes eliminar tu propio usuario activo.');
      return;
    }
    setUsuarioAEliminar(u);
  };

  const confirmEliminarUsuario = () => {
    if (!usuarioAEliminar) return;
    deleteUser(usuarioAEliminar.id);
    setUsuarioAEliminar(null);
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Módulo Administrativo</div>
          <div className="page-subtitle">Administración de catálogo de trámites y control de usuarios</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-4">
        <button
          className={`tab-btn ${adminTab === 'conceptos' ? 'active' : ''}`}
          onClick={() => setAdminTab('conceptos')}
        >
          Catálogo Trámites
        </button>

        {session.rol === 'admin' && (
          <button
            className={`tab-btn ${adminTab === 'usuarios' ? 'active' : ''}`}
            onClick={() => setAdminTab('usuarios')}
          >
            Control de Usuarios
          </button>
        )}
      </div>

      {/* Subview Conceptos */}
      {adminTab === 'conceptos' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Servicios / Trámites Disponibles</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setActive('catalogo')}>
                Ver en módulo de Catálogo →
              </button>
            </div>
            <Catalogo conceptos={conceptos} setConceptos={setConceptos} />
          </div>
        </div>
      )}

      {/* Subview Usuarios */}
      {adminTab === 'usuarios' && session.rol === 'admin' && (
        <div className="card" style={{ animation: 'slideUpLogin 0.5s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="search-wrap" style={{ maxWidth: 380, flex: 1 }}>
              <Icon name="search" size={14} />
              <input
                className="form-control search-input"
                placeholder="Buscar usuarios por nombre, correo o rol…"
                value={qUsuarios}
                onChange={e => setQUsuarios(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddUsuarioModal(true)}>
              <Icon name="plus" size={14} /> Registrar Usuario
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo Electrónico</th>
                  <th>Contraseña</th>
                  <th>Rol</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="sidebar-user-avatar" style={{ background: u.color, width: 28, height: 28, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', borderRadius: '50%', fontWeight: 'bold' }}>
                          {u.avatar}
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{u.nombre}</div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-2)' }}>{u.email}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-2)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, userSelect: 'all' }}>
                          {visiblePasswords[u.id] ? u.contrasenia : '••••••••'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => togglePasswordVisibility(u.id)}
                          style={{ padding: '2px 4px', display: 'inline-flex', alignItems: 'center', color: 'var(--text-3)', height: 'auto', border: 'none', background: 'none' }}
                          title={visiblePasswords[u.id] ? "Ocultar Contraseña" : "Mostrar Contraseña"}
                        >
                          <Icon name={visiblePasswords[u.id] ? "eyeoff" : "eye"} size={13} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.rol === 'admin' ? 'badge-green' : (u.rol === 'empleado' || u.rol === 'gestor') ? 'badge-blue' : u.rol === 'cliente' ? 'badge-purple' : 'badge-gray'}`}>
                        {getRolLabel(u.rol)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(u)} title="Editar">
                          <Icon name="edit" size={12} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleEliminarUsuario(u)}
                          disabled={u.email.toLowerCase() === 'gabrielcoc@gmail.com' || u.id === session.id}
                          title="Eliminar"
                          style={{ opacity: (u.email.toLowerCase() === 'gabrielcoc@gmail.com' || u.id === session.id) ? 0.3 : 1, cursor: (u.email.toLowerCase() === 'gabrielcoc@gmail.com' || u.id === session.id) ? 'not-allowed' : 'pointer' }}
                        >
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUsuarioModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddUsuarioModal(false)}>
          <div className="modal" style={{ animation: 'slideUpLogin 0.3s ease-out' }}>
            <div className="modal-title">Registrar Nuevo Usuario</div>

            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <input
                className="form-control"
                placeholder="Ej: Juan Pérez"
                value={nuevoUsuario.nombre}
                onChange={e => setNuevoUsuario(n => ({ ...n, nombre: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo Electrónico *</label>
              <input
                className="form-control"
                type="email"
                placeholder="Ej: juan@gestoria.com"
                value={nuevoUsuario.email}
                onChange={e => setNuevoUsuario(n => ({ ...n, email: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showNuevoPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={nuevoUsuario.contrasenia}
                  onChange={e => setNuevoUsuario(n => ({ ...n, contrasenia: e.target.value }))}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNuevoPassword(!showNuevoPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showNuevoPassword ? "Ocultar" : "Mostrar"}
                >
                  <Icon name={showNuevoPassword ? "eyeoff" : "eye"} size={16} />
                </button>
              </div>
            </div>

            {/* Asignar Rol */}
            <div className="form-group">
              <label className="form-label">Asignar Rol *</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  className="form-control"
                  value={nuevoUsuario.rol}
                  onChange={e => {
                    const selectedRol = e.target.value;
                    setNuevoUsuario(n => ({
                      ...n,
                      rol: selectedRol,
                      modulos: n.modulos || getDefaultModulos(selectedRol)
                    }));
                  }}
                  style={{ flex: 1 }}
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddRoleInput(!showAddRoleInput)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  + Nuevo Rol
                </button>
              </div>

              {showAddRoleInput && (
                <div style={{ background: 'var(--surface2)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6, fontWeight: 600 }}>Agregar Nuevo Rol</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="form-control"
                      placeholder="Ej: Auditor"
                      value={newRoleLabel}
                      onChange={e => setNewRoleLabel(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateRole}
                    >
                      Guardar Rol
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setShowAddRoleInput(false);
                        setNewRoleLabel('');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tipo de Cuenta (Módulos) */}
            <div className="form-group">
              <label className="form-label">Módulos habilitados</label>
              <div style={{
                background: 'var(--surface2)',
                padding: '16px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}>
                <div className="form-grid-2" style={{ gap: '10px 16px' }}>
                  {getDefaultModulos(nuevoUsuario.rol).map(mid => {
                    const label = mid.charAt(0).toUpperCase() + mid.slice(1);
                    return (
                      <div
                        key={mid}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          userSelect: 'none',
                          opacity: 0.8
                        }}
                      >
                        <div className="checklist-checkbox checked" style={{ margin: 0 }}>
                          <Icon name="check" size={10} />
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => { setShowAddUsuarioModal(false); setShowAddRoleInput(false); setNewRoleLabel(''); }}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleAddUsuario}
                disabled={!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.contrasenia}
                style={{ opacity: (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.contrasenia) ? 0.5 : 1 }}
              >
                <Icon name="check" size={14} /> Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUsuarioModal && editandoUsuario && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEditUsuarioModal(false)}>
          <div className="modal" style={{ animation: 'slideUpLogin 0.3s ease-out' }}>
            <div className="modal-title">Editar Usuario: {editandoUsuario.nombre}</div>

            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <input
                className="form-control"
                placeholder="Ej: Juan Pérez"
                value={editandoUsuario.nombre}
                onChange={e => setEditandoUsuario(n => ({ ...n, nombre: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo Electrónico *</label>
              <input
                className="form-control"
                type="email"
                placeholder="Ej: juan@gestoria.com"
                value={editandoUsuario.email}
                onChange={e => setEditandoUsuario(n => ({ ...n, email: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showEditPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={editandoUsuario.contrasenia}
                  onChange={e => setEditandoUsuario(n => ({ ...n, contrasenia: e.target.value }))}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showEditPassword ? "Ocultar" : "Mostrar"}
                >
                  <Icon name={showEditPassword ? "eyeoff" : "eye"} size={16} />
                </button>
              </div>
            </div>

            {/* Asignar Rol */}
            <div className="form-group">
              <label className="form-label">Rol *</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  className="form-control"
                  value={editandoUsuario.rol}
                  onChange={e => {
                    const selectedRol = e.target.value;
                    setEditandoUsuario(n => ({
                      ...n,
                      rol: selectedRol,
                      modulos: n.modulos || getDefaultModulos(selectedRol)
                    }));
                  }}
                  style={{ flex: 1 }}
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddRoleInputEdit(!showAddRoleInputEdit)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  + Nuevo Rol
                </button>
              </div>

              {showAddRoleInputEdit && (
                <div style={{ background: 'var(--surface2)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6, fontWeight: 600 }}>Agregar Nuevo Rol</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="form-control"
                      placeholder="Ej: Auditor"
                      value={newRoleLabelEdit}
                      onChange={e => setNewRoleLabelEdit(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateRoleEdit}
                    >
                      Guardar Rol
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setShowAddRoleInputEdit(false);
                        setNewRoleLabelEdit('');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tipo de Cuenta (Módulos) */}
            <div className="form-group">
              <label className="form-label">Módulos habilitados</label>
              <div style={{
                background: 'var(--surface2)',
                padding: '16px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}>
                <div className="form-grid-2" style={{ gap: '10px 16px' }}>
                  {getDefaultModulos(editandoUsuario.rol).map(mid => {
                    const isChecked = editandoUsuario.modulos?.includes(mid);
                    const isMainAdmin = editandoUsuario.email.toLowerCase() === 'gabrielcoc@gmail.com';
                    const isDisabled = isMainAdmin && mid === 'administracion';
                    return (
                      <div
                        key={mid}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          userSelect: 'none',
                          opacity: isDisabled ? 0.6 : 1
                        }}
                        onClick={() => {
                          if (isDisabled) return;
                          setEditandoUsuario(prev => {
                            const currentModulos = prev.modulos || [];
                            const exists = currentModulos.includes(mid);
                            const modulos = exists
                              ? currentModulos.filter(id => id !== mid)
                              : [...currentModulos, mid];
                            return { ...prev, modulos };
                          });
                        }}
                      >
                        <div className={`checklist-checkbox ${isChecked ? 'checked' : ''}`} style={{ margin: 0 }}>
                          {isChecked && <Icon name="check" size={10} />}
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{mid.charAt(0).toUpperCase() + mid.slice(1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => { setShowEditUsuarioModal(false); setEditandoUsuario(null); setShowAddRoleInputEdit(false); setNewRoleLabelEdit(''); }}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEditUsuario}
                disabled={!editandoUsuario.nombre || !editandoUsuario.email || !editandoUsuario.contrasenia}
                style={{ opacity: (!editandoUsuario.nombre || !editandoUsuario.email || !editandoUsuario.contrasenia) ? 0.5 : 1 }}
              >
                <Icon name="check" size={14} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {usuarioAEliminar && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setUsuarioAEliminar(null)} style={{ zIndex: 1100 }}>
          <div className="modal" style={{
            animation: 'slideUpLogin 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            maxWidth: 380,
            borderRadius: '12px',
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '3px solid #ffca28',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              color: '#ffca28',
              margin: '0 auto 16px',
              fontWeight: '600',
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1
            }}>!</div>

            <div style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text)',
              textAlign: 'center',
              marginBottom: '8px'
            }}>
              ¿Estás seguro?
            </div>

            <p style={{
              fontSize: '13px',
              color: 'var(--text-2)',
              margin: '0 0 20px 0',
              lineHeight: 1.4,
              textAlign: 'center'
            }}>
              ¿Deseas eliminar permanentemente al usuario <strong>{usuarioAEliminar.nombre}</strong>?
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--red)', fontWeight: 500, marginTop: '6px' }}>
                Esta acción no se puede deshacer.
              </span>
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setUsuarioAEliminar(null)}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: '6px'
                }}
              >
                No, cancelar
              </button>
              <button
                className="btn"
                onClick={confirmEliminarUsuario}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  background: 'var(--red)',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(192, 57, 43, 0.2)'
                }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

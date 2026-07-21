import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { Catalogo } from './Catalogo';
import { getDefaultModulos, AVAILABLE_MODULES } from '../data/mockData';
import { filterUsersQuery } from '../core/cqrs/queries/userQueries';
import { generateSecurePassword, validatePasswordSecurity } from '../utils/securityUtils';

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

  // Password Security Helpers
  const handleCopyPassword = (pass) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: '¡Contraseña copiada!',
      showConfirmButton: false,
      timer: 1800,
      background: 'var(--surface)',
      color: 'var(--text)'
    });
  };

  const handleGeneratePasswordAdd = () => {
    const generated = generateSecurePassword(12);
    setNuevoUsuario(prev => ({ ...prev, contrasenia: generated }));
    setShowNuevoPassword(true);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: '🎲 Contraseña segura generada',
      showConfirmButton: false,
      timer: 1800,
      background: 'var(--surface)',
      color: 'var(--text)'
    });
  };

  const handleGeneratePasswordEdit = () => {
    const generated = generateSecurePassword(12);
    setEditandoUsuario(prev => ({ ...prev, contrasenia: generated }));
    setShowEditPassword(true);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: '🎲 Nueva contraseña segura generada',
      showConfirmButton: false,
      timer: 1800,
      background: 'var(--surface)',
      color: 'var(--text)'
    });
  };

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

    const passCheck = validatePasswordSecurity(nuevoUsuario.contrasenia);
    if (!passCheck.isValid) {
      alert('La contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas, números y símbolos.');
      return;
    }

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

    const passCheck = validatePasswordSecurity(editandoUsuario.contrasenia);
    if (!passCheck.isValid) {
      alert('La contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas, números y símbolos.');
      return;
    }

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
      <div className="page-header">
        <div className="page-title">Módulo Administrativo</div>
        <div className="page-subtitle">Administración de catálogo de trámites y control de usuarios</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          className={`btn ${adminTab === 'conceptos' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setAdminTab('conceptos')}
        >
          Catálogo Trámites
        </button>
        <button
          className={`btn ${adminTab === 'usuarios' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setAdminTab('usuarios')}
        >
          Control de Usuarios
        </button>
      </div>

      {adminTab === 'conceptos' ? (
        <Catalogo conceptos={conceptos} setConceptos={setConceptos} />
      ) : (
        /* VISTA DE CONTROL DE USUARIOS */
        <div>
          {/* Header & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div className="search-wrap" style={{ flex: 1, minWidth: 260, maxWidth: 400 }}>
              <Icon name="search" size={14} />
              <input
                className="form-control search-input"
                placeholder="Buscar usuarios por nombre, correo o rol..."
                value={qUsuarios}
                onChange={e => setQUsuarios(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setNuevoUsuario({ nombre: '', email: '', contrasenia: '', rol: 'gestor', modulos: getDefaultModulos('gestor') });
                setShowAddUsuarioModal(true);
              }}
            >
              <Icon name="plus" size={14} /> Registrar Usuario
            </button>
          </div>

          {/* Tabla de Usuarios */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-2)', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>USUARIO</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-2)', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>CORREO ELECTRÓNICO</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-2)', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>CONTRASEÑA</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-2)', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>ROL</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-2)', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map(u => {
                  const rolLabel = getRolLabel(u.rol);
                  const isMainAdmin = u.email.toLowerCase() === 'gabrielcoc@gmail.com';
                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: u.color || 'var(--blue)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 12, fontWeight: 700
                          }}>
                            {u.avatar || 'U'}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.nombre}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-2)' }}>
                        {u.email}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text-2)' }}>
                            {visiblePasswords[u.id] ? u.contrasenia : '••••••••'}
                          </span>
                          <button
                            className="btn btn-ghost"
                            onClick={() => togglePasswordVisibility(u.id)}
                            style={{ padding: 4, minWidth: 'auto', borderRadius: '50%', color: 'var(--text-3)' }}
                            title={visiblePasswords[u.id] ? "Ocultar contraseña" : "Mostrar contraseña"}
                          >
                            <Icon name={visiblePasswords[u.id] ? "eyeoff" : "eye"} size={14} />
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span className={`badge ${u.rol === 'admin' ? 'badge-blue' : u.rol === 'cliente' ? 'badge-gray' : 'badge-amber'}`}>
                          {rolLabel}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            className="btn btn-ghost"
                            onClick={() => handleEditClick(u)}
                            style={{ padding: 6, minWidth: 'auto', borderRadius: 4 }}
                            title="Editar usuario"
                          >
                            <Icon name="edit" size={14} />
                          </button>

                          {!isMainAdmin && u.id !== session.id && (
                            <button
                              className="btn btn-ghost"
                              onClick={() => handleEliminarUsuario(u)}
                              style={{ padding: 6, minWidth: 'auto', borderRadius: 4, color: 'var(--red)' }}
                              title="Eliminar usuario"
                            >
                              <Icon name="trash" size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredUsuarios.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
                No se encontraron usuarios coincidentes.
              </div>
            )}
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
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  className="form-control"
                  type={showNuevoPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={nuevoUsuario.contrasenia}
                  onChange={e => setNuevoUsuario(n => ({ ...n, contrasenia: e.target.value }))}
                  style={{ paddingRight: 80 }}
                />
                <div style={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Botón rojo generador estilo Password Manager (HBO/Bitwarden) */}
                  <button
                    type="button"
                    onClick={handleGeneratePasswordAdd}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      background: 'var(--red)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: -0.5,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      transition: 'transform 0.1s, opacity 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    title="Generar contraseña aleatoria y segura"
                  >
                    •••|
                  </button>

                  {nuevoUsuario.contrasenia && (
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(nuevoUsuario.contrasenia)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}
                      title="Copiar contraseña al portapapeles"
                    >
                      <Icon name="copy" size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowNuevoPassword(!showNuevoPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}
                    title={showNuevoPassword ? "Ocultar" : "Mostrar"}
                  >
                    <Icon name={showNuevoPassword ? "eyeoff" : "eye"} size={16} />
                  </button>
                </div>
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
                      modulos: getDefaultModulos(selectedRol)
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
                  {AVAILABLE_MODULES.map(module => {
                    const mid = module.id;
                    const label = module.label;
                    const isChecked = nuevoUsuario.modulos?.includes(mid);
                    return (
                      <div
                        key={mid}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={() => {
                          setNuevoUsuario(prev => {
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
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  className="form-control"
                  type={showEditPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={editandoUsuario.contrasenia}
                  onChange={e => setEditandoUsuario(n => ({ ...n, contrasenia: e.target.value }))}
                  style={{ paddingRight: 80 }}
                />
                <div style={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Botón rojo generador estilo Password Manager (HBO/Bitwarden) */}
                  <button
                    type="button"
                    onClick={handleGeneratePasswordEdit}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      background: 'var(--red)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: -0.5,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      transition: 'transform 0.1s, opacity 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    title="Generar contraseña aleatoria y segura"
                  >
                    •••|
                  </button>

                  {editandoUsuario.contrasenia && (
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(editandoUsuario.contrasenia)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}
                      title="Copiar contraseña al portapapeles"
                    >
                      <Icon name="copy" size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}
                    title={showEditPassword ? "Ocultar" : "Mostrar"}
                  >
                    <Icon name={showEditPassword ? "eyeoff" : "eye"} size={16} />
                  </button>
                </div>
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
                  {AVAILABLE_MODULES.map(module => {
                    const mid = module.id;
                    const label = module.label;
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
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
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

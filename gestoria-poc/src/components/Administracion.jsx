import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { Catalogo } from './Catalogo';
import { AVAILABLE_MODULES, getDefaultModulos, PROYECTOS_MOCK } from '../data/mockData';
import { filterClientsQuery } from '../core/cqrs/queries/clientQueries';
import { filterUsersQuery } from '../core/cqrs/queries/userQueries';

export default function Administracion() {
  const {
    clientes,
    setClientes,
    conceptos,
    setConceptos,
    usuarios,
    setUsuarios,
    cotizaciones,
    session,
    setSession,
    rolesList,
    setRolesList,
    setActive,

    // Commands
    addClient,
    deleteClient,
    updateClientField,
    addUser,
    saveUserEdit,
    deleteUser
  } = useAppContext();

  const [adminTab, setAdminTab] = useState('clientes');
  const [qClientes, setQClientes] = useState('');
  const [showAddClienteModal, setShowAddClienteModal] = useState(false);
  const [showAddClientDropdown, setShowAddClientDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', contacto: '', email: '', tel: '', tipo: 'empresa', rfc: '', ciudad: '',
    estatus: 'activo', proyectos: [], responsable: 'usr-admin-1'
  });

  // Project selector states
  const [proyectoSearch, setProyectoSearch] = useState('');
  const [showProyectoDropdown, setShowProyectoDropdown] = useState(false);
  const [proyectoCellSearch, setProyectoCellSearch] = useState({});
  const [showProyectoCellDropdown, setShowProyectoCellDropdown] = useState(null);
  const proyectoDropdownRef = useRef(null);

  // All available projects (mock + stored)
  const allProyectos = (() => {
    try {
      const stored = localStorage.getItem('giu_proyectos');
      return [...PROYECTOS_MOCK, ...(stored ? JSON.parse(stored) : [])];
    } catch { return [...PROYECTOS_MOCK]; }
  })();

  // Close project dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (proyectoDropdownRef.current && !proyectoDropdownRef.current.contains(e.target)) {
        setShowProyectoDropdown(false);
        setShowProyectoCellDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // CRM Monday-style local states
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [selectedClients, setSelectedClients] = useState([]);
  const [clientsToDelete, setClientsToDelete] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [inlineAddName, setInlineAddName] = useState({});

  // Dynamic client statuses state
  const [statusList, setStatusList] = useState(() => {
    const saved = localStorage.getItem('giu_client_statuses');
    return saved ? JSON.parse(saved) : [
      { id: 'lead', label: 'Leads', color: '#0086C0' },
      { id: 'activo', label: 'Clientes Activos', color: '#FD9A00' },
      { id: 'pausado', label: 'Clientes Pausados', color: '#E2445C' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('giu_client_statuses', JSON.stringify(statusList));
  }, [statusList]);

  const [openStatusPickerId, setOpenStatusPickerId] = useState(null);
  const [pickerPlacement, setPickerPlacement] = useState('bottom');
  const [newStatusInput, setNewStatusInput] = useState('');
  const [showAddStatusInput, setShowAddStatusInput] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');

  // User management states
  const [qUsuarios, setQUsuarios] = useState('');
  const [showAddUsuarioModal, setShowAddUsuarioModal] = useState(false);
  const [showEditUsuarioModal, setShowEditUsuarioModal] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '', email: '', contrasenia: '', rol: 'gestor', modulos: getDefaultModulos('gestor')
  });
  const [editandoUsuario, setEditandoUsuario] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

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

  const filteredClientes = filterClientsQuery(clientes, qClientes, usuarios, cotizaciones, conceptos);

  const totalClientes = clientes.length;

  const handleUpdateClientField = (id, field, value) => {
    updateClientField(id, field, value);
  };

  const handleDeleteClient = (id) => {
    const client = clientes.find(c => c.id === id);
    if (!client) return;
    setClientsToDelete({
      ids: [id],
      message: `¿Deseas eliminar permanentemente al cliente <strong>${client.nombre}</strong>?`
    });
  };

  const handleBulkMoveStatus = (newStatusId) => {
    if (selectedClients.length === 0) return;
    selectedClients.forEach(id => {
      updateClientField(id, 'estatus', newStatusId);
    });
    setSelectedClients([]);
  };

  const handleBulkDelete = () => {
    if (selectedClients.length === 0) return;
    setClientsToDelete({
      ids: [...selectedClients],
      message: `¿Deseas eliminar permanentemente los <strong>${selectedClients.length}</strong> clientes seleccionados?`
    });
  };

  const confirmEliminarClientes = () => {
    if (!clientsToDelete) return;
    clientsToDelete.ids.forEach(id => {
      deleteClient(id);
    });
    setSelectedClients(prev => prev.filter(selectedId => !clientsToDelete.ids.includes(selectedId)));
    setClientsToDelete(null);
  };

  const handleInlineAdd = (groupId) => {
    const name = inlineAddName[groupId]?.trim();
    if (!name) return;
    const newId = Math.max(...clientes.map(c => c.id), 0) + 1;
    const newClient = {
      id: newId,
      nombre: name,
      contacto: 'S/N',
      email: '',
      tel: '',
      tipo: 'empresa',
      rfc: '',
      ciudad: '',
      estatus: groupId,
      proyectos: [],
      responsable: session.id || 'usr-admin-1'
    };
    addClient(newClient);
    setInlineAddName(prev => ({ ...prev, [groupId]: '' }));
  };

  const handleSelectAll = (groupId, groupClients) => {
    const groupIds = groupClients.map(c => c.id);
    const allSelected = groupIds.length > 0 && groupIds.every(id => selectedClients.includes(id));
    if (allSelected) {
      setSelectedClients(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedClients(prev => [...new Set([...prev, ...groupIds])]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleCreateStatus = (label) => {
    const text = label.trim();
    if (!text) return null;
    const id = text.toLowerCase().replace(/\s+/g, '-');
    if (statusList.some(s => s.id === id)) {
      alert(`El estatus "${text}" ya existe.`);
      return id;
    }
    const colors = ['#2A5F3F', '#1A5276', '#5B2C6F', '#B87A0A', '#8E44AD', '#34495E', '#16A085', '#D35400', '#2C3E50', '#7F8C8D'];
    const color = colors[statusList.length % colors.length];
    const newStatus = { id, label: text, color };
    setStatusList(prev => [...prev, newStatus]);
    return id;
  };

  const handleQuickAddClient = () => {
    const defaultGroup = statusList[0]?.id || 'lead';
    const newId = Math.max(...clientes.map(c => c.id), 0) + 1;
    const newClient = {
      id: newId,
      nombre: 'Nuevo Cliente ' + newId,
      contacto: 'S/N',
      email: '',
      tel: '',
      tipo: 'empresa',
      rfc: '',
      ciudad: '',
      estatus: defaultGroup,
      proyectos: [],
      responsable: session.id || 'usr-admin-1'
    };
    addClient(newClient);
    setShowAddClientDropdown(false);
  };

  const handleMockImport = () => {
    setShowImportModal(true);
    setShowAddClientDropdown(false);
  };

  const handleAddCliente = () => {
    if (!nuevoCliente.nombre || !nuevoCliente.contacto) return;
    const nuevo = {
      ...nuevoCliente,
      id: Math.max(...clientes.map(c => c.id), 0) + 1,
    };
    addClient(nuevo);
    setShowAddClienteModal(false);
    setNuevoCliente({
      nombre: '', contacto: '', email: '', tel: '', tipo: 'empresa', rfc: '', ciudad: '',
      estatus: 'activo', proyectos: [], responsable: 'usr-admin-1'
    });
    setProyectoSearch('');
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Módulo Administrativo</div>
          <div className="page-subtitle">Administración de clientes, catálogo y configuraciones generales</div>
        </div>
      </div>

      {/* Metric summary banner */}
      <div className="metric-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="metric-card">
          <div className="metric-label">Total Clientes</div>
          <div className="metric-value" style={{ color: 'var(--blue)' }}>{totalClientes}</div>
          <div className="metric-sub">registrados en la plataforma</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Clientes Activos</div>
          <div className="metric-value" style={{ color: 'var(--accent)' }}>{clientes.filter(c => c.estatus === 'activo').length}</div>
          <div className="metric-sub">en seguimiento activo</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Leads Registrados</div>
          <div className="metric-value" style={{ color: 'var(--purple)' }}>{clientes.filter(c => c.estatus === 'lead').length}</div>
          <div className="metric-sub">prospectos iniciales</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-4">
        <button
          className={`tab-btn ${adminTab === 'clientes' ? 'active' : ''}`}
          onClick={() => setAdminTab('clientes')}
        >
          Directorio de Clientes
        </button>
        <button
          className={`tab-btn ${adminTab === 'conceptos' ? 'active' : ''}`}
          onClick={() => setAdminTab('conceptos')}
        >
          Gestión de Conceptos
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

      {/* Subview Clientes */}
      {adminTab === 'clientes' && (
        <div>
          {/* Search bar & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="search-wrap" style={{ maxWidth: 380, flex: 1 }}>
              <Icon name="search" size={14} />
              <input
                className="form-control search-input"
                placeholder="Buscar por cliente, proyectos, estatus, correo ..."
                value={qClientes}
                onChange={e => setQClientes(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', position: 'relative' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddClienteModal(true)}
                style={{
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  borderRight: '1px solid rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Icon name="plus" size={14} /> Nuevo Cliente
              </button>
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddClientDropdown(!showAddClientDropdown);
                }}
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  paddingLeft: 10,
                  paddingRight: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon name="chevdown" size={14} />
              </button>

              {showAddClientDropdown && (
                <>
                  <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                    onClick={() => setShowAddClientDropdown(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 6,
                    background: 'var(--surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 1000,
                    width: 220,
                    padding: '6px 0',
                    animation: 'slideUpLogin 0.15s ease-out'
                  }}>
                    <div
                      className="dropdown-item"
                      onClick={() => { setShowAddClienteModal(true); setShowAddClientDropdown(false); }}
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: 'var(--text-2)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <span style={{ fontSize: 16 }}>📋</span> Registrar con Formulario
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={handleQuickAddClient}
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: 'var(--text-2)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <span style={{ fontSize: 16 }}>⚡</span> Añadir Fila Rápida
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={handleMockImport}
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: 'var(--text-2)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <span style={{ fontSize: 16 }}>📥</span> Importar desde Excel/CSV
                    </div>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    <div
                      className="dropdown-item"
                      onClick={() => { setShowAddStatusInput(true); setShowAddClientDropdown(false); }}
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: 'var(--text-2)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <span style={{ fontSize: 16 }}>➕</span> Crear Nuevo Estatus
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CRM Groups */}
          {statusList.map(group => {
            const isCollapsed = collapsedGroups[group.id];
            // Filter clients for this group that match the search query
            const groupClients = filteredClientes.filter(c => c.estatus === group.id);
            const isAllSelected = groupClients.length > 0 && groupClients.every(c => selectedClients.includes(c.id));

            return (
              <div key={group.id} className="crm-group" style={{ animation: 'slideUpLogin 0.4s ease-out', marginBottom: 28 }}>
                {/* Group Header */}
                <div className="crm-group-header" onClick={() => toggleGroupCollapse(group.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
                  <span style={{
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                    color: group.color,
                    fontSize: '11px'
                  }}>
                    ▼
                  </span>
                  <div className="crm-group-title" style={{ color: group.color, fontSize: '15px', fontWeight: 600 }}>
                    {group.label}
                    <span className="crm-group-count" style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-3)', marginLeft: 8 }}>
                      ({groupClients.length} Clientes)
                    </span>
                  </div>
                </div>

                {/* Group Table */}
                {!isCollapsed && (
                  <div className="table-wrap" style={{ overflow: 'visible', borderLeft: `6px solid ${group.color}`, borderRadius: '4px', background: 'var(--surface)', paddingBottom: '4px', boxShadow: 'var(--shadow-sm)', marginBottom: 8 }}>
                    <table className="crm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th className="crm-checkbox-col" style={{ width: '40px', padding: '10px 0', textAlign: 'center' }}>
                            <div
                              className={`crm-checkbox-box ${isAllSelected ? 'checked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAll(group.id, groupClients);
                              }}
                              style={{
                                width: '16px',
                                height: '16px',
                                border: '1px solid var(--border-strong)',
                                borderRadius: '3px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: isAllSelected ? 'var(--accent)' : 'var(--surface)',
                                color: 'white'
                              }}
                            >
                              {isAllSelected && <Icon name="check" size={10} />}
                            </div>
                          </th>
                          <th style={{ width: '25%', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Cliente / Razón Social</th>
                          <th style={{ width: '140px', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'center', fontWeight: 600 }}>Estatus del Cliente</th>
                          <th style={{ width: '20%', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Correo Electrónico</th>
                          <th style={{ width: '15%', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Teléfono</th>
                          <th style={{ width: '20%', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Proyectos Relacionados</th>
                          <th className="crm-avatar-col" style={{ width: '110px', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'center', fontWeight: 600 }}>Responsable</th>
                          <th style={{ width: '50px', padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupClients.map(c => {
                          const isSelected = selectedClients.includes(c.id);
                          const assignedUser = usuarios.find(u => u.id === c.responsable) || {
                            nombre: 'Sin Asignar',
                            avatar: '?',
                            color: '#9C9A94'
                          };

                          return (
                            <tr key={c.id} className="crm-row" style={{
                              background: isSelected ? 'rgba(76, 166, 106, 0.04)' : 'transparent',
                              borderBottom: '1px solid var(--border)',
                              transition: 'background 0.15s'
                            }}>
                              {/* Checkbox */}
                              <td className="crm-checkbox-col" style={{ padding: '10px 0', textAlign: 'center' }}>
                                <div
                                  className={`crm-checkbox-box ${isSelected ? 'checked' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelect(c.id);
                                  }}
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '1px solid var(--border-strong)',
                                    borderRadius: '3px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    background: isSelected ? 'var(--accent)' : 'var(--surface)',
                                    color: 'white'
                                  }}
                                >
                                  {isSelected && <Icon name="check" size={10} />}
                                </div>
                              </td>

                              {/* Nombre */}
                              <td style={{ padding: '10px 12px' }}>
                                {editingCell?.id === c.id && editingCell?.field === 'nombre' ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    defaultValue={c.nombre}
                                    onBlur={e => {
                                      handleUpdateClientField(c.id, 'nombre', e.target.value);
                                      setEditingCell(null);
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        handleUpdateClientField(c.id, 'nombre', e.target.value);
                                        setEditingCell(null);
                                      }
                                    }}
                                    autoFocus
                                    style={{ fontSize: 13, padding: '4px 8px', width: '100%', border: '1px solid var(--accent)' }}
                                  />
                                ) : (
                                  <div
                                    onClick={() => setEditingCell({ id: c.id, field: 'nombre' })}
                                    style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text)' }}
                                    title="Haz clic para editar"
                                  >
                                    {c.nombre || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Sin nombre</span>}
                                    <div style={{ fontSize: 11, fontWeight: 'normal', color: 'var(--text-3)', marginTop: 2 }}>
                                      Contacto: {c.contacto} {c.ciudad ? `| 📍 ${c.ciudad}` : ''}
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Estatus */}
                              <td className="crm-status-cell" style={{ padding: '8px 12px', textAlign: 'center', position: 'relative' }}>
                                {openStatusPickerId === c.id && (
                                  <div
                                    className="crm-status-picker-overlay"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenStatusPickerId(null);
                                    }}
                                  />
                                )}
                                <div style={{ position: 'relative', display: 'inline-block', width: '120px' }}>
                                  {/* Clickable Badge */}
                                  {(() => {
                                    const currentStatus = statusList.find(s => s.id === c.estatus) || {
                                      id: c.estatus,
                                      label: c.estatus,
                                      color: '#797E93'
                                    };
                                    return (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const spaceBelow = window.innerHeight - rect.bottom;
                                          setPickerPlacement(spaceBelow < 280 ? 'top' : 'bottom');
                                          setOpenStatusPickerId(c.id);
                                        }}
                                        style={{
                                          background: currentStatus.color,
                                          color: 'white',
                                          fontWeight: 'bold',
                                          borderRadius: '4px',
                                          padding: '6px 10px',
                                          width: '100%',
                                          textAlign: 'center',
                                          cursor: 'pointer',
                                          fontSize: '11px',
                                          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                          textTransform: 'capitalize',
                                          userSelect: 'none',
                                          transition: 'transform 0.1s'
                                        }}
                                        className="crm-status-badge"
                                      >
                                        {currentStatus.label}
                                      </div>
                                    );
                                  })()}

                                  {/* Custom status picker popup */}
                                  {openStatusPickerId === c.id && (
                                    <div
                                      className={`crm-status-picker-popup placement-${pickerPlacement}`}
                                      onClick={e => e.stopPropagation()}
                                      style={{
                                        position: 'absolute',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border-strong)',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: 'var(--shadow-md)',
                                        zIndex: 1001,
                                        width: '150px',
                                        padding: '4px',
                                        ...(pickerPlacement === 'top' ? {
                                          bottom: '100%',
                                          marginBottom: '8px'
                                        } : {
                                          top: '100%',
                                          marginTop: '8px'
                                        })
                                      }}
                                    >
                                      {/* Existing statuses list */}
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '180px', overflowY: 'auto', padding: '2px' }}>
                                        {statusList.map(statusOption => (
                                          <div
                                            key={statusOption.id}
                                            onClick={() => {
                                              handleUpdateClientField(c.id, 'estatus', statusOption.id);
                                              setOpenStatusPickerId(null);
                                            }}
                                            style={{
                                              background: statusOption.color,
                                              color: 'white',
                                              fontWeight: 'bold',
                                              padding: '6px 8px',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              fontSize: '10.5px',
                                              textAlign: 'center',
                                              textTransform: 'capitalize',
                                              transition: 'opacity 0.15s'
                                            }}
                                            className="crm-status-picker-item"
                                          >
                                            {statusOption.label}
                                          </div>
                                        ))}
                                      </div>

                                      {/* Divider */}
                                      <div style={{ height: '1px', background: 'var(--border)', margin: '6px 4px' }} />

                                      {/* New Status Input */}
                                      <div style={{ padding: '2px 4px' }}>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          placeholder="Nuevo estado..."
                                          value={newStatusInput}
                                          onChange={e => setNewStatusInput(e.target.value)}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const text = newStatusInput.trim();
                                              if (text) {
                                                const newId = handleCreateStatus(text);
                                                if (newId) {
                                                  handleUpdateClientField(c.id, 'estatus', newId);
                                                }
                                                setNewStatusInput('');
                                                setOpenStatusPickerId(null);
                                              }
                                            }
                                          }}
                                          onClick={e => e.stopPropagation()}
                                          style={{ fontSize: '11px', padding: '4px 6px', width: '100%', outline: 'none', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-strong)' }}
                                        />
                                        <div style={{ fontSize: '9px', color: 'var(--text-3)', marginTop: 4, textAlign: 'center' }}>
                                          Presiona Enter
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Correo */}
                              <td style={{ padding: '10px 12px' }}>
                                {editingCell?.id === c.id && editingCell?.field === 'email' ? (
                                  <input
                                    type="email"
                                    className="form-control form-control-sm"
                                    defaultValue={c.email}
                                    onBlur={e => {
                                      handleUpdateClientField(c.id, 'email', e.target.value);
                                      setEditingCell(null);
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        handleUpdateClientField(c.id, 'email', e.target.value);
                                        setEditingCell(null);
                                      }
                                    }}
                                    autoFocus
                                    style={{ fontSize: 13, padding: '4px 8px', width: '100%', border: '1px solid var(--accent)' }}
                                  />
                                ) : (
                                  <div
                                    onClick={() => setEditingCell({ id: c.id, field: 'email' })}
                                    style={{ cursor: 'pointer', color: c.email ? 'var(--blue)' : 'var(--text-3)', fontFamily: 'DM Mono', fontSize: '12.5px' }}
                                    title="Haz clic para editar"
                                  >
                                    {c.email ? (
                                      <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
                                        📧 {c.email}
                                      </a>
                                    ) : (
                                      <span style={{ fontStyle: 'italic' }}>+ Agregar correo</span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Teléfono */}
                              <td style={{ padding: '10px 12px' }}>
                                {editingCell?.id === c.id && editingCell?.field === 'tel' ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    defaultValue={c.tel}
                                    onBlur={e => {
                                      handleUpdateClientField(c.id, 'tel', e.target.value);
                                      setEditingCell(null);
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        handleUpdateClientField(c.id, 'tel', e.target.value);
                                        setEditingCell(null);
                                      }
                                    }}
                                    autoFocus
                                    style={{ fontSize: 13, padding: '4px 8px', width: '100%', border: '1px solid var(--accent)' }}
                                  />
                                ) : (
                                  <div
                                    onClick={() => setEditingCell({ id: c.id, field: 'tel' })}
                                    style={{ cursor: 'pointer', color: c.tel ? 'var(--text)' : 'var(--text-3)' }}
                                    title="Haz clic para editar"
                                  >
                                    {c.tel ? (
                                      <a href={`tel:${c.tel}`} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
                                        📞 {c.tel}
                                      </a>
                                    ) : (
                                      <span style={{ fontStyle: 'italic' }}>+ Agregar tel</span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Proyectos - Searchable multi-select dropdown */}
                              <td style={{ padding: '10px 12px', position: 'relative' }}>
                                {editingCell?.id === c.id && editingCell?.field === 'proyectos' ? (
                                  <div style={{ position: 'relative' }} ref={proyectoDropdownRef}>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder="Buscar proyecto..."
                                      value={proyectoCellSearch[c.id] || ''}
                                      autoFocus
                                      onChange={e => setProyectoCellSearch(prev => ({ ...prev, [c.id]: e.target.value }))}
                                      onFocus={() => setShowProyectoCellDropdown(c.id)}
                                      style={{ fontSize: 12, padding: '4px 8px', width: '100%', border: '1px solid var(--accent)' }}
                                    />
                                    {showProyectoCellDropdown === c.id && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border-strong)',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: 'var(--shadow-md)',
                                        zIndex: 1002,
                                        maxHeight: 200,
                                        overflowY: 'auto',
                                        marginTop: 2,
                                        minWidth: 220
                                      }}>
                                        {allProyectos
                                          .filter(p => {
                                            const term = (proyectoCellSearch[c.id] || '').toLowerCase();
                                            return !term || p.nombre.toLowerCase().includes(term) || p.id.toLowerCase().includes(term);
                                          })
                                          .map(p => {
                                            const alreadyLinked = (c.proyectos || []).includes(p.nombre);
                                            return (
                                              <div
                                                key={p.id}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const current = c.proyectos || [];
                                                  const updated = alreadyLinked
                                                    ? current.filter(x => x !== p.nombre)
                                                    : [...current, p.nombre];
                                                  handleUpdateClientField(c.id, 'proyectos', updated);
                                                  setProyectoCellSearch(prev => ({ ...prev, [c.id]: '' }));
                                                }}
                                                style={{
                                                  padding: '7px 12px',
                                                  fontSize: 12,
                                                  cursor: 'pointer',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 8,
                                                  background: alreadyLinked ? 'var(--accent-light)' : 'transparent',
                                                  color: alreadyLinked ? 'var(--accent)' : 'var(--text)',
                                                  borderBottom: '1px solid var(--border)'
                                                }}
                                                onMouseEnter={e => { if (!alreadyLinked) e.currentTarget.style.background = 'var(--surface2)'; }}
                                                onMouseLeave={e => { if (!alreadyLinked) e.currentTarget.style.background = ''; }}
                                              >
                                                <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{p.id}</span>
                                                <span style={{ flex: 1, fontWeight: alreadyLinked ? 600 : 400 }}>{p.nombre}</span>
                                                {alreadyLinked && <Icon name="check" size={11} />}
                                              </div>
                                            );
                                          })}
                                        {allProyectos.filter(p => {
                                          const term = (proyectoCellSearch[c.id] || '').toLowerCase();
                                          return !term || p.nombre.toLowerCase().includes(term);
                                        }).length === 0 && (
                                          <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>Sin resultados</div>
                                        )}
                                      </div>
                                    )}
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      style={{ marginTop: 4, fontSize: 11, padding: '2px 6px' }}
                                      onClick={() => { setEditingCell(null); setShowProyectoCellDropdown(null); }}
                                    >
                                      Listo ✓
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => { setEditingCell({ id: c.id, field: 'proyectos' }); setShowProyectoCellDropdown(c.id); }}
                                    style={{ minHeight: 24, cursor: 'pointer', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}
                                    title="Haz clic para vincular proyectos"
                                  >
                                    {c.proyectos && c.proyectos.length > 0 ? (
                                      c.proyectos.map((p, idx) => (
                                        <span key={idx} style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4,
                                          padding: '2px 6px 2px 8px',
                                          borderRadius: '12px',
                                          fontSize: '11px',
                                          background: 'var(--accent-light)',
                                          color: 'var(--accent)',
                                          border: '1px solid var(--accent)',
                                          fontWeight: 500
                                        }}>
                                          {p}
                                          <span
                                            style={{ cursor: 'pointer', fontWeight: 700, lineHeight: 1, marginLeft: 2, opacity: 0.7 }}
                                            onClick={e => {
                                              e.stopPropagation();
                                              const updated = (c.proyectos || []).filter(x => x !== p);
                                              handleUpdateClientField(c.id, 'proyectos', updated);
                                            }}
                                          >×</span>
                                        </span>
                                      ))
                                    ) : (
                                      <span style={{ color: 'var(--text-3)', fontSize: 11, fontStyle: 'italic' }}>+ Vincular proyecto</span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Responsable */}
                              <td className="crm-avatar-col" style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <div className="crm-avatar-container" style={{
                                  display: 'inline-flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '11px',
                                  position: 'relative',
                                  background: assignedUser.color,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                                }} title={`Responsable: ${assignedUser.nombre}`}>
                                  {assignedUser.avatar}
                                  <select
                                    value={c.responsable || ''}
                                    onChange={e => handleUpdateClientField(c.id, 'responsable', e.target.value)}
                                    className="crm-avatar-select"
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      opacity: 0,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value="" style={{ color: 'black' }}>Sin asignar</option>
                                    {usuarios.map(u => (
                                      <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.nombre}</option>
                                    ))}
                                  </select>
                                </div>
                              </td>

                              {/* Acciones */}
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleDeleteClient(c.id)}
                                  style={{ padding: '4px 6px', color: 'var(--red)', display: 'inline-flex', alignItems: 'center' }}
                                  title="Eliminar Cliente"
                                >
                                  <Icon name="trash" size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Inline Add Row */}
                        <tr className="crm-inline-add-row" style={{ borderLeft: `6px solid ${group.color}`, borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                          <td className="crm-checkbox-col" style={{ padding: '10px 0', textAlign: 'center' }}></td>
                          <td colSpan={7} style={{ padding: '6px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="crm-add-input"
                                placeholder={`+ Añadir cliente a "${group.label}"...`}
                                value={inlineAddName[group.id] || ''}
                                onChange={e => setInlineAddName(prev => ({ ...prev, [group.id]: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    handleInlineAdd(group.id);
                                  }
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  padding: '4px 8px',
                                  fontSize: '13px',
                                  width: '100%',
                                  outline: 'none',
                                  color: 'var(--text)'
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* Floating Bulk Actions Bar */}
          {selectedClients.length > 0 && (
            <div style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--text)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              zIndex: 9999,
              border: '1px solid rgba(255,255,255,0.1)',
              animation: 'slideUpLogin 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.15)', paddingRight: 16 }}>
                {selectedClients.length} Seleccionados
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: '600px' }}>
                {statusList.map(statusOption => (
                  <button
                    key={statusOption.id}
                    className="btn btn-sm"
                    style={{ background: statusOption.color, color: 'white', border: 'none', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
                    onClick={() => handleBulkMoveStatus(statusOption.id)}
                  >
                    Mover a {statusOption.label}
                  </button>
                ))}
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ color: '#ff6b6b', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
                  onClick={handleBulkDelete}
                >
                  Eliminar
                </button>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 8, padding: '4px', cursor: 'pointer' }}
                onClick={() => setSelectedClients([])}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

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
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={nuevoUsuario.contrasenia}
                onChange={e => setNuevoUsuario(n => ({ ...n, contrasenia: e.target.value }))}
              />
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
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px 16px'
                }}>
                  {AVAILABLE_MODULES.map(m => {
                    const isChecked = nuevoUsuario.modulos?.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => {
                          setNuevoUsuario(prev => {
                            const currentModulos = prev.modulos || [];
                            const exists = currentModulos.includes(m.id);
                            const modulos = exists
                              ? currentModulos.filter(id => id !== m.id)
                              : [...currentModulos, m.id];
                            return { ...prev, modulos };
                          });
                        }}
                      >
                        <div className={`checklist-checkbox ${isChecked ? 'checked' : ''}`} style={{ margin: 0 }}>
                          {isChecked && <Icon name="check" size={10} />}
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{m.label}</span>
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
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={editandoUsuario.contrasenia}
                onChange={e => setEditandoUsuario(n => ({ ...n, contrasenia: e.target.value }))}
              />
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
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px 16px'
                }}>
                  {AVAILABLE_MODULES.map(m => {
                    const isChecked = editandoUsuario.modulos?.includes(m.id);
                    const isMainAdmin = editandoUsuario.email.toLowerCase() === 'gabrielcoc@gmail.com';
                    const isDisabled = isMainAdmin && m.id === 'administracion';
                    return (
                      <div
                        key={m.id}
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
                            const exists = currentModulos.includes(m.id);
                            const modulos = exists
                              ? currentModulos.filter(id => id !== m.id)
                              : [...currentModulos, m.id];
                            return { ...prev, modulos };
                          });
                        }}
                      >
                        <div className={`checklist-checkbox ${isChecked ? 'checked' : ''}`} style={{ margin: 0 }}>
                          {isChecked && <Icon name="check" size={10} />}
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{m.label}</span>
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

      {/* Delete User Confirmation Modal (SweetAlert Style) */}
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
            {/* Warning Circle Icon */}
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

      {/* Delete Clients Confirmation Modal (SweetAlert Style) */}
      {clientsToDelete && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setClientsToDelete(null)} style={{ zIndex: 1100 }}>
          <div className="modal" style={{
            animation: 'slideUpLogin 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            maxWidth: 380,
            borderRadius: '12px',
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
          }}>
            {/* Warning Circle Icon */}
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
            }} dangerouslySetInnerHTML={{ __html: clientsToDelete.message }} />

            <p style={{
              fontSize: '11px',
              color: 'var(--red)',
              fontWeight: 500,
              marginTop: '-14px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Esta acción no se puede deshacer.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setClientsToDelete(null)}
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
                onClick={confirmEliminarClientes}
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

      {/* Add Client Modal */}
      {showAddClienteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddClienteModal(false)}>
          <div className="modal">
            <div className="modal-title">Registrar Nuevo Cliente</div>

            <div className="form-group">
              <label className="form-label">Nombre o Razón Social *</label>
              <input
                className="form-control"
                placeholder="Ej: Inmobiliaria del Bajío S.A."
                value={nuevoCliente.nombre}
                onChange={e => setNuevoCliente(n => ({ ...n, nombre: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Nombre del Contacto *</label>
                <input
                  className="form-control"
                  placeholder="Ej: Arq. Patricia Noriega"
                  value={nuevoCliente.contacto}
                  onChange={e => setNuevoCliente(n => ({ ...n, contacto: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Responsable</label>
                <select
                  className="form-control"
                  value={nuevoCliente.responsable || 'usr-admin-1'}
                  onChange={e => setNuevoCliente(n => ({ ...n, responsable: e.target.value }))}
                >
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="Ej: contacto@empresa.com"
                  value={nuevoCliente.email}
                  onChange={e => setNuevoCliente(n => ({ ...n, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  className="form-control"
                  placeholder="Ej: 442-555-0199"
                  value={nuevoCliente.tel}
                  onChange={e => setNuevoCliente(n => ({ ...n, tel: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Estatus del Cliente</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  className="form-control"
                  value={nuevoCliente.estatus || 'activo'}
                  onChange={e => setNuevoCliente(n => ({ ...n, estatus: e.target.value }))}
                  style={{ flex: 1 }}
                >
                  {statusList.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddStatusInput(!showAddStatusInput)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  + Nuevo Estatus
                </button>
              </div>

              {showAddStatusInput && (
                <div style={{ background: 'var(--surface2)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6, fontWeight: 600 }}>Agregar Nuevo Estatus</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="form-control"
                      placeholder="Ej: Archivado"
                      value={newStatusLabel}
                      onChange={e => setNewStatusLabel(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const val = newStatusLabel.trim();
                        if (val) {
                          const newId = handleCreateStatus(val);
                          if (newId) {
                            setNuevoCliente(n => ({ ...n, estatus: newId }));
                          }
                          setNewStatusLabel('');
                          setShowAddStatusInput(false);
                        }
                      }}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setShowAddStatusInput(false);
                        setNewStatusLabel('');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: 12 }} ref={proyectoDropdownRef}>
              <label className="form-label">Proyectos Relacionados</label>

              {/* Selected projects tags */}
              {nuevoCliente.proyectos && nuevoCliente.proyectos.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {nuevoCliente.proyectos.map((p, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 12, fontSize: 12,
                      background: 'var(--accent-light)', color: 'var(--accent)',
                      border: '1px solid var(--accent)', fontWeight: 500
                    }}>
                      {p}
                      <span
                        style={{ cursor: 'pointer', fontWeight: 700, opacity: 0.7 }}
                        onClick={() => setNuevoCliente(n => ({ ...n, proyectos: n.proyectos.filter(x => x !== p) }))}
                      >×</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Search input */}
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  placeholder="Buscar y seleccionar proyectos..."
                  value={proyectoSearch}
                  onChange={e => { setProyectoSearch(e.target.value); setShowProyectoDropdown(true); }}
                  onFocus={() => setShowProyectoDropdown(true)}
                  style={{ paddingLeft: 36 }}
                />
                <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />

                {showProyectoDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'var(--surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 1002, maxHeight: 220, overflowY: 'auto', marginTop: 4
                  }}>
                    {allProyectos
                      .filter(p => {
                        const term = proyectoSearch.toLowerCase();
                        return !term || p.nombre.toLowerCase().includes(term) || p.id.toLowerCase().includes(term);
                      })
                      .map(p => {
                        const alreadySelected = (nuevoCliente.proyectos || []).includes(p.nombre);
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (alreadySelected) {
                                setNuevoCliente(n => ({ ...n, proyectos: n.proyectos.filter(x => x !== p.nombre) }));
                              } else {
                                setNuevoCliente(n => ({ ...n, proyectos: [...(n.proyectos || []), p.nombre] }));
                              }
                              setProyectoSearch('');
                              setShowProyectoDropdown(false);
                            }}
                            style={{
                              padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 10,
                              background: alreadySelected ? 'var(--accent-light)' : 'transparent',
                              color: alreadySelected ? 'var(--accent)' : 'var(--text)',
                              borderBottom: '1px solid var(--border)'
                            }}
                            onMouseEnter={e => { if (!alreadySelected) e.currentTarget.style.background = 'var(--surface2)'; }}
                            onMouseLeave={e => { if (!alreadySelected) e.currentTarget.style.background = ''; }}
                          >
                            <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--text-3)', flexShrink: 0, minWidth: 56 }}>{p.id}</span>
                            <span style={{ flex: 1, fontWeight: alreadySelected ? 600 : 400 }}>{p.nombre}</span>
                            {alreadySelected && <Icon name="check" size={13} />}
                          </div>
                        );
                      })}
                    {allProyectos.filter(p => {
                      const term = proyectoSearch.toLowerCase();
                      return !term || p.nombre.toLowerCase().includes(term);
                    }).length === 0 && (
                      <div style={{ padding: '12px', fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>No se encontraron proyectos</div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>Selecciona uno o más proyectos del listado</div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => { setShowAddClienteModal(false); setShowAddStatusInput(false); setNewStatusLabel(''); }}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleAddCliente}
                disabled={!nuevoCliente.nombre || !nuevoCliente.contacto}
                style={{ opacity: (!nuevoCliente.nombre || !nuevoCliente.contacto) ? 0.5 : 1 }}
              >
                <Icon name="check" size={14} /> Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowImportModal(false)}>
          <div className="modal" style={{ maxWidth: 500, animation: 'slideUpLogin 0.3s ease-out' }}>
            <div className="modal-title">Importar Clientes desde Archivo</div>

            {!importSuccess ? (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
                  Carga tus clientes de forma masiva arrastrando un archivo Excel (.xlsx) o CSV (.csv) aquí, o selecciónalo desde tu computadora.
                </p>
                <div style={{
                  border: '2px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px 16px',
                  textAlign: 'center',
                  background: 'var(--surface2)',
                  cursor: 'pointer',
                  marginBottom: 16
                }} onClick={() => {
                  setImportSuccess(true);
                  // Add some mock imported data
                  setTimeout(() => {
                    const mockImported = [
                      { id: Math.max(...clientes.map(c => c.id), 0) + 1, nombre: 'Importado A (MexParts)', contacto: 'Ing. Pedro Páramo', email: 'pedro@paramo.com', tel: '442-123-4567', tipo: 'empresa', rfc: 'PAR850101XY3', ciudad: 'Querétaro, Qro.', estatus: 'lead', proyectos: [], responsable: 'usr-admin-1' },
                      { id: Math.max(...clientes.map(c => c.id), 0) + 2, nombre: 'Importado B (Innovations)', contacto: 'Lic. Ana Ruelas', email: 'ana@innovations.com', tel: '442-987-6543', tipo: 'empresa', rfc: 'INN901231JK2', ciudad: 'Querétaro, Qro.', estatus: 'activo', proyectos: [], responsable: 'usr-admin-1' }
                    ];
                    mockImported.forEach(c => addClient(c));
                  }, 800);
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Haz clic o arrastra un archivo aquí</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Formatos permitidos: .xlsx, .csv (Máx. 5MB)</div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Cancelar</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  margin: '0 auto 16px'
                }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>¡Importación Exitosa!</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>Se han cargado y validado correctamente 2 registros de clientes nuevos en la base de datos local.</p>
                <button className="btn btn-primary" onClick={() => { setShowImportModal(false); setImportSuccess(false); }} style={{ margin: '0 auto' }}>Aceptar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

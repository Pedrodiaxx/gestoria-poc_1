import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { PROYECTOS_MOCK } from '../data/mockData';
import { filterClientsQuery } from '../core/cqrs/queries/clientQueries';
import * as XLSX from 'xlsx';

export function Clientes() {
  const {
    clientes,
    usuarios,
    conceptos,
    cotizaciones,
    session,
    addClient,
    deleteClient,
    updateClientField
  } = useAppContext();

  const [qClientes, setQClientes] = useState('');
  const [showAddClienteModal, setShowAddClienteModal] = useState(false);
  const [showAddClientDropdown, setShowAddClientDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', nombreComercial: '', contacto: '', email: '', tel: '',
    tipo: 'empresa', personaTipo: 'moral', apoderado: '',
    rfc: '', rfcFiscal: '', ciudad: '', direccionFiscal: '',
    estatus: 'activo', proyectos: [], responsable: 'usr-admin-1'
  });
  const [importDragOver, setImportDragOver] = useState(false);
  const [importError, setImportError] = useState('');
  const [importedRows, setImportedRows] = useState(0);
  const fileInputRef = useRef(null);
  const [showManageStatuses, setShowManageStatuses] = useState(false);

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
  const DEFAULT_STATUSES = [
    { id: 'lead', label: 'Leads', color: '#0086C0' },
    { id: 'activo', label: 'Clientes Activos', color: '#FD9A00' },
    { id: 'pausado', label: 'Clientes Pausados', color: '#E2445C' }
  ];

  const [statusList, setStatusList] = useState(() => {
    try {
      const saved = localStorage.getItem('giu_client_statuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge: ensure default IDs exist so old data still shows correctly
          const merged = [...parsed];
          DEFAULT_STATUSES.forEach(def => {
            if (!merged.find(s => s.id === def.id)) merged.push(def);
          });
          return merged;
        }
      }
    } catch (_) {}
    return DEFAULT_STATUSES;
  });

  useEffect(() => {
    localStorage.setItem('giu_client_statuses', JSON.stringify(statusList));
  }, [statusList]);

  const [openStatusPickerId, setOpenStatusPickerId] = useState(null);
  const [pickerPlacement, setPickerPlacement] = useState('bottom');
  const [newStatusInput, setNewStatusInput] = useState('');
  const [showAddStatusInput, setShowAddStatusInput] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');

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

  const handleDeleteStatus = (statusId) => {
    const hasClients = clientes.some(c => c.estatus === statusId);
    if (hasClients) {
      const clientCount = clientes.filter(c => c.estatus === statusId).length;
      if (!window.confirm(`Este estatus tiene ${clientCount} cliente(s) asignado(s). ¿Deseas eliminarlo? Los clientes quedarán sin estatus asignado.`)) return;
    }
    setStatusList(prev => prev.filter(s => s.id !== statusId));
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
    if (!nuevoCliente.nombre) return;
    const nuevo = {
      ...nuevoCliente,
      id: Math.max(...clientes.map(c => c.id), 0) + 1,
    };
    addClient(nuevo);
    setShowAddClienteModal(false);
    setNuevoCliente({
      nombre: '', nombreComercial: '', contacto: '', email: '', tel: '',
      tipo: 'empresa', personaTipo: 'moral', apoderado: '',
      rfc: '', rfcFiscal: '', ciudad: '', direccionFiscal: '',
      estatus: 'activo', proyectos: [], responsable: 'usr-admin-1'
    });
    setProyectoSearch('');
  };

  // ─── Excel / CSV Import ───────────────────────────────────────────────────
  const FIELD_MAP = {
    'nombre': 'nombre', 'razon social': 'nombre', 'razon_social': 'nombre',
    'nombre comercial': 'nombreComercial', 'nombre_comercial': 'nombreComercial',
    'contacto': 'contacto', 'nombre del contacto': 'contacto',
    'email': 'email', 'correo': 'email', 'correo electronico': 'email',
    'tel': 'tel', 'telefono': 'tel', 'teléfono': 'tel',
    'tipo': 'tipo', 'persona tipo': 'personaTipo', 'persona_tipo': 'personaTipo',
    'fisica/moral': 'personaTipo', 'fisica moral': 'personaTipo',
    'apoderado': 'apoderado', 'representante legal': 'apoderado', 'apoderado/representante': 'apoderado',
    'rfc': 'rfc', 'rfc fiscal': 'rfcFiscal', 'rfc_fiscal': 'rfcFiscal',
    'ciudad': 'ciudad', 'municipio': 'ciudad',
    'direccion fiscal': 'direccionFiscal', 'direccion_fiscal': 'direccionFiscal', 'dirección fiscal': 'direccionFiscal',
    'estatus': 'estatus', 'status': 'estatus', 'estado': 'estatus'
  };

  const parseExcelFile = (file) => {
    setImportError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          setImportError('El archivo no contiene datos o está vacío.');
          return;
        }

        const baseId = Math.max(...clientes.map(c => c.id), 0);
        const newClients = rows.map((row, idx) => {
          const mapped = {};
          Object.entries(row).forEach(([key, val]) => {
            const normalKey = key.toLowerCase().trim().replace(/_/g, ' ');
            const field = FIELD_MAP[normalKey];
            if (field) mapped[field] = String(val).trim();
          });
          return {
            id: baseId + idx + 1,
            nombre: mapped.nombre || '',
            nombreComercial: mapped.nombreComercial || '',
            contacto: mapped.contacto || '',
            email: mapped.email || '',
            tel: mapped.tel || '',
            tipo: mapped.tipo || 'empresa',
            personaTipo: mapped.personaTipo || 'moral',
            apoderado: mapped.apoderado || '',
            rfc: mapped.rfc || '',
            rfcFiscal: mapped.rfcFiscal || '',
            ciudad: mapped.ciudad || '',
            direccionFiscal: mapped.direccionFiscal || '',
            estatus: mapped.estatus || (statusList[0]?.id || 'lead'),
            proyectos: [],
            responsable: session.id || 'usr-admin-1'
          };
        }).filter(c => c.nombre);

        if (newClients.length === 0) {
          setImportError('No se encontró ninguna fila con nombre válido. Revisa que tu archivo tenga una columna "Nombre" o "Razón Social".');
          return;
        }

        newClients.forEach(c => addClient(c));
        setImportedRows(newClients.length);
        setImportSuccess(true);
      } catch (err) {
        setImportError('Error al leer el archivo: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setImportDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setImportError('Formato no soportado. Usa .xlsx, .xls o .csv');
      return;
    }
    parseExcelFile(file);
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Directorio de Clientes</div>
          <div className="page-subtitle">Gestión comercial y relaciones con clientes</div>
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
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => { setShowManageStatuses(true); setShowAddClientDropdown(false); }}
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
                  <span style={{ fontSize: 16 }}>🗑️</span> Administrar Estatus
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CRM Groups */}
      {statusList.map(group => {
        const isCollapsed = collapsedGroups[group.id];
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
                      <th style={{ width: '22%', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Cliente / Razón Social</th>
                      <th style={{ width: '140px', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'center', fontWeight: 600 }}>Estatus del Cliente</th>
                      <th style={{ width: '10%', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'center', fontWeight: 600 }}>Tipo</th>
                      <th style={{ width: '16%', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>RFC Fiscal</th>
                      <th style={{ width: '18%', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Correo Electrónico</th>
                      <th style={{ width: '13%', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Teléfono</th>
                      <th style={{ width: '15%', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Proyectos Relacionados</th>
                      <th className="crm-avatar-col" style={{ width: '90px', padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'center', fontWeight: 600 }}>Responsable</th>
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
                                {c.nombreComercial && c.nombreComercial !== c.nombre && (
                                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', marginTop: 1 }}>
                                    {c.nombreComercial}
                                  </div>
                                )}
                                <div style={{ fontSize: 10.5, fontWeight: 'normal', color: 'var(--text-3)', marginTop: 2 }}>
                                  {c.contacto ? `👤 ${c.contacto}` : ''}{c.apoderado ? ` | Rep: ${c.apoderado}` : ''}{c.ciudad ? ` | 📍 ${c.ciudad}` : ''}
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

                          {/* Tipo Persona */}
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 20,
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              background: c.personaTipo === 'fisica' ? 'rgba(108,99,255,0.12)' : 'rgba(0,134,192,0.1)',
                              color: c.personaTipo === 'fisica' ? '#6c63ff' : '#0086C0',
                              border: c.personaTipo === 'fisica' ? '1px solid rgba(108,99,255,0.3)' : '1px solid rgba(0,134,192,0.25)',
                              textTransform: 'uppercase',
                              cursor: 'pointer'
                            }}
                              onClick={() => {
                                const newVal = c.personaTipo === 'fisica' ? 'moral' : 'fisica';
                                handleUpdateClientField(c.id, 'personaTipo', newVal);
                              }}
                              title="Clic para cambiar">
                              {c.personaTipo === 'fisica' ? 'Física' : 'Moral'}
                            </span>
                          </td>

                          {/* RFC Fiscal */}
                          <td style={{ padding: '10px 12px' }}>
                            {editingCell?.id === c.id && editingCell?.field === 'rfcFiscal' ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                defaultValue={c.rfcFiscal}
                                onBlur={e => {
                                  handleUpdateClientField(c.id, 'rfcFiscal', e.target.value);
                                  setEditingCell(null);
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    handleUpdateClientField(c.id, 'rfcFiscal', e.target.value);
                                    setEditingCell(null);
                                  }
                                }}
                                autoFocus
                                style={{ fontSize: 12, padding: '4px 8px', width: '100%', border: '1px solid var(--accent)', fontFamily: 'DM Mono' }}
                              />
                            ) : (
                              <div
                                onClick={() => setEditingCell({ id: c.id, field: 'rfcFiscal' })}
                                style={{ cursor: 'pointer', fontFamily: 'DM Mono', fontSize: 12, color: c.rfcFiscal ? 'var(--text)' : 'var(--text-3)' }}
                                title="Haz clic para editar"
                              >
                                {c.rfcFiscal || <span style={{ fontStyle: 'italic', fontFamily: 'inherit' }}>+ RFC</span>}
                              </div>
                            )}
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

                          {/* Proyectos */}
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

      {/* Orphan clients: estatus not in statusList */}
      {(() => {
        const knownIds = statusList.map(s => s.id);
        const orphans = filteredClientes.filter(c => !knownIds.includes(c.estatus));
        if (orphans.length === 0) return null;
        const isCollapsed = collapsedGroups['__sin_clasificar__'];
        const isAllSelected = orphans.length > 0 && orphans.every(c => selectedClients.includes(c.id));
        return (
          <div className="crm-group" style={{ animation: 'slideUpLogin 0.4s ease-out', marginBottom: 28 }}>
            <div className="crm-group-header" onClick={() => toggleGroupCollapse('__sin_clasificar__')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
              <span style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block', color: '#797E93', fontSize: '11px' }}>&#9660;</span>
              <div className="crm-group-title" style={{ color: '#797E93', fontSize: '15px', fontWeight: 600 }}>
                Sin Clasificar
                <span className="crm-group-count" style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-3)', marginLeft: 8 }}>({orphans.length} Clientes)</span>
              </div>
            </div>
            {!isCollapsed && (
              <div className="table-wrap" style={{ overflow: 'visible', borderLeft: '6px solid #797E93', borderRadius: '4px', background: 'var(--surface)', paddingBottom: '4px', boxShadow: 'var(--shadow-sm)', marginBottom: 8 }}>
                <table className="crm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th className="crm-checkbox-col" style={{ width: '40px', padding: '10px 0', textAlign: 'center' }}>
                        <div
                          className={`crm-checkbox-box ${isAllSelected ? 'checked' : ''}`}
                          onClick={e => { e.stopPropagation(); handleSelectAll('__sin_clasificar__', orphans); }}
                          style={{ width: '16px', height: '16px', border: '1px solid var(--border-strong)', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isAllSelected ? 'var(--accent)' : 'var(--surface)', color: 'white' }}
                        >
                          {isAllSelected && <Icon name="check" size={10} />}
                        </div>
                      </th>
                      <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Cliente</th>
                      <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Estatus (sin grupo)</th>
                      <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Correo</th>
                      <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'left', fontWeight: 600 }}>Teléfono</th>
                      <th style={{ width: '50px', padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orphans.map(c => {
                      const isSelected = selectedClients.includes(c.id);
                      return (
                        <tr key={c.id} className="crm-row" style={{ background: isSelected ? 'rgba(76,166,106,0.04)' : 'transparent', borderBottom: '1px solid var(--border)' }}>
                          <td className="crm-checkbox-col" style={{ padding: '10px 0', textAlign: 'center' }}>
                            <div className={`crm-checkbox-box ${isSelected ? 'checked' : ''}`} onClick={e => { e.stopPropagation(); handleToggleSelect(c.id); }} style={{ width: '16px', height: '16px', border: '1px solid var(--border-strong)', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isSelected ? 'var(--accent)' : 'var(--surface)', color: 'white' }}>
                              {isSelected && <Icon name="check" size={10} />}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.nombre || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Sin nombre</span>}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <select
                              className="form-control form-control-sm"
                              value={c.estatus || ''}
                              onChange={e => handleUpdateClientField(c.id, 'estatus', e.target.value)}
                              style={{ fontSize: 12 }}
                            >
                              <option value="">-- Asignar estatus --</option>
                              {statusList.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-2)' }}>{c.email || '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-2)' }}>{c.tel || '—'}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteClient(c.id)} style={{ padding: '4px 6px', color: 'var(--red)', display: 'inline-flex', alignItems: 'center' }} title="Eliminar">
                              <Icon name="trash" size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}
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

            {/* Row 1: Nombre + Nombre Comercial */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Nombre o Razón Social *</label>
                <input
                  className="form-control"
                  placeholder="Ej: Inmobiliaria del Bajío S.A."
                  value={nuevoCliente.nombre}
                  onChange={e => setNuevoCliente(n => ({ ...n, nombre: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre Comercial</label>
                <input
                  className="form-control"
                  placeholder="Ej: InmoBajío"
                  value={nuevoCliente.nombreComercial}
                  onChange={e => setNuevoCliente(n => ({ ...n, nombreComercial: e.target.value }))}
                />
              </div>
            </div>

            {/* Row 2: Tipo persona + Responsable */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Persona Física / Moral</label>
                <select
                  className="form-control"
                  value={nuevoCliente.personaTipo}
                  onChange={e => setNuevoCliente(n => ({ ...n, personaTipo: e.target.value }))}
                >
                  <option value="moral">Persona Moral</option>
                  <option value="fisica">Persona Física</option>
                </select>
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
            </div>

            {/* Row 3: Contacto + Apoderado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Nombre del Contacto</label>
                <input
                  className="form-control"
                  placeholder="Ej: Arq. Patricia Noriega"
                  value={nuevoCliente.contacto}
                  onChange={e => setNuevoCliente(n => ({ ...n, contacto: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Apoderado / Representante Legal</label>
                <input
                  className="form-control"
                  placeholder="Ej: Lic. Carlos Méndez"
                  value={nuevoCliente.apoderado}
                  onChange={e => setNuevoCliente(n => ({ ...n, apoderado: e.target.value }))}
                />
              </div>
            </div>

            {/* Row 4: RFC + RFC Fiscal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">RFC</label>
                <input
                  className="form-control"
                  placeholder="Ej: INM850312AB3"
                  value={nuevoCliente.rfc}
                  onChange={e => setNuevoCliente(n => ({ ...n, rfc: e.target.value }))}
                  style={{ fontFamily: 'DM Mono' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">RFC Fiscal</label>
                <input
                  className="form-control"
                  placeholder="Ej: INM850312AB3"
                  value={nuevoCliente.rfcFiscal}
                  onChange={e => setNuevoCliente(n => ({ ...n, rfcFiscal: e.target.value }))}
                  style={{ fontFamily: 'DM Mono' }}
                />
              </div>
            </div>

            {/* Row 5: Email + Tel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

            {/* Row 6: Ciudad + Dirección Fiscal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Ciudad</label>
                <input
                  className="form-control"
                  placeholder="Ej: Querétaro, Qro."
                  value={nuevoCliente.ciudad}
                  onChange={e => setNuevoCliente(n => ({ ...n, ciudad: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección Fiscal</label>
                <input
                  className="form-control"
                  placeholder="Ej: Av. Juárez 100, Col. Centro..."
                  value={nuevoCliente.direccionFiscal}
                  onChange={e => setNuevoCliente(n => ({ ...n, direccionFiscal: e.target.value }))}
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
                disabled={!nuevoCliente.nombre}
                style={{ opacity: !nuevoCliente.nombre ? 0.5 : 1 }}
              >
                <Icon name="check" size={14} /> Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowImportModal(false)}>
          <div className="modal" style={{ maxWidth: 540, animation: 'slideUpLogin 0.3s ease-out' }}>
            <div className="modal-title">Importar Clientes desde Archivo</div>

            {!importSuccess ? (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
                  Carga tus clientes masivamente subiendo un archivo Excel (.xlsx, .xls) o CSV (.csv).
                  Los campos del Excel se mapearán automáticamente. Los campos que no se encuentren quedarán vacíos para editar después.
                </p>

                {/* Field mapping guide */}
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14, fontSize: 11, color: 'var(--text-3)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-2)', fontSize: 12 }}>Columnas reconocidas:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                    {['Nombre', 'Nombre Comercial', 'Contacto', 'Email / Correo', 'Tel / Telefono', 'RFC', 'RFC Fiscal', 'Ciudad', 'Direccion Fiscal', 'Apoderado', 'Fisica/Moral', 'Estatus'].map(f => (
                      <span key={f} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }}>{f}</span>
                    ))}
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  style={{
                    border: `2px dashed ${importDragOver ? 'var(--accent)' : 'var(--border-strong)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '32px 16px',
                    textAlign: 'center',
                    background: importDragOver ? 'var(--accent-light)' : 'var(--surface2)',
                    cursor: 'pointer',
                    marginBottom: 12,
                    transition: 'all 0.2s'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setImportDragOver(true); }}
                  onDragLeave={() => setImportDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Haz clic o arrastra un archivo aquí</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Formatos permitidos: .xlsx, .xls, .csv (Máx. 5MB)</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ display: 'none' }}
                    onChange={handleFileDrop}
                  />
                </div>

                {importError && (
                  <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 12, fontSize: 12, color: 'var(--red)' }}>
                    ⚠️ {importError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => { setShowImportModal(false); setImportError(''); }}>Cancelar</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%',
                  background: 'var(--accent-light)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, margin: '0 auto 16px'
                }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>¡Importación Exitosa!</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
                  Se importaron correctamente <strong>{importedRows}</strong> registros de clientes.
                  Los campos no encontrados en el Excel quedan vacíos para editar.
                </p>
                <button className="btn btn-primary" onClick={() => { setShowImportModal(false); setImportSuccess(false); setImportedRows(0); setImportError(''); }} style={{ margin: '0 auto' }}>Aceptar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Statuses Modal */}
      {showManageStatuses && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowManageStatuses(false)}>
          <div className="modal" style={{ maxWidth: 460, animation: 'slideUpLogin 0.25s ease-out' }}>
            <div className="modal-title">Administrar Estatus de Clientes</div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
              Crea, edita o elimina los estatus del catálogo de clientes.
            </p>

            {/* Status list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
              {statusList.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--surface2)', borderRadius: 'var(--radius-md)',
                  padding: '8px 12px', border: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: s.color, flexShrink: 0,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                  }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginRight: 8 }}>
                    {clientes.filter(c => c.estatus === s.id).length} clientes
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDeleteStatus(s.id)}
                    style={{ color: 'var(--red)', padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Eliminar estatus"
                  >
                    <Icon name="trash" size={12} /> Eliminar
                  </button>
                </div>
              ))}
            </div>

            {/* Add new status */}
            <div style={{ background: 'var(--surface2)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Agregar nuevo estatus</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-control"
                  placeholder="Ej: Archivado"
                  value={newStatusLabel}
                  onChange={e => setNewStatusLabel(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleCreateStatus(newStatusLabel);
                      setNewStatusLabel('');
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    handleCreateStatus(newStatusLabel);
                    setNewStatusLabel('');
                  }}
                >
                  Agregar
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setShowManageStatuses(false); setNewStatusLabel(''); }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;

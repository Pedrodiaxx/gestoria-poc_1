import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../core/context';
import Icon from './common/Icon';
import { PROYECTOS_MOCK } from '../data/mockData';
import { filterClientsQuery } from '../core/cqrs/queries/clientQueries';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { useClientes } from '../hooks/useClientes';

export function Clientes() {
  const {
    clientes,
    usuarios,
    conceptos,
    session,
    addClient,
    deleteClient,
    updateClientField,
    setClientes,
    proyectos: contextProyectos = [],
    updateProyecto
  } = useAppContext();

  // Limpieza explícita de borradores en caché al cargar la vista
  useEffect(() => {
    localStorage.removeItem("cliente_draft");
    localStorage.removeItem("giu_cliente_en_progreso");
  }, []);

  const [qClientes, setQClientes] = useState('');
  const [showAddClienteModal, setShowAddClienteModal] = useState(false);
  const [showAddClientDropdown, setShowAddClientDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', nombreComercial: '', contacto: '', email: '', tel: '',
    tipo: 'empresa', personaTipo: 'moral', apoderado: '', apoderadoLegal: '',
    rfc: '', rfcFiscal: '', ciudad: '', direccionFiscal: '',
    estatus: 'activo', proyectos: [], responsable: 'Gabriel'
  });

  // Hook: carga de clientes delegada a la capa de servicios
  const { crearCliente, actualizarCliente, actualizarCampoCliente, eliminarCliente } = useClientes(setClientes, clientes);
  const [importDragOver, setImportDragOver] = useState(false);
  const [importError, setImportError] = useState('');
  const [importedRows, setImportedRows] = useState(0);
  const fileInputRef = useRef(null);
  const [showManageStatuses, setShowManageStatuses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenEditModal = (c) => {
    setEditingCliente(c);
    setNuevoCliente({
      id: c.id,
      nombre: c.nombre || '',
      nombreComercial: c.nombreComercial || '',
      contacto: c.contacto || '',
      email: c.email || '',
      tel: c.tel || c.telefono || '',
      tipo: c.tipo || 'empresa',
      personaTipo: c.personaTipo || c.tipo || 'moral',
      apoderado: c.apoderado || c.apoderadoLegal || '',
      apoderadoLegal: c.apoderadoLegal || c.apoderado || '',
      rfc: c.rfc || c.rfcFiscal || '',
      ciudad: c.ciudad || '',
      direccionFiscal: c.direccionFiscal || '',
      estatus: c.estatus || 'activo',
      responsable: c.responsable || 'Gabriel'
    });
    setShowAddClienteModal(true);
  };

  // Project selector states
  const [proyectoSearch, setProyectoSearch] = useState('');
  const [showProyectoDropdown, setShowProyectoDropdown] = useState(false);
  const [proyectoCellSearch, setProyectoCellSearch] = useState({});
  const [showProyectoCellDropdown, setShowProyectoCellDropdown] = useState(null);
  const proyectoDropdownRef = useRef(null);

  // All available projects (from context backend API + mock fallback)
  const allProyectos = contextProyectos && contextProyectos.length > 0 ? contextProyectos : PROYECTOS_MOCK;

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
    } catch (_) { }
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

  // 1. Ordenamiento cronológico descendente (los más recientes primero)
  const sortedClientes = [...clientes].sort((a, b) => {
    const valA = a.createdAt || a.fechaCreacion || a.created_at || a.id;
    const valB = b.createdAt || b.fechaCreacion || b.created_at || b.id;
    const dateA = new Date(valA);
    const dateB = new Date(valB);
    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return dateB - dateA;
    }
    const numA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
    return numB - numA;
  });

  // 2. Búsqueda y filtrado sobre el 100% de los registros de la base de datos
  const matchingClientes = filterClientsQuery(sortedClientes, qClientes, usuarios, conceptos);

  // 3. Lógica de renderizado: si la búsqueda está vacía, se muestran únicamente los primeros 12. Si hay búsqueda, se muestran todos los resultados.
  const isSearching = Boolean(qClientes && qClientes.trim() !== '');
  const filteredClientes = isSearching ? matchingClientes : matchingClientes.slice(0, 12);
  const totalClientes = clientes.length;

  const handleUpdateClientField = (id, field, value) => {
    actualizarCampoCliente(id, field, value);
  };

  // Clean up any residual SweetAlert modals in the DOM when client deletion confirmation opens
  useEffect(() => {
    if (clientsToDelete) {
      if (typeof Swal !== 'undefined' && Swal.close) {
        Swal.close();
      }
      if (typeof document !== 'undefined') {
        const swalElements = document.querySelectorAll('.swal2-container');
        swalElements.forEach(el => el.remove());
        document.body.classList.remove('swal2-shown', 'swal2-height-auto');
      }
    }
  }, [clientsToDelete]);

  const handleDeleteClient = (id) => {
    if (typeof Swal !== 'undefined' && Swal.close) {
      Swal.close();
    }
    if (typeof document !== 'undefined') {
      const swalElements = document.querySelectorAll('.swal2-container');
      swalElements.forEach(el => el.remove());
      document.body.classList.remove('swal2-shown', 'swal2-height-auto');
    }
    const client = clientes.find(c => c.id === id);
    if (!client) return;
    setClientsToDelete({
      ids: [id],
      message: `¿Deseas eliminar permanentemente al cliente <strong>${client.nombre}</strong>?`
    });
  };

  const handleBulkMoveStatus = async (newStatusId) => {
    if (selectedClients.length === 0) return;
    try {
      for (const id of selectedClients) {
        await actualizarCampoCliente(id, 'estatus', newStatusId);
      }
      setSelectedClients([]);
    } catch (error) {
      console.error("Error al mover estatus en lote:", error);
    }
  };

  const handleBulkDelete = () => {
    if (typeof Swal !== 'undefined' && Swal.isVisible && Swal.isVisible()) {
      Swal.close();
    }
    if (selectedClients.length === 0) return;
    setClientsToDelete({
      ids: [...selectedClients],
      message: `¿Deseas eliminar permanentemente los <strong>${selectedClients.length}</strong> clientes seleccionados?`
    });
  };

  const confirmEliminarClientes = async () => {
    if (!clientsToDelete) return;
    try {
      for (const id of clientsToDelete.ids) {
        await eliminarCliente(id);
      }
      setSelectedClients(prev => prev.filter(selectedId => !clientsToDelete.ids.includes(selectedId)));
      setClientsToDelete(null);
    } catch (error) {
      console.error("Error al eliminar clientes:", error);
    }
  };

  const handleInlineAdd = async (groupId) => {
    const name = inlineAddName[groupId]?.trim();
    if (!name) return;
    const newClient = {
      nombre: name,
      contacto: 'S/N',
      email: '',
      telefono: '',
      tipo: 'empresa',
      estatus: groupId
    };
    try {
      await crearCliente(newClient);
      setInlineAddName(prev => ({ ...prev, [groupId]: '' }));
    } catch (error) {
      console.error("Error al añadir cliente en línea:", error);
    }
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

  const handleQuickAddClient = async () => {
    const defaultGroup = statusList[0]?.id || 'lead';
    const newClient = {
      nombre: 'Nuevo Cliente',
      contacto: 'S/N',
      email: '',
      telefono: '',
      tipo: 'empresa',
      estatus: defaultGroup
    };
    try {
      await crearCliente(newClient);
      setShowAddClientDropdown(false);
    } catch (error) {
      console.error("Error al añadir cliente rápido:", error);
    }
  };

  const handleMockImport = () => {
    setShowImportModal(true);
    setShowAddClientDropdown(false);
  };

  const handleAddCliente = async () => {
    if (!nuevoCliente.nombre || isSubmitting) return;

    setIsSubmitting(true);
    const datosParaBackend = {
      id: nuevoCliente.id,
      nombre: nuevoCliente.nombre,
      nombreComercial: nuevoCliente.nombreComercial || '',
      apoderadoLegal: nuevoCliente.apoderado || nuevoCliente.apoderadoLegal || '',
      rfc: nuevoCliente.rfc || '',
      ciudad: nuevoCliente.ciudad || '',
      direccionFiscal: nuevoCliente.direccionFiscal || '',
      responsable: nuevoCliente.responsable || 'Gabriel',
      contacto: nuevoCliente.contacto || '',
      email: nuevoCliente.email || '',
      telefono: nuevoCliente.tel || nuevoCliente.telefono || '',
      estatus: nuevoCliente.estatus || 'activo',
      tipo: nuevoCliente.personaTipo || nuevoCliente.tipo || 'moral'
    };

    try {
      if (editingCliente) {
        await actualizarCliente(editingCliente.id, datosParaBackend);
        if (selectedClient && selectedClient.id === editingCliente.id) {
          setSelectedClient(prev => ({ ...prev, ...datosParaBackend }));
        }
      } else {
        await crearCliente(datosParaBackend);
      }

      setShowAddClienteModal(false);
      setEditingCliente(null);
      setNuevoCliente({
        nombre: '', nombreComercial: '', contacto: '', email: '', tel: '',
        tipo: 'empresa', personaTipo: 'moral', apoderado: '', apoderadoLegal: '',
        rfc: '', ciudad: '', direccionFiscal: '',
        estatus: 'activo', proyectos: [], responsable: 'Gabriel'
      });
      setProyectoSearch('');
    } catch (error) {
      console.error("Hubo un problema al guardar el cliente:", error);
      alert("No se pudo guardar el cliente en el servidor. Revisa la consola.");
    } finally {
      setIsSubmitting(false);
    }
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

        const saveImported = async () => {
          try {
            for (const c of newClients) {
              const payload = {
                nombre: c.nombre,
                contacto: c.contacto,
                email: c.email,
                telefono: c.tel,
                estatus: c.estatus,
                tipo: c.tipo
              };
              await crearCliente(payload);
            }
            setImportedRows(newClients.length);
            setImportSuccess(true);
          } catch (err) {
            setImportError('Error al guardar los clientes importados: ' + err.message);
          }
        };
        saveImported();
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

  const [selectedClientId, setSelectedClientId] = useState(null);
  const selectedClient = (clientes || []).find(c => c.id === selectedClientId) || filteredClientes[0] || (clientes || [])[0] || null;

  const totalActivosCount = (clientes || []).filter(c => c.estatus === 'activo' || c.estatus === 'Activo' || c.estatus === 'Clientes Activos').length || 6;
  const totalLeadsCount = (clientes || []).filter(c => c.estatus === 'lead' || c.estatus === 'Lead' || c.estatus === 'Leads').length || 1;

  const getRelatedProjectsForClient = (client) => {
    if (!client) return [];

    // 1. Proyectos asociados por clienteId
    const clientProjects = allProyectos.filter(p => p && (p.clienteId === client.id || String(p.clienteId) === String(client.id)));
    if (clientProjects.length > 0) return clientProjects;

    // 2. Proyectos asociados explícitamente en el array proyectos del cliente
    if (client.proyectos && Array.isArray(client.proyectos) && client.proyectos.length > 0) {
      return client.proyectos.map(pName => (typeof pName === 'string' ? { nombre: pName } : pName));
    }

    // 3. Mapeo específico solo para clientes mock de demostración inicial
    if (client.nombre?.toLowerCase().includes('roberto')) {
      return [{ nombre: 'Plaza Comercial Paseo Montejo - Fase II' }, { nombre: 'Montejo - Fiscal' }];
    }
    if (client.nombre?.toLowerCase().includes('urbania')) {
      return [{ nombre: 'Desarrollo Residencial Vía Montejo - Manifestación de Impacto' }];
    }
    if (client.nombre?.toLowerCase().includes('desarrolladora metropolitana')) {
      return [{ nombre: 'Plaza Comercial Paseo Montejo - Fase II' }];
    }

    // Si el cliente no tiene proyectos vinculados, NO se asigna ningún proyecto falso por defecto
    return [];
  };

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Directorio de Clientes</div>
          <div className="page-subtitle">Gestión comercial y relaciones con clientes</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddClienteModal(true)}
          >
            <Icon name="plus" size={14} /> Nuevo Cliente
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setShowManageStatuses(true)}
          >
            Estatus
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleMockImport}
          >
            Importar
          </button>
        </div>
      </div>

      {/* 3 KPI Summary Cards - Standard GIU metric-grid */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
        <div className="metric-card">
          <div className="metric-label">Total Clientes</div>
          <div className="metric-value">{totalClientes}</div>
          <div className="metric-sub">registrados en la plataforma</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Clientes Activos</div>
          <div className="metric-value text-green">{totalActivosCount}</div>
          <div className="metric-sub">en seguimiento activo</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Leads Registrados</div>
          <div className="metric-value text-amber">{totalLeadsCount}</div>
          <div className="metric-sub">prospectos iniciales</div>
        </div>
      </div>

      {/* Master-Detail Main Responsive Grid Layout */}
      <div className={`clientes-main-layout ${selectedClient ? 'has-detail' : ''}`}>

        {/* LEFT PANEL (Master Panel - Client Cards & Search) */}
        <div className="clientes-master-col">

          {/* Search Input Bar - Standard GIU */}
          <div className="search-wrap" style={{ maxWidth: 420, marginBottom: 12 }}>
            <Icon name="search" size={14} />
            <input
              type="text"
              className="form-control search-input"
              placeholder="Buscar por cliente, proyectos, estatus, correo..."
              value={qClientes}
              onChange={e => setQClientes(e.target.value)}
            />
          </div>

          {/* Results Summary Indicator */}
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
            {isSearching
              ? `Mostrando ${filteredClientes.length} resultado(s) para "${qClientes}" de ${totalClientes} clientes.`
              : totalClientes > 12
                ? `Mostrando los 12 clientes más recientes (de ${totalClientes} registrados). Usa la búsqueda para encontrar cualquier otro.`
                : `Mostrando ${filteredClientes.length} cliente(s).`
            }
          </div>

          {/* Client List Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedClient ? 'repeat(auto-fill, minmax(260px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filteredClientes.map(c => {
              const isSelected = selectedClient?.id === c.id;
              const isLead = c.estatus === 'lead' || c.estatus === 'Lead';
              const isActivo = c.estatus === 'activo' || c.estatus === 'Activo' || c.estatus === 'Clientes Activos';

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className="card"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    background: isSelected ? 'var(--surface2)' : 'var(--surface)',
                    border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 170,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  {/* Top Content */}
                  <div>
                    {/* Header Row: Client Name & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }} title="Nombre o Razón Social">
                          {c.nombre}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                          {c.contacto && c.contacto !== 'S/N' ? `Contacto: ${c.contacto}` : 'Contacto: S/N'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                        <span className={`badge ${isLead ? 'badge-gray' : isActivo ? 'badge-green' : 'badge-amber'}`}>
                          {isLead ? 'LEAD' : isActivo ? 'ACTIVO' : (c.estatus?.toUpperCase() || 'ACTIVO')}
                        </span>
                        <span className="badge badge-gray" style={{ textTransform: 'uppercase' }}>
                          {c.personaTipo || 'Moral'}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Lines */}
                    <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 4, margin: '8px 0' }}>
                      {c.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon name="mail" size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.email}</span>
                        </div>
                      )}
                      {c.tel && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon name="phone" size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                          <span>{c.tel}</span>
                        </div>
                      )}
                      {c.rfc && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                          RFC: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{c.rfc}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Footer Row: Related Projects & Delete Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid var(--border)',
                    gap: 8
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1, overflow: 'hidden' }}>
                      {getRelatedProjectsForClient(c).map((proj, idx) => (
                        <span key={idx} className="badge badge-gray" style={{ fontSize: 10 }}>
                          {proj.nombre ? (proj.nombre.length > 20 ? proj.nombre.substring(0, 20) + '...' : proj.nombre) : proj}
                        </span>
                      ))}
                    </div>

                    {/* Actions Container */}
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(c);
                        }}
                        style={{ padding: '4px 6px' }}
                        title="Editar cliente"
                      >
                        <Icon name="edit" size={13} />
                      </button>

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(c.id);
                        }}
                        style={{ padding: '4px 6px', color: 'var(--red)' }}
                        title="Eliminar cliente"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL (Detail Drawer - Selected Client) */}
        {selectedClient && (
          <div className="card clientes-detail-card" style={{ padding: 20 }}>
            {/* Header / Action Bar de Detalle: Editar Cliente + Cerrar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="user" size={15} style={{ color: 'var(--accent)' }} />
                <span>Perfil de Cliente</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenEditModal(selectedClient)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon name="edit" size={12} /> Editar
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedClientId(null)}
                  title="Cerrar detalle"
                  style={{ padding: '4px 8px', color: 'var(--text-3)' }}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            </div>

            {/* Section 1: DATOS FISCALES Y COMERCIALES */}
            <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                DATOS FISCALES Y COMERCIALES
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Nombre o Razón Social:</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginTop: 1 }}>
                    {selectedClient.nombre || '—'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Nombre Comercial:</div>
                  <div style={{ color: 'var(--text-2)' }}>
                    {selectedClient.nombreComercial || selectedClient.nombre || '—'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 2 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Persona Física / Moral:</div>
                    <div style={{ color: 'var(--text)', marginTop: 1 }}>
                      Persona {selectedClient.personaTipo || selectedClient.tipo || 'Moral'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>RFC:</div>
                    <div style={{ color: 'var(--text)', fontWeight: 600, marginTop: 1 }}>
                      {selectedClient.rfc || selectedClient.rfcFiscal || '—'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Estatus:</div>
                  <span className={`badge ${(selectedClient.estatus === 'lead' || selectedClient.estatus === 'Lead') ? 'badge-gray' : 'badge-green'}`}>
                    {(selectedClient.estatus === 'lead' || selectedClient.estatus === 'Lead') ? 'LEAD' : 'CLIENTE ACTIVO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: CONTACTO & REPRESENTACIÓN */}
            <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="user" size={13} style={{ color: 'var(--accent)' }} />
                <span>CONTACTO & REPRESENTACIÓN</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 100 }}>Contacto:</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {selectedClient.contacto && selectedClient.contacto !== 'S/N' ? selectedClient.contacto : '—'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 100 }}>Ciudad:</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                    {selectedClient.ciudad || '—'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 100 }}>Dirección:</span>
                  <span style={{ color: 'var(--text-2)', lineHeight: 1.4 }}>
                    {selectedClient.direccionFiscal || '—'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 100 }}>Correo:</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{selectedClient.email || '—'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 100 }}>Teléfono:</span>
                  <span style={{ color: '#27272A' }}>{selectedClient.tel || selectedClient.telefono || '—'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: '#71717A', fontWeight: 500, minWidth: 120 }}>Apoderado Legal:</span>
                  <span style={{ color: '#27272A', fontWeight: 500 }}>{selectedClient.apoderadoLegal || selectedClient.apoderado || '—'}</span>
                </div>
              </div>
            </div>

            {/* Section 3: ASIGNACIÓN GIU & HISTORIAL */}
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F4F4F5' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                ASIGNACIÓN GIU & HISTORIAL
              </div>
              <div style={{ fontSize: 13, color: '#27272A', marginBottom: 8 }}>
                <strong style={{ color: '#18181B' }}>Responsable:</strong> {selectedClient.responsable || 'Gabriel'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: '#71717A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E4E4E7', paddingBottom: 3 }}>
                  <span>Estatus cambió a Cliente Activo</span>
                  <span style={{ fontFamily: 'DM Mono, monospace' }}>3/01/2026</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E4E4E7', paddingBottom: 3 }}>
                  <span>Asignación de apoderado legal</span>
                  <span style={{ fontFamily: 'DM Mono, monospace' }}>3/01/2026</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Registro inicial de Lead</span>
                  <span style={{ fontFamily: 'DM Mono, monospace' }}>3/01/2026</span>
                </div>
              </div>
            </div>

            {/* Section 4: PROYECTOS E HITOS (Compact Project Cards) */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                PROYECTOS E HITOS
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {getRelatedProjectsForClient(selectedClient).length > 0 ? (
                  getRelatedProjectsForClient(selectedClient).map((proj, idx) => (
                    <div key={idx} style={{
                      background: '#FAFAFA',
                      border: '1px solid #E4E4E7',
                      borderRadius: 6,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#18181B' }}>
                          {proj.nombre || proj}
                        </span>
                        <span style={{ fontSize: 10, background: '#E6F4EA', color: '#1E5631', padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                          En Proceso
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#71717A', marginTop: 2 }}>
                        <span>Hito: Contrato firmado</span>
                        <span style={{ fontFamily: 'DM Mono, monospace' }}>3/01/2026</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 12, color: '#A1A1AA', fontStyle: 'italic', padding: '8px 0' }}>
                    Sin proyectos vinculados.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

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

      {/* Add / Edit Client Modal */}
      {showAddClienteModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowAddClienteModal(false); setEditingCliente(null); } }}>
          <div className="modal">
            <div className="modal-title">{editingCliente ? `Editar Cliente: ${editingCliente.nombre}` : 'Registrar Nuevo Cliente'}</div>

            {/* Row 1: Nombre + Nombre Comercial */}
            <div className="form-grid-2">
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
            <div className="form-grid-2">
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
                  {usuarios.filter(u => u.rol !== 'cliente').map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Contacto + Apoderado */}
            <div className="form-grid-2">
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

            {/* Row 4: RFC */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">RFC</label>
              <input
                className="form-control"
                placeholder="Ej: INM850312AB3"
                value={nuevoCliente.rfc || ''}
                onChange={e => setNuevoCliente(n => ({ ...n, rfc: e.target.value }))}
                style={{ fontFamily: 'DM Mono, monospace' }}
              />
            </div>

            {/* Row 5: Email + Tel */}
            <div className="form-grid-2">
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
            <div className="form-grid-2">
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
                    zIndex: 1002, maxHeight: 240, overflowY: 'auto', marginTop: 4
                  }}>
                    {(() => {
                      const term = proyectoSearch.toLowerCase().trim();
                      const matching = allProyectos.filter(p => {
                        if (!p) return false;
                        const nom = p.nombre || '';
                        const idStr = p.id ? String(p.id) : '';
                        return !term || nom.toLowerCase().includes(term) || idStr.toLowerCase().includes(term);
                      });
                      const visible = matching.slice(0, 10);

                      if (matching.length === 0) {
                        return (
                          <div style={{ padding: '12px', fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
                            No se encontraron proyectos
                          </div>
                        );
                      }

                      return (
                        <>
                          {visible.map(p => {
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
                          {matching.length > 10 && (
                            <div style={{ padding: '8px 12px', fontSize: 11, color: '#71717A', fontStyle: 'italic', textAlign: 'center', background: '#FAFAFA', borderTop: '1px solid #E4E4E7' }}>
                              Mostrando 10 de {matching.length} proyectos. Usa el buscador para filtrar más.
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>Selecciona uno o más proyectos del listado</div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => { setShowAddClienteModal(false); setEditingCliente(null); setShowAddStatusInput(false); setNewStatusLabel(''); }}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleAddCliente}
                disabled={!nuevoCliente.nombre || isSubmitting}
                style={{ opacity: (!nuevoCliente.nombre || isSubmitting) ? 0.5 : 1 }}
              >
                <Icon name="check" size={14} /> {isSubmitting ? 'Guardando...' : (editingCliente ? 'Guardar Cambios' : 'Registrar Cliente')}
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
                    border: `1px dashed ${importDragOver ? 'var(--accent)' : 'var(--border-strong)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: importDragOver ? 'var(--accent-light)' : 'var(--surface)',
                    cursor: 'pointer',
                    marginBottom: 12,
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setImportDragOver(true); }}
                  onDragLeave={() => setImportDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <Icon name="upload" size={20} style={{ color: importDragOver ? 'var(--accent)' : 'var(--text-3)' }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Arrastra tus archivos aquí o haz clic para examinar</div>
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
                    {importError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => { setShowImportModal(false); setImportError(''); }}>Cancelar</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--accent-light)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px'
                }}>
                  <Icon name="check" size={20} />
                </div>
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

      {/* Confirmation Modal for Client Deletion */}
      {clientsToDelete && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)', zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)', padding: 16
          }}
          onClick={() => setClientsToDelete(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E4E4E7',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
              padding: '24px 28px',
              maxWidth: 420,
              width: '100%',
              zIndex: 100000,
              position: 'relative',
              animation: 'slideUpLogin 0.2s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: '#FEE2E2',
                color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Icon name="trash" size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#18181B' }}>Confirmar eliminación</h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#71717A' }}>Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#3F3F46', marginBottom: 20, lineHeight: 1.5 }}
              dangerouslySetInnerHTML={{ __html: clientsToDelete.message }} />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => setClientsToDelete(null)}
                style={{
                  background: '#FFFFFF', border: '1px solid #E4E4E7', color: '#3F3F46',
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                className="btn"
                onClick={confirmEliminarClientes}
                style={{
                  background: '#DC2626', color: '#FFFFFF', border: 'none',
                  padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer'
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

export default Clientes;

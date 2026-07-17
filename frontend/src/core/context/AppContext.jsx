import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  addClientCommand, deleteClientCommand, updateClientFieldCommand,
  addUserCommand, saveUserEditCommand, deleteUserCommand,
  addQuoteCommand, addConceptCommand 
} from '../cqrs';
import { getDefaultModulos } from '../../data/mockData';
import { fetchClientes, updateCliente } from '../../services/clientesService';
import { fetchProyectos, updateProyecto as updateProyectoService } from '../../services/proyectosService';
import { fetchPresupuestos } from '../../services/presupuestosService';
import { fetchCotizaciones } from '../../services/cotizacionesService';
import { fetchTareas } from '../../services/tareasService';
import { fetchConceptos } from '../../services/conceptosService';

const AppContext = createContext(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

export const AppContextProvider = ({ 
  children,
  clientRepository,
  userRepository,
  conceptRepository,
  quoteRepository,
  rolesRepository,
  projectRepository,
  budgetRepository,
  taskRepository,
  initialActiveTab = 'home'
}) => {
  // ── Hash-based navigation: sync active tab with URL for browser back/forward ──
  const [active, setActiveRaw] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || initialActiveTab;
  });

  // Wrapper: every time we change tab programmatically, push to browser history
  const setActive = (tab) => {
    if (tab === active) return;
    setActiveRaw(tab);
    window.history.pushState(null, '', `#${tab}`);
  };

  // Listen for browser back/forward button
  useEffect(() => {
    const onPopState = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setActiveRaw(hash);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const [preselectedProjectId, setPreselectedProjectId] = useState(null);
  const [session, setSession] = useState(() => {
    const saved = sessionStorage.getItem('giu_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate: Ensure 'proyectos' and 'clientes' modules are enabled for admin / gestor session
      let changed = false;
      if (parsed.rol === 'admin' || parsed.rol === 'gestor') {
        if (parsed.modulos) {
          if (!parsed.modulos.includes('proyectos')) {
            parsed.modulos = [...parsed.modulos, 'proyectos'];
            changed = true;
          }
          if (!parsed.modulos.includes('clientes')) {
            parsed.modulos = [...parsed.modulos, 'clientes'];
            changed = true;
          }
        }
      }
      if (changed) {
        sessionStorage.setItem('giu_session', JSON.stringify(parsed));
      }
      return parsed;
    }
    return null;
  });

  useEffect(() => {
    if (session) {
      sessionStorage.setItem('giu_session', JSON.stringify(session));
    } else {
      sessionStorage.removeItem('giu_session');
    }
  }, [session]);

  const [clientes, setClientes] = useState(() => clientRepository.getAll());
  const [conceptos, setConceptos] = useState(() => conceptRepository.getAll());
  const [cotizaciones, setCotizaciones] = useState(() => quoteRepository.getAll());
  const [usuarios, setUsuarios] = useState(() => {
    const rawUsers = userRepository.getAll();
    return rawUsers.map(u => {
      const mappedRol = u.rol === 'empleado' ? 'gestor' : u.rol;
      let currentModulos = u.modulos || [];
      if (currentModulos.length === 0) {
        currentModulos = getDefaultModulos(mappedRol);
      }
      // Auto-migrate: Ensure 'proyectos' and 'clientes' modules are enabled for admin / gestor in DB
      if (mappedRol === 'admin' || mappedRol === 'gestor') {
        if (!currentModulos.includes('proyectos')) {
          currentModulos = [...currentModulos, 'proyectos'];
        }
        if (!currentModulos.includes('clientes')) {
          currentModulos = [...currentModulos, 'clientes'];
        }
      }
      return {
        ...u,
        rol: mappedRol,
        modulos: currentModulos
      };
    });
  });

  const [rolesList, setRolesList] = useState(() => rolesRepository.getAll());
  const [proyectos, setProyectos] = useState(() => projectRepository.getAll());
  const [presupuestos, setPresupuestos] = useState(() => budgetRepository.getAll());
  const [tareas, setTareas] = useState(() => taskRepository.getAll());

  // Global background synchronization with remote backend (Render API)
  useEffect(() => {
    if (!session) return;
    const cargarTodo = async () => {
      try {
        const queryParams = {};
        if (session.clienteId) queryParams.clienteId = session.clienteId;
        if (session.rol) queryParams.rol = session.rol;

        // Fetch and load clients
        const clientsData = await fetchClientes();
        if (clientsData && clientsData.length > 0) {
          setClientes(clientsData);
        }

        // Fetch and load projects
        const projectsData = await fetchProyectos(queryParams);
        if (projectsData && projectsData.length > 0) {
          setProyectos(projectsData);
        }

        // Fetch and load budgets
        const budgetsData = await fetchPresupuestos(queryParams);
        if (budgetsData && budgetsData.length > 0) {
          setPresupuestos(budgetsData);
        }

        // Fetch and load quotes
        const quotesData = await fetchCotizaciones(queryParams);
        if (quotesData && quotesData.length > 0) {
          setCotizaciones(quotesData);
        }

        // Fetch and load tasks
        const tasksData = await fetchTareas();
        if (tasksData && tasksData.length > 0) {
          setTareas(tasksData);
        }

        // Fetch and load concepts
        const conceptsData = await fetchConceptos();
        if (conceptsData && conceptsData.length > 0) {
          setConceptos(conceptsData);
        }
      } catch (err) {
        console.error("Error en sincronizacion global inicial:", err);
      }
    };
    cargarTodo();
  }, [session]);

  // Sync to database repositories on changes
  useEffect(() => {
    userRepository.save(usuarios);
  }, [usuarios, userRepository]);

  useEffect(() => {
    clientRepository.save(clientes);
  }, [clientes, clientRepository]);

  useEffect(() => {
    conceptRepository.save(conceptos);
  }, [conceptos, conceptRepository]);

  useEffect(() => {
    quoteRepository.save(cotizaciones);
  }, [cotizaciones, quoteRepository]);

  useEffect(() => {
    rolesRepository.save(rolesList);
  }, [rolesList, rolesRepository]);

  useEffect(() => {
    projectRepository.save(proyectos);
  }, [proyectos, projectRepository]);

  useEffect(() => {
    budgetRepository.save(presupuestos);
  }, [presupuestos, budgetRepository]);

  useEffect(() => {
    taskRepository.save(tareas);
  }, [tareas, taskRepository]);

  // Command wrappers
  const addClient = (nuevo) => addClientCommand(setClientes, nuevo, clientRepository);
  const deleteClient = (id) => deleteClientCommand(setClientes, id, clientRepository);
  const updateClientField = async (id, field, value) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    const clienteExistente = clientes.find(c => c.id === id);
    if (clienteExistente) {
      const backendField = field === 'tel' ? 'telefono' : field;
      const clienteActualizado = {
        id: clienteExistente.id,
        nombre: clienteExistente.nombre || "",
        contacto: clienteExistente.contacto || "",
        email: clienteExistente.email || "",
        telefono: clienteExistente.telefono || clienteExistente.tel || "",
        estatus: clienteExistente.estatus || "activo",
        tipo: clienteExistente.tipo || "empresa",
        [backendField]: value
      };
      try {
        await updateCliente(id, clienteActualizado);
      } catch (err) {
        console.error("Error al persistir cambio de cliente en backend:", err);
      }
    }
  };

  const addUser = (nuevo) => addUserCommand(setUsuarios, nuevo, userRepository);
  const saveUserEdit = (updatedUser) => saveUserEditCommand(setUsuarios, updatedUser, userRepository);
  const deleteUser = (id) => deleteUserCommand(setUsuarios, id, userRepository);

  const addQuote = (nueva) => addQuoteCommand(setCotizaciones, nueva, quoteRepository);
  const addConcept = (nuevo) => addConceptCommand(setConceptos, nuevo, conceptRepository);
  
  const addProyecto = (nuevo) => {
    setProyectos(prev => [nuevo, ...prev]);
  };
  const updateProyecto = async (updated) => {
    // Optimistic update of local state
    setProyectos(prev => prev.map(p => p.id === updated.id ? updated : p));
    try {
      const idNumerico = updated.idNumerico || updated.id;
      const modeloProyecto = {
        id: idNumerico,
        nombre: updated.nombre,
        clienteId: updated.clienteId,
        estatus: updated.estatus,
        prioridad: updated.prioridad,
        avance: updated.avance,
        fechaInicio: updated.fechaInicio,
        monto: updated.monto
      };
      await updateProyectoService(idNumerico, modeloProyecto);
    } catch (err) {
      console.error("Error al actualizar proyecto en el backend:", err);
    }
  };

  const linkClientAccount = (user, currentClientesList = clientes) => {
    if (user.rol !== 'cliente') return user;

    const emailClean = user.email.trim().toLowerCase();
    let client = currentClientesList.find(c => c.email && c.email.trim().toLowerCase() === emailClean);

    // Fallback: If it's Patricia N. and she wasn't matched, find by contact name "Patricia Noriega" or ID 6
    if (!client && emailClean === 'pnoriega@gmail.com') {
      client = currentClientesList.find(c => c.id === 6 || (c.contacto && c.contacto.toLowerCase().includes('patricia noriega')));
      if (client) {
        // Update client email so they are linked directly next time
        client.email = 'pnoriega@gmail.com';
        updateClientField(client.id, 'email', 'pnoriega@gmail.com');
      }
    }

    if (!client) {
      const newId = Math.max(...currentClientesList.map(c => c.id), 0) + 1;
      client = {
        id: newId,
        nombre: user.nombre,
        contacto: user.nombre,
        email: user.email,
        tel: '',
        tipo: 'persona',
        rfc: '',
        ciudad: ''
      };
      // Persist the client
      addClient(client);
    }

    return {
      ...user,
      clienteId: client.id
    };
  };

  const handleLogin = (user) => {
    const linkedUser = linkClientAccount(user);
    const linkedUserWithModulos = {
      ...linkedUser,
      modulos: linkedUser.modulos && linkedUser.modulos.length > 0
        ? linkedUser.modulos
        : getDefaultModulos(linkedUser.rol)
    };
    setSession(linkedUserWithModulos);
    const allowed = linkedUserWithModulos.modulos;
    const defaultTab = allowed && allowed.length > 0 ? allowed[0] : 'home';
    setActive(defaultTab);
  };

  const handleLogout = () => {
    setSession(null);
    setActive('home');
  };

  return (
    <AppContext.Provider value={{
      active,
      setActive,
      session,
      setSession,
      clientes,
      setClientes,
      conceptos,
      setConceptos,
      cotizaciones,
      setCotizaciones,
      usuarios,
      setUsuarios,
      rolesList,
      setRolesList,
      proyectos,
      setProyectos,
      presupuestos,
      setPresupuestos,
      tareas,
      setTareas,
      preselectedProjectId,
      setPreselectedProjectId,
      
      // Commands
      addClient,
      deleteClient,
      updateClientField,
      addUser,
      saveUserEdit,
      deleteUser,
      addQuote,
      addConcept,
      addProyecto,
      updateProyecto,
      handleLogin,
      handleLogout
    }}>
      {children}
    </AppContext.Provider>
  );
};


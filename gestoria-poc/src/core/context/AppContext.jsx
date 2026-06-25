import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  addClientCommand, deleteClientCommand, updateClientFieldCommand,
  addUserCommand, saveUserEditCommand, deleteUserCommand,
  addQuoteCommand, addConceptCommand 
} from '../cqrs';
import { getDefaultModulos } from '../../data/mockData';

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
  initialActiveTab = 'home'
}) => {
  const [active, setActive] = useState(initialActiveTab);
  const [session, setSession] = useState(() => {
    const saved = sessionStorage.getItem('giu_session');
    return saved ? JSON.parse(saved) : null;
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
      return {
        ...u,
        rol: mappedRol,
        modulos: u.modulos && u.modulos.length > 0 ? u.modulos : getDefaultModulos(mappedRol)
      };
    });
  });

  const [rolesList, setRolesList] = useState(() => rolesRepository.getAll());

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

  // Command wrappers
  const addClient = (nuevo) => addClientCommand(setClientes, nuevo, clientRepository);
  const deleteClient = (id) => deleteClientCommand(setClientes, id, clientRepository);
  const updateClientField = (id, field, value) => updateClientFieldCommand(setClientes, id, field, value, clientRepository);

  const addUser = (nuevo) => addUserCommand(setUsuarios, nuevo, userRepository);
  const saveUserEdit = (updatedUser) => saveUserEditCommand(setUsuarios, updatedUser, userRepository);
  const deleteUser = (id) => deleteUserCommand(setUsuarios, id, userRepository);

  const addQuote = (nueva) => addQuoteCommand(setCotizaciones, nueva, quoteRepository);
  const addConcept = (nuevo) => addConceptCommand(setConceptos, nuevo, conceptRepository);

  const linkClientAccount = (user, currentClientesList = clientes) => {
    if (user.rol !== 'cliente') return user;

    const emailClean = user.email.trim().toLowerCase();
    let client = currentClientesList.find(c => c.email && c.email.trim().toLowerCase() === emailClean);

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
      
      // Commands
      addClient,
      deleteClient,
      updateClientField,
      addUser,
      saveUserEdit,
      deleteUser,
      addQuote,
      addConcept,
      handleLogin,
      handleLogout
    }}>
      {children}
    </AppContext.Provider>
  );
};


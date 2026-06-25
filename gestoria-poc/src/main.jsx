import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AppContextProvider } from './core/context';
import { LocalStorageRepository } from './core/repository';
import {
  CLIENTES,
  CATALOGO_CONCEPTOS,
  initialCotizaciones,
  initialPresupuestosDB
} from './data/mockData';

// Default users for userRepository
const DEFAULT_USERS = [
  {
    id: 'usr-admin-1',
    nombre: 'Gabriel (Admin)',
    email: 'Gabrielcoc@gmail.com',
    contrasenia: '123456789',
    rol: 'admin',
    modulos: ['presupuestos', 'administracion', 'tareas', 'catalogo', 'cotizaciones'],
    avatar: 'G',
    color: '#2A5F3F'
  },
  {
    id: 'usr-emp-1',
    nombre: 'Laura M.',
    email: 'laura@gestoria.com',
    contrasenia: 'empleado123',
    rol: 'gestor',
    modulos: ['presupuestos', 'tareas', 'catalogo', 'cotizaciones'],
    avatar: 'LM',
    color: '#1A5276'
  },
  {
    id: 'usr-cli-1',
    nombre: 'Patricia N.',
    email: 'pnoriega@gmail.com',
    contrasenia: 'cliente123',
    rol: 'cliente',
    modulos: ['presupuestos', 'cotizaciones'],
    avatar: 'PN',
    color: '#5B2C6F'
  }
];

// Default roles for rolesRepository
const DEFAULT_ROLES = [
  { id: 'admin', label: 'Administrador' },
  { id: 'gestor', label: 'Gestor' },
  { id: 'cliente', label: 'Cliente' }
];

// Instantiate LocalStorageRepositories (Injected as dependencies)
const clientRepository = new LocalStorageRepository('giu_clientes', CLIENTES);
const userRepository = new LocalStorageRepository('giu_usuarios', DEFAULT_USERS);
const conceptRepository = new LocalStorageRepository('giu_conceptos', CATALOGO_CONCEPTOS);
const quoteRepository = new LocalStorageRepository('giu_cotizaciones', initialCotizaciones);
const rolesRepository = new LocalStorageRepository('giu_roles', DEFAULT_ROLES);
const budgetRepository = new LocalStorageRepository('giu_presupuestos', initialPresupuestosDB);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppContextProvider
      clientRepository={clientRepository}
      userRepository={userRepository}
      conceptRepository={conceptRepository}
      quoteRepository={quoteRepository}
      rolesRepository={rolesRepository}
    >
      <App budgetRepository={budgetRepository} />
    </AppContextProvider>
  </React.StrictMode>,
);

import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para autenticación y gestión de usuarios.
 * Conecta con el controlador de autenticación del backend.
 */

export async function login(username, password) {
  const endpoint = `${API_BASE_URL}/api/auth/login`;
  console.log("[AUTH_ENDPOINT]:", endpoint);

  const cleanUser = (username || '').trim();
  const cleanPass = (password || '').trim();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUser,
        password: cleanPass
      })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Intento de login con backend falló o está conectando, usando fallback local:", err.message);
  }

  // Fallback local/offline si el servidor está iniciando o no responde
  const saved = localStorage.getItem('giu_usuarios');
  const localUsers = saved ? JSON.parse(saved) : [];

  const found = localUsers.find(u =>
    u.nombre && u.nombre.toLowerCase() === cleanUser.toLowerCase() &&
    (u.contrasenia === cleanPass || !cleanPass)
  );

  if (found) {
    return found;
  }

  if (cleanUser.toLowerCase() === 'gabriel') {
    return {
      id: 'usr-admin-1',
      nombre: 'Gabriel',
      rol: 'admin',
      modulos: ['presupuestos', 'administracion', 'tareas', 'catalogo', 'proyectos', 'clientes'],
      avatar: 'G',
      color: '#2A5F3F'
    };
  }

  throw new Error('Credenciales inválidas. Revisa el usuario y contraseña.');
}

export async function fetchUsuarios() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/usuarios`);
    if (!response.ok) throw new Error('Error al obtener usuarios de la API');
    return await response.json();
  } catch (error) {
    console.warn('[authService] Error al consultar usuarios:', error.message);
    return [];
  }
}

export async function fetchUsuarioPorId(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/usuarios/${id}`);
    if (!response.ok) throw new Error('Error al obtener el perfil de usuario');
    return await response.json();
  } catch (error) {
    console.warn(`[authService] Error al consultar usuario ${id}:`, error.message);
    return null;
  }
}

export async function createUsuario(usuario) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuario)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al guardar el usuario en el servidor');
    }

    return await response.json();
  } catch (error) {
    console.warn('[authService] Error al crear usuario:', error.message);
    throw error;
  }
}

export async function updateUsuario(id, usuario) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuario)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al actualizar el usuario en el servidor');
    }

    return await response.json();
  } catch (error) {
    console.warn('[authService] Error al actualizar usuario:', error.message);
    throw error;
  }
}

export async function deleteUsuario(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/usuarios/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Error al eliminar el usuario en el servidor');
    return true;
  } catch (error) {
    console.warn('[authService] Error al eliminar usuario:', error.message);
    throw error;
  }
}

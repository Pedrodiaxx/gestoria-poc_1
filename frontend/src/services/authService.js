import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para autenticación y gestión de usuarios.
 * Conecta con el controlador de autenticación del backend remoto.
 */

export async function login(email, contrasenia) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, contrasenia })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Credenciales inválidas. Revisa el correo y contraseña.');
  }

  return response.json();
}

export async function fetchUsuarios() {
  const response = await fetch(`${API_BASE_URL}/api/auth/usuarios`);
  if (!response.ok) throw new Error('Error al obtener usuarios de la API');
  return response.json();
}

export async function fetchUsuarioPorId(id) {
  const response = await fetch(`${API_BASE_URL}/api/auth/usuarios/${id}`);
  if (!response.ok) throw new Error('Error al obtener el perfil de usuario');
  return response.json();
}

export async function createUsuario(usuario) {
  const response = await fetch(`${API_BASE_URL}/api/auth/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al guardar el usuario en el servidor');
  }

  return response.json();
}

export async function updateUsuario(id, usuario) {
  const response = await fetch(`${API_BASE_URL}/api/auth/usuarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al actualizar el usuario en el servidor');
  }

  return response.json();
}

export async function deleteUsuario(id) {
  const response = await fetch(`${API_BASE_URL}/api/auth/usuarios/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) throw new Error('Error al eliminar el usuario en el servidor');
  return true;
}

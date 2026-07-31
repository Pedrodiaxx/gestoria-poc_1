import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para gestión de roles dinámicos en la base de datos PostgreSQL.
 */

export async function fetchRoles() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/roles`);
    if (!response.ok) throw new Error('Error al consultar los roles del servidor');
    return await response.json();
  } catch (err) {
    console.warn("Fallo al consultar roles del servidor, usando fallback local:", err);
    const saved = localStorage.getItem('giu_roles');
    return saved ? JSON.parse(saved) : [
      { id: 'admin', label: 'Administrador' },
      { id: 'gestor', label: 'Gestor' },
      { id: 'cliente', label: 'Cliente' }
    ];
  }
}

export async function createRol(rol) {
  const response = await fetch(`${API_BASE_URL}/api/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rol)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Error al guardar el rol en el servidor');
  }

  return response.json();
}

export async function updateRol(id, rol) {
  const response = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rol)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Error al actualizar el rol en el servidor');
  }

  return response.json();
}

export async function deleteRol(id) {
  const response = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) throw new Error('Error al eliminar el rol en el servidor');
  return true;
}

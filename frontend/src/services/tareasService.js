import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Tareas.
 * Encapsula todas las llamadas fetch al endpoint /api/tareas.
 */

export async function fetchTareas({ clienteId, rol } = {}) {
  const queryParams = new URLSearchParams();
  if (clienteId) queryParams.append('clienteId', clienteId);
  if (rol) queryParams.append('rol', rol);

  const url = `${API_BASE_URL}/api/tareas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Error al conectar con la API de tareas');
  return response.json();
}

export async function createTarea(datos) {
  const response = await fetch(`${API_BASE_URL}/api/tareas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) throw new Error('Error al guardar tarea en el servidor');
  return response.json();
}

export async function deleteTarea(id) {
  const response = await fetch(`${API_BASE_URL}/api/tareas/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Error al eliminar tarea en el servidor');
  return true;
}

export async function updateTarea(id, datos) {
  const response = await fetch(`${API_BASE_URL}/api/tareas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) throw new Error('Error al actualizar tarea en el servidor');
  return response.json();
}

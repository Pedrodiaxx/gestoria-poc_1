import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Tareas.
 * Encapsula todas las llamadas fetch al endpoint /api/tareas.
 */

export async function fetchTareas() {
  const response = await fetch(`${API_BASE_URL}/api/tareas`);
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

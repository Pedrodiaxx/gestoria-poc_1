import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Tareas.
 * Encapsula todas las llamadas fetch al endpoint /api/tareas con manejo seguro de excepciones.
 */

export async function fetchTareas({ clienteId, rol } = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (clienteId) queryParams.append('clienteId', clienteId);
    if (rol) queryParams.append('rol', rol);

    const url = `${API_BASE_URL}/api/tareas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al conectar con la API de tareas');
    return await response.json();
  } catch (error) {
    console.warn('[tareasService] Error de red o servidor no disponible:', error.message);
    return [];
  }
}

export async function createTarea(datos) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tareas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al guardar tarea en el servidor');
    return await response.json();
  } catch (error) {
    console.warn('[tareasService] Error al crear tarea:', error.message);
    throw error;
  }
}

export async function deleteTarea(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tareas/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar tarea en el servidor');
    return true;
  } catch (error) {
    console.warn('[tareasService] Error al eliminar tarea:', error.message);
    throw error;
  }
}

export async function updateTarea(id, datos) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tareas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al actualizar tarea en el servidor');
    return await response.json();
  } catch (error) {
    console.warn('[tareasService] Error al actualizar tarea:', error.message);
    throw error;
  }
}

import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Proyectos.
 * Encapsula todas las llamadas fetch al endpoint /api/proyectos con manejo seguro de excepciones.
 */

export async function fetchProyectos({ clienteId, rol } = {}) {
  try {
    const params = new URLSearchParams();
    if (clienteId) params.append('clienteId', clienteId);
    if (rol) params.append('rol', rol);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/proyectos${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al conectar con la API de proyectos');
    return await response.json();
  } catch (error) {
    console.warn('[proyectosService] Error de red o servidor no disponible:', error.message);
    return [];
  }
}

export async function fetchProyectoById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/proyectos/${id}`);
    if (!response.ok) throw new Error('Error al consultar proyecto en el servidor');
    return await response.json();
  } catch (error) {
    console.warn(`[proyectosService] Error al consultar proyecto ${id}:`, error.message);
    return null;
  }
}

export async function createProyecto(datos) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/proyectos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al guardar proyecto en el servidor');
    return await response.json();
  } catch (error) {
    console.warn('[proyectosService] Error al crear proyecto:', error.message);
    throw error;
  }
}

export async function updateProyecto(id, datos) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/proyectos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al actualizar proyecto en el servidor');
    return await response.json();
  } catch (error) {
    console.warn('[proyectosService] Error al actualizar proyecto:', error.message);
    throw error;
  }
}

export async function deleteProyecto(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/proyectos/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar proyecto en el servidor');
    return true;
  } catch (error) {
    console.warn('[proyectosService] Error al eliminar proyecto:', error.message);
    throw error;
  }
}

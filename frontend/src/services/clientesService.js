import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Clientes.
 * Encapsula todas las llamadas fetch al endpoint /api/clientes con manejo seguro de excepciones.
 */

export async function fetchClientes() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clientes`);
    if (!response.ok) throw new Error('Error al conectar con la API de clientes');
    return await response.json();
  } catch (error) {
    console.warn('[clientesService] Error de red o servidor no disponible:', error.message);
    return [];
  }
}

export async function createCliente(datos) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al guardar cliente en el servidor');
    return await response.json();
  } catch (error) {
    console.warn('[clientesService] Error al crear cliente:', error.message);
    throw error;
  }
}

export async function updateCliente(id, datos) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al actualizar cliente en el servidor');
    return await response.json();
  } catch (error) {
    console.warn('[clientesService] Error al actualizar cliente:', error.message);
    throw error;
  }
}

export async function deleteCliente(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clientes/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar cliente en el servidor');
    return true;
  } catch (error) {
    console.warn('[clientesService] Error al eliminar cliente:', error.message);
    throw error;
  }
}

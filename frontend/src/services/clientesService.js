import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Clientes.
 * Encapsula todas las llamadas fetch al endpoint /api/clientes.
 */

export async function fetchClientes() {
  const response = await fetch(`${API_BASE_URL}/api/clientes`);
  if (!response.ok) throw new Error('Error al conectar con la API de clientes');
  return response.json();
}

export async function createCliente(datos) {
  const response = await fetch(`${API_BASE_URL}/api/clientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) throw new Error('Error al guardar cliente en el servidor');
  return response.json();
}

export async function updateCliente(id, datos) {
  const response = await fetch(`${API_BASE_URL}/api/clientes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) throw new Error('Error al actualizar cliente en el servidor');
  return response.json();
}

export async function deleteCliente(id) {
  const response = await fetch(`${API_BASE_URL}/api/clientes/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Error al eliminar cliente en el servidor');
  return true;
}

import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Presupuestos.
 * Encapsula todas las llamadas fetch al endpoint /api/presupuestos.
 */

export async function fetchPresupuestos({ clienteId, rol } = {}) {
  const queryParams = new URLSearchParams();
  if (clienteId) queryParams.append('clienteId', clienteId);
  if (rol) queryParams.append('rol', rol);

  const response = await fetch(`${API_BASE_URL}/api/presupuestos?${queryParams.toString()}`);
  if (!response.ok) throw new Error('Error al conectar con la API de presupuestos');
  return response.json();
}

export async function createPresupuesto(datos) {
  const response = await fetch(`${API_BASE_URL}/api/presupuestos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) throw new Error('Error al guardar presupuesto en el servidor');
  return response.json();
}

export async function updatePresupuesto(id, datos) {
  const response = await fetch(`${API_BASE_URL}/api/presupuestos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) throw new Error('Error al actualizar presupuesto en el servidor');
  return response.json();
}

export async function deletePresupuesto(id) {
  const response = await fetch(`${API_BASE_URL}/api/presupuestos/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Error al eliminar presupuesto en el servidor');
  return true;
}

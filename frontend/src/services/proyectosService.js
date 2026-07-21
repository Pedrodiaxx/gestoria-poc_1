import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Proyectos.
 * Encapsula todas las llamadas fetch al endpoint /api/proyectos.
 */

export async function fetchProyectos({ clienteId, rol } = {}) {
  const params = new URLSearchParams();
  if (clienteId) params.append('clienteId', clienteId);
  if (rol) params.append('rol', rol);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/proyectos${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Error al conectar con la API de proyectos');
  return response.json();
}

export async function createProyecto(datos) {
  const response = await fetch(`${API_BASE_URL}/api/proyectos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) throw new Error('Error al guardar proyecto en el servidor');
  return response.json();
}

export async function updateProyecto(id, datos) {
  const response = await fetch(`${API_BASE_URL}/api/proyectos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) throw new Error('Error al actualizar proyecto en el servidor');
  return response.json();
}

export async function deleteProyecto(id) {
  const response = await fetch(`${API_BASE_URL}/api/proyectos/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Error al eliminar proyecto en el servidor');
  return true;
}

import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Cotizaciones.
 * Encapsula todas las llamadas fetch al endpoint /api/cotizaciones.
 */

export async function fetchCotizaciones({ clienteId, rol } = {}) {
  const params = new URLSearchParams();
  if (clienteId) params.append('clienteId', clienteId);
  if (rol) params.append('rol', rol);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/cotizaciones${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Error al conectar con la API de cotizaciones');
  return response.json();
}

export async function createCotizacion(datos) {
  const response = await fetch(`${API_BASE_URL}/api/cotizaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) throw new Error('Error al guardar cotización en el servidor');
  return response.json();
}

export async function deleteCotizacion(id) {
  const response = await fetch(`${API_BASE_URL}/api/cotizaciones/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Error al eliminar cotización en el servidor');
  return true;
}

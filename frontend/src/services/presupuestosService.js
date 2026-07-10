import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Presupuestos.
 * Encapsula todas las llamadas fetch al endpoint /api/presupuestos.
 */

export async function fetchPresupuestos({ clienteId, rol } = {}) {
  const params = new URLSearchParams();
  if (clienteId) params.append('clienteId', clienteId);
  if (rol) params.append('rol', rol);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/presupuestos${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
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

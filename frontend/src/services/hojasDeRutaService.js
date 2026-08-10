import { API_BASE_URL } from '../config/api';

export async function fetchHojasDeRuta({ clienteId, rol } = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (clienteId) queryParams.append('clienteId', clienteId);
    if (rol) queryParams.append('rol', rol);

    const url = `${API_BASE_URL}/api/hojasderuta${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al consultar Hojas de Ruta desde el servidor');
    return await response.json();
  } catch (error) {
    console.warn('[hojasDeRutaService] Error de red o servidor no disponible:', error.message);
    return [];
  }
}

export async function updateHojaDeRuta(id, data) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hojasderuta/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar Hoja de Ruta en el servidor');
    return await response.json();
  } catch (error) {
    console.warn('[hojasDeRutaService] Error al actualizar Hoja de Ruta:', error.message);
    throw error;
  }
}

export async function finalizarHojaDeRuta(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hojasderuta/${id}/finalizar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const retryRes = await fetch(`${API_BASE_URL}/api/hojasderuta/${id}/finalizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!retryRes.ok) throw new Error('Error al finalizar Hoja de Ruta en el servidor');
      return await retryRes.json();
    }
    return await response.json();
  } catch (error) {
    console.warn('[hojasDeRutaService] Error al finalizar Hoja de Ruta:', error.message);
    throw error;
  }
}

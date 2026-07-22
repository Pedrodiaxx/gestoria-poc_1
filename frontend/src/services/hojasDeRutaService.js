import { API_BASE_URL } from '../config/api';

export async function fetchHojasDeRuta() {
  const response = await fetch(`${API_BASE_URL}/api/hojasderuta`);
  if (!response.ok) throw new Error('Error al consultar Hojas de Ruta desde el servidor');
  return response.json();
}

export async function updateHojaDeRuta(id, data) {
  const response = await fetch(`${API_BASE_URL}/api/hojasderuta/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Error al actualizar Hoja de Ruta en el servidor');
  return response.json();
}

export async function finalizarHojaDeRuta(id) {
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
    return retryRes.json();
  }
  return response.json();
}

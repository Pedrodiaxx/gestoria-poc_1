import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Catálogo de Conceptos.
 * Encapsula todas las llamadas fetch al endpoint /api/conceptos.
 */

export async function fetchConceptos() {
  const response = await fetch(`${API_BASE_URL}/api/conceptos`);
  if (!response.ok) throw new Error('Error al conectar con la API de conceptos');
  return response.json();
}

export async function createConcepto(datos) {
  const response = await fetch(`${API_BASE_URL}/api/conceptos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) throw new Error('Error al guardar concepto en el servidor');
  return response.json();
}

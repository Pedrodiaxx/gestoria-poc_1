import { API_BASE_URL } from '../config/api';

/**
 * Servicio de red para el módulo Conceptos.
 * Encapsula todas las llamadas fetch al endpoint /api/conceptos con manejo seguro de excepciones.
 */

export async function fetchConceptos() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conceptos`);
    if (!response.ok) throw new Error('Error al conectar con la API de conceptos');
    return await response.json();
  } catch (error) {
    console.warn('[conceptosService] Error de red o servidor no disponible:', error.message);
    return [];
  }
}

export async function createConcepto(nuevo) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conceptos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo)
    });
    if (!response.ok) throw new Error('Error al guardar el concepto en el servidor');
    return await response.json();
  } catch (error) {
    console.warn('[conceptosService] Error al crear concepto:', error.message);
    throw error;
  }
}

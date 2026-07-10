/**
 * Capa de transformación DTO → modelo de UI.
 * 
 * Actualmente los DTOs del backend ya vienen listos para la UI (pass-through),
 * pero este módulo existe como punto de extensión para cuando se necesite
 * sanitizar, renombrar campos, o adaptar estructuras complejas.
 */

/**
 * Transforma un CotizacionDTO en el formato interno de la UI.
 * @param {Object} dto - DTO recibido del backend
 * @returns {Object} Modelo de UI
 */
export function mapCotizacion(dto) {
  return dto; // Pass-through: el DTO ya viene listo
}

export function mapCliente(dto) {
  return dto;
}

export function mapProyecto(dto) {
  return dto;
}

export function mapPresupuesto(dto) {
  return dto;
}

export function mapTarea(dto) {
  return dto;
}

export function mapConcepto(dto) {
  return dto;
}

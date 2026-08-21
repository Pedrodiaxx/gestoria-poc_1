/**
 * Capa de transformación DTO → modelo de UI.
 * 
 * Actualmente los DTOs del backend ya vienen listos para la UI (pass-through),
 * pero este módulo existe como punto de extensión para cuando se necesite
 * sanitizar, renombrar campos, o adaptar estructuras complejas.
 */

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

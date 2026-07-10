/**
 * Caso de uso: Validación de una cotización antes de enviarla al backend.
 * Funciones puras que ejecutan reglas de negocio en el navegador.
 */

/**
 * Valida que una cotización tenga datos mínimos para ser enviada.
 * @param {Object} params
 * @param {string} params.clienteId - ID del cliente seleccionado
 * @param {Array} params.lineItems - Conceptos agregados a la cotización
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCotizacion({ clienteId, lineItems }) {
  const errors = [];

  if (!clienteId) {
    errors.push('Debes seleccionar un cliente.');
  }

  if (!lineItems || lineItems.length === 0) {
    errors.push('Debes agregar al menos un concepto.');
  }

  if (lineItems) {
    const sinCantidad = lineItems.filter(li => !li.cantidad || li.cantidad <= 0);
    if (sinCantidad.length > 0) {
      errors.push(`Hay ${sinCantidad.length} concepto(s) sin cantidad válida.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Utility functions for password generation and validation.
 */

/**
 * Genera una contraseña segura que cumple con todas las políticas de seguridad:
 * - 12+ caracteres
 * - Al menos una mayúscula (A-Z)
 * - Al menos una minúscula (a-z)
 * - Al menos un número (0-9)
 * - Al menos un símbolo (!@#$%^&*()_+-=[]{}|;:,.<>?)
 *
 * @param {number} length Longitud deseada (por defecto 12)
 * @returns {string} Contraseña segura aleatoria
 */
export function generateSecurePassword(length = 12) {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const allChars = uppercase + lowercase + numbers + symbols;

  // Garantizar al menos 1 carácter de cada categoría requerida
  const passwordChars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  // Rellenar los caracteres restantes
  for (let i = passwordChars.length; i < length; i++) {
    passwordChars.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Mezcla Fisher-Yates
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

/**
 * Valida los requisitos de seguridad de una contraseña.
 *
 * @param {string} password Contraseña a evaluar
 * @returns {object} Resultado de la validación
 */
export function validatePasswordSecurity(password = '') {
  const pass = password || '';
  const hasMinLength = pass.length >= 8;
  const isRecommendedLength = pass.length >= 12;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pass);

  const isValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSymbol;

  return {
    isValid,
    hasMinLength,
    isRecommendedLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol
  };
}

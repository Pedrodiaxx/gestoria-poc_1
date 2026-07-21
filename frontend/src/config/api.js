let baseUrl = import.meta.env.VITE_API_URL || 'https://gestoria-backend.onrender.com';

if (typeof baseUrl === 'string') {
  baseUrl = baseUrl.trim();
  // Si empieza con '/' seguido de 'http', es una URL absoluta mal estructurada en el env (ej: /https://...)
  if (baseUrl.startsWith('/http')) {
    baseUrl = baseUrl.slice(1);
  }
  // Quitar la barra diagonal final para evitar barras dobles al concatenar
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
}

export const API_BASE_URL = baseUrl;

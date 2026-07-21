export const API_BASE_URL = (() => {
  let url = import.meta.env.VITE_API_URL || 'https://gestoria-backend.onrender.com';
  // Si la URL contiene más de un 'http', tomar solo la última ocurrencia válida
  if (url.includes('https://') && url.indexOf('https://') !== url.lastIndexOf('https://')) {
    url = url.substring(url.lastIndexOf('https://'));
  }
  // Limpiar espacios, comillas, corchetes y barras finales
  url = url.replace(/[\[\]'"]+/g, '').trim();
  url = url.replace(/\/+$/, '');
  
  // Garantizar el nombre exacto del dominio de producción si no hay env local
  if (url.includes('gestoria-barkend')) {
    url = url.replace('gestoria-barkend', 'gestoria-backend');
  }
  
  return url;
})();

console.log("[API_BASE_URL_CARGADA]:", API_BASE_URL);

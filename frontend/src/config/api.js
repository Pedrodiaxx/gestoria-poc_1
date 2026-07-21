const getCleanUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'https://gestoria-backend.onrender.com';
  // Remover corchetes, comillas o espacios accidentales
  url = url.replace(/[\[\]'"]+/g, '').trim();
  return url.replace(/\/+$/, '');
};

export const API_BASE_URL = getCleanUrl();

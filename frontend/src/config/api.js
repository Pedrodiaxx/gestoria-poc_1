const rawUrl = (import.meta.env.VITE_API_URL || 'https://gestoria-backend.onrender.com').trim();
export const API_BASE_URL = rawUrl.replace(/\/+$/, '');

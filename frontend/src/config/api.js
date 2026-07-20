const viteApiUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL = (viteApiUrl && viteApiUrl.startsWith('http'))
  ? viteApiUrl
  : 'https://gestoria-backend.onrender.com';

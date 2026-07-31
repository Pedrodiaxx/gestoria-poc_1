const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = isLocalhost
  ? 'http://localhost:5158'
  : 'https://gestoria-backend.onrender.com';

console.log("[API_BASE_URL]:", API_BASE_URL);

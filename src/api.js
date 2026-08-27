// Shared API base URL — reads from .env (VITE_API_URL), falls back to the deployed backend
const API_URL = import.meta.env.VITE_API_URL || 'https://oditechteams-backend.onrender.com';

/**
 * Normalizes media/avatar URLs.
 * If a URL starts with http://localhost:5000 or contains legacy local server URLs,
 * rewrites it to use the active API_URL.
 * If it's a relative path like /uploads/..., prepends API_URL.
 */
export const getMediaUrl = (url) => {
  if (!url) return '';
  let formattedUrl = String(url).trim();
  const cleanApiUrl = API_URL.replace(/\/$/, '');

  if (formattedUrl.startsWith('http://localhost:5000')) {
    formattedUrl = formattedUrl.replace('http://localhost:5000', cleanApiUrl);
  } else if (formattedUrl.startsWith('/uploads')) {
    formattedUrl = `${cleanApiUrl}${formattedUrl}`;
  }
  return formattedUrl;
};

export default API_URL;


// Shared API base URL — reads from .env (VITE_API_URL), falls back to the deployed backend
const API_URL = import.meta.env.VITE_API_URL || 'https://oditechteams-backend.onrender.com';

export default API_URL;

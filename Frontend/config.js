// Central place for the backend address.
// Change it here once and every file that imports it will follow.
const DEFAULT_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (DEFAULT_HOST === 'localhost' || DEFAULT_HOST === '127.0.0.1'
    ? `http://${DEFAULT_HOST}:8000`
    : 'https://thesis2026-production.up.railway.app');
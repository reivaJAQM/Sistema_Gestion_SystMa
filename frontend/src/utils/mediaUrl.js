/**
 * Convierte una URL de media relativa del backend Django a una URL absoluta.
 * Si la URL ya es absoluta (http/https/blob), la devuelve sin cambios.
 * Si es relativa (e.g. /media/perfiles/foto.jpg), le antepone la base del backend.
 */
const BACKEND_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://127.0.0.1:8000';

export function getMediaUrl(url) {
  if (!url) return null;
  // Ya es absoluta o es un blob local
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  // URL relativa del backend — construir URL absoluta
  return `${BACKEND_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

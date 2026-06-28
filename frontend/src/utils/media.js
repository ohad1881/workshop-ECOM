// Resolves a backend media/image path to a usable URL (e.g. product images).
// Some values are already absolute URLs, others are a relative `/media/...` path —
// this handles both. Returns undefined for empty input so callers can fall back.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const MEDIA_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const resolveMediaUrl = (path) => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${MEDIA_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
};

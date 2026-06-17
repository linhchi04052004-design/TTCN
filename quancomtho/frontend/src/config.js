const stripTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const joinUrl = (base, path = '') => {
  if (!path) return base;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const API_BASE_URL = stripTrailingSlash(import.meta.env.VITE_API_URL || 'http://localhost:8000/api');
export const STORAGE_BASE_URL = stripTrailingSlash(import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000');

export const buildApiUrl = (path = '') => joinUrl(API_BASE_URL, path);
export const buildStorageUrl = (path = '') => joinUrl(STORAGE_BASE_URL, path);
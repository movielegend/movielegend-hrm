import { assertApiUrl, assertSocketUrl } from '../constants/env';

export function resolveFileUrl(uri?: string | null): string | null {
  if (!uri) return null;
  let url = String(uri).trim();
  if (!url) return null;

  try {
    url = decodeURIComponent(url);
  } catch {
    // Keep raw string if URI is malformed
  }

  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('file:')) {
    return url;
  }

  // Handle relative URLs (e.g., /uploads/..., uploads/..., /storage/...)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    let baseUrl = '';
    try {
      baseUrl = assertSocketUrl().replace(/\/$/, '');
    } catch {
      try {
        baseUrl = assertApiUrl().replace(/\/api\/v1\/?$/, '');
      } catch {
        baseUrl = '';
      }
    }

    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    if (cleanPath.startsWith('/uploads') || cleanPath.startsWith('/storage')) {
      url = `${baseUrl}${cleanPath}`;
    } else {
      let apiUrl = '';
      try {
        apiUrl = assertApiUrl();
      } catch {
        apiUrl = baseUrl;
      }
      url = `${apiUrl}${cleanPath}`;
    }
  }

  // If url points to localhost or 127.0.0.1, rewrite to actual target server host if configured
  try {
    const targetApi = assertApiUrl();
    const hostMatch = targetApi.match(/^https?:\/\/([^/:]+)/);
    if (hostMatch && hostMatch[1] && !hostMatch[1].includes('localhost') && !hostMatch[1].includes('127.0.0.1')) {
      url = url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, (_match, _h, port) => {
        const p = port || ':3000';
        return `http://${hostMatch[1]}${p}`;
      });
    }
  } catch {
    // ignore
  }

  return url;
}


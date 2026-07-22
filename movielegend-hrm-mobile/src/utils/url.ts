import { assertApiUrl } from '../constants/env';

export function resolveFileUrl(uri?: string | null): string | null {
  if (!uri) return null;
  let url = uri;
  if (!url.startsWith('http')) {
    const apiUrl = assertApiUrl();
    if (url.startsWith('/uploads')) {
      const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
      url = `${baseUrl}${url}`;
    } else {
      url = `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
  }
  return url;
}

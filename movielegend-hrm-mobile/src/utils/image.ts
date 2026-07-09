import { apiUrl } from '../constants/env';

const baseUrl = apiUrl.split('/api')[0];

export function getAbsoluteImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://') || path.startsWith('data:')) {
    return path;
  }
  
  const decodedPath = decodeURIComponent(path);
  return `${baseUrl}${decodedPath.startsWith('/') ? decodedPath : `/${decodedPath}`}`;
}

import { apiUrl } from '../constants/env';

const baseUrl = apiUrl.split('/api')[0];

import * as ImageManipulator from 'expo-image-manipulator';

export function getAbsoluteImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://') || path.startsWith('data:')) {
    return path;
  }
  
  const decodedPath = decodeURIComponent(path);
  return `${baseUrl}${decodedPath.startsWith('/') ? decodedPath : `/${decodedPath}`}`;
}

export async function normalizeAndCompressImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch (error) {
    console.warn('Failed to manipulate image, returning original uri:', error);
    return uri;
  }
}

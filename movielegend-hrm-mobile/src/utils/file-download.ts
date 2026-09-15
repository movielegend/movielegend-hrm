import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export async function downloadAndSaveImage(imageUrl: string, suggestedName?: string): Promise<boolean> {
  if (!imageUrl) return false;
  try {
    if (Platform.OS === 'web') {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = suggestedName || `mvl_image_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    }

    const filename = suggestedName || `mvl_image_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`;
    const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
    const localUri = `${docDir}${filename}`;
    const result = await FileSystem.downloadAsync(imageUrl, localUri);

    if (result.status === 200) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Lưu hoặc chia sẻ ảnh',
          UTI: 'public.jpeg',
        });
        return true;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

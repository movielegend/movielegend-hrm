import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type CustomAlertFn = (title: string, message: string, buttons?: AlertButton[]) => void;

/**
 * Xin quyền Camera theo chuẩn Apple Guideline 5.1.1(iv):
 * - Lần 1: Xin quyền hệ thống. Nếu người dùng chọn Từ chối -> Im lặng return false (Không hiện Alert chèo kéo).
 * - Lần 2 (khi canAskAgain = false từ trước): Hiển thị Alert hướng dẫn mở Cài đặt (Settings).
 */
export async function requestCameraPermissionWithFallback(
  showAlertFn?: CustomAlertFn
): Promise<boolean> {
  try {
    const current = await ImagePicker.getCameraPermissionsAsync();

    if (current.granted) {
      return true;
    }

    // Lần 1: Có thể hỏi hệ thống
    if (current.canAskAgain) {
      const requested = await ImagePicker.requestCameraPermissionsAsync();
      if (requested.granted) {
        return true;
      }
      // Vừa bấm Từ chối trên iOS -> Im lặng return false
      return false;
    }

    // Lần 2+: Người dùng chủ động bấm lại tính năng sau khi đã từng từ chối trước đó (canAskAgain = false)
    const title = 'Cấp quyền Camera';
    const message = 'Ứng dụng chưa được cấp quyền truy cập Camera. Bạn có muốn mở Cài đặt thiết bị để bật quyền không?';
    const buttons: AlertButton[] = [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Cài đặt', onPress: () => void Linking.openSettings() },
    ];

    if (showAlertFn) {
      showAlertFn(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons);
    }
    return false;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
}

/**
 * Xin quyền Thư viện ảnh theo chuẩn Apple Guideline 5.1.1(iv):
 * - Lần 1: Xin quyền hệ thống. Nếu người dùng chọn Từ chối -> Im lặng return false (Không hiện Alert chèo kéo).
 * - Lần 2 (khi canAskAgain = false từ trước): Hiển thị Alert hướng dẫn mở Cài đặt (Settings).
 */
export async function requestMediaLibraryPermissionWithFallback(
  showAlertFn?: CustomAlertFn
): Promise<boolean> {
  try {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (current.granted) {
      return true;
    }

    // Lần 1: Có thể hỏi hệ thống
    if (current.canAskAgain) {
      const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (requested.granted) {
        return true;
      }
      // Vừa bấm Từ chối trên iOS -> Im lặng return false
      return false;
    }

    // Lần 2+: Người dùng chủ động bấm lại tính năng sau khi đã từng từ chối trước đó (canAskAgain = false)
    const title = 'Cấp quyền Thư viện ảnh';
    const message = 'Ứng dụng chưa được cấp quyền truy cập Thư viện ảnh. Bạn có muốn mở Cài đặt thiết bị để bật quyền không?';
    const buttons: AlertButton[] = [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Cài đặt', onPress: () => void Linking.openSettings() },
    ];

    if (showAlertFn) {
      showAlertFn(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons);
    }
    return false;
  } catch (error) {
    console.error('Error requesting media library permission:', error);
    return false;
  }
}

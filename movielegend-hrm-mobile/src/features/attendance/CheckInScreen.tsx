import { useEffect, useState, useRef } from 'react';
import {StyleSheet, Text, View, Pressable, ActivityIndicator, Modal, ScrollView} from 'react-native';
import { AttendanceCamera } from './AttendanceCamera';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system/legacy';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../lib/Maps';
import * as ImageManipulator from 'expo-image-manipulator';

import { Screen } from '../../components/Screen';
import { CustomAlert } from '../../components/CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkIn, getAttendanceHistory } from '../../api/attendance.api';
import { uploadFile } from '../../api/uploads.api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../constants/queryKeys';
import { useMySchedule } from '../../hooks/useShifts';
import Toast from 'react-native-toast-message';
import { CustomAlert } from '../../components/CustomAlert';

export function CheckInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: schedule, isLoading: scheduleLoading } = useMySchedule();

  // Find today's shift
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayShift = schedule?.find(s => new Date(s.workDate).toISOString().substring(0, 10) === todayStr);


  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [networkType, setNetworkType] = useState<string>('Đang kiểm tra...');

  useEffect(() => {
    const getNetworkInfo = async () => {
      try {
        const state = await NetInfo.fetch();
        if (state.type === 'wifi') {
          setNetworkType(`Wi-Fi: ${state.details?.ssid || 'Đã kết nối'}`);
        } else if (state.type === 'cellular') {
          setNetworkType(`Dữ liệu di động (${state.details?.cellularGeneration || '4G/5G'})`);
        } else {
          setNetworkType('Không có kết nối mạng');
        }
      } catch {
        setNetworkType('Không xác định');
      }
    };

    getNetworkInfo();
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Ứng dụng cần quyền truy cập vị trí để chấm công.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);
    } catch (err: any) {
      setLocationError('Không thể lấy vị trí hiện tại. Vui lòng bật GPS.');
    }
  };

  const [isCameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef<any>(null);

  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  const fetchLocation = async (showFeedback = false) => {
    setIsRefreshingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Cần cấp quyền vị trí để chấm công.');
        if (showFeedback) Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Chưa cấp quyền vị trí' });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);
      if (showFeedback) Toast.show({ type: 'success', text1: 'Thành công', text2: 'Đã làm mới vị trí hiện tại' });
    } catch (error) {
      if (showFeedback) Toast.show({ type: 'error', text1: 'Lỗi', text2: 'Không thể lấy vị trí' });
    } finally {
      setIsRefreshingLocation(false);
    }
  };



  const handleConfirm = async () => {
    if (!location) {
      CustomAlert.alert('Chưa có vị trí', 'Vui lòng đợi ứng dụng lấy tọa độ GPS chính xác.');
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Xác thực sinh trắc học để vào ca',
          fallbackLabel: 'Dùng mã PIN/Mật khẩu',
          cancelLabel: 'Hủy',
        });

        if (!auth.success) {
          CustomAlert.alert('Xác thực thất bại', 'Cần xác thực sinh trắc học để tiếp tục.');
          return;
        }
      }
    } catch (err) {
      console.warn('Lỗi xác thực sinh trắc học:', err);
      // Có thể bỏ qua nếu lỗi phần hardware hoặc tiếp tục tùy theo yêu cầu
    }

    setCameraVisible(true);
  };

  const handleCaptureAndSubmit = async (photoUri: string) => {
    if (!location) return;

    setLoading(true);
    try {
      if (!photoUri) throw new Error('Không thể chụp ảnh xác thực');

      // Fast lightweight image compression (30-40KB)
      const compressedImage = await ImageManipulator.manipulateAsync(
        photoUri,
        [{ resize: { width: 400 } }],
        { compress: 0.25, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(compressedImage.uri, { encoding: 'base64' });

      // Check in with photoBase64
      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        photoBase64: base64Data,
        workDate: new Date().toISOString().substring(0, 10),
      };

      await checkIn(payload);
      await queryClient.invalidateQueries({ queryKey: queryKeys.attendanceCurrent() });
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      CustomAlert.alert('Thành công', 'Vào ca thành công!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      // If error is timeout, double check if attendance was actually recorded
      const isTimeout = e.code === 'ECONNABORTED' || (e.message && e.message.toLowerCase().includes('timeout'));
      if (isTimeout) {
        try {
          const history = await getAttendanceHistory({ limit: 1 });
          const todayStr = new Date().toISOString().substring(0, 10);
          const hasTodayCheckin = history.data?.some((r: any) => 
            new Date(r.workDate).toISOString().substring(0, 10) === todayStr && !!r.checkInAt
          );
          if (hasTodayCheckin) {
            CustomAlert.alert('Thành công', 'Vào ca thành công!', [
              { text: 'OK', onPress: () => router.back() }
            ]);
            return;
          }
        } catch {
          // ignore verification error
        }
      }
      const msg = e.response?.data?.message || e.response?.data?.error?.message || e.message || 'Có lỗi xảy ra khi chấm công.';
      CustomAlert.alert('Lỗi chấm công', msg);
    } finally {
      setLoading(false);
      setCameraVisible(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Vào ca</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + Math.max(insets.bottom, 20) }}
      >
        {/* Map View */}
        <View style={styles.mapContainerWrapper}>
          <View style={styles.mapContainer}>
            {location ? (
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} />
              </MapView>
            ) : (
              <View style={[styles.map, styles.center]}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
          </View>

          {/* Map Footer Info */}
          <View style={styles.mapFooter}>
            <Text style={styles.privacyText}>Quyền riêng tư</Text>
            <Pressable
              style={styles.refreshBtn}
              onPress={() => void fetchLocation(true)}
              disabled={isRefreshingLocation}
            >
              {isRefreshingLocation ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <MaterialCommunityIcons name="refresh" size={16} color="#111827" />
              )}
              <Text style={styles.refreshText}>{isRefreshingLocation ? 'Đang tải...' : 'Làm mới vị trí'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Network Info */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Mạng hiện tại</Text>
          <View style={styles.wifiBox}>
            <View style={styles.wifiIconBox}>
              <MaterialCommunityIcons name="wifi" size={24} color="#111827" />
            </View>
            <View style={styles.wifiInfoBox}>
              <Text style={styles.wifiName}>Mạng: {networkType}</Text>
              <Text style={styles.wifiBssid}>Đang kết nối</Text>
            </View>
            <MaterialCommunityIcons name="check-circle" size={20} color="#111827" />
          </View>
        </View>

        {/* Shift Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Ca làm việc đang chọn</Text>
          {scheduleLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : todayShift ? (
            <Pressable style={styles.shiftCard}>
              <MaterialCommunityIcons name="radiobox-marked" size={24} color="#111827" style={styles.radioIcon} />
              <View>
                <Text style={styles.shiftName}>{todayShift.shift?.name}</Text>
                <Text style={styles.shiftTime}>{todayShift.shift?.startTime} - {todayShift.shift?.endTime}</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.emptyShiftCard}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyShiftText}>Bạn không có ca làm việc hôm nay.</Text>
              <Text style={{ textAlign: 'center', color: '#6B7280', fontSize: 13, marginTop: 4 }}>Bạn vẫn có thể bấm "Xác nhận" để vào ca OT đột xuất.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={isCameraVisible} animationType="fade" transparent={false} statusBarTranslucent>
        <AttendanceCamera
          photoUri={null}
          onCapture={handleCaptureAndSubmit}
          onClose={() => setCameraVisible(false)}
        />
      </Modal>

      {/* Footer Confirm Button */}
      {!isCameraVisible ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Pressable
            style={styles.confirmBtn}
            onPress={() => void handleConfirm()}
          >
            <Text style={styles.confirmBtnText}>Xác nhận</Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#FAFAFA',
  },
  iconBtn: {
    padding: 8,
  },
  iconBtnPlaceholder: {
    width: 44,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  mapContainerWrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  mapContainer: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: '#FFF',
  },
  map: {
    flex: 1,
  },
  mapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  privacyText: {
    fontSize: 13,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  sectionContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.md,
  },
  wifiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  wifiIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  wifiInfoBox: {
    flex: 1,
  },
  wifiName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  wifiBssid: {
    fontSize: 13,
    color: '#6B7280',
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radioIcon: {
    marginRight: spacing.md,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 14,
    color: '#4B5563',
  },
  emptyShiftCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyShiftText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  cameraModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullCamera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cameraCancelBtn: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCaptureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cameraBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    backgroundColor: '#111827',
    paddingVertical: spacing.lg,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  }
});

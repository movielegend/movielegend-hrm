import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, Modal } from 'react-native';
import { AttendanceCamera } from '../../../src/features/attendance/AttendanceCamera';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../../src/lib/Maps';

import { Screen } from '../../../src/components/Screen';
import { checkOut } from '../../../src/api/attendance.api';
import { uploadFile } from '../../../src/api/uploads.api';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { useMySchedule } from '../../../src/hooks/useShifts';
import Toast from 'react-native-toast-message';

export default function CheckOutScreen() {
  const router = useRouter();
  const { data: schedule, isLoading: scheduleLoading } = useMySchedule();
  
  // Find today's shift
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayShift = schedule?.find(s => new Date(s.workDate).toISOString().substring(0, 10) === todayStr);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ipv4, setIpv4] = useState<string>('Đang lấy IP...');

  const [isCameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpv4(data.ip))
      .catch(() => setIpv4('Không xác định'));
  }, []);

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

  useEffect(() => {
    void fetchLocation();
  }, []);



  const handleConfirm = async () => {
    if (locationError || !location) {
      Alert.alert('Lỗi', locationError || 'Đang lấy vị trí, vui lòng chờ...');
      return;
    }
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Xác nhận danh tính để chấm công',
          fallbackLabel: 'Sử dụng mật khẩu',
        });

        if (!authResult.success) {
          Alert.alert('Xác thực thất bại', 'Bạn cần xác thực sinh trắc học hoặc mật khẩu điện thoại để tiếp tục.');
          return;
        }
      }
    } catch (err) {
      console.warn('Lỗi xác thực sinh trắc học:', err);
      // Có thể bỏ qua nếu lỗi phần cứng hoặc tiếp tục tùy theo yêu cầu
    }

    setCameraVisible(true);
  };

  const handleCaptureAndSubmit = async (photoUri: string) => {
    if (!location) return;
    
    setLoading(true);
    try {
      if (!photoUri) throw new Error('Không thể chụp ảnh xác thực');

      // 1. Upload photo first
      const uploaded = await uploadFile({
        uri: photoUri,
        name: 'attendance.jpg',
        mimeType: 'image/jpeg',
        purpose: 'ATTENDANCE',
      });

      // 2. Check out with photoFileId
      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        photoFileId: uploaded.fileId,
        workDate: new Date().toISOString().substring(0, 10),
      };

      await checkOut(payload);
      Alert.alert('Thành công', 'Ra ca thành công!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.error?.message || e.message || 'Có lỗi xảy ra khi chấm công.';
      Alert.alert('Lỗi chấm công', msg);
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
        <Text style={styles.title}>Ra ca</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

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
            <Text style={styles.wifiName}>IPv4: {ipv4}</Text>
            <Text style={styles.wifiBssid}>IP Public đang kết nối</Text>
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
             <Text style={styles.emptyShiftText}>Bạn không có ca làm việc hôm nay</Text>
          </View>
        )}
      </View>

      {/* Footer Confirm Button */}
      {todayShift ? (
        <View style={styles.footer}>
          <Pressable 
            style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]} 
            onPress={() => void handleConfirm()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>Xác nhận</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {/* Camera Modal */}
      <Modal visible={isCameraVisible} animationType="fade" transparent={false} statusBarTranslucent>
        <AttendanceCamera 
          photoUri={null} 
          onCapture={handleCaptureAndSubmit} 
          onClose={() => setCameraVisible(false)} 
        />
      </Modal>
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
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
    fontSize: 16,
    fontWeight: 'bold',
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
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraCancelBtn: {
    padding: spacing.md,
  },
  cameraBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraCaptureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});

import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Screen } from '../../../src/components/Screen';
import { checkIn } from '../../../src/api/attendance.api';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';

export default function CheckInScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const fetchLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('Cần cấp quyền vị trí để chấm công.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
  };

  useEffect(() => {
    void fetchLocation();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.text}>App cần quyền truy cập Camera để xác thực khuôn mặt.</Text>
          <Pressable style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>Cấp quyền Camera</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const handleConfirm = async () => {
    if (locationError || !location) {
      Alert.alert('Lỗi', locationError || 'Đang lấy vị trí, vui lòng chờ...');
      return;
    }
    if (!cameraRef.current) return;
    
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      
      if (!photo?.base64) throw new Error('Không thể chụp ảnh xác thực');

      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        faceImageBase64: photo.base64,
        shiftAssignmentId: undefined,
        workDate: new Date().toISOString().substring(0, 10),
      };

      await checkIn(payload);
      Alert.alert('Thành công', 'Vào ca thành công!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi chấm công', e.message || 'Có lỗi xảy ra khi chấm công.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Chọn ca làm</Text>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
        </Pressable>
      </View>

      {/* Map View */}
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
        <Pressable style={styles.refreshBtn} onPress={() => void fetchLocation()}>
          <MaterialCommunityIcons name="refresh" size={16} color={colors.primary} />
          <Text style={styles.refreshText}>Làm mới vị trí</Text>
        </Pressable>
      </View>

      {/* Wifi Info */}
      <View style={styles.wifiBox}>
        <Text style={styles.wifiLabel}>Kết nối: wifi</Text>
        <View style={styles.wifiRight}>
          <Text style={styles.wifiName}>MOVIE LEGEND HA NOI</Text>
          <Text style={styles.wifiBssid}>(bssid: ec:41:18:e:cd:6d)</Text>
        </View>
      </View>

      {/* Shift Selection */}
      <Text style={styles.shiftSectionTitle}>Bạn đang có 1 ca làm, chọn ca để Vào ca</Text>
      
      <Pressable style={styles.shiftCard}>
        <MaterialCommunityIcons name="radiobox-marked" size={24} color={colors.primary} style={styles.radioIcon} />
        <View>
          <Text style={styles.shiftName}>Ca hành chính</Text>
          <Text style={styles.shiftTime}>(08:00 - 17:30)</Text>
        </View>
      </Pressable>

      {/* Hidden Camera for background capture */}
      <View style={styles.hiddenCamera}>
        <CameraView style={{ flex: 1 }} facing="front" ref={cameraRef} />
      </View>

      {/* Footer Confirm Button */}
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
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontSize: 16,
    color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
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
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
  },
  iconBtn: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  mapContainer: {
    height: 200,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  map: {
    flex: 1,
  },
  mapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  privacyText: {
    fontSize: 12,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  wifiBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  wifiLabel: {
    fontSize: 15,
    color: colors.muted,
  },
  wifiRight: {
    alignItems: 'flex-end',
  },
  wifiName: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  wifiBssid: {
    fontSize: 12,
    color: colors.muted,
  },
  shiftSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
    minWidth: '60%',
  },
  radioIcon: {
    marginRight: spacing.md,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  shiftTime: {
    fontSize: 14,
    color: colors.muted,
  },
  hiddenCamera: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
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
    backgroundColor: '#10B981', // Emerald 500
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
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

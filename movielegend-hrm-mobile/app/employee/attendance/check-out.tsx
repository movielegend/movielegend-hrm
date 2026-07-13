import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../../src/lib/Maps';

import { Screen } from '../../../src/components/Screen';
import { checkOut } from '../../../src/api/attendance.api';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { useMySchedule } from '../../../src/hooks/useShifts';

export default function CheckOutScreen() {
  const router = useRouter();
  const { data: schedule, isLoading: scheduleLoading } = useMySchedule();
  
  // Find today's shift
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayShift = schedule?.find(s => new Date(s.workDate).toISOString().substring(0, 10) === todayStr);

  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ipv4, setIpv4] = useState<string>('Đang lấy IP...');

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpv4(data.ip))
      .catch(() => setIpv4('Không xác định'));
  }, []);

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
    
    setLoading(true);
    try {
      const payload = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
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
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Chọn ca để Ra ca</Text>
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

      {/* Network Info */}
      <View style={styles.wifiBox}>
        <Text style={styles.wifiLabel}>Kết nối mạng</Text>
        <View style={styles.wifiRight}>
          <Text style={styles.wifiName}>IPv4: {ipv4}</Text>
          <Text style={styles.wifiBssid}>(IP Public)</Text>
        </View>
      </View>

      {/* Shift Selection */}
      {scheduleLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : todayShift ? (
        <>
          <Text style={styles.shiftSectionTitle}>Bạn đang có 1 ca làm, chọn ca để Ra ca</Text>
          <Pressable style={styles.shiftCard}>
            <MaterialCommunityIcons name="radiobox-marked" size={24} color={colors.primary} style={styles.radioIcon} />
            <View>
              <Text style={styles.shiftName}>{todayShift.shift?.name}</Text>
              <Text style={styles.shiftTime}>({todayShift.shift?.startTime} - {todayShift.shift?.endTime})</Text>
            </View>
          </Pressable>
        </>
      ) : (
        <Text style={[styles.shiftSectionTitle, { color: colors.danger, textAlign: 'center', marginTop: 20 }]}>Bạn không có ca làm việc hôm nay</Text>
      )}

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
    fontSize: 14,
    color: colors.muted,
  },
  wifiRight: {
    alignItems: 'flex-end',
  },
  wifiName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  wifiBssid: {
    fontSize: 12,
    color: colors.muted,
  },
  shiftSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  radioIcon: {
    marginRight: spacing.sm,
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
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

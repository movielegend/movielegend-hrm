import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';

import { useBranch, useUpdateBranch } from '../../api/branches.api';
import { useRegions } from '../../api/regions.api';
import { useAuth } from '../../providers/AuthProvider';
import { CustomAlert } from '../../components/CustomAlert';
import { normalizeApiError } from '../../utils/api-error';
import { LocationPickerMap, LocationData } from '../../components/LocationPickerMap';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

export function BranchEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const isSuperAdmin =
    user?.roles?.includes('ADMIN') &&
    user?.scopes?.some((s) => s.role === 'ADMIN' && s.scopeType === 'GLOBAL');

  const branchQuery = useBranch(id!);
  const mutation = useUpdateBranch();
  const regionsQuery = useRegions();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isHeadquarters, setIsHeadquarters] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [allowedIps, setAllowedIps] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  // Modals state
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [tempRegionId, setTempRegionId] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [isFetchingIp, setIsFetchingIp] = useState(false);

  const regions = regionsQuery.data || [];

  // Populate data
  useEffect(() => {
    if (branchQuery.data) {
      setCode(branchQuery.data.code || '');
      setName(branchQuery.data.name || '');
      setAddress(branchQuery.data.address || '');
      setIsHeadquarters(branchQuery.data.isHeadquarters || false);
      setLatitude(branchQuery.data.latitude);
      setLongitude(branchQuery.data.longitude);
      setAllowedIps((branchQuery.data as any).allowedIps?.join(', ') || '');
      setSelectedRegionId(branchQuery.data.regionId || branchQuery.data.region?.id || null);
    }
  }, [branchQuery.data]);

  const selectedRegionName = useMemo(() => {
    if (!selectedRegionId) return '';
    const r = regions.find((item) => item.id === selectedRegionId);
    return r ? r.name : '';
  }, [selectedRegionId, regions]);

  const fetchCurrentNetwork = async (currentIps: string) => {
    try {
      setIsFetchingIp(true);
      let ssid = '';
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const netInfo = await NetInfo.fetch();
        if (
          netInfo.type === 'wifi' &&
          netInfo.details &&
          'ssid' in netInfo.details &&
          netInfo.details.ssid
        ) {
          ssid = netInfo.details.ssid;
        }
      }

      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      const currentIp = data.ip;

      if (ssid) {
        setNetworkName(ssid);
      }

      if (currentIps && !currentIps.includes(currentIp)) {
        setAllowedIps(currentIps.trim() ? `${currentIps}, ${currentIp}` : currentIp);
      } else if (!currentIps) {
        setAllowedIps(currentIp);
      }
    } catch (err) {
      console.warn('Lỗi lấy mạng:', err);
    } finally {
      setIsFetchingIp(false);
    }
  };

  const openRegionModal = () => {
    setTempRegionId(selectedRegionId);
    setRegionModalVisible(true);
  };

  const applyRegionModal = () => {
    setSelectedRegionId(tempRegionId);
    setRegionModalVisible(false);
  };

  const handleLocationSelect = (loc: LocationData) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    if (loc.address) setAddress(loc.address);
    setMapVisible(false);
  };

  const submit = async () => {
    if (!name.trim()) {
      CustomAlert.alert('Thiếu thông tin', 'Vui lòng nhập tên chi nhánh');
      return;
    }

    try {
      const payload: any = {
        id,
        code,
        name: name.trim(),
        address: address.trim() || undefined,
        latitude,
        longitude,
        allowedIps: allowedIps
          ? allowedIps
              .split(',')
              .map((ip) => ip.trim())
              .filter(Boolean)
          : [],
        isHeadquarters,
        regionId: selectedRegionId || null,
      };

      await mutation.mutateAsync(payload);
      CustomAlert.alert('Thành công', 'Đã lưu thay đổi chi nhánh', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      CustomAlert.alert('Lỗi cập nhật chi nhánh', normalized.message);
    }
  };

  if (branchQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState label="Đang tải dữ liệu chi nhánh..." />
      </SafeAreaView>
    );
  }

  if (branchQuery.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          error={branchQuery.error}
          onRetry={() => void branchQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const isFormValid = name.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>Chỉnh sửa chi nhánh</Text>
        </View>
        <Text style={styles.subtitle}>Cập nhật thông tin chi nhánh</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD 1: Thông tin chi nhánh */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin chi nhánh</Text>

          {/* Tên chi nhánh * */}
          <Text style={styles.fieldLabel}>
            Tên chi nhánh <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Nhập tên chi nhánh"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
              style={styles.textInput}
            />
          </View>

          {/* Vùng / Miền quản lý */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Vùng / Miền quản lý</Text>
          <Pressable
            style={styles.selectPill}
            onPress={openRegionModal}
            android_ripple={{ color: '#F1F5F9' }}
          >
            <Text
              style={[
                styles.selectPillText,
                !selectedRegionName && styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {selectedRegionName || 'Chọn vùng / miền'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </Pressable>

          {/* Trụ sở chính (Switch) */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Trụ sở chính</Text>
              <Text style={styles.switchSub}>Đặt làm trụ sở chính của công ty</Text>
            </View>
            <Switch
              value={isHeadquarters}
              onValueChange={setIsHeadquarters}
              trackColor={{ false: '#E2E8F0', true: '#166534' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* CARD 2: Wi-Fi chi nhánh */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wi-Fi chi nhánh</Text>

          <Text style={styles.fieldLabel}>Tên mạng Wi-Fi (SSID) hoặc IP</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="MOVIE LEGEND HA NOI_5G"
              placeholderTextColor="#94A3B8"
              value={networkName || allowedIps}
              onChangeText={(text) => {
                setNetworkName('');
                setAllowedIps(text);
              }}
              style={styles.textInput}
              autoCapitalize="none"
            />
          </View>

          <Pressable
            style={styles.refreshNetworkBtn}
            onPress={() => void fetchCurrentNetwork(allowedIps)}
            disabled={isFetchingIp}
          >
            {isFetchingIp ? (
              <ActivityIndicator size="small" color="#166534" />
            ) : (
              <Ionicons name="refresh" size={16} color="#166534" />
            )}
            <Text style={styles.refreshNetworkText}>Làm mới mạng</Text>
          </Pressable>
        </View>

        {/* CARD 3: Vị trí & địa chỉ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vị trí & địa chỉ</Text>

          {/* Location row */}
          <Pressable
            style={styles.locationPill}
            onPress={() => setMapVisible(true)}
          >
            <Ionicons name="location" size={18} color="#166534" />
            <Text
              style={[
                styles.locationPillText,
                !address && styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {address || 'Chưa chọn vị trí'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </Pressable>

          {/* Chọn vị trí trên bản đồ button */}
          <Pressable
            style={styles.mapOutlineBtn}
            onPress={() => setMapVisible(true)}
            android_ripple={{ color: '#F0FDF4' }}
          >
            <Ionicons name="location-outline" size={18} color="#166534" />
            <Text style={styles.mapOutlineBtnText}>Chọn vị trí trên bản đồ</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* 4. Bottom Fixed Action Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[
            styles.submitBtn,
            (!isFormValid || mutation.isPending) && styles.submitBtnDisabled,
          ]}
          onPress={() => void submit()}
          disabled={!isFormValid || mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Lưu thay đổi</Text>
          )}
        </Pressable>
      </View>

      {/* 5. Map Modal */}
      <LocationPickerMap
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onSelect={handleLocationSelect}
        initialLocation={
          latitude !== undefined && longitude !== undefined
            ? { latitude, longitude }
            : undefined
        }
      />

      {/* 6. Bottom Sheet Modal: Chọn vùng / miền */}
      <Modal
        visible={regionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRegionModalVisible(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setRegionModalVisible(false)}
        >
          <View
            style={styles.bottomSheetContainer}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetHandleBar} />

            <View style={styles.sheetHeaderRow}>
              <Text style={styles.regionSheetTitle}>Chọn vùng / miền</Text>
              <Pressable
                onPress={() => setRegionModalVisible(false)}
                style={styles.sheetCloseButton}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>
            <Text style={styles.regionSheetSubtitle}>
              Chọn khu vực quản lý chi nhánh
            </Text>

            <ScrollView style={styles.regionOptionsScroll} showsVerticalScrollIndicator={false}>
              {regions.map((region) => {
                const isSelected = tempRegionId === region.id;
                return (
                  <Pressable
                    key={region.id}
                    style={[
                      styles.regionOptionCard,
                      isSelected && styles.regionOptionCardSelected,
                    ]}
                    onPress={() => setTempRegionId(region.id)}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.regionOptionName,
                        isSelected && styles.regionOptionNameSelected,
                      ]}
                    >
                      {region.name}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                style={[
                  styles.regionOptionCard,
                  tempRegionId === null && styles.regionOptionCardSelected,
                ]}
                onPress={() => setTempRegionId(null)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    tempRegionId === null && styles.radioOuterSelected,
                  ]}
                >
                  {tempRegionId === null && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.regionOptionName,
                    tempRegionId === null && styles.regionOptionNameSelected,
                  ]}
                >
                  Chưa phân miền (Mặc định)
                </Text>
              </Pressable>
            </ScrollView>

            <Pressable
              style={styles.applyBtn}
              onPress={applyRegionModal}
              android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
              <Text style={styles.applyBtnText}>Áp dụng</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 32,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  reqStar: {
    color: '#EF4444',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    color: '#0F172A',
  },
  selectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
  },
  selectPillText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  refreshNetworkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  refreshNetworkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 10,
  },
  locationPillText: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  mapOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#166534',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    height: 46,
    gap: 6,
  },
  mapOutlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  submitBtn: {
    backgroundColor: '#1B382B',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#8FA89B',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Region Bottom Sheet Modal
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  regionSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  regionSheetSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  sheetCloseButton: {
    padding: 4,
  },
  regionOptionsScroll: {
    marginBottom: 16,
  },
  regionOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 10,
    gap: 12,
  },
  regionOptionCardSelected: {
    borderColor: '#166534',
    borderWidth: 1.5,
    backgroundColor: '#EAF5EE',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#166534',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#166534',
  },
  regionOptionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  regionOptionNameSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  applyBtn: {
    backgroundColor: '#1B382B',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

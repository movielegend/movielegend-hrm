import React, { useState, useEffect } from 'react';
import {View, StyleSheet, Dimensions, Pressable, Text, TextInput, Keyboard, ActivityIndicator} from 'react-native';
import MapView, { Marker } from '../lib/Maps';
import type { Region } from '../lib/Maps';

import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { CustomAlert } from './CustomAlert';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationPickerMapProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  initialLocation?: { latitude: number; longitude: number } | undefined;
}

export function LocationPickerMap({ visible, onClose, onSelect, initialLocation }: LocationPickerMapProps) {
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.latitude || 21.028511, // Default Hanoi
    longitude: initialLocation?.longitude || 105.804817,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedCoordinate, setSelectedCoordinate] = useState<{latitude: number, longitude: number} | null>(initialLocation || null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (visible && !initialLocation) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        CustomAlert.alert('Lỗi', 'Cần cấp quyền vị trí để lấy tọa độ hiện tại');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setRegion({
        ...coord,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      handleSelectCoordinate(coord);
    } catch (error) {
      CustomAlert.alert('Lỗi', 'Không thể lấy tọa độ hiện tại');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setSearching(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      const place = results[0];
      if (results.length > 0 && place) {
        const { latitude, longitude } = place;
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        handleSelectCoordinate({ latitude, longitude });
      } else {
        CustomAlert.alert('Không tìm thấy', 'Không tìm thấy địa điểm này. Vui lòng thử từ khóa cụ thể hơn.');
      }
    } catch (e) {
      console.warn(e);
      CustomAlert.alert('Lỗi', 'Không thể tìm kiếm địa điểm');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCoordinate = async (coordinate: {latitude: number, longitude: number}) => {
    setSelectedCoordinate(coordinate);
    try {
      const geocode = await Location.reverseGeocodeAsync(coordinate);
      const place = geocode[0];
      if (geocode.length > 0 && place) {
        // Format address: name, street, subregion, region
        const parts = [];
        if (place.name && place.name !== place.street) parts.push(place.name);
        if (place.street) parts.push(place.street);
        if (place.subregion) parts.push(place.subregion);
        if (place.region) parts.push(place.region);
        setAddress(parts.join(', '));
      } else {
        setAddress('Không tìm thấy địa chỉ');
      }
    } catch (error) {
      console.warn(error);
      setAddress('');
    }
  };

  const handleConfirm = () => {
    if (selectedCoordinate) {
      onSelect({
        ...selectedCoordinate,
        address,
      });
    }
  };

  return (
    <View style={[styles.modalContainer, !visible && { display: 'none' }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>Chọn vị trí</Text>
          <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="close" size={22} color="#0F172A" />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm địa điểm, đường phố..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color="#166534" style={{ marginRight: 8 }} />}
          {searchQuery.length > 0 && !searching && (
            <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={(e: any) => handleSelectCoordinate(e.nativeEvent.coordinate)}
            showsUserLocation
          >
            {selectedCoordinate && (
              <Marker coordinate={selectedCoordinate} pinColor="#166534" />
            )}
          </MapView>

          <View style={styles.mapInstructionPill}>
            <Text style={styles.mapInstructionText}>Di chuyển bản đồ để chọn vị trí</Text>
          </View>
          <Text style={styles.mapAttributionText}>Bản đồ minh họa</Text>
        </View>

        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.addressTitle}>Địa chỉ đã chọn</Text>
          <Text style={styles.addressText} numberOfLines={2}>
            {address || 'Vui lòng chạm trên bản đồ để chọn điểm'}
          </Text>

          <View style={styles.bottomButtonsRow}>
            <Pressable
              style={styles.myLocationBtn}
              onPress={getCurrentLocation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <>
                  <Ionicons name="location-outline" size={18} color="#0F172A" />
                  <Text style={styles.myLocationBtnText}>Vị trí của tôi</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.confirmBtn,
                !selectedCoordinate && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedCoordinate}
            >
              <Text style={styles.confirmBtnText}>Xác nhận</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#FFFFFF',
    elevation: 99,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  headerBtn: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
  mapInstructionPill: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapInstructionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  mapAttributionText: {
    position: 'absolute',
    bottom: 6,
    right: 12,
    fontSize: 10,
    color: '#94A3B8',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
    minHeight: 40,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  myLocationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  myLocationBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1B382B', // Deep forest green
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#8FA89B',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

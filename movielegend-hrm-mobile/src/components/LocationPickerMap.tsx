import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Dimensions, Alert, Pressable, Text, TextInput, Keyboard, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { PrimaryButton, SecondaryButton } from './Buttons';

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
        Alert.alert('Lỗi', 'Cần cấp quyền vị trí để lấy tọa độ hiện tại');
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
      Alert.alert('Lỗi', 'Không thể lấy tọa độ hiện tại');
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
        Alert.alert('Không tìm thấy', 'Không tìm thấy địa điểm này. Vui lòng thử từ khóa cụ thể hơn.');
      }
    } catch (e) {
      console.warn(e);
      Alert.alert('Lỗi', 'Không thể tìm kiếm địa điểm');
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#333" />
          </Pressable>
          <Text style={styles.title}>Chọn vị trí</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm địa điểm, đường phố..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
          {searchQuery.length > 0 && !searching && (
            <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </Pressable>
          )}
        </View>

        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={(e) => handleSelectCoordinate(e.nativeEvent.coordinate)}
          showsUserLocation
        >
          {selectedCoordinate && (
            <Marker coordinate={selectedCoordinate} />
          )}
        </MapView>

        <View style={styles.bottomSheet}>
          <Text style={styles.addressTitle}>Địa chỉ đã chọn:</Text>
          <Text style={styles.addressText}>{address || 'Vui lòng chạm trên bản đồ để chọn điểm'}</Text>
          
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton onPress={getCurrentLocation} loading={loading}>
                <Ionicons name="location" size={16} color={colors.primary} /> Vị trí của tôi
              </SecondaryButton>
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton onPress={handleConfirm} disabled={!selectedCoordinate}>
                Xác nhận
              </PrimaryButton>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  closeBtn: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B3B61',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EEF3',
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333',
  },
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
  bottomSheet: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  addressTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

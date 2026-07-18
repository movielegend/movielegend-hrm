import React, { Children, isValidElement } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import NativeMapView, { Marker as NativeMarker, UrlTile, MapType } from 'react-native-maps';

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export function Marker(props: { coordinate: { latitude: number; longitude: number } }) {
  return <NativeMarker coordinate={props.coordinate} />;
}

interface MapViewProps {
  style?: any;
  initialRegion?: Region;
  region?: Region;
  onRegionChangeComplete?: (region: Region) => void;
  onPanDrag?: (e: any) => void;
  onPress?: (e: any) => void;
  showsUserLocation?: boolean;
  children?: React.ReactNode;
}

export default function MapView({
  style,
  initialRegion,
  region,
  onRegionChangeComplete,
  onPress,
  showsUserLocation,
  children,
}: MapViewProps) {
  return (
    <View style={style || { flex: 1 }}>
      <NativeMapView
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={onPress}
        showsUserLocation={showsUserLocation}
        mapType="standard" // Sử dụng Google Maps chuẩn
      >
        {children}
      </NativeMapView>
    </View>
  );
}

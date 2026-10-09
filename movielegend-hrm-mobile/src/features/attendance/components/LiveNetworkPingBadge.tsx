import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NetworkQualityInfo } from '../../../hooks/useNetworkQuality';

interface LiveNetworkPingBadgeProps {
  quality: NetworkQualityInfo;
  isChecking?: boolean;
  onRefresh?: () => void;
}

export const LiveNetworkPingBadge: React.FC<LiveNetworkPingBadgeProps> = ({
  quality,
  isChecking = false,
  onRefresh,
}) => {
  const getSignalIcon = () => {
    if (quality.level === 'OFFLINE') return 'wifi-off';
    if (quality.level === 'POOR') return 'wifi-strength-1-alert';
    if (quality.level === 'FAIR') return 'wifi-strength-2';
    if (quality.level === 'GOOD') return 'wifi-strength-3';
    return 'wifi-strength-4';
  };

  return (
    <Pressable
      onPress={onRefresh}
      disabled={isChecking}
      style={[
        styles.container,
        { backgroundColor: quality.bgColor, borderColor: quality.color + '40' }
      ]}
    >
      <View style={styles.leftRow}>
        <View style={[styles.statusDot, { backgroundColor: quality.color }]} />
        <MaterialCommunityIcons
          name={getSignalIcon() as any}
          size={16}
          color={quality.color}
          style={styles.signalIcon}
        />
        <Text style={[styles.pingText, { color: quality.color }]}>
          {quality.pingMs !== null ? `${quality.pingMs} ms` : '-- ms'}
        </Text>
        <Text style={styles.separator}>•</Text>
        <Text style={[styles.labelText, { color: quality.color }]} numberOfLines={1}>
          {quality.label}
        </Text>
      </View>

      <View style={styles.rightRow}>
        {isChecking ? (
          <ActivityIndicator size="small" color={quality.color} style={{ transform: [{ scale: 0.7 }] }} />
        ) : (
          <MaterialCommunityIcons name="refresh" size={14} color={quality.color} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 10,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  signalIcon: {
    marginRight: 4,
  },
  pingText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    marginHorizontal: 6,
    color: '#9CA3AF',
    fontSize: 12,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  rightRow: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { useAuth } from '../../providers/AuthProvider';
import { getAbsoluteImageUrl } from '../../utils/image';

interface TabBarUserAvatarProps {
  focused: boolean;
  color: string;
  size?: number;
}

export function TabBarUserAvatar({ focused, color, size = 26 }: TabBarUserAvatarProps) {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const avatarUri = getAbsoluteImageUrl(user?.avatarUrl);

  const getInitials = (name?: string | null) => {
    if (!name) return 'ML';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase()).join('') || 'ML';
  };

  const hasValidImage = Boolean(avatarUri && !imgError);

  if (hasValidImage) {
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, borderRadius: size / 2 },
          focused ? styles.borderFocused : styles.borderInactive,
        ]}
      >
        <Image
          source={{ uri: avatarUri }}
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      </View>
    );
  }

  // Fallback: If no image or image failed, render clean initials or Lucide User icon
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        focused ? styles.fallbackFocused : styles.fallbackInactive,
      ]}
    >
      {user?.fullName ? (
        <Text style={[styles.initialsText, { fontSize: Math.max(size * 0.38, 9), color: focused ? '#FFFFFF' : 'rgba(255,255,255,0.85)' }]}>
          {getInitials(user.fullName)}
        </Text>
      ) : (
        <User size={Math.round(size * 0.65)} color={color} strokeWidth={focused ? 2.5 : 2} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  borderFocused: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  borderInactive: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    opacity: 0.85,
  },
  fallbackFocused: {
    borderWidth: 1.8,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  fallbackInactive: {
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  initialsText: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});

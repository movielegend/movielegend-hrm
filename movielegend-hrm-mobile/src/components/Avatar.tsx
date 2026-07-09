import { Image, StyleSheet, Text, View } from 'react-native';
import { getAbsoluteImageUrl } from '../utils/image';
import { colors } from '../theme/colors';

interface AvatarProps {
  name?: string | null | undefined;
  uri?: string | null | undefined;
  size?: number;
}

export function Avatar({ name, uri, size = 48 }: AvatarProps) {
  const absoluteUri = getAbsoluteImageUrl(uri);
  const dynamicStyle = { height: size, width: size, borderRadius: size / 2 };
  
  if (absoluteUri) return <Image source={{ uri: absoluteUri }} style={[styles.avatar, dynamicStyle]} />;
  return (
    <View style={[styles.fallback, dynamicStyle]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials(name)}</Text>
    </View>
  );
}

function initials(name?: string | null): string {
  if (!name) return 'ML';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'ML';
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  initials: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
});

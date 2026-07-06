import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface AvatarProps {
  name?: string | null | undefined;
  uri?: string | null | undefined;
}

export function Avatar({ name, uri }: AvatarProps) {
  if (uri) return <Image source={{ uri }} style={styles.avatar} />;
  return (
    <View style={styles.fallback}>
      <Text style={styles.initials}>{initials(name)}</Text>
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

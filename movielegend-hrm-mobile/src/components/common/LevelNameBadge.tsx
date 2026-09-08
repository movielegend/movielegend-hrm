import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';

export const LEVEL_COLORS: Record<number, string> = {
  1: '#9E9E9E', // Thực tập (Xám tro)
  2: '#2196F3', // Chính thức (Xanh dương)
  3: '#00BCD4', // Senior (Xanh ngọc)
  4: '#4CAF50', // Key Member (Xanh lá)
  5: '#FF9800', // Team Leader (Cam)
  6: '#E91E63', // Manager (Hồng đậm)
  7: '#9C27B0', // Director (Tím hoàng gia)
  8: '#D4AF37', // Executive (Vàng Gold)
};

export const LEVEL_DEFAULT_NAMES: Record<number, string> = {
  1: 'Thực tập',
  2: 'Chính thức',
  3: 'Senior',
  4: 'Key Member',
  5: 'Leader',
  6: 'Manager',
  7: 'Director',
  8: 'Executive',
};

interface LevelNameBadgeProps {
  name: string;
  levelNumber?: number;
  badgeTitle?: string;
  showBadge?: boolean;
  nameStyle?: TextStyle;
  containerStyle?: ViewStyle;
  badgeStyle?: ViewStyle;
  badgeTextStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const LevelNameBadge: React.FC<LevelNameBadgeProps> = ({
  name,
  levelNumber = 1,
  badgeTitle,
  showBadge = true,
  nameStyle,
  containerStyle,
  badgeStyle,
  badgeTextStyle,
  size = 'md',
}) => {
  const safeLevel = Math.max(1, Math.min(8, levelNumber || 1));
  const colorHex = LEVEL_COLORS[safeLevel] || '#2196F3';
  const displayBadge = badgeTitle || LEVEL_DEFAULT_NAMES[safeLevel] || `Lv.${safeLevel}`;

  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 18 : 15;
  const badgeFontSize = size === 'sm' ? 10 : size === 'lg' ? 12 : 11;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        style={[
          styles.nameText,
          { color: colorHex, fontSize },
          nameStyle,
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {showBadge && (
        <View
          style={[
            styles.badgeContainer,
            { backgroundColor: `${colorHex}1A`, borderColor: `${colorHex}4D` },
            badgeStyle,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: colorHex, fontSize: badgeFontSize },
              badgeTextStyle,
            ]}
          >
            {displayBadge}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontWeight: '700',
  },
  badgeContainer: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: '600',
  },
});

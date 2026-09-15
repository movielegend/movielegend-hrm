import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';

export const LEVEL_COLORS: Record<number, string> = {
  1: '#64748B', // Thực tập (Slate nhã nhặn)
  2: '#475569', // Chính thức (Slate Navy)
  3: '#2563EB', // Senior / Middle (Royal Blue)
  4: '#1D4ED8', // Key Member (Deep Cobalt)
  5: '#4338CA', // Team Leader (Deep Indigo)
  6: '#1E293B', // Manager (Executive Navy)
  7: '#0F172A', // Director (Deep Charcoal)
  8: '#B45309', // Executive (Warm Bronze Gold)
  9: '#059669', // Master (Forest Emerald)
  10: '#991B1B', // Grandmaster (Deep Wine Red)
  11: '#6B21A8', // Legend (Deep Royal Violet)
  12: '#1E40AF', // Champion (Midnight Blue)
  13: '#92400E', // Mythic (Deep Amber)
  14: '#0E7490', // Immortal (Deep Cyan Navy)
  15: '#881337', // Supreme (Deep Crimson)
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
  9: 'Master',
  10: 'Grandmaster',
  11: 'Legend',
  12: 'Champion',
  13: 'Mythic',
  14: 'Immortal',
  15: 'Supreme',
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
  const safeLevel = Math.max(1, levelNumber || 1);
  const colorHex = LEVEL_COLORS[safeLevel] || (safeLevel > 8 ? '#D4AF37' : '#2196F3');
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
    flexWrap: 'wrap',
    flexShrink: 1,
    maxWidth: '100%',
  },
  nameText: {
    fontWeight: '700',
    flexShrink: 1,
  },
  badgeContainer: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 1,
  },
  badgeText: {
    fontWeight: '600',
  },
});

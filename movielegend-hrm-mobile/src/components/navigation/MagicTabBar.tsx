import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

const CAPSULE_HEIGHT = 44;
const TOP_BAR_WIDTH = 24;

export const MagicTabBar = React.memo(function MagicTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState(screenWidth);

  const numTabs = state.routes.length;
  const tabWidth = containerWidth > 0 && numTabs > 0 ? containerWidth / numTabs : 0;
  const capsuleWidth = Math.min(64, Math.max(50, tabWidth - 10));

  // Tọa độ X ban đầu cho con trượt mềm
  const initialCapsuleX = tabWidth > 0 ? tabWidth * state.index + (tabWidth - capsuleWidth) / 2 : 0;
  const initialTopBarX = tabWidth > 0 ? tabWidth * state.index + (tabWidth - TOP_BAR_WIDTH) / 2 : 0;

  const capsuleTranslateX = useRef(new Animated.Value(initialCapsuleX)).current;
  const topBarTranslateX = useRef(new Animated.Value(initialTopBarX)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animation di chuyển lò xo khi đổi tab
  useEffect(() => {
    if (tabWidth > 0) {
      const targetCapsuleX = tabWidth * state.index + (tabWidth - capsuleWidth) / 2;
      const targetTopBarX = tabWidth * state.index + (tabWidth - TOP_BAR_WIDTH) / 2;

      Animated.parallel([
        Animated.spring(capsuleTranslateX, {
          toValue: targetCapsuleX,
          damping: 16,
          mass: 0.7,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.spring(topBarTranslateX, {
          toValue: targetTopBarX,
          damping: 16,
          mass: 0.7,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.06,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            damping: 12,
            stiffness: 180,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [state.index, tabWidth, capsuleWidth]);

  const bottomPadding = Math.max(Platform.OS === 'android' ? 8 : 16, insets.bottom);

  return (
    <View
      style={[
        styles.navBarContainer,
        {
          paddingBottom: bottomPadding,
        },
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - containerWidth) > 1) {
          setContainerWidth(w);
        }
      }}
    >
      {/* Vạch chỉ báo siêu mỏng ở đỉnh thanh bar */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.topIndicatorBar,
            {
              transform: [{ translateX: topBarTranslateX }],
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Con trượt mềm (Soft Capsule Pill) lướt ngang êm ái phía sau tab active */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.capsuleIndicator,
            {
              width: capsuleWidth,
              transform: [
                { translateX: capsuleTranslateX },
                { scale: scaleAnim },
              ],
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Hàng các tab bấm chọn */}
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          if (!descriptor) return null;
          const { options } = descriptor;
          const isFocused = state.index === index;
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            } else if (isFocused) {
              // Nhấn lại vào tab active -> nhấp nháy xúc giác nhẹ
              Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.08, duration: 80, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, damping: 10, stiffness: 200, useNativeDriver: true }),
              ]).start();
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabItem}
            >
              <View style={[styles.tabContent, isFocused && styles.tabContentActive]}>
                {/* Icon với badge */}
                <View style={styles.iconContainer}>
                  {options.tabBarIcon
                    ? options.tabBarIcon({
                        color: isFocused ? '#2563EB' : '#94A3B8',
                        focused: isFocused,
                        size: 24,
                      })
                    : null}

                  {options.tabBarBadge !== undefined && (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgeText} numberOfLines={1}>
                        {options.tabBarBadge}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Nhãn chữ đồng bộ trên cả 5 tab */}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    isFocused ? styles.labelActive : styles.labelInactive,
                  ]}
                >
                  {typeof label === 'string' ? label : ''}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  // Thanh bar liền đáy edge-to-edge
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
    // Đổ bóng hắt lên cực nhẹ tạo chiều sâu cho thanh footer
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  // Vạch chỉ báo mảnh 2.5px ở mép đỉnh
  topIndicatorBar: {
    position: 'absolute',
    top: -1,
    width: TOP_BAR_WIDTH,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#2563EB',
    zIndex: 10,
  },
  // Con trượt mềm dạng viên thuốc bo tròn nền xanh băng siêu nhẹ
  capsuleIndicator: {
    position: 'absolute',
    top: 5,
    height: CAPSULE_HEIGHT,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    zIndex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  tabItem: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabContentActive: {
    transform: [{ translateY: -1 }],
  },
  iconContainer: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  labelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  labelInactive: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  badgePill: {
    position: 'absolute',
    top: -3,
    right: -7,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
});

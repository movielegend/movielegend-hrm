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
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

const WAVE_WIDTH = 110;
const WAVE_HEIGHT = 12;

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

  // Tính tọa độ X cho vòm sóng và hào quang xanh trượt ngang
  const initialX = tabWidth > 0 ? tabWidth * state.index + (tabWidth - WAVE_WIDTH) / 2 : 0;

  const translateX = useRef(new Animated.Value(initialX)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Lắng nghe chuyển tab để chạy animation lò xo 60fps Native Driver
  useEffect(() => {
    if (tabWidth > 0) {
      const targetX = tabWidth * state.index + (tabWidth - WAVE_WIDTH) / 2;

      Animated.parallel([
        Animated.spring(translateX, {
          toValue: targetX,
          damping: 16,
          mass: 0.7,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 80,
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
  }, [state.index, tabWidth]);

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
      {/* Vòm sóng lượn cong mềm mại (Gentle Wave Crown) trượt ngang ở đỉnh navbar */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.waveCrownWrapper,
            {
              transform: [{ translateX }],
            },
          ]}
          pointerEvents="none"
        >
          <Svg width={WAVE_WIDTH} height={WAVE_HEIGHT + 2} viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT + 2}`}>
            {/* Thân vòm sóng trắng lượn cong cực êm (độ nhô nhẹ 8px) */}
            <Path
              d="M 0 10 C 28 10, 38 1, 55 1 C 72 1, 82 10, 110 10 L 110 14 L 0 14 Z"
              fill="#FFFFFF"
            />
            {/* Đường viền hairline siêu mảnh ở đỉnh vòm */}
            <Path
              d="M 0 10 C 28 10, 38 1, 55 1 C 72 1, 82 10, 110 10"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="1.2"
            />
          </Svg>
        </Animated.View>
      )}

      {/* Vầng hào quang xanh chuyển sắc (Ambient Aura Glow) trượt theo tab active */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.auraGlowWrapper,
            {
              left: (WAVE_WIDTH - 48) / 2,
              transform: [
                { translateX },
                { scale: scaleAnim },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Svg width="48" height="48" viewBox="0 0 48 48">
            <Defs>
              <RadialGradient id="auraGradient" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                <Stop offset="45%" stopColor="#93C5FD" stopOpacity="0.12" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="24" cy="24" r="23" fill="url(#auraGradient)" />
          </Svg>
        </Animated.View>
      )}

      {/* Hàng 5 tab điều hướng */}
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
              Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.12, duration: 70, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, damping: 10, stiffness: 180, useNativeDriver: true }),
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
              <View style={styles.tabContent}>
                {/* Hàng Icon: Cả 5 tab nằm trên cùng 1 trục ngang hoàn hảo */}
                <View style={styles.iconBox}>
                  {options.tabBarIcon
                    ? options.tabBarIcon({
                        color: isFocused ? '#2563EB' : '#94A3B8',
                        focused: isFocused,
                        size: 25,
                      })
                    : null}

                  {/* Huy hiệu thông báo nếu có */}
                  {options.tabBarBadge !== undefined && (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgeText} numberOfLines={1}>
                        {options.tabBarBadge}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Hàng chữ: Cả 5 tab nằm trên cùng 1 trục ngang, rộng rãi không bị gò ép */}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
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
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    // Đổ bóng hắt lên nhẹ tạo chiều sâu cho thanh footer
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  // Vòm sóng siêu êm ở đỉnh mép navbar
  waveCrownWrapper: {
    position: 'absolute',
    top: -9,
    width: WAVE_WIDTH,
    height: WAVE_HEIGHT + 2,
    zIndex: 10,
  },
  // Vầng hào quang xanh chuyển sắc sau icon active
  auraGlowWrapper: {
    position: 'absolute',
    top: 0,
    width: 48,
    height: 48,
    zIndex: 5,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 15,
  },
  tabItem: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 3,
  },
  iconBox: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    position: 'absolute',
    top: -4,
    right: -8,
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
  tabLabel: {
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#94A3B8',
    fontWeight: '500',
  },
});

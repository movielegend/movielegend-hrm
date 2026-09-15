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

const WAVE_WIDTH = 96;
const WAVE_HEIGHT = 28;

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

  // Tọa độ X ban đầu cho vòm sóng SVG
  const initialWaveX = tabWidth > 0 ? tabWidth * state.index + (tabWidth - WAVE_WIDTH) / 2 : 0;

  const waveTranslateX = useRef(new Animated.Value(initialWaveX)).current;
  const waveScale = useRef(new Animated.Value(1)).current;
  const iconFade = useRef(new Animated.Value(1)).current;

  // Lắng nghe chuyển tab để chạy animation lướt lò xo 60fps Native Driver
  useEffect(() => {
    if (tabWidth > 0) {
      const targetWaveX = tabWidth * state.index + (tabWidth - WAVE_WIDTH) / 2;

      Animated.parallel([
        Animated.spring(waveTranslateX, {
          toValue: targetWaveX,
          damping: 15,
          mass: 0.75,
          stiffness: 145,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(waveScale, {
            toValue: 1.08,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.spring(waveScale, {
            toValue: 1,
            damping: 11,
            mass: 0.6,
            stiffness: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(iconFade, {
            toValue: 0.3,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(iconFade, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [state.index, tabWidth]);

  const activeRoute = state.routes[state.index];
  const activeDescriptor = activeRoute ? descriptors[activeRoute.key] : undefined;
  const activeOptions = activeDescriptor ? activeDescriptor.options : {};
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
      {/* Vòm sóng cong Bézier SVG liền mạch (Seamless Organic Wave Crest) */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.waveCrestContainer,
            {
              transform: [
                { translateX: waveTranslateX },
                { scale: waveScale },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Svg width={WAVE_WIDTH} height={WAVE_HEIGHT} viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`}>
            <Defs>
              {/* Vầng hào quang xanh chuyển sắc (Ambient Aura) */}
              <RadialGradient id="ambientAura" cx="50%" cy="40%" rx="45%" ry="45%" fx="50%" fy="40%">
                <Stop offset="0%" stopColor="#2563EB" stopOpacity="0.24" />
                <Stop offset="45%" stopColor="#60A5FA" stopOpacity="0.12" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Thân vòm sóng trắng lượn cong ăn khớp hoàn toàn vào mép navbar */}
            <Path
              d="M 0 22 C 24 22, 34 2, 48 2 C 62 2, 72 22, 96 22 L 96 28 L 0 28 Z"
              fill="#FFFFFF"
            />

            {/* Đường viền hairline siêu thanh mảnh ở đỉnh vòm cong */}
            <Path
              d="M 0 22 C 24 22, 34 2, 48 2 C 62 2, 72 22, 96 22"
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="1.5"
            />

            {/* Vầng sáng xanh dịu tỏa sau lưng icon */}
            <Circle cx="48" cy="11" r="22" fill="url(#ambientAura)" />
          </Svg>

          {/* Icon nổi bật đặt chính xác tại đỉnh vòm sóng */}
          <View style={styles.activeIconAnchor}>
            <Animated.View style={{ opacity: iconFade }}>
              {activeOptions.tabBarIcon
                ? activeOptions.tabBarIcon({
                    color: '#2563EB',
                    focused: true,
                    size: 25,
                  })
                : null}
            </Animated.View>

            {/* Badge nếu tab active có thông báo */}
            {activeOptions.tabBarBadge !== undefined && (
              <View style={styles.activeBadgePill}>
                <Text style={styles.badgeText} numberOfLines={1}>
                  {activeOptions.tabBarBadge}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
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
              // Chạm lại tab active -> tạo nhịp nảy xúc giác
              Animated.sequence([
                Animated.timing(waveScale, { toValue: 1.12, duration: 70, useNativeDriver: true }),
                Animated.spring(waveScale, { toValue: 1, damping: 10, stiffness: 180, useNativeDriver: true }),
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
              <View style={styles.tabColumn}>
                {/* Khu vực Icon (Tab inactive hiển thị icon, tab active hiển thị trong vòm sóng phía trên) */}
                <View style={styles.inactiveIconArea}>
                  {!isFocused && options.tabBarIcon ? (
                    options.tabBarIcon({
                      color: '#94A3B8',
                      focused: false,
                      size: 24,
                    })
                  ) : null}

                  {/* Badge của tab inactive */}
                  {!isFocused && options.tabBarBadge !== undefined && (
                    <View style={styles.inactiveBadgePill}>
                      <Text style={styles.badgeText} numberOfLines={1}>
                        {options.tabBarBadge}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Hàng chữ giải phóng không gian (Full tab width, tuyệt đối không bao giờ bị cắt hay tràn box) */}
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
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
    // Đổ bóng hắt lên tạo chiều sâu cho thanh footer
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  // Khối vòm sóng SVG lượn cong nổi lên khỏi mép trên của navbar
  waveCrestContainer: {
    position: 'absolute',
    top: -22,
    width: WAVE_WIDTH,
    height: WAVE_HEIGHT,
    zIndex: 10,
  },
  activeIconAnchor: {
    position: 'absolute',
    top: -2,
    left: (WAVE_WIDTH - 28) / 2,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgePill: {
    position: 'absolute',
    top: -4,
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
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  tabItem: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 2,
    gap: 3,
  },
  inactiveIconArea: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveBadgePill: {
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
  tabLabel: {
    fontSize: 10.5,
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

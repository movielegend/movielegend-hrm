import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Platform} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

const AURA_WIDTH = 52;
const AURA_HEIGHT = 38;
const TOP_PILL_WIDTH = 24;

export const MagicTabBar = React.memo(function MagicTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState(screenWidth);

  // Lọc ra danh sách các tab được phép hiển thị trên thanh điều hướng đáy
  const visibleRoutes = state.routes.filter((route) => {
    const descriptor = descriptors[route.key];
    if (!descriptor) return false;
    const { options } = descriptor;
    return (options as any).href !== null && (options.tabBarItemStyle as any)?.display !== 'none';
  });

  const numTabs = visibleRoutes.length;
  const tabWidth = containerWidth > 0 && numTabs > 0 ? containerWidth / numTabs : 0;

  // Xác định vị trí tab đang active trong danh sách visibleRoutes
  const currentRouteKey = state.routes[state.index]?.key;
  const activeVisibleIndex = visibleRoutes.findIndex((r) => r.key === currentRouteKey);
  const isCurrentRouteVisible = activeVisibleIndex >= 0;
  const safeIndex = isCurrentRouteVisible ? activeVisibleIndex : 0;

  // Tọa độ X ban đầu cho con trượt hào quang và vạch chỉ báo
  const initialAuraX = tabWidth > 0 ? tabWidth * safeIndex + (tabWidth - AURA_WIDTH) / 2 : 0;
  const initialPillX = tabWidth > 0 ? tabWidth * safeIndex + (tabWidth - TOP_PILL_WIDTH) / 2 : 0;

  const auraTranslateX = useRef(new Animated.Value(initialAuraX)).current;
  const pillTranslateX = useRef(new Animated.Value(initialPillX)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Lắng nghe chuyển tab để chạy animation lò xo 60fps Native Driver
  useEffect(() => {
    if (tabWidth > 0 && isCurrentRouteVisible) {
      const targetAuraX = tabWidth * activeVisibleIndex + (tabWidth - AURA_WIDTH) / 2;
      const targetPillX = tabWidth * activeVisibleIndex + (tabWidth - TOP_PILL_WIDTH) / 2;

      Animated.parallel([
        Animated.spring(auraTranslateX, {
          toValue: targetAuraX,
          damping: 16,
          mass: 0.7,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.spring(pillTranslateX, {
          toValue: targetPillX,
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
  }, [activeVisibleIndex, tabWidth, isCurrentRouteVisible]);

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
      {/* Vạch chỉ báo mảnh 2.5px ở mép đỉnh trượt đồng bộ với tab active */}
      {tabWidth > 0 && isCurrentRouteVisible && (
        <Animated.View
          style={[
            styles.topPillIndicator,
            {
              transform: [{ translateX: pillTranslateX }],
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Vầng hào quang xanh chuyển sắc (Ambient Aura Glow) nằm gọn gàng sau icon active */}
      {tabWidth > 0 && isCurrentRouteVisible && (
        <Animated.View
          style={[
            styles.auraGlowWrapper,
            {
              transform: [
                { translateX: auraTranslateX },
                { scale: scaleAnim },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.auraPod}>
            <Svg width={AURA_WIDTH} height={AURA_HEIGHT} viewBox={`0 0 ${AURA_WIDTH} ${AURA_HEIGHT}`}>
              <Defs>
                <RadialGradient id="auraGradient" cx="50%" cy="45%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#2563EB" stopOpacity="0.20" />
                  <Stop offset="50%" stopColor="#93C5FD" stopOpacity="0.10" />
                  <Stop offset="100%" stopColor="#EFF6FF" stopOpacity="0.0" />
                </RadialGradient>
              </Defs>
              <Rect
                x="1"
                y="1"
                width={AURA_WIDTH - 2}
                height={AURA_HEIGHT - 2}
                rx="18"
                ry="18"
                fill="url(#auraGradient)"
              />
            </Svg>
          </View>
        </Animated.View>
      )}

      {/* Hàng tab điều hướng hiển thị chuẩn xác */}
      <View style={styles.tabsRow}>
        {visibleRoutes.map((route, index) => {
          const descriptor = descriptors[route.key];
          if (!descriptor) return null;
          const { options } = descriptor;
          const isFocused = isCurrentRouteVisible && activeVisibleIndex === index;
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
                        size: 24,
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

                {/* Hàng chữ: Cả 5 tab nằm trên cùng 1 trục ngang, rộng rãi không bao giờ tràn mép */}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  // Vạch chỉ báo mảnh 2.5px ở mép đỉnh
  topPillIndicator: {
    position: 'absolute',
    top: -1,
    width: TOP_PILL_WIDTH,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#2563EB',
    zIndex: 20,
  },
  // Vầng hào quang xanh chuyển sắc sau icon active
  auraGlowWrapper: {
    position: 'absolute',
    top: 5,
    width: AURA_WIDTH,
    height: AURA_HEIGHT,
    zIndex: 5,
  },
  auraPod: {
    width: AURA_WIDTH,
    height: AURA_HEIGHT,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    overflow: 'hidden',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 15,
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

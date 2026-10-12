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
import { useTabBarVisibilityState, setTabBarVisible } from './tabBarVisibility';

const DOCK_HEIGHT = 60;
const INDICATOR_WIDTH = 54;
const INDICATOR_HEIGHT = 44;

export const MagicTabBar = React.memo(function MagicTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState(screenWidth - 36);
  const isTabBarVisible = useTabBarVisibilityState();

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

  // Tọa độ X ban đầu cho con trượt pill chỉ báo
  const initialPillX = tabWidth > 0 ? tabWidth * safeIndex + (tabWidth - INDICATOR_WIDTH) / 2 : 0;

  const pillTranslateX = useRef(new Animated.Value(initialPillX)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // Khi cuộn trang lên/xuống: hiệu ứng trượt ẩn xuống đáy (120px) hoặc đẩy lên lại (0px)
  useEffect(() => {
    Animated.spring(translateYAnim, {
      toValue: isTabBarVisible ? 0 : 120,
      damping: 18,
      mass: 0.6,
      stiffness: 160,
      useNativeDriver: true,
    }).start();
  }, [isTabBarVisible]);

  // Luôn đảm bảo hiện lại tab bar khi bấm chuyển tab
  useEffect(() => {
    setTabBarVisible(true);
  }, [state.index]);

  // Lắng nghe chuyển tab để chạy animation lò xo 60fps Native Driver
  useEffect(() => {
    if (tabWidth > 0 && isCurrentRouteVisible) {
      const targetPillX = tabWidth * activeVisibleIndex + (tabWidth - INDICATOR_WIDTH) / 2;

      Animated.parallel([
        Animated.spring(pillTranslateX, {
          toValue: targetPillX,
          damping: 18,
          mass: 0.6,
          stiffness: 160,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.94,
            duration: 60,
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

  // Vị trí nổi cách đáy màn hình
  const bottomMargin = Math.max(Platform.OS === 'android' ? 14 : insets.bottom, 12);

  return (
    <Animated.View
      style={[
        styles.dockOuterContainer,
        {
          bottom: bottomMargin,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
      pointerEvents={isTabBarVisible ? 'box-none' : 'none'}
    >
      <View
        style={styles.dockCapsule}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - containerWidth) > 1) {
            setContainerWidth(w);
          }
        }}
      >
        {/* Con trượt Pill hình bầu dục / Oval capsule indicator theo tab đang active */}
        {tabWidth > 0 && isCurrentRouteVisible && (
          <Animated.View
            style={[
              styles.activePillIndicator,
              {
                transform: [
                  { translateX: pillTranslateX },
                  { scale: scaleAnim },
                ],
              },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Hàng các tab điều hướng (icon-only gọn gàng, sắc nét) */}
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
                  Animated.timing(scaleAnim, { toValue: 1.12, duration: 60, useNativeDriver: true }),
                  Animated.spring(scaleAnim, { toValue: 1, damping: 10, stiffness: 180, useNativeDriver: true }),
                ]).start();
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={
                  options.tabBarAccessibilityLabel ||
                  (typeof label === 'string' ? label : undefined)
                }
                onPress={onPress}
                style={styles.tabItem}
              >
                <View style={styles.iconBox}>
                  {options.tabBarIcon
                    ? options.tabBarIcon({
                        color: isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.68)',
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
              </Pressable>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  dockOuterContainer: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
    zIndex: 999,
  },
  dockCapsule: {
    width: '100%',
    maxWidth: 420,
    height: DOCK_HEIGHT,
    backgroundColor: '#102739', // Màu xanh đen / Deep Navy sang trọng đồng bộ với màu chủ đạo
    borderRadius: DOCK_HEIGHT / 2, // Bo tròn dạng viên thuốc hoàn hảo
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  // Vùng pill bầu dục nổi bật của tab đang active
  activePillIndicator: {
    position: 'absolute',
    top: (DOCK_HEIGHT - INDICATOR_HEIGHT) / 2,
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.16)', // Highlight nhẹ sang trọng đồng bộ với màu nền
    zIndex: 5,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: DOCK_HEIGHT,
    zIndex: 15,
  },
  tabItem: {
    flex: 1,
    height: DOCK_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgePill: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#102739',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});

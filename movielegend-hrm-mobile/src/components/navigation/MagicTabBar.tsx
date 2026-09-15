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

const HORIZONTAL_MARGIN = 16;
const NAVBAR_HEIGHT = 62;
const BUBBLE_SIZE = 54;

export const MagicTabBar = React.memo(function MagicTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState(screenWidth - HORIZONTAL_MARGIN * 2);

  const numTabs = state.routes.length;
  const tabWidth = containerWidth > 0 && numTabs > 0 ? containerWidth / numTabs : 0;

  // Tính tọa độ X ban đầu cho tab đang active
  const initialX = tabWidth > 0 ? tabWidth * state.index + (tabWidth - BUBBLE_SIZE) / 2 : 0;
  const translateX = useRef(new Animated.Value(initialX)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconOpacity = useRef(new Animated.Value(1)).current;

  // Lắng nghe thay đổi tab để chạy animation trượt lò xo
  useEffect(() => {
    if (tabWidth > 0) {
      const targetX = tabWidth * state.index + (tabWidth - BUBBLE_SIZE) / 2;

      Animated.parallel([
        // Trượt ngang bằng vật lý lò xo (Spring Physics) 60fps mượt mà
        Animated.spring(translateX, {
          toValue: targetX,
          damping: 14,
          mass: 0.8,
          stiffness: 140,
          useNativeDriver: true,
        }),
        // Hiệu ứng nảy nhẹ (tactile pop bounce)
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.12,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            damping: 10,
            mass: 0.6,
            stiffness: 160,
            useNativeDriver: true,
          }),
        ]),
        // Hiệu ứng chuyển icon
        Animated.sequence([
          Animated.timing(iconOpacity, {
            toValue: 0.3,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(iconOpacity, {
            toValue: 1,
            duration: 130,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [state.index, tabWidth]);

  const activeRoute = state.routes[state.index];
  const activeDescriptor = activeRoute ? descriptors[activeRoute.key] : undefined;
  const activeOptions = activeDescriptor ? activeDescriptor.options : {};
  const bottomInset = Math.max(Platform.OS === 'android' ? 12 : 16, insets.bottom);

  return (
    <View
      style={[styles.wrapper, { bottom: bottomInset }]}
      pointerEvents="box-none"
    >
      <View
        style={styles.navBarContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - containerWidth) > 1) {
            setContainerWidth(w);
          }
        }}
      >
        {/* Bong bóng tròn lồi lên (Bulging Active Bubble) màu trắng trượt ngang */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.indicatorBubble,
              {
                transform: [
                  { translateX },
                  { scale: scaleAnim },
                ],
              },
            ]}
            pointerEvents="none"
          >
            {/* Vòng hào quang siêu tinh tế */}
            <View style={styles.bubbleGlowRing} />

            {/* Icon của tab đang active */}
            <Animated.View style={{ opacity: iconOpacity }}>
              {activeOptions.tabBarIcon
                ? activeOptions.tabBarIcon({
                    color: '#2563EB',
                    focused: true,
                    size: 26,
                  })
                : null}
            </Animated.View>

            {/* Badge cho tab đang active nếu có */}
            {activeOptions.tabBarBadge !== undefined && (
              <View style={styles.bubbleBadge}>
                <Text style={styles.bubbleBadgeText} numberOfLines={1}>
                  {activeOptions.tabBarBadge}
                </Text>
              </View>
            )}
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
                // Nhấp lại vào tab đang active -> tạo hiệu ứng rung nảy tactile
                Animated.sequence([
                  Animated.timing(scaleAnim, { toValue: 1.15, duration: 90, useNativeDriver: true }),
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
                {isFocused ? (
                  // Tab đang active: Icon đã nhô lên trong bong bóng tròn, chữ đặt ngay bên dưới
                  <View style={styles.activeLabelBox}>
                    <Text numberOfLines={1} style={styles.activeLabelText}>
                      {typeof label === 'string' ? label : ''}
                    </Text>
                    <View style={styles.activeDot} />
                  </View>
                ) : (
                  // Tab chưa active: Icon đặt ngay ngắn ở trung tâm kèm badge nếu có
                  <View style={styles.inactiveBox}>
                    {options.tabBarIcon
                      ? options.tabBarIcon({
                          color: '#94A3B8',
                          focused: false,
                          size: 24,
                        })
                      : null}
                    {options.tabBarBadge !== undefined && (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText} numberOfLines={1}>
                          {options.tabBarBadge}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: HORIZONTAL_MARGIN,
    right: HORIZONTAL_MARGIN,
    zIndex: 999,
  },
  navBarContainer: {
    height: NAVBAR_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    // Đổ bóng sang trọng nhiều tầng chuẩn Executive
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  // Bong bóng tròn lồi lên khỏi mép trên của navbar
  indicatorBubble: {
    position: 'absolute',
    top: -20,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: '#EFF6FF', // Viền hào quang xanh băng nhẹ tôn nền trắng
    // Đổ bóng sâu riêng cho bong bóng nổi
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 20,
  },
  bubbleGlowRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bubbleBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: 1,
    height: NAVBAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabelBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    gap: 2,
  },
  activeLabelText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  inactiveBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  inactiveBadge: {
    position: 'absolute',
    top: -3,
    right: -6,
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
  inactiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
});

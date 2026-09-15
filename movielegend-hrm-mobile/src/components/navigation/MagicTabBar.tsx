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

const DOME_WIDTH = 56;
const DOME_HEIGHT = 40;

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

  // Tính tọa độ X cho vòm sóng nổi
  const initialDomeX = tabWidth > 0 ? tabWidth * state.index + (tabWidth - DOME_WIDTH) / 2 : 0;

  const domeTranslateX = useRef(new Animated.Value(initialDomeX)).current;
  const domeScale = useRef(new Animated.Value(1)).current;
  const iconFade = useRef(new Animated.Value(1)).current;

  // Animation di chuyển lò xo native driver 60fps mượt mà
  useEffect(() => {
    if (tabWidth > 0) {
      const targetDomeX = tabWidth * state.index + (tabWidth - DOME_WIDTH) / 2;

      Animated.parallel([
        Animated.spring(domeTranslateX, {
          toValue: targetDomeX,
          damping: 14,
          mass: 0.75,
          stiffness: 145,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(domeScale, {
            toValue: 1.10,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.spring(domeScale, {
            toValue: 1,
            damping: 10,
            mass: 0.6,
            stiffness: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(iconFade, {
            toValue: 0.4,
            duration: 70,
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
      {/* Vòm sóng nổi mềm mại (Organic Wave Dome) trượt mượt mà phía trên tab active */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.waveDome,
            {
              transform: [
                { translateX: domeTranslateX },
                { scale: domeScale },
              ],
            },
          ]}
          pointerEvents="none"
        >
          {/* Vầng hào quang xanh băng phía sau vòm */}
          <View style={styles.domeAura} />

          {/* Icon nổi bật của tab active */}
          <Animated.View style={{ opacity: iconFade }}>
            {activeOptions.tabBarIcon
              ? activeOptions.tabBarIcon({
                  color: '#2563EB',
                  focused: true,
                  size: 24,
                })
              : null}
          </Animated.View>

          {/* Badge nếu tab active có thông báo chưa đọc */}
          {activeOptions.tabBarBadge !== undefined && (
            <View style={styles.domeBadge}>
              <Text style={styles.domeBadgeText} numberOfLines={1}>
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
              // Chạm lại vào tab active -> nhịp nảy xúc giác
              Animated.sequence([
                Animated.timing(domeScale, { toValue: 1.12, duration: 80, useNativeDriver: true }),
                Animated.spring(domeScale, { toValue: 1, damping: 10, stiffness: 180, useNativeDriver: true }),
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
                {/* Khu vực Icon của các tab inactive (tab active hiển thị trong vòm) */}
                <View style={styles.inactiveIconArea}>
                  {!isFocused && options.tabBarIcon ? (
                    options.tabBarIcon({
                      color: '#94A3B8',
                      focused: false,
                      size: 23,
                    })
                  ) : null}

                  {/* Badge cho tab chưa active */}
                  {!isFocused && options.tabBarBadge !== undefined && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText} numberOfLines={1}>
                        {options.tabBarBadge}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Hàng chữ được giải phóng không gian (Full tab width, không bao giờ bị cắt hay trồi box) */}
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
  // Thanh bar liền đáy vững chãi
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    // Bóng đổ hắt lên tạo chiều sâu tách biệt với nội dung cuộn
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  // Vòm sóng hữu cơ (Organic Wave Dome) nhô nhẹ lên khỏi mép trên của navbar
  waveDome: {
    position: 'absolute',
    top: -14,
    width: DOME_WIDTH,
    height: DOME_HEIGHT,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    // Đổ bóng xanh hoàng gia nhẹ tạo cảm giác bồng bềnh cao cấp
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 7,
    zIndex: 10,
  },
  domeAura: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  domeBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
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
  domeBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
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
  tabColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 2,
    gap: 3,
  },
  inactiveIconArea: {
    width: 26,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
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
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  // Nhãn chữ: Rộng rãi, không bị bó trong hộp nào
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

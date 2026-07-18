import React, { useRef } from 'react';
import { Animated, PanResponder, Pressable, View, StyleSheet, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '../theme/spacing';

const { width, height } = Dimensions.get('window');
const FAB_SIZE = 60;

export function DraggableFAB({ onPress }: { onPress: () => void }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Touch down feedback
        Animated.timing(opacity, { toValue: 0.7, duration: 100, useNativeDriver: false }).start();
        
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (evt, gestureState) => {
        // Touch up feedback
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: false }).start();
        
        pan.flattenOffset();

        // If it was just a tap (movement < 5px), trigger onPress
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          onPress();
        }
        
        // Define safe bounds to prevent dragging off-screen
        const minX = -width + FAB_SIZE + spacing.lg;
        const maxX = spacing.lg;
        
        const minY = -height + FAB_SIZE + 100;
        const maxY = spacing.xxl;

        let finalX = (pan.x as any)._value;
        let finalY = (pan.y as any)._value;

        if (finalX < minX) finalX = minX;
        if (finalX > maxX) finalX = maxX;
        
        if (finalY < minY) finalY = minY;
        if (finalY > maxY) finalY = maxY;

        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          opacity: opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.fab}>
        <MaterialCommunityIcons name="robot-outline" size={28} color="#fff" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.lg,
    zIndex: 999,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

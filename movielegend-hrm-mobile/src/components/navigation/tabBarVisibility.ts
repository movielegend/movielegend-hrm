import { useRef, useCallback, useEffect, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

type Listener = (visible: boolean) => void;
const listeners = new Set<Listener>();
let currentVisible = true;

export const setTabBarVisible = (visible: boolean) => {
  if (currentVisible !== visible) {
    currentVisible = visible;
    listeners.forEach((l) => l(visible));
  }
};

export const getTabBarVisible = () => currentVisible;

export const subscribeTabBarVisible = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useTabBarVisibilityState = () => {
  const [isVisible, setIsVisible] = useState(currentVisible);

  useEffect(() => {
    return subscribeTabBarVisible((vis) => {
      setIsVisible(vis);
    });
  }, []);

  return isVisible;
};

export const handleTabBarScrollEvent = (
  event: NativeSyntheticEvent<NativeScrollEvent>,
  lastYRef: { current: number }
) => {
  const currentY = event.nativeEvent.contentOffset.y;
  const diff = currentY - lastYRef.current;

  // Nếu đang ở gần đỉnh trang, luôn hiện tab bar
  if (currentY <= 20) {
    setTabBarVisible(true);
  } else if (diff > 10) {
    // Vuốt lên (nội dung trôi xuống, trang cuộn xuống dưới) -> ẩn tab bar
    setTabBarVisible(false);
  } else if (diff < -10) {
    // Vuốt xuống (nội dung trôi lên, trang cuộn lên trên) -> hiện tab bar
    setTabBarVisible(true);
  }

  lastYRef.current = currentY;
};

export const useTabBarScroll = () => {
  const lastY = useRef(0);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleTabBarScrollEvent(event, lastY);
  }, []);

  return {
    onScroll,
    scrollEventThrottle: 16,
  };
};

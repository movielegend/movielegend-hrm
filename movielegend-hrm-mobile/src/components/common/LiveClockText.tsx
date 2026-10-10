import React, { useState, useEffect } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface LiveClockTextProps {
  style?: StyleProp<TextStyle>;
}

/**
 * LiveClockText isolates the 1-second clock interval into its own leaf component.
 * This completely prevents parent dashboard screens from re-rendering every 1000ms,
 * ensuring smooth 60fps scrolling and eliminating stutter/lag.
 */
export const LiveClockText = React.memo(function LiveClockText({ style }: LiveClockTextProps) {
  const [time, setTime] = useState(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <Text style={style}>{time}</Text>;
});

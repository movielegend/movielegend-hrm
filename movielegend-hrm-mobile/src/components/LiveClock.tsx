import React, { useState, useEffect } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface LiveClockProps {
  style?: StyleProp<TextStyle>;
  format?: 'time' | 'date' | 'full';
}

export const LiveClock: React.FC<LiveClockProps> = ({ style, format = 'time' }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatText = () => {
    if (format === 'date') {
      return now.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    if (format === 'full') {
      return `${now.toLocaleTimeString('vi-VN')} - ${now.toLocaleDateString('vi-VN')}`;
    }
    return now.toLocaleTimeString('vi-VN');
  };

  return <Text style={style}>{formatText()}</Text>;
};

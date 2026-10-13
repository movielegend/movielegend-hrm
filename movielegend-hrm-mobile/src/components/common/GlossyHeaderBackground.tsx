import React from 'react';
import { View, StyleSheet } from 'react-native';

interface GlossyHeaderBackgroundProps {
  idPrefix?: string;
  style?: any;
}

export function GlossyHeaderBackground({ style }: GlossyHeaderBackgroundProps) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: '#102739' }, style]}
    />
  );
}

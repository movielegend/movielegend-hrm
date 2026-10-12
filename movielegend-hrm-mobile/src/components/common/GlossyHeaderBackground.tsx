import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  Rect,
  Path,
  Line,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GlossyHeaderBackgroundProps {
  /**
   * Unique prefix for SVG gradient IDs to prevent conflicts across screens
   */
  idPrefix?: string;
  /**
   * Optional custom height or stretch
   */
  style?: any;
}

export function GlossyHeaderBackground({ idPrefix = 'ghb', style }: GlossyHeaderBackgroundProps) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {/* 1. Nền Navy #102739 Gradient chủ đạo */}
      <LinearGradient
        colors={['#102739', '#143147', '#1A3F5B', '#225275']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Cực quang loang màu (Aurora Glow) + Sọc chéo vi tế (Tech Lines) */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Loang loang: Vùng sáng cực quang góc trên bên phải */}
          <SvgRadialGradient
            id={`${idPrefix}AuraRight`}
            cx="85%"
            cy="20%"
            rx="60%"
            ry="50%"
            fx="85%"
            fy="20%"
          >
            <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.22" />
            <Stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#102739" stopOpacity="0" />
          </SvgRadialGradient>

          {/* Loang loang: Vệt sáng chìm góc dưới bên trái */}
          <SvgRadialGradient
            id={`${idPrefix}AuraLeft`}
            cx="15%"
            cy="85%"
            rx="50%"
            ry="50%"
            fx="15%"
            fy="85%"
          >
            <Stop offset="0%" stopColor="#60A5FA" stopOpacity="0.18" />
            <Stop offset="60%" stopColor="#3B82F6" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#102739" stopOpacity="0" />
          </SvgRadialGradient>

          {/* Dải phản chiếu chéo bóng bẩy */}
          <SvgLinearGradient id={`${idPrefix}GlossHighlight`} x1="0%" y1="0%" x2="100%" y2="80%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </SvgLinearGradient>

          {/* Sọc chéo vi tế thanh mảnh */}
          <SvgLinearGradient id={`${idPrefix}LineGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.0" />
            <Stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <Stop offset="70%" stopColor="#38BDF8" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </SvgLinearGradient>
        </Defs>

        {/* Lớp nền loang ánh sáng */}
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${idPrefix}AuraRight)`} />
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${idPrefix}AuraLeft)`} />

        {/* Vệt chéo phản quang */}
        <Path
          d="M -60 -40 L 260 -40 L 140 240 L -60 240 Z"
          fill={`url(#${idPrefix}GlossHighlight)`}
        />

        {/* Các đường sọc chéo vi tế hiện đại */}
        <Line
          x1={SCREEN_WIDTH - 120}
          y1={-10}
          x2={SCREEN_WIDTH + 80}
          y2={190}
          stroke={`url(#${idPrefix}LineGrad)`}
          strokeWidth={2}
          strokeDasharray="6, 6"
        />
        <Line
          x1={SCREEN_WIDTH - 60}
          y1={-10}
          x2={SCREEN_WIDTH + 140}
          y2={190}
          stroke={`url(#${idPrefix}LineGrad)`}
          strokeWidth={1.5}
        />
        <Line
          x1={SCREEN_WIDTH - 180}
          y1={-10}
          x2={SCREEN_WIDTH + 20}
          y2={190}
          stroke={`url(#${idPrefix}LineGrad)`}
          strokeWidth={1}
          strokeDasharray="4, 8"
          opacity={0.6}
        />
      </Svg>
    </View>
  );
}

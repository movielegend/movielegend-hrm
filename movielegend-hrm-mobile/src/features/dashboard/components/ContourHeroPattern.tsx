import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type ContourVariant = 'green' | 'red' | 'blue' | 'slate';

interface ContourHeroPatternProps {
  variant?: ContourVariant;
}

const PALETTES: Record<ContourVariant, {
  level1: { fill: string; stroke: string };
  level2: { fill: string; stroke: string };
  level3: { fill: string; stroke: string };
  level4: { fill: string; stroke: string };
  level5: { fill: string; stroke: string };
}> = {
  // Leader: Emerald / Mint Topo
  green: {
    level1: { fill: '#E8FDF0', stroke: '#BBF7D0' },
    level2: { fill: '#DCFCE7', stroke: '#86EFAC' },
    level3: { fill: '#BBF7D0', stroke: '#4ADE80' },
    level4: { fill: '#86EFAC', stroke: '#22C55E' },
    level5: { fill: '#4ADE80', stroke: '#16A34A' },
  },
  // Admin: Ruby / Rose Topo
  red: {
    level1: { fill: '#FFF1F2', stroke: '#FECDD3' },
    level2: { fill: '#FFE4E6', stroke: '#FDA4AF' },
    level3: { fill: '#FECDD3', stroke: '#FB7185' },
    level4: { fill: '#FDA4AF', stroke: '#F43F5E' },
    level5: { fill: '#FB7185', stroke: '#E11D48' },
  },
  // Employee: Sky / Azure Topo
  blue: {
    level1: { fill: '#F0F9FF', stroke: '#BAE6FD' },
    level2: { fill: '#E0F2FE', stroke: '#7DD3FC' },
    level3: { fill: '#BAE6FD', stroke: '#38BDF8' },
    level4: { fill: '#7DD3FC', stroke: '#0EA5E9' },
    level5: { fill: '#38BDF8', stroke: '#2563EB' },
  },
  // HR: Slate / Charcoal Topo
  slate: {
    level1: { fill: '#F8FAFC', stroke: '#E2E8F0' },
    level2: { fill: '#F1F5F9', stroke: '#CBD5E1' },
    level3: { fill: '#E2E8F0', stroke: '#94A3B8' },
    level4: { fill: '#CBD5E1', stroke: '#64748B' },
    level5: { fill: '#94A3B8', stroke: '#475569' },
  },
};

export const ContourHeroPattern: React.FC<ContourHeroPatternProps> = ({ variant = 'green' }) => {
  const palette = PALETTES[variant] || PALETTES.green;

  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 360 160"
        preserveAspectRatio="xMaxYMid slice"
      >
        {/* Layer 1: Outermost broad ambient wave */}
        <Path
          d="M 175 -35
             C 285 -55, 425 -5, 405 110
             C 385 200, 275 220, 175 200
             C 115 185, 120 75, 150 20
             C 160 -10, 165 -30, 175 -35 Z"
          fill={palette.level1.fill}
          fillOpacity={0.4}
          stroke={palette.level1.stroke}
          strokeWidth={0.8}
          strokeOpacity={0.4}
        />

        {/* Layer 2: Outermost organic ripple */}
        <Path
          d="M 215 -15
             C 300 -30, 405 10, 390 100
             C 375 175, 290 192, 210 178
             C 160 165, 165 80, 190 30
             C 200 8, 205 -10, 215 -15 Z"
          fill={palette.level2.fill}
          fillOpacity={0.6}
          stroke={palette.level2.stroke}
          strokeWidth={1}
          strokeOpacity={0.6}
        />

        {/* Layer 3: Medium topographic contour */}
        <Path
          d="M 250 8
             C 315 -5, 385 25, 375 92
             C 365 150, 305 165, 245 155
             C 205 145, 208 80, 230 40
             C 238 22, 240 10, 250 8 Z"
          fill={palette.level3.fill}
          fillOpacity={0.75}
          stroke={palette.level3.stroke}
          strokeWidth={1.2}
          strokeOpacity={0.75}
        />

        {/* Layer 4: Inner contour wave */}
        <Path
          d="M 285 28
             C 330 20, 365 42, 360 85
             C 355 125, 320 138, 280 132
             C 248 126, 252 82, 268 52
             C 275 38, 275 30, 285 28 Z"
          fill={palette.level4.fill}
          fillOpacity={0.9}
          stroke={palette.level4.stroke}
          strokeWidth={1.2}
          strokeOpacity={0.9}
        />

        {/* Layer 5: Organic center nucleus / blob */}
        <Path
          d="M 315 48
             C 335 44, 348 58, 345 80
             C 342 98, 332 112, 312 110
             C 295 108, 290 88, 298 68
             C 304 54, 305 50, 315 48 Z"
          fill={palette.level5.fill}
          fillOpacity={1.0}
          stroke={palette.level5.stroke}
          strokeWidth={1.4}
          strokeOpacity={1.0}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    borderRadius: 24,
  },
});

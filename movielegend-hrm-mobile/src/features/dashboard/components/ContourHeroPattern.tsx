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
        viewBox="0 0 360 175"
        preserveAspectRatio="xMaxYMid slice"
      >
        {/* Layer 1: Outermost broad ambient wave */}
        <Path
          d="M 135 -40
             C 255 -65, 435 -10, 415 120
             C 395 220, 260 240, 135 215
             C 65 195, 75 75, 110 15
             C 120 -15, 125 -35, 135 -40 Z"
          fill={palette.level1.fill}
          fillOpacity={0.4}
          stroke={palette.level1.stroke}
          strokeWidth={0.8}
          strokeOpacity={0.4}
        />

        {/* Layer 2: Outermost organic ripple */}
        <Path
          d="M 175 -20
             C 275 -40, 415 5, 395 110
             C 380 195, 275 215, 180 192
             C 120 175, 130 80, 160 25
             C 168 5, 170 -15, 175 -20 Z"
          fill={palette.level2.fill}
          fillOpacity={0.6}
          stroke={palette.level2.stroke}
          strokeWidth={1}
          strokeOpacity={0.6}
        />

        {/* Layer 3: Medium topographic contour */}
        <Path
          d="M 215 5
             C 295 -15, 395 20, 385 100
             C 375 168, 295 185, 222 170
             C 170 155, 175 82, 200 38
             C 208 20, 210 8, 215 5 Z"
          fill={palette.level3.fill}
          fillOpacity={0.75}
          stroke={palette.level3.stroke}
          strokeWidth={1.2}
          strokeOpacity={0.75}
        />

        {/* Layer 4: Inner contour wave */}
        <Path
          d="M 255 25
             C 315 15, 375 38, 368 92
             C 362 142, 312 152, 265 144
             C 222 135, 225 85, 245 52
             C 250 35, 252 26, 255 25 Z"
          fill={palette.level4.fill}
          fillOpacity={0.9}
          stroke={palette.level4.stroke}
          strokeWidth={1.2}
          strokeOpacity={0.9}
        />

        {/* Layer 5: Organic center nucleus / blob */}
        <Path
          d="M 295 48
             C 328 42, 355 56, 350 85
             C 346 115, 322 128, 295 122
             C 270 116, 265 92, 276 68
             C 282 52, 286 49, 295 48 Z"
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

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
  // Leader: Emerald / Mint Topo (Exact match to reference mockup)
  green: {
    level1: { fill: '#DCFCE7', stroke: '#86EFAC' },
    level2: { fill: '#BBF7D0', stroke: '#4ADE80' },
    level3: { fill: '#86EFAC', stroke: '#22C55E' },
    level4: { fill: '#4ADE80', stroke: '#16A34A' },
    level5: { fill: '#22C55E', stroke: '#15803D' },
  },
  // Admin: Ruby / Rose Topo
  red: {
    level1: { fill: '#FFE4E6', stroke: '#FECDD3' },
    level2: { fill: '#FECDD3', stroke: '#FDA4AF' },
    level3: { fill: '#FDA4AF', stroke: '#FB7185' },
    level4: { fill: '#FB7185', stroke: '#F43F5E' },
    level5: { fill: '#F43F5E', stroke: '#BE123C' },
  },
  // Employee: Sky / Azure Topo
  blue: {
    level1: { fill: '#E0F2FE', stroke: '#BAE6FD' },
    level2: { fill: '#BAE6FD', stroke: '#7DD3FC' },
    level3: { fill: '#7DD3FC', stroke: '#38BDF8' },
    level4: { fill: '#38BDF8', stroke: '#0EA5E9' },
    level5: { fill: '#0EA5E9', stroke: '#1D4ED8' },
  },
  // HR: Slate / Charcoal Topo
  slate: {
    level1: { fill: '#F1F5F9', stroke: '#E2E8F0' },
    level2: { fill: '#E2E8F0', stroke: '#CBD5E1' },
    level3: { fill: '#CBD5E1', stroke: '#94A3B8' },
    level4: { fill: '#94A3B8', stroke: '#64748B' },
    level5: { fill: '#64748B', stroke: '#334155' },
  },
};

export const ContourHeroPattern: React.FC<ContourHeroPatternProps> = ({ variant = 'green' }) => {
  const palette = PALETTES[variant] || PALETTES.green;

  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 360 150"
        preserveAspectRatio="xMaxYMid slice"
      >
        {/* Layer 1: Outermost broad ambient contour */}
        <Path
          d="M 230 -35
             C 345 -50, 420 5, 410 80
             C 395 160, 320 185, 230 175
             C 150 165, 125 105, 140 45
             C 152 8, 175 -25, 230 -35 Z"
          fill={palette.level1.fill}
          fillOpacity={0.4}
          stroke={palette.level1.stroke}
          strokeWidth={0.9}
          strokeOpacity={0.45}
        />

        {/* Layer 2: Outer contour wave */}
        <Path
          d="M 240 -15
             C 330 -25, 390 15, 380 78
             C 368 140, 310 162, 240 152
             C 178 142, 158 98, 170 52
             C 180 20, 195 -8, 240 -15 Z"
          fill={palette.level2.fill}
          fillOpacity={0.6}
          stroke={palette.level2.stroke}
          strokeWidth={1}
          strokeOpacity={0.6}
        />

        {/* Layer 3: Medium topographic contour */}
        <Path
          d="M 252 6
             C 315 -2, 360 28, 350 75
             C 340 120, 300 138, 252 132
             C 205 125, 192 92, 202 58
             C 208 30, 218 12, 252 6 Z"
          fill={palette.level3.fill}
          fillOpacity={0.75}
          stroke={palette.level3.stroke}
          strokeWidth={1.2}
          strokeOpacity={0.75}
        />

        {/* Layer 4: Inner contour wave around nucleus */}
        <Path
          d="M 262 25
             C 300 18, 330 42, 324 74
             C 318 104, 292 116, 262 112
             C 232 108, 222 88, 228 62
             C 232 40, 238 28, 262 25 Z"
          fill={palette.level4.fill}
          fillOpacity={0.9}
          stroke={palette.level4.stroke}
          strokeWidth={1.2}
          strokeOpacity={0.9}
        />

        {/* Layer 5: Prominent center organic nucleus blob */}
        <Path
          d="M 270 44
             C 294 38, 310 52, 304 74
             C 298 90, 286 98, 270 96
             C 252 94, 246 80, 250 62
             C 254 50, 258 45, 270 44 Z"
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

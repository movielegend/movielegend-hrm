import React from 'react';
import { UnifiedLevelingScreen } from '../../../src/features/leveling/UnifiedLevelingScreen';

export default function AdminLevelsRoute() {
  return <UnifiedLevelingScreen mode="config_only" initialTab="config" />;
}


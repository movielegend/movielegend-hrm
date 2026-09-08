import React from 'react';
import { UnifiedLevelingScreen } from '../../../src/features/leveling/UnifiedLevelingScreen';

export default function AdminMonthlyReviewRoute() {
  return <UnifiedLevelingScreen mode="review_only" initialTab="members" initialLeaderSubTab="pending_requests" />;
}


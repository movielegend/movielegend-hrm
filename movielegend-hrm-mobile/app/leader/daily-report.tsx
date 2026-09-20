import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { PageHeader } from '../../src/components/PageHeader';
import { LeaderDepartmentReportsScreen } from '../../src/features/daily-reports/LeaderDepartmentReportsScreen';
import { DailyReportFormScreen } from '../../src/features/daily-reports/DailyReportFormScreen';

export default function LeaderDailyReportRoute() {
  const [tab, setTab] = useState<'dept' | 'my'>('dept');

  return (
    <Screen>
      <ScreenContainer refreshControl={undefined}>
        <PageHeader
          title="Báo cáo cuối ngày"
          subtitle={tab === 'dept' ? 'Theo dõi báo cáo phòng ban' : 'Báo cáo cá nhân của Leader'}
          showBack={true}
        />
        
        {/* Segmented Control */}
        <View style={styles.segmentContainer}>
          <Pressable
            style={[styles.segmentBtn, tab === 'dept' && styles.segmentBtnActive]}
            onPress={() => setTab('dept')}
          >
            <Text style={[styles.segmentText, tab === 'dept' && styles.segmentTextActive]}>
              Báo cáo phòng ban
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, tab === 'my' && styles.segmentBtnActive]}
            onPress={() => setTab('my')}
          >
            <Text style={[styles.segmentText, tab === 'my' && styles.segmentTextActive]}>
              Báo cáo của tôi
            </Text>
          </Pressable>
        </View>

        {tab === 'dept' ? (
          <LeaderDepartmentReportsScreen />
        ) : (
          <DailyReportFormScreen />
        )}
      </ScreenContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#2563EB',
  },
});

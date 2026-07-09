import { Text, View } from 'react-native';
import { Screen } from '../../../src/components/Screen';
import { PageHeader } from '../../../src/components/PageHeader';

export default function AdminElearningTab() {
  return (
    <Screen>
      <PageHeader title="E-Learning" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Tính năng đang phát triển</Text>
      </View>
    </Screen>
  );
}

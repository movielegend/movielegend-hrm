import { View } from 'react-native';
import { EmployeeProfileScreen } from '../../src/features/employees/EmployeeProfileScreen';
import { BottomNavBar } from '../../src/components/BottomNavBar';

export default function EmployeeProfileRoute() {
  return (
    <View style={{ flex: 1 }}>
      <EmployeeProfileScreen />
      <BottomNavBar activeTab="profile" />
    </View>
  );
}

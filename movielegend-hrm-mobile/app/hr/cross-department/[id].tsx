import { useLocalSearchParams } from 'expo-router';
import { CrossDepartmentDetailScreen } from '../../../src/features/cross-department/CrossDepartmentScreens';

export default function HRCrossDepartmentDetailRoute() {
  return <CrossDepartmentDetailScreen area="hr" />;
}

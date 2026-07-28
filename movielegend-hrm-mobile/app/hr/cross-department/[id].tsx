import { useLocalSearchParams } from 'expo-router';
import { CrossDepartmentRequestDetailScreen } from '../../../src/features/cross-department/CrossDepartmentScreens';

export default function HRCrossDepartmentDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CrossDepartmentRequestDetailScreen requestId={id} />;
}

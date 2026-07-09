import { Screen } from '../../../src/components/Screen';
import { PageHeader } from '../../../src/components/PageHeader';
import { useAuth } from '../../../src/providers/AuthProvider';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { EmployeeProfileScreen } from '../../../src/features/employees/EmployeeProfileScreen';

export default function EmployeeProfileRoute() {
  return <EmployeeProfileScreen />;
}

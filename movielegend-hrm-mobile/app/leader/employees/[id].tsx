import { ErrorState } from '../../../src/components/ErrorState';

export default function LeaderEmployeeDetailRoute() {
  return <ErrorState error={{ message: 'Backend report employee list không trả employee id cho leader detail trong Phase 2.' }} />;
}

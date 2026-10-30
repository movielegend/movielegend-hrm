import { Redirect, useLocalSearchParams } from 'expo-router';

export default function AccountantShiftSwapDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/employee/shift-swaps/${id}` as any} />;
}

import { useLocalSearchParams } from 'expo-router';
import { ChatRoomScreen } from '../../../src/features/chat/ChatScreens';

export default function EmployeeChatRoomRoute() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  return <ChatRoomScreen groupId={id} groupName={name} />;
}

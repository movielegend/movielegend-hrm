import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { PageHeader } from '../../../src/components/PageHeader';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMyChatGroups, clearChatHistory, type ChatGroup } from '../../../src/api/chat.api';
import { chatKeys } from '../../../src/constants/queryKeys';
import Toast from 'react-native-toast-message';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';

export default function ChatListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMyChatGroups();
        setGroups(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const onRefresh = async () => {
    setLoading(true);
    try {
      const data = await fetchMyChatGroups();
      setGroups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLongPress = (item: ChatGroup) => {
    Alert.alert(
      'Xóa lịch sử trò chuyện',
      `Bạn có chắc chắn muốn xóa toàn bộ tin nhắn trong cuộc trò chuyện "${item.name || 'này'}" ở phía bạn không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearChatHistory(item.id);
              Toast.show({
                type: 'success',
                text1: 'Đã xóa lịch sử trò chuyện'
              });
              
              // Xóa cache của tin nhắn trong React Query
              if (queryClient) {
                queryClient.invalidateQueries({ queryKey: chatKeys.messages(item.id) });
              }

              // Refresh the list to reflect any changes if needed
              onRefresh();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Lỗi khi xóa lịch sử trò chuyện'
              });
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: ChatGroup }) => (
    <Pressable 
      style={styles.groupCard} 
      onPress={() => router.push(`/employee/chat/${item.id}?departmentId=${item.departmentId}`)}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(item.name || 'Nhóm chat').charAt(0)}</Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name || 'Nhóm chat'}</Text>
        <Text style={styles.lastMessage}>Nhấn để xem tin nhắn</Text>
      </View>
    </Pressable>
  );

  return (
    <Screen>
      <PageHeader title="Nhóm Chat Phòng ban" />
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Bạn chưa tham gia nhóm chat nào.</Text> : null
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.muted,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.xl,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';

export function BottomNavBar({ activeTab = 'home' }: { activeTab?: 'home' | 'tasks' | 'notifications' | 'profile' }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/admin')} style={styles.item}>
        <Ionicons name="home" size={24} color={activeTab === 'home' ? '#1E88E5' : '#98A0A8'} />
        <Text style={[styles.text, activeTab === 'home' && styles.activeText]}>Làm việc</Text>
      </Pressable>
      
      <Pressable onPress={() => router.push('/admin/tasks')} style={styles.item}>
        <Ionicons name={activeTab === 'tasks' ? "briefcase" : "briefcase-outline"} size={24} color={activeTab === 'tasks' ? '#1E88E5' : '#98A0A8'} />
        <Text style={[styles.text, activeTab === 'tasks' && styles.activeText]}>Giao việc</Text>
      </Pressable>
      
      <Pressable onPress={() => router.push('/admin/notifications')} style={styles.item}>
        <Ionicons name={activeTab === 'notifications' ? "notifications" : "notifications-outline"} size={24} color={activeTab === 'notifications' ? '#1E88E5' : '#98A0A8'} />
        <Text style={[styles.text, activeTab === 'notifications' && styles.activeText]}>Thông báo</Text>
      </Pressable>
      
      <Pressable onPress={() => router.push('/admin/profile')} style={styles.item}>
        <Ionicons name={activeTab === 'profile' ? "person" : "person-outline"} size={24} color={activeTab === 'profile' ? '#1E88E5' : '#98A0A8'} />
        <Text style={[styles.text, activeTab === 'profile' && styles.activeText]}>Tài khoản</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EEF3',
    paddingBottom: 24, // Safe area for iOS
    paddingTop: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  item: {
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '500',
    color: '#98A0A8',
  },
  activeText: {
    fontWeight: '600',
    color: '#1E88E5',
  }
});

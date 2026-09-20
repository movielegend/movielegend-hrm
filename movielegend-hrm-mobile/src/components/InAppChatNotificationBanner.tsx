import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveChat } from '../contexts/ActiveChatContext';
import { useAuth } from '../providers/AuthProvider';
import { Avatar } from './Avatar';
import { markGroupAsRead } from '../api/chat.api';
import { chatKeys } from '../constants/queryKeys';
import { roleBase } from '../utils/notification-routing';
import { Ionicons } from '@expo/vector-icons';

export function InAppChatNotificationBanner() {
  const { activeNotification, hideInAppChatNotification } = useActiveChat();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeNotification) {
      // Vibrate softly on arrival
      try {
        if (Platform.OS !== 'web') {
          Vibration.vibrate(40);
        }
      } catch (e) {
        // ignore
      }

      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -150,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeNotification]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy < -5; // Swipe up
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -20 || gestureState.vy < -0.5) {
          hideInAppChatNotification();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!activeNotification) return null;

  const handlePress = () => {
    const groupId = activeNotification.groupId;
    hideInAppChatNotification();

    if (groupId) {
      markGroupAsRead(groupId)
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: chatKeys.groups() });
          void queryClient.invalidateQueries({ queryKey: chatKeys.allGroups() });
        })
        .catch(() => {});

      const base = roleBase(user);
      router.push(`${base}/chat/${groupId}` as any);
    }
  };

  const isGroup = activeNotification.groupType && activeNotification.groupType !== 'DIRECT';
  const headerTitle = isGroup
    ? (activeNotification.groupName || activeNotification.title)
    : (activeNotification.senderName || activeNotification.title);

  const subText = isGroup && activeNotification.senderName
    ? `${activeNotification.senderName}: ${activeNotification.body}`
    : activeNotification.body;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          top: insets.top + (Platform.OS === 'ios' ? 6 : 10),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={styles.card}
      >
        <View style={styles.avatarContainer}>
          <Avatar
            name={activeNotification.senderName || headerTitle}
            uri={activeNotification.senderAvatarUrl}
            size={42}
          />
          {isGroup && (
            <View style={styles.groupBadge}>
              <Ionicons name="people" size={10} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={1}>
              {headerTitle}
            </Text>
            <Text style={styles.timeAgo}>Vừa xong</Text>
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {subText}
          </Text>
        </View>

        <TouchableOpacity
          onPress={hideInAppChatNotification}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99999,
    elevation: 99999,
  },
  card: {
    backgroundColor: '#0F172A', // Dark modern slate
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  groupBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  timeAgo: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  body: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  closeBtn: {
    marginLeft: 10,
    padding: 4,
  },
});

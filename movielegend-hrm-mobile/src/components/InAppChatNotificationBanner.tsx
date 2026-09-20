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

  let rawTitle = activeNotification.title || '';
  if (rawTitle.startsWith('Tin nhắn mới từ ')) {
    rawTitle = rawTitle.replace(/^Tin nhắn mới từ\s+/, '');
    const matchGroup = rawTitle.match(/^(.*?)\s*\(Nhóm:\s*(.*?)\)$/);
    if (matchGroup) {
      rawTitle = matchGroup[2] || matchGroup[1];
    }
  }

  const isGroup = activeNotification.groupType && activeNotification.groupType !== 'DIRECT';
  const headerTitle = isGroup
    ? (activeNotification.groupName || rawTitle || activeNotification.senderName)
    : (activeNotification.senderName || rawTitle);

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
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.card}
      >
        <View style={styles.appIconWrapper}>
          {activeNotification.senderAvatarUrl ? (
            <Avatar
              name={activeNotification.senderName || headerTitle}
              uri={activeNotification.senderAvatarUrl}
              size={38}
            />
          ) : (
            <View style={styles.messengerIconContainer}>
              <Ionicons name="chatbubble" size={24} color="#0084FF" />
            </View>
          )}
          {isGroup && (
            <View style={styles.groupBadge}>
              <Ionicons name="people" size={9} color="#fff" />
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
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 99999,
    elevation: 99999,
  },
  card: {
    backgroundColor: 'rgba(38, 38, 42, 0.94)', // Exact iOS dark mode notification surface
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  appIconWrapper: {
    position: 'relative',
    marginRight: 12,
    width: 38,
    height: 38,
    borderRadius: 10,
    overflow: 'hidden',
  },
  messengerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#2563EB',
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E22',
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
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  timeAgo: {
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 12.5,
    fontWeight: '400',
  },
  body: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13.5,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});

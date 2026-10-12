import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlossyHeaderBackground } from './common/GlossyHeaderBackground';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  tagline?: string;
  right?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  variant?: 'default' | 'card';
  idPrefix?: string;
}

export function PageHeader({
  title,
  subtitle,
  tagline,
  right,
  showBack = false,
  onBack,
  variant = 'default',
  idPrefix,
}: PageHeaderProps) {
  const router = useRouter();
  const shouldShowBack = showBack || !!onBack;

  const handleBack = () => {
    try {
      if (onBack) {
        onBack();
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/');
    }
  };

  if (variant === 'card') {
    const safePrefix = idPrefix || `hdrCard_${title.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return (
      <View style={styles.cardContainer}>
        <GlossyHeaderBackground idPrefix={safePrefix} />
        <View style={styles.cardContent}>
          {shouldShowBack && (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.cardBackBtn, pressed && { opacity: 0.75 }]}
              accessibilityLabel="Quay lại"
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
            </Pressable>
          )}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTagline}>{tagline || 'MOVIE LEGEND'}</Text>
              <Text style={styles.cardTitle}>{title}</Text>
              {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
            </View>
            {right ? <View style={styles.cardRightWrap}>{right}</View> : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {shouldShowBack && (
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}
          accessibilityLabel="Quay lại"
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#1E293B" />
        </Pressable>
      )}
      <View style={styles.wrap}>
        <View style={styles.copy}>
          {tagline ? <Text style={styles.defaultTagline}>{tagline}</Text> : null}
          <View style={styles.titleRow}>
            <View style={styles.titleAccentBar} />
            <Text style={styles.title}>{title}</Text>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── 1. Default Variant ── */
  container: {
    marginBottom: 14,
    marginTop: 2,
  },
  wrap: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  defaultTagline: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1064EE',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleAccentBar: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#1064EE',
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13.5,
    lineHeight: 19,
    paddingLeft: 14,
  },
  backBtn: {
    marginBottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F0F7',
    borderWidth: 1,
    borderColor: '#D1E1EF',
  },

  /* ── 2. Card Variant (Glossy Banner) ── */
  cardContainer: {
    marginBottom: 16,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardBackBtn: {
    marginBottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardCopy: {
    flex: 1,
    marginRight: 10,
  },
  cardTagline: {
    fontSize: 10.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.72)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
    lineHeight: 18,
  },
  cardRightWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

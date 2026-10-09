import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { NetworkQualityInfo } from '../../../hooks/useNetworkQuality';

interface NetworkQualityWarningModalProps {
  visible: boolean;
  quality: NetworkQualityInfo;
  isRetesting?: boolean;
  onRetest: () => void;
  onProceed: () => void;
  onCancel: () => void;
}

export const NetworkQualityWarningModal: React.FC<NetworkQualityWarningModalProps> = ({
  visible,
  quality,
  isRetesting = false,
  onRetest,
  onProceed,
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top Gaming Accent Header */}
          <View style={styles.badgeHeader}>
            <View style={styles.warningGlowIcon}>
              <MaterialCommunityIcons name="wifi-strength-1-alert" size={32} color="#EF4444" />
            </View>
            <Text style={styles.title}>CẢNH BÁO MẠNG YẾU</Text>
            <Text style={styles.subtitle}>Kết nối không ổn định trước khi vào ca</Text>
          </View>

          {/* Ping Meter Display */}
          <View style={styles.pingMeterContainer}>
            <View style={styles.pingRow}>
              <Text style={styles.pingNumber}>
                {quality.pingMs !== null ? quality.pingMs : '--'}
              </Text>
              <Text style={styles.pingUnit}>ms</Text>
            </View>
            
            <View style={styles.statusPill}>
              <View style={[styles.pulseDot, { backgroundColor: quality.color }]} />
              <Text style={[styles.statusText, { color: quality.color }]}>
                {quality.label.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.connectionLabel}>
              {quality.connectionType}
            </Text>
          </View>

          {/* Explanation info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#D97706" style={{ marginTop: 2, marginRight: 8 }} />
            <Text style={styles.infoText}>
              Độ trễ mạng quá cao có thể khiến ảnh chấm công bị tải chậm hoặc phát sinh lỗi mạng. Bạn nên chuyển sang Wi-Fi khác hoặc bật 4G/5G ổn định hơn.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonGroup}>
            <Pressable
              onPress={onRetest}
              disabled={isRetesting}
              style={[styles.btn, styles.btnRetest]}
            >
              {isRetesting ? (
                <ActivityIndicator size="small" color="#1E293B" />
              ) : (
                <>
                  <MaterialCommunityIcons name="reload" size={18} color="#1E293B" style={{ marginRight: 6 }} />
                  <Text style={styles.btnRetestText}>Kiểm tra lại mạng</Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={onProceed}
              style={[styles.btn, styles.btnProceed]}
            >
              <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnProceedText}>Vẫn tiếp tục chấm công</Text>
            </Pressable>

            <Pressable
              onPress={onCancel}
              style={styles.btnCancel}
            >
              <Text style={styles.btnCancelText}>Hủy bỏ</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  badgeHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  warningGlowIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FECACA',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  pingMeterContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  pingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pingNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: '#EF4444',
    fontVariant: ['tabular-nums'],
  },
  pingUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  connectionLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  btn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRetest: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnRetestText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  btnProceed: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnProceedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnCancel: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
});

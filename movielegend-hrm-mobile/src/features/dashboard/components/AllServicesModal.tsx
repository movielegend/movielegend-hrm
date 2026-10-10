import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  LayoutAnimation,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  X,
  Clock,
  Calendar,
  CalendarDays,
  Users,
  Building2,
  UserCheck,
  MapPin,
  Tv,
  SquareCheck,
  Briefcase,
  MessageSquare,
  FileText,
  FolderOpen,
  Layers,
  FileSpreadsheet,
  Newspaper,
  Receipt,
  CreditCard,
  Coins,
  Crown,
  Trophy,
  Laptop,
  AlertTriangle,
  Warehouse,
  Package,
  Boxes,
  ClipboardCheck,
  Zap,
  Plus,
  Minus,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ArrowRightLeft,
} from 'lucide-react-native';

import {
  APP_REGISTRY,
  APP_CATEGORIES,
  ALL_APPS_LIST,
  CORE_APP_KEYS,
  AppRegistryItem,
  getAppRoute,
} from '../../../constants/app-registry';
import { usePinnedApps } from '../../../hooks/usePinnedApps';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Pre-grouped categories to avoid re-filtering on every render
const CATEGORIZED_APPS = APP_CATEGORIES.map(cat => ({
  ...cat,
  apps: ALL_APPS_LIST.filter(a => a.category === cat.id),
}));

interface AllServicesModalProps {
  visible: boolean;
  onClose: () => void;
  role?: 'ADMIN' | 'LEADER' | 'EMPLOYEE';
  pendingCounts?: {
    pendingRequests?: number;
    dueTasks?: number;
    pendingVault?: number;
  };
  initialEditMode?: boolean;
}

export function renderAppIcon(iconName: string, color: string, size = 22) {
  switch (iconName) {
    case 'Clock': return <Clock size={size} color={color} strokeWidth={2.2} />;
    case 'Calendar': return <Calendar size={size} color={color} strokeWidth={2.2} />;
    case 'CalendarDays': return <CalendarDays size={size} color={color} strokeWidth={2.2} />;
    case 'Users': return <Users size={size} color={color} strokeWidth={2.2} />;
    case 'Building2': return <Building2 size={size} color={color} strokeWidth={2.2} />;
    case 'UserCheck': return <UserCheck size={size} color={color} strokeWidth={2.2} />;
    case 'MapPin': return <MapPin size={size} color={color} strokeWidth={2.2} />;
    case 'Tv': return <Tv size={size} color={color} strokeWidth={2.2} />;
    case 'SquareCheck': return <SquareCheck size={size} color={color} strokeWidth={2.2} />;
    case 'Briefcase': return <Briefcase size={size} color={color} strokeWidth={2.2} />;
    case 'MessageSquare': return <MessageSquare size={size} color={color} strokeWidth={2.2} />;
    case 'FileText': return <FileText size={size} color={color} strokeWidth={2.2} />;
    case 'FolderOpen': return <FolderOpen size={size} color={color} strokeWidth={2.2} />;
    case 'Layers': return <Layers size={size} color={color} strokeWidth={2.2} />;
    case 'FileSpreadsheet': return <FileSpreadsheet size={size} color={color} strokeWidth={2.2} />;
    case 'Newspaper': return <Newspaper size={size} color={color} strokeWidth={2.2} />;
    case 'Receipt': return <Receipt size={size} color={color} strokeWidth={2.2} />;
    case 'CreditCard': return <CreditCard size={size} color={color} strokeWidth={2.2} />;
    case 'Coins': return <Coins size={size} color={color} strokeWidth={2.2} />;
    case 'Crown': return <Crown size={size} color={color} strokeWidth={2.2} />;
    case 'Trophy': return <Trophy size={size} color={color} strokeWidth={2.2} />;
    case 'Laptop': return <Laptop size={size} color={color} strokeWidth={2.2} />;
    case 'AlertTriangle': return <AlertTriangle size={size} color={color} strokeWidth={2.2} />;
    case 'Warehouse': return <Warehouse size={size} color={color} strokeWidth={2.2} />;
    case 'Package': return <Package size={size} color={color} strokeWidth={2.2} />;
    case 'Boxes': return <Boxes size={size} color={color} strokeWidth={2.2} />;
    case 'ClipboardCheck': return <ClipboardCheck size={size} color={color} strokeWidth={2.2} />;
    case 'Zap': return <Zap size={size} color={color} strokeWidth={2.2} />;
    case 'ArrowRightLeft': return <ArrowRightLeft size={size} color={color} strokeWidth={2.2} />;
    default: return <Briefcase size={size} color={color} strokeWidth={2.2} />;
  }
}

// Memoized Service Tile for 60fps fast performance
const ServiceTile = React.memo(function ServiceTile({
  item,
  isPinned,
  isEditMode,
  badgeStr,
  onPress,
}: {
  item: AppRegistryItem;
  isPinned: boolean;
  isEditMode: boolean;
  badgeStr?: string;
  onPress: (item: AppRegistryItem) => void;
}) {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [onPress, item]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.modalTile,
        pressed && { opacity: 0.75 },
        isEditMode && isPinned && styles.modalTilePinnedActive,
      ]}
      onPress={handlePress}
    >
      <View style={styles.modalTileIconWrapper}>
        <View style={[styles.modalTileIconCircle, { backgroundColor: item.bgColor }]}>
          {renderAppIcon(item.icon, item.color, 24)}
        </View>

        {/* Badge count (Normal mode) */}
        {!isEditMode && Boolean(badgeStr) && (
          <View style={styles.modalTileBadge}>
            <Text style={styles.modalTileBadgeText}>{badgeStr}</Text>
          </View>
        )}

        {/* Action badge (Edit mode: + or -) */}
        {isEditMode && (
          <View
            style={[
              styles.actionBadge,
              isPinned ? styles.actionBadgeRemove : styles.actionBadgeAdd,
            ]}
          >
            {isPinned ? (
              <Minus size={12} color="#FFFFFF" strokeWidth={3} />
            ) : (
              <Plus size={12} color="#FFFFFF" strokeWidth={3} />
            )}
          </View>
        )}
      </View>

      <Text style={styles.modalTileText} numberOfLines={1}>
        {item.title}
      </Text>
    </Pressable>
  );
});

// Memoized Pinned Chip in Edit Header
const PinnedChip = React.memo(function PinnedChip({
  appKey,
  onRemove,
}: {
  appKey: string;
  onRemove: (key: string) => void;
}) {
  const app = APP_REGISTRY[appKey];
  if (!app) return null;

  return (
    <View style={styles.pinnedChip}>
      <View style={[styles.pinnedChipIconBox, { backgroundColor: app.bgColor }]}>
        {renderAppIcon(app.icon, app.color, 14)}
      </View>
      <Text style={styles.pinnedChipText} numberOfLines={1}>
        {app.title}
      </Text>
      <Pressable
        hitSlop={8}
        onPress={() => onRemove(appKey)}
        style={styles.removeChipBtn}
      >
        <Minus size={12} color="#EF4444" strokeWidth={3} />
      </Pressable>
    </View>
  );
});

export function AllServicesModal({
  visible,
  onClose,
  role = 'ADMIN',
  pendingCounts = {},
  initialEditMode = false,
}: AllServicesModalProps) {
  const router = useRouter();
  const {
    pinnedKeys,
    updatePinnedApps,
    resetPinnedApps,
    isUpdating,
    isResetting,
  } = usePinnedApps();

  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(pinnedKeys);

  // Sync state when opening
  React.useEffect(() => {
    if (visible) {
      setSelectedKeys(pinnedKeys);
      setIsEditMode(Boolean(initialEditMode));
    }
  }, [visible, pinnedKeys, initialEditMode]);

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const handleTogglePin = useCallback((appKey: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedKeys(prev => {
      if (prev.includes(appKey)) {
        // Tối thiểu 4 app
        if (prev.length <= 4) {
          Toast.show({
            type: 'info',
            text1: 'Tối thiểu 4 ứng dụng',
            text2: 'Trang chủ cần ít nhất 4 ứng dụng. Hãy thêm ứng dụng khác trước khi gỡ!',
          });
          return prev;
        }
        return prev.filter(k => k !== appKey);
      } else {
        // Tối đa 12 app
        if (prev.length >= 12) {
          Toast.show({
            type: 'info',
            text1: 'Đã đạt giới hạn',
            text2: 'Bạn có thể ghim tối đa 12 ứng dụng lên trang chủ',
          });
          return prev;
        }
        return [...prev, appKey];
      }
    });
  }, []);

  const handleSaveEdit = async () => {
    if (selectedKeys.length < 4) {
      Toast.show({
        type: 'error',
        text1: 'Chưa đủ ứng dụng',
        text2: 'Trang chủ cần tối thiểu 4 ứng dụng',
      });
      return;
    }

    try {
      await updatePinnedApps(selectedKeys);
      setIsEditMode(false);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã lưu cài đặt lối tắt trang chủ',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể lưu lối tắt, vui lòng thử lại',
      });
    }
  };

  const handleResetToDefault = async () => {
    try {
      await resetPinnedApps();
      setSelectedKeys([...CORE_APP_KEYS]);
      setIsEditMode(false);
      Toast.show({
        type: 'success',
        text1: 'Đã khôi phục',
        text2: 'Đã đặt lại 4 ứng dụng mặc định ban đầu',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể khôi phục mặc định',
      });
    }
  };

  const handleOpenApp = useCallback((item: AppRegistryItem) => {
    onClose();
    const targetRoute = getAppRoute(item, role);
    if (targetRoute) {
      router.push(targetRoute as any);
    }
  }, [onClose, role, router]);

  const handleTilePress = useCallback((item: AppRegistryItem) => {
    if (isEditMode) {
      handleTogglePin(item.key);
    } else {
      handleOpenApp(item);
    }
  }, [isEditMode, handleTogglePin, handleOpenApp]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalSheetTitle}>
                {isEditMode ? 'Tùy biến Lối tắt Trang chủ' : 'Tất cả dịch vụ hệ thống'}
              </Text>
              <Text style={styles.modalSheetSubtitle}>
                {isEditMode
                  ? `Đang chọn ${selectedKeys.length} ứng dụng (Tối thiểu 4)`
                  : 'Toàn bộ nghiệp vụ & tính năng vận hành'}
              </Text>
            </View>

            <View style={styles.headerActions}>
              {!isEditMode ? (
                <Pressable
                  style={styles.editToggleBtn}
                  onPress={() => setIsEditMode(true)}
                >
                  <SlidersHorizontal size={16} color="#2563EB" strokeWidth={2.2} />
                  <Text style={styles.editToggleText}>Tùy chỉnh</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.saveBtn}
                  onPress={handleSaveEdit}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.saveBtnText}>Lưu</Text>
                    </>
                  )}
                </Pressable>
              )}

              <Pressable style={styles.modalCloseBtn} onPress={onClose}>
                <X size={20} color="#64748B" strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 36 }}
          >
            {/* Thanh trạng thái các app đang ghim khi ở chế độ tùy chỉnh */}
            {isEditMode && (
              <View style={styles.editSummaryBox}>
                <View style={styles.editSummaryHeader}>
                  <Text style={styles.editSummaryTitle}>
                    ỨNG DỤNG ĐÃ GHIM TRÊN TRANG CHỦ ({selectedKeys.length})
                  </Text>
                  <Pressable
                    style={styles.resetBtn}
                    onPress={handleResetToDefault}
                    disabled={isResetting}
                  >
                    <RotateCcw size={13} color="#64748B" />
                    <Text style={styles.resetBtnText}>Mặc định</Text>
                  </Pressable>
                </View>

                {/* Danh sách chip app đã ghim */}
                <View style={styles.pinnedChipsContainer}>
                  {selectedKeys.map(key => (
                    <PinnedChip
                      key={key}
                      appKey={key}
                      onRemove={handleTogglePin}
                    />
                  ))}
                </View>

                <Text style={styles.editSummaryHint}>
                  💡 Trang chủ cần tối thiểu 4 ứng dụng (hàng 1). Bạn có thể ghim thêm bất kỳ ứng dụng nào hoặc đổi 4 ứng dụng mặc định ban đầu.
                </Text>
              </View>
            )}

            {/* Render danh mục đã pre-grouped */}
            {CATEGORIZED_APPS.map(category => (
              <View key={category.id} style={styles.drawerSection}>
                <Text style={styles.drawerSectionHeader}>{category.label}</Text>
                <View style={styles.modalServiceGrid}>
                  {category.apps.map(item => {
                    const isPinned = selectedKeySet.has(item.key);
                    const badgeStr = !isEditMode && item.badgeKey && pendingCounts[item.badgeKey]
                      ? String(pendingCounts[item.badgeKey])
                      : undefined;

                    return (
                      <ServiceTile
                        key={item.key}
                        item={item}
                        isPinned={isPinned}
                        isEditMode={isEditMode}
                        badgeStr={badgeStr}
                        onPress={handleTilePress}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    minHeight: '60%',
    paddingHorizontal: 20,
    paddingTop: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  modalSheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Edit Summary Box
  editSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  editSummaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  pinnedChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  pinnedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  pinnedChipIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: 90,
  },
  removeChipBtn: {
    padding: 2,
  },
  editSummaryHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },

  // Category Sections
  drawerSection: {
    marginBottom: 20,
  },
  drawerSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  modalServiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  modalTile: {
    width: (SCREEN_WIDTH - 40 - 16) / 3,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    marginHorizontal: 2,
    marginBottom: 8,
  },
  modalTilePinnedActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  modalTileIconWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  modalTileIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTileBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  modalTileBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  actionBadgeAdd: {
    backgroundColor: '#10B981',
  },
  actionBadgeRemove: {
    backgroundColor: '#EF4444',
  },
  modalTileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
});

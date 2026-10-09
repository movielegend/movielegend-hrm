import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ImageView from '../../../components/ImageViewer/ImageViewer';
import { CustomAlert } from '../../../components/CustomAlert';
import {
  getDepartmentPayslipBatch,
  assignDepartmentPayslipImage,
  unassignDepartmentPayslipImage,
  DepartmentPayslipBatchResponse,
  DepartmentBatchImage,
} from '../../../api/payroll.api';

interface Props {
  visible: boolean;
  onClose: () => void;
  month: number;
  year: number;
  departmentId?: string;
  onAssigned: () => void;
}

export function DepartmentLabelingModal({
  visible,
  onClose,
  month,
  year,
  departmentId,
  onAssigned,
}: Props) {
  const [batchData, setBatchData] = useState<DepartmentPayslipBatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('UNASSIGNED');

  const loadBatch = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getDepartmentPayslipBatch({
        departmentId,
        month,
        year,
      });
      setBatchData(data);
    } catch (err: any) {
      CustomAlert.alert('Thông báo', err.message || 'Không thể tải lô ảnh phòng ban');
    } finally {
      setIsLoading(false);
    }
  }, [departmentId, month, year]);

  useEffect(() => {
    if (visible) {
      loadBatch();
      setSelectedImageIndex(0);
    }
  }, [visible, loadBatch]);

  const allImages: DepartmentBatchImage[] = React.useMemo(() => {
    if (!batchData) return [];
    if (filterMode === 'UNASSIGNED') {
      return batchData.unassignedImages;
    }
    if (filterMode === 'ASSIGNED') {
      return batchData.assignedImages;
    }
    return [...batchData.unassignedImages, ...batchData.assignedImages];
  }, [batchData, filterMode]);

  const currentImage: DepartmentBatchImage | undefined = allImages[selectedImageIndex];

  const handleAssignToUser = async (targetUserId: string, targetUserName: string) => {
    if (!currentImage || !batchData) return;
    try {
      setIsAssigning(true);
      await assignDepartmentPayslipImage({
        departmentId: batchData.departmentId,
        month,
        year,
        imageId: currentImage.id,
        targetUserId,
      });

      CustomAlert.alert(
        'Đã gán nhãn ✓',
        `Đã gán ảnh phiếu lương cho ${targetUserName} thành công!`
      );

      onAssigned();
      await loadBatch();

      // Nếu đang ở filter UNASSIGNED và còn ảnh, giữ nguyên index hoặc chọn ảnh tiếp theo
      if (selectedImageIndex >= allImages.length - 1 && selectedImageIndex > 0) {
        setSelectedImageIndex((prev) => prev - 1);
      }
    } catch (err: any) {
      CustomAlert.alert('Lỗi gán nhãn', err.message || 'Không thể gán ảnh phiếu lương');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async (imageId: string) => {
    if (!batchData) return;
    try {
      setIsAssigning(true);
      await unassignDepartmentPayslipImage({
        departmentId: batchData.departmentId,
        month,
        year,
        imageId,
      });

      CustomAlert.alert('Thành công', 'Đã hủy gán ảnh phiếu lương!');
      onAssigned();
      await loadBatch();
    } catch (err: any) {
      CustomAlert.alert('Lỗi', err.message || 'Không thể hủy gán ảnh');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredEmployees = React.useMemo(() => {
    if (!batchData) return [];
    const q = searchEmployee.toLowerCase().trim();
    if (!q) return batchData.employees;
    return batchData.employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.userCode.toLowerCase().includes(q) ||
        e.positionName.toLowerCase().includes(q)
    );
  }, [batchData, searchEmployee]);

  const totalAssignedCount = batchData?.assignedImages.length || 0;
  const totalImagesCount = batchData?.totalImages || 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.containerCard}>
          {/* 1. Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="label-multiple" size={20} color="#059669" />
                <Text style={styles.headerTitle}>
                  Gán phiếu lương: {batchData?.departmentName || 'Phòng ban'}
                </Text>
              </View>
              <Text style={styles.headerSub}>
                Tháng {month}/{year} • Đã gán {totalAssignedCount}/{totalImagesCount} ảnh
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Đang tải lô ảnh phòng ban...</Text>
            </View>
          ) : totalImagesCount === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="image-off-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Chưa có ảnh nào được tải lên</Text>
              <Text style={styles.emptySub}>
                Kế toán lương chưa tải lô ảnh phiếu lương tháng {month}/{year} cho phòng ban này.
              </Text>
              <Pressable style={styles.emptyCloseBtn} onPress={onClose}>
                <Text style={styles.emptyCloseBtnText}>Đóng</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* 2. Filter tabs: Chưa gán vs Đã gán */}
              <View style={styles.filterTabBar}>
                <Pressable
                  style={[styles.filterTabItem, filterMode === 'UNASSIGNED' && styles.filterTabItemActive]}
                  onPress={() => {
                    setFilterMode('UNASSIGNED');
                    setSelectedImageIndex(0);
                  }}
                >
                  <Text style={[styles.filterTabText, filterMode === 'UNASSIGNED' && styles.filterTabTextActive]}>
                    Chưa gán ({batchData?.unassignedImages.length || 0})
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.filterTabItem, filterMode === 'ASSIGNED' && styles.filterTabItemActive]}
                  onPress={() => {
                    setFilterMode('ASSIGNED');
                    setSelectedImageIndex(0);
                  }}
                >
                  <Text style={[styles.filterTabText, filterMode === 'ASSIGNED' && styles.filterTabTextActive]}>
                    Đã gán ({batchData?.assignedImages.length || 0})
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.filterTabItem, filterMode === 'ALL' && styles.filterTabItemActive]}
                  onPress={() => {
                    setFilterMode('ALL');
                    setSelectedImageIndex(0);
                  }}
                >
                  <Text style={[styles.filterTabText, filterMode === 'ALL' && styles.filterTabTextActive]}>
                    Tất cả ({totalImagesCount})
                  </Text>
                </Pressable>
              </View>

              {/* 3. Current Focus Image Card */}
              {allImages.length > 0 && currentImage ? (
                <View style={styles.focusImageSection}>
                  <View style={styles.focusNavRow}>
                    <Pressable
                      style={[styles.navArrowBtn, selectedImageIndex === 0 && styles.navArrowBtnDisabled]}
                      onPress={() => setSelectedImageIndex((prev) => Math.max(0, prev - 1))}
                      disabled={selectedImageIndex === 0}
                    >
                      <MaterialCommunityIcons name="chevron-left" size={20} color="#334155" />
                    </Pressable>

                    <Text style={styles.imageIndexText}>
                      Ảnh {selectedImageIndex + 1} / {allImages.length}
                    </Text>

                    <Pressable
                      style={[
                        styles.navArrowBtn,
                        selectedImageIndex >= allImages.length - 1 && styles.navArrowBtnDisabled,
                      ]}
                      onPress={() =>
                        setSelectedImageIndex((prev) => Math.min(allImages.length - 1, prev + 1))
                      }
                      disabled={selectedImageIndex >= allImages.length - 1}
                    >
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#334155" />
                    </Pressable>
                  </View>

                  {/* Image Display */}
                  <Pressable
                    style={styles.mainImageCard}
                    onPress={() => setIsImageViewerVisible(true)}
                  >
                    <Image
                      source={{ uri: currentImage.imageUrl }}
                      style={styles.mainImage}
                      resizeMode="contain"
                    />
                    <View style={styles.zoomHintBadge}>
                      <MaterialCommunityIcons name="magnify-plus-outline" size={14} color="#fff" />
                      <Text style={styles.zoomHintText}>Bấm để phóng to xem rõ tên</Text>
                    </View>
                  </Pressable>

                  {/* Trạng thái gán của ảnh này */}
                  {currentImage.assignedUserId ? (
                    <View style={styles.assignedStatusRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <MaterialCommunityIcons name="check-decagram" size={18} color="#059669" />
                        <Text style={styles.assignedUserLabel} numberOfLines={1}>
                          Đã gán: <Text style={{ fontWeight: '800' }}>{currentImage.assignedUserName || 'Nhân sự'}</Text>
                        </Text>
                      </View>
                      <Pressable
                        style={styles.unassignBtn}
                        onPress={() => handleUnassign(currentImage.id)}
                        disabled={isAssigning}
                      >
                        <MaterialCommunityIcons name="link-off" size={14} color="#EF4444" />
                        <Text style={styles.unassignBtnText}>Hủy gán</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.unassignedNoticeRow}>
                      <MaterialCommunityIcons name="hand-pointing-down" size={16} color="#D97706" />
                      <Text style={styles.unassignedNoticeText}>
                        Chọn 1 nhân viên bên dưới để gán ảnh này
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noFilterImageBox}>
                  <Text style={styles.noFilterImageText}>Không có ảnh nào trong mục này</Text>
                </View>
              )}

              {/* 4. Employee Picker List */}
              <View style={styles.employeeSection}>
                <View style={styles.searchBar}>
                  <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm tên nhân viên, mã NV..."
                    placeholderTextColor="#94A3B8"
                    value={searchEmployee}
                    onChangeText={setSearchEmployee}
                  />
                  {searchEmployee ? (
                    <Pressable onPress={() => setSearchEmployee('')} hitSlop={6}>
                      <MaterialCommunityIcons name="close-circle" size={16} color="#94A3B8" />
                    </Pressable>
                  ) : null}
                </View>

                <ScrollView style={styles.employeeList} showsVerticalScrollIndicator={false}>
                  {filteredEmployees.map((emp) => {
                    const isAssignedToThisImage =
                      currentImage?.assignedUserId === emp.userId;
                    return (
                      <View
                        key={emp.userId}
                        style={[
                          styles.empRowCard,
                          isAssignedToThisImage && styles.empRowCardCurrent,
                        ]}
                      >
                        <View style={styles.empAvatar}>
                          <Text style={styles.empAvatarText}>
                            {emp.fullName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.empName}>{emp.fullName}</Text>
                          <Text style={styles.empSub}>
                            {emp.userCode} • {emp.positionName}
                          </Text>
                        </View>

                        {isAssignedToThisImage ? (
                          <View style={styles.activeBadge}>
                            <MaterialCommunityIcons name="check" size={14} color="#059669" />
                            <Text style={styles.activeBadgeText}>Ảnh hiện tại</Text>
                          </View>
                        ) : (
                          <Pressable
                            style={[
                              styles.assignActionBtn,
                              isAssigning && styles.assignActionBtnDisabled,
                            ]}
                            onPress={() => handleAssignToUser(emp.userId, emp.fullName)}
                            disabled={isAssigning || !currentImage}
                          >
                            <MaterialCommunityIcons
                              name="account-check"
                              size={15}
                              color="#FFFFFF"
                            />
                            <Text style={styles.assignActionBtnText}>Gán vào đây</Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Image Fullscreen Viewer */}
          {allImages.length > 0 && (
            <ImageView
              images={allImages.map((img) => ({ uri: img.imageUrl }))}
              imageIndex={selectedImageIndex}
              visible={isImageViewerVisible}
              onRequestClose={() => setIsImageViewerVisible(false)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  containerCard: {
    width: '100%',
    height: '92%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  emptyCloseBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#059669',
    borderRadius: 10,
  },
  emptyCloseBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  filterTabBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  filterTabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterTabItemActive: {
    backgroundColor: '#ECFDF5',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  focusImageSection: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  focusNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navArrowBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 4,
  },
  navArrowBtnDisabled: {
    opacity: 0.3,
  },
  imageIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  mainImageCard: {
    height: 180,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  zoomHintBadge: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoomHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  assignedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  assignedUserLabel: {
    fontSize: 12,
    color: '#047857',
  },
  unassignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unassignBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  unassignedNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  unassignedNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  noFilterImageBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noFilterImageText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  employeeSection: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  employeeList: {
    flex: 1,
  },
  empRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  empRowCardCurrent: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  empAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  empName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  empSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  assignActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assignActionBtnDisabled: {
    opacity: 0.5,
  },
  assignActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});

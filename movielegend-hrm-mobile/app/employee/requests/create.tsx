import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppAlert } from '../../../src/contexts/AlertContext';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Modal, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { requestCameraPermissionWithFallback } from '../../../src/utils/mediaPermissions';
import { Screen } from '../../../src/components/Screen';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';
import { createEmployeeRequest } from '../../../src/api/employee-requests.api';
import type { EmployeeRequestType } from '../../../src/types/request.types';
import { useAuth } from '../../../src/providers/AuthProvider';
import { getShifts } from '../../../src/api/shifts.api';
import type { Shift } from '../../../src/types/shift.types';
import { getScopedEmployees } from '../../../src/api/employees.api';
import { getDepartment } from '../../../src/api/departments.api';
import type { EmployeeUser } from '../../../src/types/employee.types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { uploadFile } from '../../../src/api/uploads.api';

const REQUEST_TYPES: { type: EmployeeRequestType, label: string, icon: keyof typeof MaterialCommunityIcons.glyphMap, color: string }[] = [
  { type: 'LEAVE', label: 'Nghỉ phép', icon: 'umbrella-outline', color: '#1B382B' },
  { type: 'ATTENDANCE_ADJUSTMENT', label: 'Giải trình\ncông', icon: 'file-document-outline', color: '#1B382B' },
  { type: 'LATE_ARRIVAL', label: 'Đi muộn', icon: 'clock-outline', color: '#1B382B' },
  { type: 'EARLY_LEAVE', label: 'Về sớm', icon: 'exit-to-app', color: '#1B382B' },
  { type: 'OVERTIME', label: 'Làm thêm\ngiờ', icon: 'clock-plus-outline', color: '#1B382B' },
  { type: 'ADVANCE', label: 'Tạm ứng', icon: 'database-outline', color: '#1B382B' },
  { type: 'EXPENSE', label: 'Thanh toán', icon: 'credit-card-outline', color: '#1B382B' },
  { type: 'OTHER', label: 'Khác', icon: 'dots-horizontal', color: '#1B382B' },
];

function normalizeSearchText(str?: string | null): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export default function CreateRequestScreen() {
  const { showAlert } = useAppAlert();
  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const userFullName = user?.fullName || (user as any)?.profile?.fullName || 'Admin Movie Legend';
  const userInitials = React.useMemo(() => {
    const trimmed = (userFullName || '').trim();
    if (!trimmed) return 'AD';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      if (parts[0].toLowerCase() === 'admin') return 'AD';
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }, [userFullName]);

  const [selectedType, setSelectedType] = useState<EmployeeRequestType>('ATTENDANCE_ADJUSTMENT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [amount, setAmount] = useState('');
  
  // Specific fields for Late/Early Leave
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Specific fields for Leave & Explanation
  const [leaveDurationType, setLeaveDurationType] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [explanationType, setExplanationType] = useState('');
  const [handoverEmployee, setHandoverEmployee] = useState<EmployeeUser | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(new Date());
  const [toDate, setToDate] = useState<Date | null>(null);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);

  // Modal states
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState<'start' | 'end' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | 'single' | null>(null);
  const [showLeaveDurationModal, setShowLeaveDurationModal] = useState(false);
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [showExplanationTypeModal, setShowExplanationTypeModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [isFullScreenPhoto, setIsFullScreenPhoto] = useState(false);
  const [apiShifts, setApiShifts] = useState<Shift[]>([]);
  const [apiEmployees, setApiEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

  const leaveDurationTypes = ["1/4 ngày", "1/2 ngày", "3/4 ngày", "Trong ngày", "Nhiều ngày", "Theo giờ"];
  const leaveTypes = ["Nghỉ phép năm", "Nghỉ ốm", "Nghỉ không lương", "Thai sản", "Khác"];
  const explanationTypes = ["Quên Check-in", "Quên Check-out", "Quên cả In & Out", "Lỗi hệ thống/máy chấm công", "Đi công tác/Làm việc bên ngoài"];

  const reasonRef = React.useRef<TextInput>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLeave = selectedType === 'LEAVE';
  const isExplanation = selectedType === 'ATTENDANCE_ADJUSTMENT';
  const isOvertime = selectedType === 'OVERTIME';
  const isLateOrEarly = selectedType === 'LATE_ARRIVAL' || selectedType === 'EARLY_LEAVE';
  const isFinancial = selectedType === 'ADVANCE' || selectedType === 'EXPENSE' || selectedType === 'PURCHASE';

  const userDeptId = user?.department?.id || (user as any)?.departmentId;
  const userDeptName = user?.department?.name || (user as any)?.departmentName || '';

  const fetchEmployeesList = useCallback(async () => {
    try {
      setIsLoadingEmployees(true);
      const currentDeptId = user?.department?.id || (user as any)?.departmentId;
      const res = await getScopedEmployees({
        page: 1,
        limit: 100,
        ...(currentDeptId ? { departmentId: currentDeptId } : {}),
      });
      const rawList = res?.items || (Array.isArray(res) ? res : []);
      // BẮT BUỘC: Chỉ lấy đúng nhân sự thuộc phòng ban của người tạo đơn
      const validList = rawList.filter((e: any) => {
        if (!currentDeptId) return true;
        const empDeptId = e.department?.id || e.departmentId || e.departmentLinks?.[0]?.departmentId;
        return empDeptId === currentDeptId;
      });
      setApiEmployees(validList);
    } catch (err) {
      console.log('Error fetching scoped employees:', err);
      setApiEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [user?.id, user?.department?.id, (user as any)?.departmentId]);

  React.useEffect(() => {
    if (isLateOrEarly || isExplanation || isOvertime) {
      getShifts()
        .then(setApiShifts)
        .catch(err => console.log('Error fetching shifts', err));
    }
    void fetchEmployeesList();
  }, [isLateOrEarly, isLeave, isExplanation, isOvertime, fetchEmployeesList]);



  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermissionWithFallback();
    if (!hasPermission) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimeModal(null); // Hide picker on Android
    }
    
    if (event.type === 'dismissed') {
      return; // User cancelled, do not update time
    }
    
    if (selectedDate) {
      if (showTimeModal === 'start') setStartTime(selectedDate);
      if (showTimeModal === 'end') setEndTime(selectedDate);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(null);
    if (event.type === 'dismissed') return;
    
    if (selectedDate) {
      if (Platform.OS === 'ios') {
        setTempSelectedDate(selectedDate);
      } else {
        if (showDatePicker === 'from' || showDatePicker === 'single') {
          setFromDate(selectedDate);
        } else if (showDatePicker === 'to') {
          setToDate(selectedDate);
        }
      }
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSelectShift = (selectedShift: Shift) => {
    setShift(selectedShift);
    setShowShiftModal(false);
  };

  const handleSubmit = async () => {
    let generatedTitle = title.trim();

    if (!generatedTitle) {
      const typeConfig = REQUEST_TYPES.find(t => t.type === selectedType);
      const typeLabel = typeConfig ? typeConfig.label : 'Yêu cầu';
      const dateStr = fromDate ? formatDate(fromDate) : new Date().toLocaleDateString('vi-VN');
      
      if (isExplanation && explanationType) {
        generatedTitle = `Giải trình: ${explanationType} - ${dateStr}`;
      } else if (isLeave && leaveType) {
        generatedTitle = `Nghỉ phép: ${leaveType} - ${dateStr}`;
      } else if (isOvertime) {
        generatedTitle = `Làm thêm giờ - ${dateStr}`;
      } else if (isLateOrEarly) {
        generatedTitle = `${typeLabel} - ${dateStr}`;
      } else if (isFinancial) {
        generatedTitle = `${typeLabel} - ${amount ? Number(amount).toLocaleString('vi-VN') + ' VNĐ' : ''}`;
      } else {
        generatedTitle = `${typeLabel} - ${dateStr}`;
      }
    }

    if (!content.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập Lý do/Nội dung chi tiết.');
      return;
    }
    if (isFinancial && !amount.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập Số tiền cho loại đơn này.');
      return;
    }
    if (isLeave) {
      if (!leaveDurationType || !leaveType || !fromDate) {
        showAlert('Lỗi', 'Vui lòng nhập đầy đủ thông tin Loại nghỉ, Ngày nghỉ');
        return;
      }
      if (leaveDurationType === 'Nhiều ngày' && !toDate) {
        showAlert('Lỗi', 'Vui lòng chọn Ngày kết thúc');
        return;
      }
    }
    if (isLateOrEarly) {
      if (!shift) {
        showAlert('Lỗi', 'Vui lòng Chọn ca làm.');
        return;
      }
      if (selectedType === 'LATE_ARRIVAL' && !startTime) {
        showAlert('Lỗi', 'Vui lòng nhập Giờ bắt đầu.');
        return;
      }
      if (selectedType === 'EARLY_LEAVE' && !endTime) {
        showAlert('Lỗi', 'Vui lòng nhập Giờ kết thúc.');
        return;
      }
      
      if (selectedType === 'LATE_ARRIVAL' && fromDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lateDate = new Date(fromDate);
        lateDate.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - lateDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 2) {
          showAlert('Lỗi', 'Chỉ được phép tạo đơn đi muộn trong vòng 2 ngày kể từ ngày vi phạm. Đơn của bạn đã quá hạn.');
          return;
        }
      }
    }
    if (isOvertime) {
      if (!fromDate || !startTime || !endTime) {
        showAlert('Lỗi', 'Vui lòng nhập đầy đủ Ngày làm thêm, Từ giờ, Đến giờ');
        return;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const otDate = new Date(fromDate);
      otDate.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - otDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 3) {
        showAlert('Lỗi', 'Chỉ được phép tạo đơn làm thêm giờ (OT) trong vòng 3 ngày kể từ ngày OT. Đơn của bạn đã quá hạn.');
        return;
      }
    }
    if (selectedType === 'EXPENSE' || selectedType === 'PURCHASE') {
      if (!photoUri) {
        showAlert('Lỗi', 'Vui lòng đính kèm ảnh minh chứng (Hóa đơn/Chứng từ).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let uploadedUrl = null;
      if (photoUri) {
        try {
          const res = await uploadFile({
            uri: photoUri,
            name: `request_proof_${Date.now()}.jpg`,
            mimeType: 'image/jpeg',
            purpose: 'EMPLOYEE_DOCUMENT'
          });
          uploadedUrl = res.fileUrl;
        } catch (uploadErr) {
          console.log('Upload error', uploadErr);
          showAlert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
          setIsSubmitting(false);
          return;
        }
      }

      const attachmentMetadata = {
        ...(uploadedUrl ? { image: uploadedUrl } : {}),
        ...(fromDate ? { fromDate: fromDate.toISOString() } : {}),
        ...(toDate ? { toDate: toDate.toISOString() } : {}),
        ...(startTime ? { startTime: startTime.toISOString() } : {}),
        ...(endTime ? { endTime: endTime.toISOString() } : {}),
        ...(shift ? { shiftName: shift.name, shiftId: shift.id } : {}),
        ...(explanationType ? { explanationType } : {}),
        ...(leaveType ? { leaveType } : {}),
        ...(leaveDurationType ? { leaveDurationType } : {}),
        ...(handoverEmployee ? {
          handoverEmployee: (handoverEmployee as any).fullName || (handoverEmployee as any).profile?.fullName || (handoverEmployee as any).userCode || 'Nhân sự',
          handoverUserId: handoverEmployee.id
        } : {}),
      };

      await createEmployeeRequest({
        type: selectedType,
        title: generatedTitle,
        content: content.trim(),
        ...(isFinancial && amount ? { amount: Number(amount) } : {}),
        ...(Object.keys(attachmentMetadata).length > 0 ? { attachmentMetadata } : {})
      });
      
      showAlert('Thành công', 'Đã gửi đơn thành công!');
      router.back();
    } catch (e: any) {
      console.log('API Error:', JSON.stringify(e.response?.data, null, 2) || e.message);
      const errorMsg = e.response?.data?.error?.message || e.response?.data?.message || e.message || 'Có lỗi xảy ra khi gửi đơn.';
      showAlert('Lỗi', Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#F8FAFC' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#F8FAFC' }}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0F172A" />
          </Pressable>
          <Text style={styles.topBarTitle}>MOVIE LEGEND</Text>
          <View style={styles.topAvatarCircle}>
            <Text style={styles.topAvatarText}>{userInitials}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Section */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Tạo đơn mới</Text>
          <Text style={styles.screenSubtitle}>Gửi yêu cầu của bạn trong vài bước.</Text>
        </View>

        {/* 01 CHỌN LOẠI ĐƠN */}
        <View style={styles.sectionHeadingWrap}>
          <Text style={styles.sectionNumber}>01</Text>
          <Text style={styles.sectionHeadingTitle}>CHỌN LOẠI ĐƠN</Text>
        </View>

        <View style={styles.gridCard}>
          <View style={styles.gridRowWrap}>
            {REQUEST_TYPES.map((t) => {
              const isSelected = selectedType === t.type;
              return (
                <Pressable
                  key={t.type}
                  style={styles.gridCol}
                  onPress={() => setSelectedType(t.type)}
                >
                  <View style={[styles.gridIconBox, isSelected && styles.gridIconBoxActive]}>
                    <MaterialCommunityIcons
                      name={t.icon}
                      size={24}
                      color={isSelected ? '#FFFFFF' : '#334155'}
                    />
                  </View>
                  <Text
                    style={[styles.gridColLabel, isSelected && styles.gridColLabelActive]}
                    numberOfLines={2}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 02 THÔNG TIN ĐƠN */}
        <View style={[styles.sectionHeadingWrap, { marginTop: 22 }]}>
          <Text style={styles.sectionNumber}>02</Text>
          <Text style={styles.sectionHeadingTitle}>THÔNG TIN ĐƠN</Text>
        </View>

        <View style={styles.formCard}>
          {/* User Profile Header */}
          <View style={styles.userRow}>
            <View style={styles.userAvatarCircle}>
              <Text style={styles.userAvatarText}>{userInitials}</Text>
            </View>
            <View style={styles.userTextCol}>
              <Text style={styles.userLabelText}>Người tạo đơn</Text>
              <Text style={styles.userNameText}>{userFullName}</Text>
            </View>
          </View>

          <View style={styles.formDivider} />

          {/* Form Fields by Type */}
          {isExplanation ? (
            <>
              {/* Ngày áp dụng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Ngày áp dụng <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowDatePicker('single')}>
                  <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                    {fromDate ? formatDate(fromDate) : 'Chọn ngày áp dụng'}
                  </Text>
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                </Pressable>
              </View>

              {/* Ca làm việc */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Ca làm việc <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowShiftModal(true)}>
                  <Text style={[styles.inputText, !shift && styles.inputPlaceholder]}>
                    {shift ? shift.name : 'Chọn ca làm việc'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                </Pressable>
              </View>

              {/* Loại giải trình */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Loại giải trình <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowExplanationTypeModal(true)}>
                  <Text style={[styles.inputText, !explanationType && styles.inputPlaceholder]}>
                    {explanationType || 'Chọn loại giải trình'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                </Pressable>
              </View>

              {/* Giờ vào thực tế */}
              {['Quên Check-in', 'Quên cả In & Out'].includes(explanationType) && (
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>
                    Giờ vào thực tế <Text style={styles.required}>*</Text>
                  </Text>
                  <Pressable style={styles.inputBox} onPress={() => setShowTimeModal('start')}>
                    <Text style={[styles.inputText, !startTime && styles.inputPlaceholder]}>
                      {startTime ? formatTime(startTime) : 'Chọn giờ vào thực tế'}
                    </Text>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                  </Pressable>
                </View>
              )}

              {/* Giờ ra thực tế */}
              {['Quên Check-out', 'Quên cả In & Out'].includes(explanationType) && (
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>
                    Giờ ra thực tế <Text style={styles.required}>*</Text>
                  </Text>
                  <Pressable style={styles.inputBox} onPress={() => setShowTimeModal('end')}>
                    <Text style={[styles.inputText, !endTime && styles.inputPlaceholder]}>
                      {endTime ? formatTime(endTime) : 'Chọn giờ ra thực tế'}
                    </Text>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                  </Pressable>
                </View>
              )}

              {/* Lý do chi tiết */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Lý do chi tiết <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.textAreaBox}>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder="Nhập nội dung giải trình..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    maxLength={500}
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                  />
                  <Text style={styles.counterText}>{content.length}/500</Text>
                </View>
              </View>

              {/* Chụp ảnh minh chứng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Ảnh minh chứng (Tùy chọn)</Text>
                <Pressable style={styles.photoButton} onPress={handleTakePhoto}>
                  <MaterialCommunityIcons 
                    name={photoUri ? "check-circle" : "camera-outline"} 
                    size={20} 
                    color={photoUri ? "#10B981" : "#475569"} 
                  />
                  <Text style={[styles.photoButtonText, photoUri && styles.photoButtonTextSuccess]}>
                    {photoUri ? 'Đã chụp ảnh minh chứng' : 'Chụp ảnh minh chứng'}
                  </Text>
                </Pressable>
                {photoUri && (
                  <View style={styles.photoPreviewWrap}>
                    <TouchableOpacity onPress={() => setIsFullScreenPhoto(true)} style={{ width: '100%', height: '100%' }}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                      <MaterialCommunityIcons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          ) : isLeave ? (
            <>
              {/* Hình thức nghỉ */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Hình thức nghỉ <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowLeaveDurationModal(true)}>
                  <Text style={[styles.inputText, !leaveDurationType && styles.inputPlaceholder]}>
                    {leaveDurationType || 'Chọn hình thức nghỉ'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                </Pressable>
              </View>

              {/* Loại nghỉ phép */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Loại nghỉ phép <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowLeaveTypeModal(true)}>
                  <Text style={[styles.inputText, !leaveType && styles.inputPlaceholder]}>
                    {leaveType || 'Chọn loại nghỉ phép'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                </Pressable>
              </View>

              {/* Dynamic Date/Time Fields */}
              {leaveDurationType === 'Nhiều ngày' ? (
                <>
                  <View style={styles.formItem}>
                    <Text style={styles.formLabel}>
                      Từ ngày <Text style={styles.required}>*</Text>
                    </Text>
                    <Pressable style={styles.inputBox} onPress={() => setShowDatePicker('from')}>
                      <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                        {fromDate ? formatDate(fromDate) : 'Chọn từ ngày'}
                      </Text>
                      <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                    </Pressable>
                  </View>

                  <View style={styles.formItem}>
                    <Text style={styles.formLabel}>
                      Đến ngày <Text style={styles.required}>*</Text>
                    </Text>
                    <Pressable style={styles.inputBox} onPress={() => setShowDatePicker('to')}>
                      <Text style={[styles.inputText, !toDate && styles.inputPlaceholder]}>
                        {toDate ? formatDate(toDate) : 'Chọn đến ngày'}
                      </Text>
                      <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                    </Pressable>
                  </View>
                </>
              ) : ['Theo giờ', '1/4 ngày', '1/2 ngày', '3/4 ngày'].includes(leaveDurationType) ? (
                <>
                  <View style={styles.formItem}>
                    <Text style={styles.formLabel}>
                      Ngày nghỉ <Text style={styles.required}>*</Text>
                    </Text>
                    <Pressable style={styles.inputBox} onPress={() => setShowDatePicker('single')}>
                      <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                        {fromDate ? formatDate(fromDate) : 'Chọn ngày'}
                      </Text>
                      <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                    </Pressable>
                  </View>

                  <View style={styles.formItem}>
                    <Text style={styles.formLabel}>
                      Từ giờ <Text style={styles.required}>*</Text>
                    </Text>
                    <Pressable style={styles.inputBox} onPress={() => setShowTimeModal('start')}>
                      <Text style={[styles.inputText, !startTime && styles.inputPlaceholder]}>
                        {startTime ? formatTime(startTime) : 'Chọn từ giờ'}
                      </Text>
                      <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                    </Pressable>
                  </View>

                  <View style={styles.formItem}>
                    <Text style={styles.formLabel}>
                      Đến giờ <Text style={styles.required}>*</Text>
                    </Text>
                    <Pressable style={styles.inputBox} onPress={() => setShowTimeModal('end')}>
                      <Text style={[styles.inputText, !endTime && styles.inputPlaceholder]}>
                        {endTime ? formatTime(endTime) : 'Chọn đến giờ'}
                      </Text>
                      <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>
                    Ngày áp dụng <Text style={styles.required}>*</Text>
                  </Text>
                  <Pressable style={styles.inputBox} onPress={() => setShowDatePicker('single')}>
                    <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                      {fromDate ? formatDate(fromDate) : 'Chọn ngày'}
                    </Text>
                    <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                  </Pressable>
                </View>
              )}

              {/* Người bàn giao */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Người bàn giao</Text>
                <Pressable
                  style={styles.inputBox}
                  onPress={() => {
                    setShowEmployeeModal(true);
                    void fetchEmployeesList();
                  }}
                >
                  <Text style={[styles.inputText, !handoverEmployee && styles.inputPlaceholder]}>
                    {handoverEmployee ? ((handoverEmployee as any).fullName || (handoverEmployee as any).profile?.fullName || (handoverEmployee as any).userCode || 'Nhân sự') : 'Chọn người bàn giao'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                </Pressable>
              </View>

              {/* Lý do chi tiết */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Lý do chi tiết <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.textAreaBox}>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder="Nhập lý do nghỉ phép..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    maxLength={500}
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                  />
                  <Text style={styles.counterText}>{content.length}/500</Text>
                </View>
              </View>
            </>
          ) : isLateOrEarly ? (
            <>
              {/* Ngày áp dụng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Ngày áp dụng <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowDatePicker('single')}>
                  <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                    {fromDate ? formatDate(fromDate) : 'Chọn ngày'}
                  </Text>
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                </Pressable>
              </View>

              {/* Ca làm việc */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Ca làm việc <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowShiftModal(true)}>
                  <Text style={[styles.inputText, !shift && styles.inputPlaceholder]}>
                    {shift ? `${shift.name} (${shift.startTime} - ${shift.endTime})` : 'Chọn ca làm việc'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                </Pressable>
              </View>

              {/* Giờ vào / ra */}
              {selectedType === 'LATE_ARRIVAL' ? (
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>
                    Giờ vào thực tế <Text style={styles.required}>*</Text>
                  </Text>
                  <Pressable style={styles.inputBox} onPress={() => setShowTimeModal('start')}>
                    <Text style={[styles.inputText, !startTime && styles.inputPlaceholder]}>
                      {startTime ? formatTime(startTime) : 'Chọn giờ vào'}
                    </Text>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>
                    Giờ ra thực tế <Text style={styles.required}>*</Text>
                  </Text>
                  <Pressable style={styles.inputBox} onPress={() => setShowTimeModal('end')}>
                    <Text style={[styles.inputText, !endTime && styles.inputPlaceholder]}>
                      {endTime ? formatTime(endTime) : 'Chọn giờ ra'}
                    </Text>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                  </Pressable>
                </View>
              )}

              {/* Lý do chi tiết */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Lý do chi tiết <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.textAreaBox}>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder={selectedType === 'LATE_ARRIVAL' ? "Nhập lý do đi muộn..." : "Nhập lý do về sớm..."}
                    placeholderTextColor="#94A3B8"
                    multiline
                    maxLength={500}
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                  />
                  <Text style={styles.counterText}>{content.length}/500</Text>
                </View>
              </View>

              {/* Chụp ảnh minh chứng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Ảnh minh chứng (Tùy chọn)</Text>
                <Pressable style={styles.photoButton} onPress={handleTakePhoto}>
                  <MaterialCommunityIcons 
                    name={photoUri ? "check-circle" : "camera-outline"} 
                    size={20} 
                    color={photoUri ? "#10B981" : "#475569"} 
                  />
                  <Text style={[styles.photoButtonText, photoUri && styles.photoButtonTextSuccess]}>
                    {photoUri ? 'Đã chụp ảnh minh chứng' : 'Chụp ảnh minh chứng'}
                  </Text>
                </Pressable>
                {photoUri && (
                  <View style={styles.photoPreviewWrap}>
                    <TouchableOpacity onPress={() => setIsFullScreenPhoto(true)} style={{ width: '100%', height: '100%' }}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                      <MaterialCommunityIcons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          ) : isOvertime ? (
            <>
              {/* Ngày làm thêm */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Ngày áp dụng <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowDatePicker('single')}>
                  <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                    {fromDate ? formatDate(fromDate) : 'Chọn ngày'}
                  </Text>
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                </Pressable>
              </View>

              {/* Ca làm việc (Nếu có) */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Ca làm việc (Không bắt buộc)</Text>
                <Pressable style={styles.inputBox} onPress={() => setShowShiftModal(true)}>
                  <Text style={[styles.inputText, !shift && styles.inputPlaceholder]}>
                    {shift ? shift.name : 'Chọn ca làm việc'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                </Pressable>
              </View>

              {/* Từ giờ */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Từ giờ <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowTimeModal('start')}>
                  <Text style={[styles.inputText, !startTime && styles.inputPlaceholder]}>
                    {startTime ? formatTime(startTime) : 'Chọn từ giờ'}
                  </Text>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                </Pressable>
              </View>

              {/* Đến giờ */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Đến giờ <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowTimeModal('end')}>
                  <Text style={[styles.inputText, !endTime && styles.inputPlaceholder]}>
                    {endTime ? formatTime(endTime) : 'Chọn đến giờ'}
                  </Text>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                </Pressable>
              </View>

              {/* Lý do chi tiết */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Lý do chi tiết <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.textAreaBox}>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder="Nhập nội dung công việc / lý do làm thêm giờ..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    maxLength={500}
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                  />
                  <Text style={styles.counterText}>{content.length}/500</Text>
                </View>
              </View>
            </>
          ) : isFinancial ? (
            <>
              {/* Số tiền */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  {selectedType === 'EXPENSE' ? 'Số tiền thanh toán (VNĐ)' : 'Số tiền tạm ứng (VNĐ)'}{' '}
                  <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={[styles.inputText, { flex: 1, fontWeight: '600' }]}
                    placeholder="Nhập số tiền..."
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={amount ? parseInt(amount, 10).toLocaleString('vi-VN') : ''}
                    onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
                  />
                  <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>VNĐ</Text>
                </View>
              </View>

              {/* Ngày áp dụng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  {selectedType === 'EXPENSE' ? 'Ngày phát sinh chi phí' : 'Ngày mong muốn nhận'}{' '}
                  <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowDatePicker('single')}>
                  <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                    {fromDate ? formatDate(fromDate) : 'Chọn ngày'}
                  </Text>
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                </Pressable>
              </View>

              {/* Lý do chi tiết */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Lý do chi tiết <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.textAreaBox}>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder={selectedType === 'EXPENSE' ? "Nhập hạng mục / lý do thanh toán..." : "Nhập lý do tạm ứng..."}
                    placeholderTextColor="#94A3B8"
                    multiline
                    maxLength={500}
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                  />
                  <Text style={styles.counterText}>{content.length}/500</Text>
                </View>
              </View>

              {/* Quy trình duyệt thông minh */}
              <View style={styles.approvalWorkflowBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <MaterialCommunityIcons 
                    name="transit-connection-variant" 
                    size={16} 
                    color={Number(amount || 0) > 5000000 ? '#2563EB' : '#16A34A'} 
                  />
                  <Text style={[styles.approvalWorkflowTitle, { color: Number(amount || 0) > 5000000 ? '#1E40AF' : '#15803D' }]}>
                    Quy trình duyệt {Number(amount || 0) > 5000000 ? '(Đơn > 5tr)' : '(Đơn ≤ 5tr)'}
                  </Text>
                </View>
                <Text style={styles.approvalWorkflowSubtitle}>
                  {Number(amount || 0) > 5000000
                    ? '1. Trưởng BP duyệt ➔ 2. Leader HR đối chứng ➔ 3. BGĐ duyệt ➔ 4. Kế toán chi'
                    : '1. Trưởng BP duyệt ➔ 2. Leader HR duyệt ➔ 3. Kế toán chi'}
                </Text>
              </View>

              {/* Chụp ảnh minh chứng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Ảnh minh chứng {selectedType === 'EXPENSE' ? <Text style={styles.required}>*</Text> : '(Tùy chọn)'}
                </Text>
                <Pressable style={styles.photoButton} onPress={handleTakePhoto}>
                  <MaterialCommunityIcons 
                    name={photoUri ? "check-circle" : "camera-outline"} 
                    size={20} 
                    color={photoUri ? "#10B981" : "#475569"} 
                  />
                  <Text style={[styles.photoButtonText, photoUri && styles.photoButtonTextSuccess]}>
                    {photoUri ? 'Đã đính kèm ảnh minh chứng' : 'Chụp ảnh minh chứng / hóa đơn'}
                  </Text>
                </Pressable>
                {photoUri && (
                  <View style={styles.photoPreviewWrap}>
                    <TouchableOpacity onPress={() => setIsFullScreenPhoto(true)} style={{ width: '100%', height: '100%' }}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                      <MaterialCommunityIcons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          ) : (
            <>
              {/* Tiêu đề đơn */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Tiêu đề đơn <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={[styles.inputText, { flex: 1 }]}
                    placeholder="VD: Đề xuất cấp thiết bị làm việc"
                    placeholderTextColor="#94A3B8"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
              </View>

              {/* Ngày áp dụng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Ngày áp dụng <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => setShowDatePicker('single')}>
                  <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                    {fromDate ? formatDate(fromDate) : 'Chọn ngày'}
                  </Text>
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                </Pressable>
              </View>

              {/* Lý do chi tiết */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Lý do chi tiết <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.textAreaBox}>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder="Nhập nội dung đề xuất chi tiết..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    maxLength={500}
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                  />
                  <Text style={styles.counterText}>{content.length}/500</Text>
                </View>
              </View>

              {/* Chụp ảnh minh chứng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Ảnh minh chứng (Tùy chọn)</Text>
                <Pressable style={styles.photoButton} onPress={handleTakePhoto}>
                  <MaterialCommunityIcons 
                    name={photoUri ? "check-circle" : "camera-outline"} 
                    size={20} 
                    color={photoUri ? "#10B981" : "#475569"} 
                  />
                  <Text style={[styles.photoButtonText, photoUri && styles.photoButtonTextSuccess]}>
                    {photoUri ? 'Đã chụp ảnh minh chứng' : 'Chụp ảnh minh chứng'}
                  </Text>
                </Pressable>
                {photoUri && (
                  <View style={styles.photoPreviewWrap}>
                    <TouchableOpacity onPress={() => setIsFullScreenPhoto(true)} style={{ width: '100%', height: '100%' }}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                      <MaterialCommunityIcons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Shift Picker Modal */}
      <Modal visible={showShiftModal} transparent animationType="slide" onRequestClose={() => setShowShiftModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowShiftModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ width: 28 }} />
              <Text style={styles.modalTitle}>Chọn ca làm</Text>
              <Pressable onPress={() => setShowShiftModal(false)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>
            {apiShifts.length === 0 ? (
              <Text style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>Đang tải danh sách ca...</Text>
            ) : (
              <FlatList
                data={apiShifts}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = shift?.id === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                      onPress={() => handleSelectShift(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>{item.name}</Text>
                        <Text style={[styles.modalItemSubtext, isSelected && styles.modalItemSubtextSelected]}>
                          {item.startTime} - {item.endTime}
                        </Text>
                      </View>
                      {isSelected ? (
                        <MaterialCommunityIcons name="check-circle" size={20} color="#059669" />
                      ) : (
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Real Time Picker */}
      {Platform.OS === 'ios' ? (
        <Modal visible={showTimeModal !== null} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <Pressable onPress={() => setShowTimeModal(null)}>
                  <Text style={styles.iosPickerBtn}>Hủy</Text>
                </Pressable>
                <Pressable onPress={() => {
                  if (showTimeModal === 'start' && !startTime) setStartTime(new Date());
                  if (showTimeModal === 'end' && !endTime) setEndTime(new Date());
                  setShowTimeModal(null);
                }}>
                  <Text style={[styles.iosPickerBtn, { fontWeight: '700' }]}>Xong</Text>
                </Pressable>
              </View>
              {showTimeModal !== null && (
                <DateTimePicker
                  value={showTimeModal === 'start' ? (startTime || new Date()) : (endTime || new Date())}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={handleTimeChange}
                  textColor="#000"
                  locale="vi-VN"
                />
              )}
            </View>
          </View>
        </Modal>
      ) : (
        showTimeModal !== null && (
          <DateTimePicker
            value={showTimeModal === 'start' ? (startTime || new Date()) : (endTime || new Date())}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        )
      )}

      {/* Full Screen Photo Modal */}
      <Modal visible={isFullScreenPhoto} transparent animationType="fade">
        <View style={styles.fullScreenOverlay}>
          <Pressable style={styles.fullScreenCloseBtn} onPress={() => setIsFullScreenPhoto(false)}>
            <MaterialCommunityIcons name="close" size={28} color="#fff" />
          </Pressable>
          {photoUri && (
            <Image 
              source={{ uri: photoUri }} 
              style={styles.fullScreenImage} 
            />
          )}
        </View>
      </Modal>

      {/* Leave Duration Type Modal */}
      <Modal visible={showLeaveDurationModal} transparent animationType="slide">
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.fullScreenModalContent}>
            <View style={styles.fullScreenModalHeader}>
              <Pressable onPress={() => setShowLeaveDurationModal(false)} style={{ padding: 8, marginRight: 8 }}>
                <MaterialCommunityIcons name="close" size={24} color="#111827" />
              </Pressable>
              <Text style={styles.fullScreenModalTitle}>Loại</Text>
            </View>
            <FlatList
              data={leaveDurationTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.fullScreenModalItem} 
                  onPress={() => { setLeaveDurationType(item); setShowLeaveDurationModal(false); }}
                >
                  <Text style={styles.fullScreenModalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Leave Type Modal */}
      <Modal visible={showLeaveTypeModal} transparent animationType="slide">
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.fullScreenModalContent}>
            <View style={styles.fullScreenModalHeader}>
              <Pressable onPress={() => setShowLeaveTypeModal(false)} style={{ padding: 8, marginRight: 8 }}>
                <MaterialCommunityIcons name="close" size={24} color="#111827" />
              </Pressable>
              <Text style={styles.fullScreenModalTitle}>Loại nghỉ phép</Text>
            </View>
            <FlatList
              data={leaveTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.fullScreenModalItem} 
                  onPress={() => { setLeaveType(item); setShowLeaveTypeModal(false); }}
                >
                  <Text style={styles.fullScreenModalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Explanation Type Modal */}
      <Modal visible={showExplanationTypeModal} transparent animationType="slide">
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.fullScreenModalContent}>
            <View style={styles.fullScreenModalHeader}>
              <Pressable onPress={() => setShowExplanationTypeModal(false)} style={{ padding: 8, marginRight: 8 }}>
                <MaterialCommunityIcons name="close" size={24} color="#111827" />
              </Pressable>
              <Text style={styles.fullScreenModalTitle}>Loại giải trình</Text>
            </View>
            <FlatList
              data={explanationTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.fullScreenModalItem} 
                  onPress={() => { setExplanationType(item); setShowExplanationTypeModal(false); }}
                >
                  <Text style={styles.fullScreenModalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Employee Selector Modal */}
      <Modal visible={showEmployeeModal} transparent animationType="slide">
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.fullScreenModalContent}>
            <View style={styles.fullScreenModalHeader}>
              <Pressable onPress={() => { setShowEmployeeModal(false); setEmployeeSearchQuery(''); }} style={{ padding: 8, marginRight: 8 }}>
                <MaterialCommunityIcons name="close" size={24} color="#111827" />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.fullScreenModalTitle}>{isExplanation ? 'Người duyệt' : 'Người bàn giao'}</Text>
                {userDeptName ? (
                  <Text style={{ fontSize: 12, color: '#059669', fontWeight: '600', marginTop: 1 }}>
                    Phòng ban: {userDeptName}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => void fetchEmployeesList()}
                style={{ padding: 8 }}
                disabled={isLoadingEmployees}
              >
                <MaterialCommunityIcons
                  name="reload"
                  size={22}
                  color={isLoadingEmployees ? '#9CA3AF' : '#10B981'}
                />
              </Pressable>
            </View>

            {/* Search Box */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F3F4F6',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === 'ios' ? 10 : 6,
              marginHorizontal: 16,
              marginBottom: 12,
            }}>
              <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 14, color: '#111827' }}
                placeholder="Tìm nhân sự cùng phòng (tên, mã NV)..."
                placeholderTextColor="#9CA3AF"
                value={employeeSearchQuery}
                onChangeText={setEmployeeSearchQuery}
                clearButtonMode="while-editing"
              />
              {employeeSearchQuery ? (
                <Pressable onPress={() => setEmployeeSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
                </Pressable>
              ) : null}
            </View>

            {isLoadingEmployees ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Đang tải danh sách nhân sự...</Text>
              </View>
            ) : (() => {
              const cleanQ = normalizeSearchText(employeeSearchQuery);
              const filteredList = apiEmployees.filter((item: any) => {
                if (!cleanQ) return true;
                const name = normalizeSearchText(item.fullName || item.profile?.fullName || '');
                const code = normalizeSearchText(item.userCode || '');
                const dept = normalizeSearchText(item.department?.name || '');
                const pos = normalizeSearchText(item.position?.name || '');
                return name.includes(cleanQ) || code.includes(cleanQ) || dept.includes(cleanQ) || pos.includes(cleanQ);
              });

              if (filteredList.length === 0) {
                return (
                  <View style={{ paddingVertical: 40, alignItems: 'center', paddingHorizontal: 20 }}>
                    <MaterialCommunityIcons name="account-search-outline" size={48} color="#9CA3AF" />
                    <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14, textAlign: 'center' }}>
                      {apiEmployees.length === 0
                        ? userDeptName
                          ? `Không có nhân sự nào khác trong phòng ban "${userDeptName}".`
                          : 'Chưa có dữ liệu nhân sự phù hợp.'
                        : 'Không tìm thấy nhân sự phù hợp với từ khóa.'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => void fetchEmployeesList()}
                      style={{
                        marginTop: 16,
                        backgroundColor: '#F3F4F6',
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                      }}
                    >
                      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 13 }}>Tải lại danh sách</Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <FlatList
                  data={filteredList}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }: { item: any }) => {
                    const isMe = item.id === user?.id;
                    const rawName = item.fullName || item.profile?.fullName || item.userCode || 'Nhân sự';
                    const dispName = isMe ? `${rawName} (Bạn)` : rawName;
                    const deptName = item.department?.name;
                    const posName = item.position?.name;
                    const subtitle = [item.userCode, deptName, posName].filter(Boolean).join(' • ');

                    return (
                      <TouchableOpacity
                        style={[styles.fullScreenModalItem, { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }]}
                        onPress={() => {
                          setHandoverEmployee(item);
                          setShowEmployeeModal(false);
                          setEmployeeSearchQuery('');
                        }}
                      >
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: '#10B98115',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: '#10B981' }}>
                            {dispName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fullScreenModalItemText, { fontSize: 15, fontWeight: '600' }]}>{dispName}</Text>
                          {subtitle ? (
                            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{subtitle}</Text>
                          ) : null}
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
                      </TouchableOpacity>
                    );
                  }}
                />
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Real Date Picker */}
      {Platform.OS === 'ios' ? (
        <Modal visible={showDatePicker !== null} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <Pressable onPress={() => {
                  setTempSelectedDate(null);
                  setShowDatePicker(null);
                }}>
                  <Text style={styles.iosPickerBtn}>Hủy</Text>
                </Pressable>
                <Pressable onPress={() => {
                  const targetDate = tempSelectedDate || (
                    showDatePicker === 'from' ? (fromDate || new Date())
                    : showDatePicker === 'to' ? (toDate || new Date())
                    : (fromDate || new Date())
                  );
                  if (showDatePicker === 'from' || showDatePicker === 'single') {
                    setFromDate(targetDate);
                  } else if (showDatePicker === 'to') {
                    setToDate(targetDate);
                  }
                  setTempSelectedDate(null);
                  setShowDatePicker(null);
                }}>
                  <Text style={[styles.iosPickerBtn, { fontWeight: '700' }]}>Xong</Text>
                </Pressable>
              </View>
              {showDatePicker !== null && (
                <DateTimePicker
                  value={
                    tempSelectedDate || (
                      showDatePicker === 'from' ? (fromDate || new Date()) 
                      : showDatePicker === 'to' ? (toDate || new Date())
                      : (fromDate || new Date())
                    )
                  }
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  textColor="#000"
                  locale="vi-VN"
                />
              )}
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker !== null && (
          <DateTimePicker
            value={
              showDatePicker === 'from' ? (fromDate || new Date()) 
              : showDatePicker === 'to' ? (toDate || new Date())
              : (fromDate || new Date())
            }
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )
      )}

      <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
        <Text style={styles.requiredNoteText}>
          <Text style={styles.required}>* </Text>Thông tin bắt buộc
        </Text>
        <Pressable 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.submitButtonContent}>
              <Text style={styles.submitButtonText}>Gửi đơn từ</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </View>
          )}
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  topBarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 2,
  },
  topAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D9E4DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B382B',
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F2F20',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  sectionHeadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  sectionNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  sectionHeadingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.8,
  },
  gridCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gridCol: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  gridIconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridIconBoxActive: {
    backgroundColor: '#1B382B',
  },
  gridColLabel: {
    fontSize: 11.5,
    color: '#334155',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
    minHeight: 28,
  },
  gridColLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  formCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D9E4DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B382B',
  },
  userTextCol: {
    flex: 1,
  },
  userLabelText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  formDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  formItem: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  inputBox: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 14,
    color: '#0F172A',
  },
  inputPlaceholder: {
    color: '#94A3B8',
  },
  textAreaBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
  },
  textAreaInput: {
    fontSize: 14,
    color: '#0F172A',
    minHeight: 60,
    padding: 0,
  },
  counterText: {
    fontSize: 11,
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  photoButton: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  photoButtonText: {
    fontSize: 13,
    color: '#475569',
  },
  photoButtonTextSuccess: {
    color: '#10B981',
    fontWeight: '600',
  },
  photoPreviewWrap: {
    marginTop: 8,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvalWorkflowBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  approvalWorkflowTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  approvalWorkflowSubtitle: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  requiredNoteText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  submitButton: {
    height: 50,
    backgroundColor: '#1B382B',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.8,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Modal & Picker styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '60%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  modalItemSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalItemTextSelected: {
    color: '#065F46',
    fontWeight: '700',
  },
  modalItemSubtext: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 3,
  },
  modalItemSubtextSelected: {
    color: '#059669',
  },
  iosPickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iosPickerBtn: {
    fontSize: 16,
    color: '#3B82F6',
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  fullScreenModalContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullScreenModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fullScreenModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  fullScreenModalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fullScreenModalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  fullScreenCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
});

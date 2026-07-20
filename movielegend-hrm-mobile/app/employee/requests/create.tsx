import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Modal, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
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
  { type: 'LEAVE', label: 'Nghỉ phép', icon: 'beach', color: '#10B981' },
  { type: 'ATTENDANCE_ADJUSTMENT', label: 'Giải trình công', icon: 'file-clock-outline', color: '#3B82F6' },
  { type: 'LATE_ARRIVAL', label: 'Đi muộn', icon: 'clock-in', color: '#F59E0B' },
  { type: 'EARLY_LEAVE', label: 'Về sớm', icon: 'clock-out', color: '#EF4444' },
  { type: 'OVERTIME', label: 'Làm thêm giờ', icon: 'briefcase-clock', color: '#8B5CF6' },
  { type: 'ADVANCE', label: 'Tạm ứng', icon: 'cash', color: '#14B8A6' },
  { type: 'EXPENSE', label: 'Thanh toán', icon: 'receipt', color: '#F97316' },
  { type: 'OTHER', label: 'Khác', icon: 'file-document', color: '#6B7280' },
];

export default function CreateRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [selectedType, setSelectedType] = useState<EmployeeRequestType>('LEAVE');
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
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

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
  const [apiEmployees, setApiEmployees] = useState<EmployeeUser[]>([]);

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

  React.useEffect(() => {
    if (isLateOrEarly || isExplanation || isOvertime) {
      getShifts()
        .then(setApiShifts)
        .catch(err => console.log('Error fetching shifts', err));
    }
    if ((isLeave || isExplanation) && apiEmployees.length === 0) {
      getScopedEmployees({ page: 1, limit: 50 })
        .then(res => setApiEmployees(res.items || []))
        .catch(err => console.log('Error fetching employees', err));
    }
  }, [isLateOrEarly, isLeave, isExplanation, isOvertime]);



  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Lỗi", "Vui lòng cấp quyền truy cập Camera để chụp ảnh bằng chứng.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
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
      if (showDatePicker === 'from' || showDatePicker === 'single') {
        setFromDate(selectedDate);
      } else if (showDatePicker === 'to') {
        setToDate(selectedDate);
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
      Alert.alert('Lỗi', 'Vui lòng nhập Lý do/Nội dung chi tiết.');
      return;
    }
    if (isFinancial && !amount.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập Số tiền cho loại đơn này.');
      return;
    }
    if (isLeave) {
      if (!leaveDurationType || !leaveType || !fromDate) {
        Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin Loại nghỉ, Ngày nghỉ');
        return;
      }
      if (leaveDurationType === 'Nhiều ngày' && !toDate) {
        Alert.alert('Lỗi', 'Vui lòng chọn Ngày kết thúc');
        return;
      }
    }
    if (isLateOrEarly) {
      if (!shift) {
        Alert.alert('Lỗi', 'Vui lòng Chọn ca làm.');
        return;
      }
      if (selectedType === 'LATE_ARRIVAL' && !startTime) {
        Alert.alert('Lỗi', 'Vui lòng nhập Giờ bắt đầu.');
        return;
      }
      if (selectedType === 'EARLY_LEAVE' && !endTime) {
        Alert.alert('Lỗi', 'Vui lòng nhập Giờ kết thúc.');
        return;
      }
    }
    if (isOvertime) {
      if (!fromDate || !startTime || !endTime) {
        Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Ngày làm thêm, Từ giờ, Đến giờ');
        return;
      }
    }
    if (selectedType === 'EXPENSE' || selectedType === 'PURCHASE') {
      if (!photoUri) {
        Alert.alert('Lỗi', 'Vui lòng đính kèm ảnh minh chứng (Hóa đơn/Chứng từ).');
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
          Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
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
        ...(handoverEmployee ? { handoverEmployee: handoverEmployee.fullName, handoverUserId: handoverEmployee.id } : {}),
      };

      await createEmployeeRequest({
        type: selectedType,
        title: generatedTitle,
        content: content.trim(),
        ...(isFinancial && amount ? { amount: Number(amount) } : {}),
        ...(Object.keys(attachmentMetadata).length > 0 ? { attachmentMetadata } : {})
      });
      
      Alert.alert('Thành công', 'Đã gửi đơn thành công!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      console.log('API Error:', JSON.stringify(e.response?.data, null, 2) || e.message);
      const errorMsg = e.response?.data?.error?.message || e.response?.data?.message || e.message || 'Có lỗi xảy ra khi gửi đơn.';
      Alert.alert('Lỗi', Array.isArray(errorMsg) ? errorMsg.join('\n') : errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#FAFAFA' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={[styles.header, shadows.sm]}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <MaterialCommunityIcons name="chevron-left" size={32} color="#111827" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Tạo đơn từ mới</Text>
              <Text style={styles.headerSubtitle}>Chọn loại đơn và điền thông tin</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          <Text style={styles.sectionLabel}>Loại đơn từ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector} contentContainerStyle={{ paddingRight: spacing.md }}>
            {REQUEST_TYPES.map(t => {
              const isSelected = selectedType === t.type;
              return (
                <Pressable 
                  key={t.type} 
                  style={[styles.typeBox, isSelected && { borderColor: t.color, backgroundColor: `${t.color}08` }]}
                  onPress={() => setSelectedType(t.type)}
                >
                  <View style={[styles.typeIconWrap, { backgroundColor: isSelected ? t.color : '#F3F4F6' }]}>
                    <MaterialCommunityIcons name={t.icon} size={28} color={isSelected ? '#fff' : '#6B7280'} />
                  </View>
                  <Text style={[styles.typeLabel, isSelected && { color: t.color, fontWeight: '700' }]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.formContainer}>
            {isExplanation ? (
              <>
                {/* Employee Name */}
                <View style={[styles.rowInput, shadows.sm]}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="account-group" size={20} color="#000" />
                  </View>
                  <Text style={styles.rowTextValue}>{user?.fullName || 'Người dùng'}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                </View>

                {/* Ngày giải trình */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowDatePicker('single')}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="calendar-today" size={20} color="#000" />
                  </View>
                  <Text style={[fromDate ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {fromDate ? formatDate(fromDate) : 'Ngày cần giải trình'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Chọn Ca làm việc */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowShiftModal(true)}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="briefcase-clock" size={20} color="#000" />
                  </View>
                  <Text style={[shift ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {shift ? shift.name : 'Ca làm việc'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Chọn Loại giải trình */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowExplanationTypeModal(true)}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="form-select" size={20} color="#000" />
                  </View>
                  <Text style={[explanationType ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {explanationType || 'Loại giải trình'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Giờ vào / ra thực tế tùy loại giải trình */}
                {['Quên Check-in', 'Quên cả In & Out'].includes(explanationType) && (
                  <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowTimeModal('start')}>
                    <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                      <MaterialCommunityIcons name="clock-in" size={20} color="#000" />
                    </View>
                    <Text style={[startTime ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                      <Text style={styles.required}>*</Text> {startTime ? formatTime(startTime) : 'Giờ vào thực tế'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                  </Pressable>
                )}

                {['Quên Check-out', 'Quên cả In & Out'].includes(explanationType) && (
                  <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowTimeModal('end')}>
                    <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                      <MaterialCommunityIcons name="clock-out" size={20} color="#000" />
                    </View>
                    <Text style={[endTime ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                      <Text style={styles.required}>*</Text> {endTime ? formatTime(endTime) : 'Giờ ra thực tế'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                  </Pressable>
                )}



                {/* Nhập nội dung/lý do chi tiết */}
                <View style={[styles.rowInput, shadows.sm, { alignItems: 'flex-start', paddingVertical: 16 }]}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6', marginTop: 2 }]}>
                    <MaterialCommunityIcons name="message-text-outline" size={20} color="#000" />
                  </View>
                  <TextInput
                    style={[styles.rowTextInput, { minHeight: 80 }]}
                    placeholder="Lý do chi tiết giải trình"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                  />
                </View>

                {/* Chụp ảnh minh chứng */}
                <View style={{ marginBottom: spacing.md }}>
                  <Pressable 
                    style={[styles.rowInput, shadows.sm, { marginBottom: 8 }]} 
                    onPress={handleTakePhoto}
                  >
                    <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                      <MaterialCommunityIcons name="camera-outline" size={20} color="#000" />
                    </View>
                    <Text style={[photoUri ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                      <Text style={styles.required}>*</Text> {photoUri ? 'Đã chụp ảnh' : 'Chụp ảnh minh chứng'}
                    </Text>
                    {photoUri && (
                      <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                    )}
                  </Pressable>

                  {photoUri && (
                    <TouchableOpacity onPress={() => setIsFullScreenPhoto(true)} style={[styles.photoPreviewWrap, shadows.sm]}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                      <View style={styles.photoOverlay}>
                        <MaterialCommunityIcons name="magnify-plus-outline" size={24} color="#fff" />
                        <Text style={styles.photoOverlayText}>Xem ảnh lớn</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : isOvertime ? (
              <>
                {/* Employee Name */}
                <View style={[styles.rowInput, shadows.sm]}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="account-group" size={20} color="#000" />
                  </View>
                  <Text style={styles.rowTextValue}>{user?.fullName || 'Người dùng'}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                </View>

                {/* Ngày làm thêm */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowDatePicker('single')}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="calendar-today" size={20} color="#000" />
                  </View>
                  <Text style={[fromDate ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {fromDate ? formatDate(fromDate) : 'Ngày làm thêm'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Chọn Ca làm việc (Nếu có) */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowShiftModal(true)}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="briefcase-clock" size={20} color="#000" />
                  </View>
                  <Text style={[shift ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    {shift ? shift.name : 'Ca làm việc (Không bắt buộc)'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Từ giờ */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowTimeModal('start')}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="clock-in" size={20} color="#000" />
                  </View>
                  <Text style={[startTime ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {startTime ? formatTime(startTime) : 'Từ giờ'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Đến giờ */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowTimeModal('end')}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="clock-out" size={20} color="#000" />
                  </View>
                  <Text style={[endTime ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {endTime ? formatTime(endTime) : 'Đến giờ'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Nhập nội dung/lý do chi tiết */}
                <View style={[styles.rowInput, shadows.sm, { alignItems: 'flex-start', paddingVertical: 16 }]}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6', marginTop: 2 }]}>
                    <MaterialCommunityIcons name="message-text-outline" size={20} color="#000" />
                  </View>
                  <TextInput
                    style={[styles.rowTextInput, { minHeight: 80 }]}
                    placeholder="Lý do làm thêm giờ / Công việc"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                  />
                </View>
              </>
            ) : isFinancial ? (
              <>
                {/* Employee Name */}
                <View style={[styles.rowInput, shadows.sm]}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="account-group" size={20} color="#000" />
                  </View>
                  <Text style={styles.rowTextValue}>{user?.fullName || 'Người dùng'}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                </View>

                {/* Amount */}
                <View style={[styles.rowInput, shadows.sm]}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="cash" size={20} color="#000" />
                  </View>
                  <TextInput
                    style={[styles.rowTextInput, { fontSize: 16, fontWeight: '600' }]}
                    placeholder={
                      selectedType === 'EXPENSE' ? 'Số tiền cần thanh toán (VNĐ)' :
                      selectedType === 'PURCHASE' ? 'Số tiền dự kiến (VNĐ)' :
                      'Số tiền cần tạm ứng (VNĐ)'
                    }
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={amount ? parseInt(amount, 10).toLocaleString('vi-VN') : ''}
                    onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
                  />
                  <Text style={{ color: '#111827', fontWeight: '600', marginLeft: 8 }}>VNĐ</Text>
                </View>

                {/* Ngày cần nhận / Ngày phát sinh */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowDatePicker('single')}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="calendar-today" size={20} color="#000" />
                  </View>
                  <Text style={[fromDate ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {fromDate ? formatDate(fromDate) : 
                      selectedType === 'EXPENSE' ? 'Ngày phát sinh chi phí' :
                      selectedType === 'PURCHASE' ? 'Ngày cần hàng' :
                      'Ngày mong muốn nhận'
                    }
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Nhập nội dung/lý do chi tiết */}
                <View style={[styles.rowInput, shadows.sm, { alignItems: 'flex-start', paddingVertical: 16 }]}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6', marginTop: 2 }]}>
                    <MaterialCommunityIcons name="message-text-outline" size={20} color="#000" />
                  </View>
                  <TextInput
                    style={[styles.rowTextInput, { minHeight: 80 }]}
                    placeholder={
                      selectedType === 'EXPENSE' ? 'Lý do / Hạng mục thanh toán' :
                      selectedType === 'PURCHASE' ? 'Danh sách đề xuất mua sắm' :
                      'Lý do chi tiết tạm ứng'
                    }
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                  />
                </View>

                {/* Chụp ảnh minh chứng (Chỉ hiện cho EXPENSE và PURCHASE) */}
                {selectedType !== 'ADVANCE' && (
                  <View style={{ marginBottom: spacing.md }}>
                    <Pressable 
                      style={[styles.rowInput, shadows.sm, { marginBottom: 8 }]} 
                      onPress={handleTakePhoto}
                    >
                      <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                        <MaterialCommunityIcons name="camera-outline" size={20} color="#000" />
                      </View>
                      <Text style={[photoUri ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                        {photoUri ? 'Đã chụp ảnh' : 
                          selectedType === 'EXPENSE' ? 'Chụp ảnh Hóa đơn/Chứng từ' :
                          'Chụp ảnh báo giá/minh chứng (Tùy chọn)'
                        }
                      </Text>
                      {photoUri && (
                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                      )}
                    </Pressable>

                    {photoUri && (
                      <TouchableOpacity onPress={() => setIsFullScreenPhoto(true)} style={[styles.photoPreviewWrap, shadows.sm]}>
                        <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                        <View style={styles.photoOverlay}>
                          <MaterialCommunityIcons name="magnify-plus-outline" size={24} color="#fff" />
                          <Text style={styles.photoOverlayText}>Xem ảnh lớn</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            ) : isLeave ? (
              <>
                {/* Employee Name */}
                <View style={[styles.rowInput, shadows.sm]}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="account-group" size={20} color="#000" />
                  </View>
                  <Text style={styles.rowTextValue}>{user?.fullName || 'Người dùng'}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                </View>

                {/* Chọn loại */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowLeaveDurationModal(true)}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="view-grid-outline" size={20} color="#000" />
                  </View>
                  <Text style={[leaveDurationType ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {leaveDurationType || 'Chọn loại'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Chọn loại nghỉ phép */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowLeaveTypeModal(true)}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="water-outline" size={20} color="#000" />
                  </View>
                  <Text style={[leaveType ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {leaveType || 'Chọn loại nghỉ phép'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Dynamic Date/Time Fields for Leave */}
                {leaveDurationType === 'Nhiều ngày' ? (
                  <>
                    <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowDatePicker('from')}>
                      <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                        <MaterialCommunityIcons name="calendar-range" size={20} color="#000" />
                      </View>
                      <Text style={[fromDate ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                        <Text style={styles.required}>*</Text> {fromDate ? formatDate(fromDate) : 'Từ ngày'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                    </Pressable>
                    <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowDatePicker('to')}>
                      <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                        <MaterialCommunityIcons name="calendar-range" size={20} color="#000" />
                      </View>
                      <Text style={[toDate ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                        <Text style={styles.required}>*</Text> {toDate ? formatDate(toDate) : 'Đến ngày'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                    </Pressable>
                  </>
                ) : ['Theo giờ', '1/4 ngày', '1/2 ngày', '3/4 ngày'].includes(leaveDurationType) ? (
                  <>
                    <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowDatePicker('single')}>
                      <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                        <MaterialCommunityIcons name="calendar-today" size={20} color="#000" />
                      </View>
                      <Text style={[fromDate ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                        <Text style={styles.required}>*</Text> {fromDate ? formatDate(fromDate) : 'Ngày nghỉ'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                    </Pressable>
                    <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowTimeModal('start')}>
                      <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#000" />
                      </View>
                      <Text style={[startTime ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                        <Text style={styles.required}>*</Text> {startTime ? formatTime(startTime) : 'Từ giờ'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                    </Pressable>
                    <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowTimeModal('end')}>
                      <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#000" />
                      </View>
                      <Text style={[endTime ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                        <Text style={styles.required}>*</Text> {endTime ? formatTime(endTime) : 'Đến giờ'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                    </Pressable>
                  </>
                ) : leaveDurationType ? (
                  <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowDatePicker('single')}>
                    <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                      <MaterialCommunityIcons name="calendar-today" size={20} color="#000" />
                    </View>
                    <Text style={[fromDate ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                      <Text style={styles.required}>*</Text> {fromDate ? formatDate(fromDate) : 'Ngày nghỉ'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                  </Pressable>
                ) : null}

                {/* Chọn người bàn giao */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowEmployeeModal(true)}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="account-tie-outline" size={20} color="#000" />
                  </View>
                  <Text style={[handoverEmployee ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    {handoverEmployee ? handoverEmployee.fullName : 'Chọn người bàn giao'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Nhập nội dung */}
                <View style={[styles.rowInput, shadows.sm, { alignItems: 'flex-start', paddingVertical: 16 }]}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6', marginTop: 2 }]}>
                    <MaterialCommunityIcons name="message-text-outline" size={20} color="#000" />
                  </View>
                  <TextInput
                    style={[styles.rowTextInput, { minHeight: 60 }]}
                    placeholder="Nhập nội dung"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={content}
                    onChangeText={setContent}
                  />
                </View>

                {/* Nhập vào lý do */}
                <Pressable 
                  style={[styles.rowInput, shadows.sm, { alignItems: 'flex-start', paddingVertical: 16 }]}
                  onPress={() => reasonRef.current?.focus()}
                >
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6', marginTop: 2 }]}>
                    <MaterialCommunityIcons name="message-text-outline" size={20} color="#000" />
                  </View>
                  <TextInput
                    ref={reasonRef}
                    style={[styles.rowTextInput, { minHeight: 80 }]}
                    placeholder="* Nhập vào lý do"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={title}
                    onChangeText={setTitle}
                  />
                </Pressable>
              </>
            ) : isLateOrEarly ? (
              <>
                {/* Sub-type Toggle */}
                <View style={styles.toggleContainer}>
                  <Pressable 
                    style={[styles.toggleBtn, selectedType === 'LATE_ARRIVAL' && styles.toggleBtnActive]}
                    onPress={() => setSelectedType('LATE_ARRIVAL')}
                  >
                    <Text style={[styles.toggleBtnText, selectedType === 'LATE_ARRIVAL' && styles.toggleBtnTextActive]}>Đi muộn</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.toggleBtn, selectedType === 'EARLY_LEAVE' && styles.toggleBtnActive]}
                    onPress={() => setSelectedType('EARLY_LEAVE')}
                  >
                    <Text style={[styles.toggleBtnText, selectedType === 'EARLY_LEAVE' && styles.toggleBtnTextActive]}>Về sớm</Text>
                  </Pressable>
                </View>

                {/* Employee Name */}
                <View style={[styles.rowInput, shadows.sm]}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="account-group" size={20} color="#000" />
                  </View>
                  <Text style={styles.rowTextValue}>{user?.fullName || 'Người dùng'}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                </View>

                {/* Start Time */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowTimeModal('start')}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#000" />
                  </View>
                  <Text style={[startTime ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {startTime ? formatTime(startTime) : 'Giờ bắt đầu'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </Pressable>

                {/* End Time */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowTimeModal('end')}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#000" />
                  </View>
                  <Text style={[endTime ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {endTime ? formatTime(endTime) : 'Giờ kết thúc'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Shift */}
                <Pressable style={[styles.rowInput, shadows.sm]} onPress={() => setShowShiftModal(true)}>
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="view-grid-outline" size={20} color="#000" />
                  </View>
                  <Text style={[shift ? styles.rowTextValue : styles.rowTextPlaceholder]}>
                    <Text style={styles.required}>*</Text> {shift ? `${shift.name} (${shift.startTime} - ${shift.endTime})` : 'Chọn ca làm'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Reason Textarea */}
                <Pressable 
                  style={[styles.rowInput, shadows.sm, { alignItems: 'flex-start', paddingVertical: 16 }]}
                  onPress={() => reasonRef.current?.focus()}
                >
                  <View style={[styles.rowIconWrap, { backgroundColor: '#F3F4F6', marginTop: 2 }]}>
                    <MaterialCommunityIcons name="message-text-outline" size={20} color="#000" />
                  </View>
                  <TextInput
                    ref={reasonRef}
                    style={[styles.rowTextInput, { minHeight: 80 }]}
                    placeholder="* Nhập vào lý do chi tiết..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                  />
                </Pressable>

                {/* Photo Evidence */}
                <Pressable style={[styles.rowInput, shadows.sm, photoUri ? { borderColor: '#10B981', borderWidth: 1 } : null]} onPress={handleTakePhoto}>
                  <View style={[styles.rowIconWrap, { backgroundColor: photoUri ? '#D1FAE5' : '#F3F4F6' }]}>
                    <MaterialCommunityIcons name={photoUri ? "check-circle" : "camera-outline"} size={20} color={photoUri ? '#10B981' : "#111827"} />
                  </View>
                  <Text style={[styles.rowTextPlaceholder, photoUri ? { color: '#10B981', fontWeight: '600' } : null]}>
                    {photoUri ? 'Đã đính kèm bằng chứng' : 'Chụp ảnh bằng chứng'}
                  </Text>
                  {!photoUri && <MaterialCommunityIcons name="camera-plus" size={20} color="#9CA3AF" />}
                </Pressable>

                {/* Photo Preview */}
                {photoUri && (
                  <View style={styles.photoPreviewContainer}>
                    <Pressable style={{ width: '100%', height: '100%' }} onPress={() => setIsFullScreenPhoto(true)}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    </Pressable>
                    <Pressable style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                      <MaterialCommunityIcons name="close" size={16} color="#fff" />
                    </Pressable>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tiêu đề đơn <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: Đơn xin nghỉ phép năm"
                    placeholderTextColor="#9CA3AF"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                {isFinancial && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Số tiền đề xuất (VNĐ) <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={styles.input}
                      placeholder="VD: 5,000,000"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nội dung / Lý do <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Nhập lý do chi tiết..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>

      {/* Shift Picker Modal */}
      <Modal visible={showShiftModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowShiftModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn ca làm</Text>
            {apiShifts.length === 0 ? (
              <Text style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>Đang tải danh sách ca...</Text>
            ) : (
              <FlatList
                data={apiShifts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectShift(item)}>
                    <Text style={styles.modalItemText}>{item.name}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
                      {item.startTime} - {item.endTime}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
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
              <Pressable onPress={() => setShowEmployeeModal(false)} style={{ padding: 8, marginRight: 8 }}>
                <MaterialCommunityIcons name="close" size={24} color="#111827" />
              </Pressable>
              <Text style={styles.fullScreenModalTitle}>{isExplanation ? 'Người duyệt' : 'Người bàn giao'}</Text>
            </View>
            {apiEmployees.length === 0 ? (
              <Text style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>Đang tải danh sách nhân sự...</Text>
            ) : (
              <FlatList
                data={apiEmployees}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.fullScreenModalItem} 
                    onPress={() => { setHandoverEmployee(item); setShowEmployeeModal(false); }}
                  >
                    <Text style={styles.fullScreenModalItemText}>{item.fullName}</Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{item.email}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Real Date Picker */}
      {Platform.OS === 'ios' ? (
        <Modal visible={showDatePicker !== null} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <Pressable onPress={() => setShowDatePicker(null)}>
                  <Text style={styles.iosPickerBtn}>Hủy</Text>
                </Pressable>
                <Pressable onPress={() => {
                  if ((showDatePicker === 'from' || showDatePicker === 'single') && !fromDate) {
                    setFromDate(new Date());
                  } else if (showDatePicker === 'to' && !toDate) {
                    setToDate(new Date());
                  }
                  setShowDatePicker(null);
                }}>
                  <Text style={[styles.iosPickerBtn, { fontWeight: '700' }]}>Xong</Text>
                </Pressable>
              </View>
              {showDatePicker !== null && (
                <DateTimePicker
                  value={
                    showDatePicker === 'from' ? (fromDate || new Date()) 
                    : showDatePicker === 'to' ? (toDate || new Date())
                    : (fromDate || new Date())
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

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable 
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Gửi Đơn Từ</Text>
            </>
          )}
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  typeSelector: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  typeBox: {
    width: 110,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  typeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowTextPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: '#9CA3AF',
  },
  rowTextValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  rowTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0, // Reset padding for multiline Android
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleBtnTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  photoPreviewContainer: {
    marginTop: -4,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    height: 200,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '60%',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
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
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    fontSize: 16,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    minHeight: 140,
    paddingTop: 16,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  submitBtn: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  }
});

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAppAlert } from '../../../src/contexts/AlertContext';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Modal, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { requestCameraPermissionWithFallback } from '../../../src/utils/mediaPermissions';
import { Screen } from '../../../src/components/Screen';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { shadows } from '../../../src/theme/shadows';
import { createEmployeeRequest, getMyEmployeeRequests } from '../../../src/api/employee-requests.api';
import type { EmployeeRequestType, EmployeeRequest } from '../../../src/types/request.types';
import { useAuth } from '../../../src/providers/AuthProvider';
import { getShifts } from '../../../src/api/shifts.api';
import type { Shift } from '../../../src/types/shift.types';
import { getScopedEmployees } from '../../../src/api/employees.api';
import { getDepartment } from '../../../src/api/departments.api';
import type { EmployeeUser } from '../../../src/types/employee.types';
import { uploadFile } from '../../../src/api/uploads.api';
import { resolveFileUrl } from '../../../src/utils/url';

const REQUEST_TYPES: { type: EmployeeRequestType, label: string, icon: keyof typeof MaterialCommunityIcons.glyphMap, color: string }[] = [
  { type: 'LEAVE', label: 'Nghỉ phép', icon: 'umbrella-outline', color: '#1B382B' },
  { type: 'COMPENSATORY_WORK', label: 'Làm bù', icon: 'calendar-sync-outline', color: '#1B382B' },
  { type: 'ATTENDANCE_ADJUSTMENT', label: 'Giải trình\ncông', icon: 'file-document-outline', color: '#1B382B' },
  { type: 'BUSINESS_TRIP', label: 'Đi công tác', icon: 'airplane', color: '#1B382B' },
  { type: 'LATE_ARRIVAL', label: 'Đi muộn', icon: 'clock-outline', color: '#1B382B' },
  { type: 'EARLY_LEAVE', label: 'Về sớm', icon: 'exit-to-app', color: '#1B382B' },
  { type: 'OVERTIME', label: 'Làm thêm\ngiờ', icon: 'clock-plus-outline', color: '#1B382B' },
  { type: 'PURCHASE', label: 'Mua sắm', icon: 'cart-outline', color: '#1B382B' },
  { type: 'ADVANCE', label: 'Tạm ứng', icon: 'database-outline', color: '#1B382B' },
  { type: 'EXPENSE', label: 'Thanh toán', icon: 'credit-card-outline', color: '#1B382B' },
  { type: 'OTHER', label: 'Khác', icon: 'dots-horizontal', color: '#1B382B' },
];

const COMMON_BANKS = [
  'Vietcombank',
  'MBBank',
  'Techcombank',
  'ACB',
  'VPBank',
  'BIDV',
  'VietinBank',
  'TPBank',
  'Sacombank',
  'VIB',
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

  const params = useLocalSearchParams<{ type?: string }>();
  const [selectedType, setSelectedType] = useState<EmployeeRequestType>(
    (params.type as EmployeeRequestType) || 'ATTENDANCE_ADJUSTMENT'
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [amount, setAmount] = useState('');

  // Specific fields for Advance (Tạm ứng lương)
  const [advanceBankName, setAdvanceBankName] = useState('');
  const [advanceBankAccount, setAdvanceBankAccount] = useState('');
  const [advanceAccountHolder, setAdvanceAccountHolder] = useState('');

  // Specific fields for Purchase (Đề xuất mua sắm / Đơn mua hàng)
  const [purchaseItemName, setPurchaseItemName] = useState('');
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  
  // Specific fields for Late/Early Leave
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [hasVat, setHasVat] = useState(false);

  // Specific fields for Business Trip
  const [tripLocation, setTripLocation] = useState('');
  const [tripImages, setTripImages] = useState<string[]>([]);
  const [isUploadingTripImages, setIsUploadingTripImages] = useState(false);

  // Specific fields for Compensatory Work (Làm bù)
  const [targetLeaveDate, setTargetLeaveDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [targetLeaveRate, setTargetLeaveRate] = useState<number>(1.0);
  const [compensationMode, setCompensationMode] = useState<'SINGLE' | 'SPLIT_2'>('SINGLE');

  // Slot 1
  const [compensatoryDate, setCompensatoryDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [compensatoryShift, setCompensatoryShift] = useState<Shift | null>(null);
  const [compensatoryRate, setCompensatoryRate] = useState<number>(1.0);
  const [compensatoryHours, setCompensatoryHours] = useState<string>('8');

  // Slot 2 (khi chia làm bù 2 ngày)
  const [compensatoryDate2, setCompensatoryDate2] = useState<Date | null>(null);
  const [compensatoryShift2, setCompensatoryShift2] = useState<Shift | null>(null);
  const [compensatoryRate2, setCompensatoryRate2] = useState<number>(0.5);
  const [compensatoryHours2, setCompensatoryHours2] = useState<string>('4');

  const [activeCompSlot, setActiveCompSlot] = useState<1 | 2>(1);
  const [compensatoryType, setCompensatoryType] = useState<string>('Cả ca');
  const [showCompensatoryTypeModal, setShowCompensatoryTypeModal] = useState(false);
  const compensatoryTypes = ['Cả ca', 'Nửa ngày', 'Theo giờ'];
  const [approvedLeaves, setApprovedLeaves] = useState<EmployeeRequest[]>([]);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<EmployeeRequest | null>(null);
  const [isLoadingApprovedLeaves, setIsLoadingApprovedLeaves] = useState(false);
  const [showApprovedLeavesModal, setShowApprovedLeavesModal] = useState(false);
  const [isRulesExpanded, setIsRulesExpanded] = useState(true);

  const applyLeaveRequest = (leaveReq: EmployeeRequest) => {
    setSelectedLeaveRequest(leaveReq);
    const meta: any = leaveReq.attachmentMetadata || {};

    // 1. Tự fill ngày nghỉ (targetLeaveDate)
    const rawDate = meta.fromDate || leaveReq.createdAt;
    if (rawDate) {
      const d = new Date(rawDate);
      d.setHours(0, 0, 0, 0);
      setTargetLeaveDate(d);
      setCompensatoryDate(new Date(d));
      const d2 = new Date(d);
      d2.setDate(d2.getDate() + 1);
      setCompensatoryDate2(d2);
    }

    // 2. Tự tính tỷ lệ công và giờ theo hình thức nghỉ
    if (meta.leaveDurationType === 'Theo giờ') {
      let diffHours = 4;
      if (meta.startTime && meta.endTime) {
        const start = new Date(meta.startTime);
        const end = new Date(meta.endTime);
        const diffMs = end.getTime() - start.getTime();
        const calculated = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        if (calculated > 0) diffHours = calculated;
      }
      const rate = Math.min(1.0, Math.round((diffHours / 8) * 100) / 100);
      setTargetLeaveRate(rate);
      setCompensatoryType('Theo giờ');
      setCompensatoryHours(String(diffHours));
      setCompensatoryRate(rate);

      const halfRate = Math.round((rate / 2) * 100) / 100;
      const halfHours = Math.round((diffHours / 2) * 10) / 10;
      setCompensatoryRate2(halfRate);
      setCompensatoryHours2(String(halfHours));
      setCompensationMode('SINGLE');
    } else if (['1/2 ngày', 'Nửa ngày'].includes(meta.leaveDurationType)) {
      setTargetLeaveRate(0.5);
      setCompensatoryType('Nửa ngày');
      setCompensatoryHours('4');
      setCompensatoryRate(0.5);
      // Khi chia làm bù 2 ngày: mỗi ngày là 0.25 công (2 giờ)
      setCompensatoryRate2(0.25);
      setCompensatoryHours2('2');
      setCompensationMode('SINGLE');
    } else {
      // 1 ngày / trong ngày
      setTargetLeaveRate(1.0);
      setCompensatoryType('Cả ca');
      setCompensatoryHours('8');
      setCompensatoryRate(1.0);
      // Khi chia làm bù 2 ngày: mỗi ngày là 0.5 công (4 giờ)
      setCompensatoryRate2(0.5);
      setCompensatoryHours2('4');
      setCompensationMode('SINGLE');
    }
  };

  // Specific fields for Leave & Explanation
  const [leaveDurationType, setLeaveDurationType] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [explanationType, setExplanationType] = useState('');
  const [handoverEmployee, setHandoverEmployee] = useState<EmployeeUser | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [toDate, setToDate] = useState<Date | null>(null);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);

  // Modal states
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<number>(8);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [timePickerTab, setTimePickerTab] = useState<'hour' | 'minute'>('hour');
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState<'start' | 'end' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | 'single' | 'target_leave' | 'compensatory' | 'compensatory2' | null>(null);
  const [showLeaveDurationModal, setShowLeaveDurationModal] = useState(false);
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [showExplanationTypeModal, setShowExplanationTypeModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [isFullScreenPhoto, setIsFullScreenPhoto] = useState(false);
  const [apiShifts, setApiShifts] = useState<Shift[]>([]);
  const [apiEmployees, setApiEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

  const handleOpenDatePicker = (mode: 'from' | 'to' | 'single' | 'target_leave' | 'compensatory' | 'compensatory2') => {
    let initialDate = new Date();
    if (mode === 'from' && fromDate) initialDate = new Date(fromDate);
    if (mode === 'to' && toDate) initialDate = new Date(toDate);
    if (mode === 'single' && fromDate) initialDate = new Date(fromDate);
    if (mode === 'target_leave' && targetLeaveDate) initialDate = new Date(targetLeaveDate);
    if (mode === 'compensatory' && compensatoryDate) initialDate = new Date(compensatoryDate);
    if (mode === 'compensatory2') {
      if (compensatoryDate2) initialDate = new Date(compensatoryDate2);
      else if (compensatoryDate) {
        const nextD = new Date(compensatoryDate);
        nextD.setDate(nextD.getDate() + 1);
        initialDate = nextD;
      }
    }
    setCalendarViewDate(initialDate);
    setShowDatePicker(mode);
  };

  const handleOpenTimePicker = (mode: 'start' | 'end') => {
    const existing = mode === 'start' ? startTime : endTime;
    const baseDate = (mode === 'start' ? fromDate : (toDate || fromDate)) || new Date();
    const initialTime = existing ? new Date(existing) : new Date(baseDate);
    if (!existing) {
      initialTime.setHours(mode === 'start' ? 8 : 17, mode === 'start' ? 0 : 30, 0, 0);
    }

    // Trên điện thoại Android: Sử dụng trực tiếp Dialog Đồng hồ mặc định của hệ thống
    if (Platform.OS === 'android') {
      try {
        DateTimePickerAndroid.open({
          value: initialTime,
          mode: 'time',
          is24Hour: true,
          display: 'clock',
          onChange: (event: any, selectedDate?: Date) => {
            if (event.type === 'set' && selectedDate) {
              const res = new Date(baseDate);
              res.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
              if (mode === 'start') {
                setStartTime(res);
              } else {
                setEndTime(res);
              }
            }
          },
        });
        return;
      } catch (err) {
        console.warn('Native Android DateTimePicker error:', err);
      }
    }

    // Dự phòng cho iOS hoặc Web
    setSelectedHour(initialTime.getHours());
    setSelectedMinute(initialTime.getMinutes());
    setTimePickerTab('hour');
    setShowTimeModal(mode);
  };

  const handleStepHour = (delta: number) => {
    setSelectedHour((prev) => (prev + delta + 24) % 24);
  };

  const handleStepMinute = (delta: number) => {
    setSelectedMinute((prev) => (prev + delta + 60) % 60);
  };

  const handleSelectHour = (h: number) => {
    setSelectedHour(h);
    setTimePickerTab('minute');
  };

  const leaveDurationTypes = ["1/2 ngày", "Trong ngày", "Nhiều ngày", "Theo giờ"];
  const leaveTypes = ["Nghỉ phép năm", "Nghỉ ốm", "Nghỉ không lương", "Thai sản", "Khác"];
  const explanationTypes = [
    "Quên Check-in",
    "Quên Check-out",
    "Quên cả In & Out",
    "Check-in muộn",
    "Check-out sớm",
    "Check-in muộn & Check-out sớm",
    "Lỗi hệ thống/máy chấm công",
    "Đi công tác/Làm việc bên ngoài",
  ];

  const reasonRef = React.useRef<TextInput>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLeave = selectedType === 'LEAVE';
  const isCompensatory = selectedType === 'COMPENSATORY_WORK';
  const isExplanation = selectedType === 'ATTENDANCE_ADJUSTMENT';
  const isBusinessTrip = selectedType === 'BUSINESS_TRIP';
  const isOvertime = selectedType === 'OVERTIME';
  const isLateOrEarly = selectedType === 'LATE_ARRIVAL' || selectedType === 'EARLY_LEAVE';
  const isPurchase = selectedType === 'PURCHASE';
  const isAdvance = selectedType === 'ADVANCE';
  const isExpense = selectedType === 'EXPENSE';
  const isFinancial = isAdvance || isExpense;

  // Pre-fill user profile bank info when selecting ADVANCE
  useEffect(() => {
    if (user) {
      const userMeta = (user as any)?.profile || user;
      if (userMeta?.fullName && !advanceAccountHolder) {
        setAdvanceAccountHolder(userMeta.fullName.toUpperCase());
      }
      if (userMeta?.bankName && !advanceBankName) {
        setAdvanceBankName(userMeta.bankName);
      }
      if ((userMeta?.bankAccountNumber || userMeta?.bankAccount) && !advanceBankAccount) {
        setAdvanceBankAccount(userMeta.bankAccountNumber || userMeta.bankAccount);
      }
    }
  }, [user, isAdvance]);

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
    if (isLateOrEarly || isExplanation || isOvertime || isCompensatory) {
      getShifts()
        .then(setApiShifts)
        .catch(err => console.log('Error fetching shifts', err));
    }
    void fetchEmployeesList();
  }, [isLateOrEarly, isLeave, isExplanation, isOvertime, isCompensatory, fetchEmployeesList]);

  // Tự động tìm nạp các đơn nghỉ phép đã duyệt trong 14 ngày gần nhất khi tạo đơn Làm bù
  React.useEffect(() => {
    if (selectedType === 'COMPENSATORY_WORK') {
      setIsLoadingApprovedLeaves(true);
      getMyEmployeeRequests({
        type: 'LEAVE',
        status: 'APPROVED',
        limit: 20,
      })
        .then((res) => {
          const items = res.items || [];
          const fourteenDaysAgo = new Date();
          fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
          fourteenDaysAgo.setHours(0, 0, 0, 0);

          const eligible = items.filter((item) => {
            const meta: any = item.attachmentMetadata || {};
            const itemDate = new Date(meta.fromDate || item.createdAt || new Date());
            return itemDate.getTime() >= fourteenDaysAgo.getTime();
          });

          eligible.sort((a, b) => {
            const dateA = new Date((a.attachmentMetadata as any)?.fromDate || a.createdAt || 0).getTime();
            const dateB = new Date((b.attachmentMetadata as any)?.fromDate || b.createdAt || 0).getTime();
            return dateB - dateA;
          });

          setApprovedLeaves(eligible);

          if (eligible.length > 0 && eligible[0]) {
            applyLeaveRequest(eligible[0]);
          } else {
            setSelectedLeaveRequest(null);
          }
        })
        .catch((err) => {
          console.log('Error fetching approved leaves:', err);
        })
        .finally(() => {
          setIsLoadingApprovedLeaves(false);
        });
    }
  }, [selectedType]);



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

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Pick photo error:', err);
      showAlert('Lỗi', 'Không thể chọn ảnh từ máy.');
    }
  };

  const handlePickTripImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingTripImages(true);
        const newUrls: string[] = [];
        for (const asset of result.assets) {
          if (asset.uri) {
            try {
              const uploadRes = await uploadFile({
                uri: asset.uri,
                name: `business_trip_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`,
                mimeType: 'image/jpeg',
                purpose: 'TASK_ATTACHMENT'
              });
              if (uploadRes?.fileUrl) {
                newUrls.push(uploadRes.fileUrl);
              }
            } catch (err) {
              console.log('Upload trip image error:', err);
            }
          }
        }
        setTripImages(prev => [...prev, ...newUrls]);
      }
    } catch (err) {
      console.log('Pick trip images error:', err);
      showAlert('Lỗi', 'Không thể chọn ảnh từ thư viện.');
    } finally {
      setIsUploadingTripImages(false);
    }
  };

  const handleTakeTripPhoto = async () => {
    const hasPermission = await requestCameraPermissionWithFallback();
    if (!hasPermission) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
        setIsUploadingTripImages(true);
        const uploadRes = await uploadFile({
          uri: result.assets[0].uri,
          name: `business_trip_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          purpose: 'TASK_ATTACHMENT'
        });
        if (uploadRes?.fileUrl) {
          setTripImages(prev => [...prev, uploadRes.fileUrl]);
        }
      }
    } catch (err) {
      console.log('Camera trip photo error:', err);
      showAlert('Lỗi', 'Không thể chụp ảnh.');
    } finally {
      setIsUploadingTripImages(false);
    }
  };

  const handleRemoveTripImage = (indexToRemove: number) => {
    setTripImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const calendarYear = calendarViewDate.getFullYear();
  const calendarMonth = calendarViewDate.getMonth(); // 0-indexed

  const handlePrevMonth = () => {
    setCalendarViewDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const chosen = new Date(calendarYear, calendarMonth, day, 12, 0, 0, 0);
    if (showDatePicker === 'from' || showDatePicker === 'single') {
      setFromDate(chosen);
      if (showDatePicker === 'from' && toDate) {
        const toNormalized = new Date(toDate);
        toNormalized.setHours(12, 0, 0, 0);
        if (chosen.getTime() > toNormalized.getTime()) {
          setToDate(null);
        }
      }
    } else if (showDatePicker === 'to') {
      setToDate(chosen);
    } else if (showDatePicker === 'target_leave') {
      setTargetLeaveDate(chosen);
      if (compensatoryDate && (chosen.getMonth() !== compensatoryDate.getMonth() || chosen.getFullYear() !== compensatoryDate.getFullYear())) {
        showAlert('Lưu ý', `Ngày nghỉ (${chosen.getDate()}/${chosen.getMonth() + 1}) khác tháng với ngày làm bù. Vui lòng chọn lại ngày làm bù trong cùng tháng ${chosen.getMonth() + 1}/${chosen.getFullYear()}.`);
        setCompensatoryDate(null);
      }
    } else if (showDatePicker === 'compensatory') {
      if (targetLeaveDate && (chosen.getMonth() !== targetLeaveDate.getMonth() || chosen.getFullYear() !== targetLeaveDate.getFullYear())) {
        showAlert('Không hợp lệ', `Ngày làm bù (${chosen.getDate()}/${chosen.getMonth() + 1}) phải nằm trong cùng tháng ${targetLeaveDate.getMonth() + 1}/${targetLeaveDate.getFullYear()} với ngày nghỉ. Không cho phép làm bù chéo tháng.`);
        setShowDatePicker(null);
        return;
      }
      if (compensationMode === 'SPLIT_2' && compensatoryDate2) {
        if (chosen.getDate() === compensatoryDate2.getDate() && chosen.getMonth() === compensatoryDate2.getMonth() && chosen.getFullYear() === compensatoryDate2.getFullYear()) {
          showAlert('Trùng ngày', 'Ngày làm bù ca 1 không được trùng với ca 2. Mỗi ngày chỉ được xếp 1 ca làm bù.');
          setShowDatePicker(null);
          return;
        }
      }
      setCompensatoryDate(chosen);
    } else if (showDatePicker === 'compensatory2') {
      if (targetLeaveDate && (chosen.getMonth() !== targetLeaveDate.getMonth() || chosen.getFullYear() !== targetLeaveDate.getFullYear())) {
        showAlert('Không hợp lệ', `Ngày làm bù ca 2 (${chosen.getDate()}/${chosen.getMonth() + 1}) phải nằm trong cùng tháng ${targetLeaveDate.getMonth() + 1}/${targetLeaveDate.getFullYear()} với ngày nghỉ. Không cho phép làm bù chéo tháng.`);
        setShowDatePicker(null);
        return;
      }
      if (compensatoryDate) {
        if (chosen.getDate() === compensatoryDate.getDate() && chosen.getMonth() === compensatoryDate.getMonth() && chosen.getFullYear() === compensatoryDate.getFullYear()) {
          showAlert('Trùng ngày', 'Ngày làm bù ca 2 không được trùng với ca 1. Mỗi ngày chỉ được xếp 1 ca làm bù.');
          setShowDatePicker(null);
          return;
        }
      }
      setCompensatoryDate2(chosen);
    }
    setShowDatePicker(null);
  };

  const handleQuickDateSelect = (daysOffset: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    target.setHours(12, 0, 0, 0);
    if (showDatePicker === 'from' || showDatePicker === 'single') {
      setFromDate(target);
      if (showDatePicker === 'from' && toDate) {
        const toNormalized = new Date(toDate);
        toNormalized.setHours(0, 0, 0, 0);
        if (target.getTime() > toNormalized.getTime()) {
          setToDate(null);
        }
      }
    } else if (showDatePicker === 'to') {
      setToDate(target);
    } else if (showDatePicker === 'target_leave') {
      setTargetLeaveDate(target);
    } else if (showDatePicker === 'compensatory') {
      setCompensatoryDate(target);
    } else if (showDatePicker === 'compensatory2') {
      setCompensatoryDate2(target);
    }
    setShowDatePicker(null);
  };

  const currentPickerTime = useMemo(() => {
    if (showTimeModal === 'start') {
      if (startTime) return startTime;
      const d = new Date(fromDate || new Date());
      d.setHours(8, 0, 0, 0);
      return d;
    }
    if (showTimeModal === 'end') {
      if (endTime) return endTime;
      const d = new Date(toDate || fromDate || new Date());
      d.setHours(17, 30, 0, 0);
      return d;
    }
    return new Date();
  }, [showTimeModal, startTime, endTime, fromDate, toDate]);

  const handleNativeTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimeModal(null);
    }
    if (selectedDate && (event.type === 'set' || Platform.OS === 'ios')) {
      const baseDate = (showTimeModal === 'start' ? fromDate : (toDate || fromDate)) || new Date();
      const resultTime = new Date(baseDate);
      resultTime.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);

      if (showTimeModal === 'start') {
        setStartTime(resultTime);
      } else if (showTimeModal === 'end') {
        setEndTime(resultTime);
      }
    }
  };

  const handleConfirmTime = () => {
    const baseDate = (showTimeModal === 'start' ? fromDate : (toDate || fromDate)) || new Date();
    const resultTime = new Date(baseDate);
    resultTime.setHours(selectedHour, selectedMinute, 0, 0);
    if (showTimeModal === 'start') {
      setStartTime(resultTime);
    } else {
      setEndTime(resultTime);
    }
    setShowTimeModal(null);
  };

  const handleSelectPresetTime = (h: number, m: number) => {
    setSelectedHour(h);
    setSelectedMinute(m);
    const baseDate = (showTimeModal === 'start' ? fromDate : (toDate || fromDate)) || new Date();
    const resultTime = new Date(baseDate);
    resultTime.setHours(h, m, 0, 0);
    if (showTimeModal === 'start') {
      setStartTime(resultTime);
    } else {
      setEndTime(resultTime);
    }
    setShowTimeModal(null);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatLocalDateYMD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSelectShift = (selectedShift: Shift) => {
    if (isCompensatory) {
      if (activeCompSlot === 2) {
        setCompensatoryShift2(selectedShift);
      } else {
        setCompensatoryShift(selectedShift);
      }
    } else {
      setShift(selectedShift);
    }
    setShowShiftModal(false);
  };

  const handleSubmit = async () => {
    let generatedTitle = title.trim();

    if (!generatedTitle) {
      const typeConfig = REQUEST_TYPES.find(t => t.type === selectedType);
      const typeLabel = typeConfig ? typeConfig.label : 'Yêu cầu';
      const dateStr = fromDate ? formatDate(fromDate) : new Date().toLocaleDateString('vi-VN');
      
      if (isBusinessTrip) {
        const toDateStr = toDate ? formatDate(toDate) : dateStr;
        generatedTitle = `Đi công tác: ${tripLocation.trim() || 'Công tác'} (${dateStr} - ${toDateStr})`;
      } else if (isExplanation && explanationType) {
        generatedTitle = `Giải trình: ${explanationType} - ${dateStr}`;
      } else if (isLeave && leaveType) {
        generatedTitle = `Nghỉ phép: ${leaveType} - ${dateStr}`;
      } else if (isCompensatory) {
        const targetDateStr = targetLeaveDate ? formatDate(targetLeaveDate) : '';
        if (compensationMode === 'SPLIT_2') {
          const compDate1Str = compensatoryDate ? formatDate(compensatoryDate) : '';
          const compDate2Str = compensatoryDate2 ? formatDate(compensatoryDate2) : '';
          generatedTitle = `[LÀM BÙ] Làm bù 2 ngày (${compDate1Str} & ${compDate2Str})${targetDateStr ? ` cho ngày ${targetDateStr}` : ''}`;
        } else {
          const compDateStr = compensatoryDate ? formatDate(compensatoryDate) : '';
          const shiftName = compensatoryShift?.name || (compensatoryType === 'Theo giờ' ? `${compensatoryHours}h` : 'ca làm');
          generatedTitle = `[LÀM BÙ] Làm bù ${shiftName}${compDateStr ? ` ngày ${compDateStr}` : ''}${targetDateStr ? ` cho ngày ${targetDateStr}` : ''}`;
        }
      } else if (isPurchase) {
        generatedTitle = `[Mua sắm] ${purchaseItemName.trim() || 'Vật tư'} (SL: ${purchaseQuantity.trim() || '1'})`;
      } else if (isAdvance) {
        const now = fromDate || new Date();
        generatedTitle = `[TẠM ỨNG LƯƠNG] Đề xuất tạm ứng lương tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
      } else if (isExpense) {
        generatedTitle = `${typeLabel} - ${amount ? Number(amount).toLocaleString('vi-VN') + ' VNĐ' : ''}`;
      } else {
        generatedTitle = `${typeLabel} - ${dateStr}`;
      }
    }

    if (isBusinessTrip) {
      if (!tripLocation.trim()) {
        showAlert('Lỗi', 'Vui lòng nhập Địa điểm / Vị trí công tác.');
        return;
      }
      if (!fromDate) {
        showAlert('Lỗi', 'Vui lòng chọn Ngày bắt đầu công tác.');
        return;
      }
      if (!toDate) {
        showAlert('Lỗi', 'Vui lòng chọn Ngày kết thúc công tác.');
        return;
      }
      const fromDay = new Date(fromDate);
      fromDay.setHours(0, 0, 0, 0);
      const toDay = new Date(toDate);
      toDay.setHours(0, 0, 0, 0);
      if (toDay.getTime() < fromDay.getTime()) {
        showAlert('Lỗi', 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
        return;
      }
    }

    if (isPurchase) {
      if (!purchaseItemName.trim()) {
        showAlert('Lỗi', 'Vui lòng nhập Tên sản phẩm / vật phẩm cần mua.');
        return;
      }
      if (!purchaseQuantity.trim()) {
        showAlert('Lỗi', 'Vui lòng nhập Số lượng.');
        return;
      }
      if (!fromDate) {
        showAlert('Lỗi', 'Vui lòng chọn Ngày cần có.');
        return;
      }
      if (!content.trim()) {
        showAlert('Lỗi', 'Vui lòng nhập Lý do / Mục đích sử dụng.');
        return;
      }
    }

    if (isAdvance) {
      if (!amount.trim() || Number(amount) <= 0) {
        showAlert('Lỗi', 'Vui lòng nhập số tiền muốn tạm ứng.');
        return;
      }
      if (!content.trim()) {
        showAlert('Thiếu thông tin', 'Vui lòng nhập lý do tạm ứng lương.');
        return;
      }
      if (!advanceBankAccount.trim()) {
        showAlert('Thiếu thông tin', 'Vui lòng nhập số tài khoản nhận tiền.');
        return;
      }
    }

    if (!content.trim() && !isCompensatory) {
      showAlert('Lỗi', isBusinessTrip ? 'Vui lòng nhập Mục đích / Kế hoạch công tác chi tiết.' : 'Vui lòng nhập Lý do/Nội dung chi tiết.');
      return;
    }
    if (isExpense && !amount.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập Số tiền cho loại đơn này.');
      return;
    }
    if (isLeave) {
      if (!leaveDurationType || !leaveType || !fromDate) {
        showAlert('Lỗi', 'Vui lòng nhập đầy đủ thông tin Loại nghỉ, Ngày nghỉ');
        return;
      }
      if (leaveDurationType === 'Nhiều ngày') {
        if (!toDate) {
          showAlert('Lỗi', 'Vui lòng chọn Ngày kết thúc');
          return;
        }
        const fromDay = new Date(fromDate);
        fromDay.setHours(0, 0, 0, 0);
        const toDay = new Date(toDate);
        toDay.setHours(0, 0, 0, 0);
        if (toDay.getTime() < fromDay.getTime()) {
          showAlert('Lỗi', 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
          return;
        }
      }
      if (leaveDurationType === 'Theo giờ') {
        if (!startTime) {
          showAlert('Lỗi', 'Vui lòng chọn Giờ bắt đầu nghỉ.');
          return;
        }
        if (!endTime) {
          showAlert('Lỗi', 'Vui lòng chọn Giờ kết thúc nghỉ.');
          return;
        }

        const leaveStart = new Date(fromDate);
        leaveStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

        const now = new Date();
        const diffMinutes = (leaveStart.getTime() - now.getTime()) / (1000 * 60);

        if (diffMinutes < 180) {
          showAlert('Chưa đủ điều kiện', 'Đối với hình thức nghỉ theo giờ, bạn phải tạo đơn trước thời điểm bắt đầu nghỉ ít nhất 3 tiếng.');
          return;
        }

        const leaveEnd = new Date(fromDate);
        leaveEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
        if (leaveEnd.getTime() <= leaveStart.getTime()) {
          showAlert('Lỗi', 'Giờ kết thúc nghỉ phải sau giờ bắt đầu nghỉ.');
          return;
        }
      } else {
        // Nghỉ theo ngày: "Trong ngày", "1/2 ngày", "Nửa ngày", "Nhiều ngày"
        let totalDays = 1;
        if (leaveDurationType === 'Nhiều ngày' && toDate) {
          const fromD = new Date(fromDate);
          fromD.setHours(0, 0, 0, 0);
          const toD = new Date(toDate);
          toD.setHours(0, 0, 0, 0);
          totalDays = Math.max(1, Math.round((toD.getTime() - fromD.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }

        const leaveStart = new Date(fromDate);
        if (startTime) {
          leaveStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        } else {
          leaveStart.setHours(8, 0, 0, 0);
        }

        const now = new Date();
        const diffHours = (leaveStart.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (totalDays >= 2) {
          if (diffHours < 72) {
            showAlert(
              'Chưa đủ điều kiện',
              'Đối với đơn xin nghỉ từ 2 ngày trở lên, bạn phải tạo đơn trước ngày bắt đầu nghỉ ít nhất 3 ngày (72 tiếng).'
            );
            return;
          }
        } else {
          if (diffHours < 24) {
            showAlert(
              'Chưa đủ điều kiện',
              'Đối với đơn xin nghỉ 1 ngày (hoặc nửa ngày), bạn phải tạo đơn trước thời điểm bắt đầu nghỉ ít nhất 24 tiếng (1 ngày).'
            );
            return;
          }
        }
      }
    }
    if (isCompensatory) {
      if (approvedLeaves.length === 0 && !selectedLeaveRequest) {
        showAlert('Chưa đủ điều kiện', 'Bạn không có đơn nghỉ phép nào đã được duyệt trong 14 ngày qua để thực hiện làm bù.');
        return;
      }
      if (!targetLeaveDate) {
        showAlert('Lỗi', 'Vui lòng chọn Ngày nghỉ cần làm bù.');
        return;
      }
      if (!compensatoryDate || !compensatoryShift) {
        showAlert('Lỗi', 'Vui lòng chọn Ngày và Ca làm bù thứ nhất.');
        return;
      }
      if (targetLeaveDate && compensatoryDate) {
        if (
          targetLeaveDate.getMonth() !== compensatoryDate.getMonth() ||
          targetLeaveDate.getFullYear() !== compensatoryDate.getFullYear()
        ) {
          showAlert(
            'Không hợp lệ',
            `Ngày làm bù (${compensatoryDate.getDate()}/${compensatoryDate.getMonth() + 1}/${compensatoryDate.getFullYear()}) và ngày nghỉ (${targetLeaveDate.getDate()}/${targetLeaveDate.getMonth() + 1}/${targetLeaveDate.getFullYear()}) phải nằm trong cùng một tháng. Hệ thống không cho phép làm bù chéo tháng.`,
          );
          return;
        }
      }
      if (compensationMode === 'SPLIT_2') {
        if (!compensatoryDate2 || !compensatoryShift2) {
          showAlert('Lỗi', 'Vui lòng chọn Ngày và Ca làm bù thứ hai.');
          return;
        }
        if (
          targetLeaveDate.getMonth() !== compensatoryDate2.getMonth() ||
          targetLeaveDate.getFullYear() !== compensatoryDate2.getFullYear()
        ) {
          showAlert(
            'Không hợp lệ',
            `Ngày làm bù thứ 2 (${compensatoryDate2.getDate()}/${compensatoryDate2.getMonth() + 1}/${compensatoryDate2.getFullYear()}) phải nằm trong cùng tháng với ngày nghỉ.`,
          );
          return;
        }
        if (
          compensatoryDate.getDate() === compensatoryDate2.getDate() &&
          compensatoryDate.getMonth() === compensatoryDate2.getMonth() &&
          compensatoryDate.getFullYear() === compensatoryDate2.getFullYear()
        ) {
          showAlert('Không hợp lệ', 'Hai ca làm bù phải được chọn vào 2 ngày khác nhau (do mỗi ngày chỉ được xếp 1 ca làm bù).');
          return;
        }
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
    if (isExplanation) {
      if (!explanationType) {
        showAlert('Lỗi', 'Vui lòng chọn Loại giải trình.');
        return;
      }
      if (!fromDate) {
        showAlert('Lỗi', 'Vui lòng chọn Ngày áp dụng.');
        return;
      }
      if (!shift) {
        showAlert('Lỗi', 'Vui lòng chọn Ca làm việc.');
        return;
      }
      if (['Quên Check-in', 'Quên cả In & Out', 'Check-in muộn', 'Check-in muộn & Check-out sớm'].includes(explanationType) && !startTime) {
        showAlert('Lỗi', 'Vui lòng chọn Giờ vào thực tế.');
        return;
      }
      if (['Quên Check-out', 'Quên cả In & Out', 'Check-out sớm', 'Check-in muộn & Check-out sớm'].includes(explanationType) && !endTime) {
        showAlert('Lỗi', 'Vui lòng chọn Giờ ra thực tế.');
        return;
      }
      if (['Quên cả In & Out', 'Check-in muộn & Check-out sớm'].includes(explanationType) && startTime && endTime) {
        if (endTime.getTime() <= startTime.getTime()) {
          showAlert('Lỗi', 'Giờ ra thực tế phải sau giờ vào thực tế.');
          return;
        }
      }
    }

    if (selectedType === 'EXPENSE') {
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
        ...(isAdvance ? {
          month: (fromDate || new Date()).getMonth() + 1,
          year: (fromDate || new Date()).getFullYear(),
          bankName: advanceBankName.trim() || 'Ngân hàng',
          bankAccount: advanceBankAccount.trim(),
          accountHolder: advanceAccountHolder.trim(),
          requestTypeCategory: 'SALARY_ADVANCE_50_PERCENT',
        } : {}),
        ...(selectedType === 'EXPENSE' ? { hasVat: Boolean(hasVat), vatInvoiceUrl: uploadedUrl || undefined } : {}),
        ...(isPurchase ? {
          itemName: purchaseItemName.trim(),
          quantity: purchaseQuantity.trim(),
          neededDate: fromDate ? fromDate.toISOString() : undefined,
        } : {}),
        ...(isBusinessTrip ? {
          location: tripLocation.trim(),
          images: tripImages,
          ...(tripImages.length > 0 ? { image: tripImages[0] } : {})
        } : {}),
        ...(fromDate ? { fromDate: fromDate.toISOString() } : {}),
        ...(toDate ? { toDate: toDate.toISOString() } : {}),
        ...(fromDate && startTime ? {
          startTime: (() => {
            const d = new Date(fromDate);
            d.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
            return d.toISOString();
          })(),
        } : (startTime ? { startTime: startTime.toISOString() } : {})),
        ...(fromDate && endTime ? {
          endTime: (() => {
            const d = new Date(fromDate);
            d.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
            return d.toISOString();
          })(),
        } : (endTime ? { endTime: endTime.toISOString() } : {})),
        ...(shift ? { shiftName: shift.name, shiftId: shift.id } : {}),
        ...(explanationType ? { explanationType } : {}),
        ...(isExplanation ? {
          requestedCheckInAt: fromDate && startTime ? (() => {
            const d = new Date(fromDate);
            d.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
            return d.toISOString();
          })() : undefined,
          requestedCheckOutAt: fromDate && endTime ? (() => {
            const d = new Date(fromDate);
            d.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
            return d.toISOString();
          })() : undefined,
        } : {}),
        ...(leaveType ? { leaveType } : {}),
        ...(leaveDurationType ? { leaveDurationType } : {}),
        ...(isCompensatory ? {
          requestType: 'COMPENSATORY_WORK',
          targetLeaveDate: formatLocalDateYMD(targetLeaveDate!),
          targetLeaveRate,
          compensationMode,
          compensationShifts: compensationMode === 'SPLIT_2' ? [
            {
              date: formatLocalDateYMD(compensatoryDate!),
              shiftId: compensatoryShift?.id,
              shiftName: compensatoryShift?.name,
              rate: compensatoryRate,
              hours: Number(compensatoryHours) || (compensatoryRate * 8),
            },
            {
              date: formatLocalDateYMD(compensatoryDate2!),
              shiftId: compensatoryShift2?.id,
              shiftName: compensatoryShift2?.name,
              rate: compensatoryRate2,
              hours: Number(compensatoryHours2) || (compensatoryRate2 * 8),
            },
          ] : [
            {
              date: formatLocalDateYMD(compensatoryDate!),
              shiftId: compensatoryShift?.id,
              shiftName: compensatoryShift?.name,
              rate: compensatoryRate,
              hours: Number(compensatoryHours) || (compensatoryRate * 8),
            },
          ],
          compensatoryDate: formatLocalDateYMD(compensatoryDate!),
          compensatoryShiftId: compensatoryShift?.id,
          compensatoryShiftName: compensatoryShift?.name,
          compensatoryRate,
          compensatoryType,
          missedHours: Number(compensatoryHours) || (compensatoryRate * 8),
          leaveRequestId: selectedLeaveRequest?.id,
          leaveRequestTitle: selectedLeaveRequest?.title,
        } : {}),
        ...(handoverEmployee ? {
          handoverEmployee: (handoverEmployee as any).fullName || (handoverEmployee as any).profile?.fullName || (handoverEmployee as any).userCode || 'Nhân sự',
          handoverUserId: handoverEmployee.id
        } : {}),
      };

      await createEmployeeRequest({
        type: selectedType,
        title: generatedTitle,
        content: isCompensatory && !content.trim() 
          ? `Làm bù cho ngày nghỉ ${targetLeaveDate ? formatDate(targetLeaveDate) : ''}`
          : content.trim(),
        referenceId: selectedLeaveRequest?.id,
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
    <View style={{ flex: 1, backgroundColor: '#102739' }}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={false} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#102739' }}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable 
              onPress={() => {
                if (isCompensatory && !params.type) {
                  setSelectedType('ATTENDANCE_ADJUSTMENT');
                } else {
                  router.back();
                }
              }} 
              style={styles.backBtn} 
              hitSlop={12}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Tạo đơn mới</Text>
              <Text style={styles.headerSubtitle}>{isCompensatory ? 'Đăng ký lịch làm bù' : 'Gửi yêu cầu của bạn trong vài bước.'}</Text>
            </View>
            {!isCompensatory && (
              <View style={styles.topAvatarCircle}>
                <Text style={styles.topAvatarText}>{userInitials}</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView 
        style={[styles.curvedSheet, isCompensatory && { backgroundColor: '#FFFFFF' }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isCompensatory ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            {isLoadingApprovedLeaves ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, marginBottom: 12 }}>
                <ActivityIndicator size="small" color="#0284C7" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, color: '#64748B' }}>Đang tìm nạp đơn nghỉ đã duyệt gần nhất...</Text>
              </View>
            ) : approvedLeaves.length === 0 ? (
              <View style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#B91C1C' }}>Chưa có đơn nghỉ hợp lệ</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#991B1B', lineHeight: 18 }}>
                  Bạn chưa có đơn nghỉ phép nào được duyệt trong 14 ngày qua. Đơn làm bù chỉ được tạo khi đơn nghỉ phép tương ứng đã được Leader phê duyệt.
                </Text>
              </View>
            ) : approvedLeaves.length > 1 ? (
              <Pressable
                onPress={() => setShowApprovedLeavesModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F0F9FF',
                  borderWidth: 1,
                  borderColor: '#BAE6FD',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginBottom: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialCommunityIcons name="calendar-sync-outline" size={16} color="#0284C7" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, color: '#0369A1', fontWeight: '600' }} numberOfLines={1}>
                    Đang bù cho: {targetLeaveDate ? formatDate(targetLeaveDate) : 'Đơn nghỉ'} ({targetLeaveRate} công)
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: '700', marginLeft: 8 }}>Đổi</Text>
              </Pressable>
            ) : null}

            {/* Phương án làm bù */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 10 }}>
                Phương án làm bù <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Bù 1 ngày */}
                <Pressable
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: compensationMode === 'SINGLE' ? '#0284C7' : '#E2E8F0',
                    backgroundColor: compensationMode === 'SINGLE' ? '#F0F9FF' : '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => {
                    setCompensationMode('SINGLE');
                    if (targetLeaveRate === 1.0) {
                      setCompensatoryRate(1.0);
                      setCompensatoryHours('8');
                    } else if (targetLeaveRate === 0.5) {
                      setCompensatoryRate(0.5);
                      setCompensatoryHours('4');
                    }
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
                      Bù 1 ngày
                    </Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                      {targetLeaveRate === 1.0 ? '1 ca · 1 công' : targetLeaveRate === 0.5 ? '1 ca · 0.5 công' : `1 ca · ${targetLeaveRate} công`}
                    </Text>
                  </View>
                  {compensationMode === 'SINGLE' ? (
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: '#0284C7',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 1.5,
                      borderColor: '#CBD5E1',
                      backgroundColor: 'transparent',
                    }} />
                  )}
                </Pressable>

                {/* Chia 2 ngày */}
                <Pressable
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: compensationMode === 'SPLIT_2' ? '#0284C7' : '#E2E8F0',
                    backgroundColor: compensationMode === 'SPLIT_2' ? '#F0F9FF' : '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => {
                    setCompensationMode('SPLIT_2');
                    if (targetLeaveRate === 1.0) {
                      setCompensatoryRate(0.5);
                      setCompensatoryHours('4');
                      setCompensatoryRate2(0.5);
                      setCompensatoryHours2('4');
                    } else if (targetLeaveRate === 0.5) {
                      setCompensatoryRate(0.25);
                      setCompensatoryHours('2');
                      setCompensatoryRate2(0.25);
                      setCompensatoryHours2('2');
                    } else {
                      const halfR = Math.round((targetLeaveRate / 2) * 100) / 100;
                      setCompensatoryRate(halfR);
                      setCompensatoryRate2(halfR);
                    }
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
                      Chia 2 ngày
                    </Text>
                    <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                      {targetLeaveRate === 1.0 ? '2 ca · 0.5 công/ca' : targetLeaveRate === 0.5 ? '2 ca · 0.25 công/ca' : `2 ca · ${Math.round((targetLeaveRate / 2) * 100) / 100} công/ca`}
                    </Text>
                  </View>
                  {compensationMode === 'SPLIT_2' ? (
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: '#0284C7',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 1.5,
                      borderColor: '#CBD5E1',
                      backgroundColor: 'transparent',
                    }} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Tiêu đề mục: Lịch làm bù */}
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>
              Lịch làm bù
            </Text>

            {/* Card 1: Ngày làm bù 1 */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 14,
              padding: 16,
              marginBottom: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
              elevation: 1,
            }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0369A1' }}>01</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                    {compensationMode === 'SPLIT_2' ? 'Ngày làm bù 1' : 'Ngày làm bù'}
                  </Text>
                </View>
                <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#0369A1' }}>
                    Dự kiến {compensatoryRate} công
                  </Text>
                </View>
              </View>

              {/* Field 1: Ngày * */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>
                  Ngày <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <Pressable
                  style={{
                    height: 48,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    backgroundColor: '#F8FAFC',
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => handleOpenDatePicker('compensatory')}
                >
                  <Text style={{ fontSize: 14, color: compensatoryDate ? '#0F172A' : '#94A3B8' }}>
                    {compensatoryDate ? formatDate(compensatoryDate) : 'Chọn ngày'}
                  </Text>
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                </Pressable>
              </View>

              {/* Field 2: Ca làm * */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>
                  Ca làm <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <Pressable
                  style={{
                    height: 48,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    backgroundColor: '#F8FAFC',
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => {
                    setActiveCompSlot(1);
                    setShowShiftModal(true);
                  }}
                >
                  <Text style={{ fontSize: 14, color: compensatoryShift ? '#0F172A' : '#94A3B8' }} numberOfLines={1}>
                    {compensatoryShift ? `${compensatoryShift.name} · ${compensatoryShift.startTime} – ${compensatoryShift.endTime}` : 'Chọn ca làm'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                </Pressable>
              </View>
            </View>

            {/* Card 2: Ngày làm bù 2 (khi compensationMode === 'SPLIT_2') */}
            {compensationMode === 'SPLIT_2' && (
              <View style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 14,
                padding: 16,
                marginBottom: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#E0F2FE',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0369A1' }}>02</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                      Ngày làm bù 2
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#0369A1' }}>
                      Dự kiến {compensatoryRate2} công
                    </Text>
                  </View>
                </View>

                {/* Field 1: Ngày * */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>
                    Ngày <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <Pressable
                    style={{
                      height: 48,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      backgroundColor: '#F8FAFC',
                      paddingHorizontal: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onPress={() => handleOpenDatePicker('compensatory2')}
                  >
                    <Text style={{ fontSize: 14, color: compensatoryDate2 ? '#0F172A' : '#94A3B8' }}>
                      {compensatoryDate2 ? formatDate(compensatoryDate2) : 'Chọn ngày'}
                    </Text>
                    <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                  </Pressable>
                </View>

                {/* Field 2: Ca làm * */}
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 }}>
                    Ca làm <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <Pressable
                    style={{
                      height: 48,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      backgroundColor: '#F8FAFC',
                      paddingHorizontal: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onPress={() => {
                      setActiveCompSlot(2);
                      setShowShiftModal(true);
                    }}
                  >
                    <Text style={{ fontSize: 14, color: compensatoryShift2 ? '#0F172A' : '#94A3B8' }} numberOfLines={1}>
                      {compensatoryShift2 ? `${compensatoryShift2.name} · ${compensatoryShift2.startTime} – ${compensatoryShift2.endTime}` : 'Chọn ca làm'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Thông tin tóm tắt tổng số ngày & công dự kiến */}
            <View style={{
              backgroundColor: '#F0F9FF',
              borderWidth: 1,
              borderColor: '#BAE6FD',
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="calendar-check-outline" size={22} color="#0284C7" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0369A1' }}>
                  {compensationMode === 'SPLIT_2' ? '2 ngày làm bù' : '1 ngày làm bù'}
                </Text>
              </View>

              <View style={{ width: 1, height: 22, backgroundColor: '#BAE6FD', marginHorizontal: 12 }} />

              <Text style={{ fontSize: 13, color: '#64748B' }}>
                Tổng dự kiến: <Text style={{ fontWeight: '700', color: '#0369A1' }}>
                  {compensationMode === 'SPLIT_2' 
                    ? Math.round((compensatoryRate + compensatoryRate2) * 100) / 100 
                    : compensatoryRate} công
                </Text>
              </Text>
            </View>

            {/* Accordion: Quy định làm bù */}
            <View style={{
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}>
              <Pressable 
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                onPress={() => setIsRulesExpanded(!isRulesExpanded)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="information-outline" size={22} color="#0284C7" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0369A1' }}>Quy định làm bù</Text>
                </View>
                <MaterialCommunityIcons 
                  name={isRulesExpanded ? "chevron-up" : "chevron-down"} 
                  size={22} 
                  color="#64748B" 
                />
              </Pressable>
              
              {isRulesExpanded && (
                <View style={{ marginTop: 8, paddingLeft: 30 }}>
                  <Text style={{ fontSize: 12.5, color: '#64748B', lineHeight: 20 }}>
                    Ngày làm bù phải cùng tháng với ngày nghỉ.{'\n'}
                    Công thực tế được ghi nhận theo ca hoàn thành.
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <>
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
                <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('single')}>
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
              {['Quên Check-in', 'Quên cả In & Out', 'Check-in muộn', 'Check-in muộn & Check-out sớm', 'Lỗi hệ thống/máy chấm công', 'Đi công tác/Làm việc bên ngoài'].includes(explanationType) && (
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>
                    Giờ vào thực tế {['Quên Check-in', 'Quên cả In & Out', 'Check-in muộn', 'Check-in muộn & Check-out sớm'].includes(explanationType) ? <Text style={styles.required}>*</Text> : null}
                  </Text>
                  <Pressable style={styles.inputBox} onPress={() => handleOpenTimePicker('start')}>
                    <Text style={[styles.inputText, !startTime && styles.inputPlaceholder]}>
                      {startTime ? formatTime(startTime) : 'Chọn giờ vào thực tế'}
                    </Text>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                  </Pressable>
                </View>
              )}

              {/* Giờ ra thực tế */}
              {['Quên Check-out', 'Quên cả In & Out', 'Check-out sớm', 'Check-in muộn & Check-out sớm', 'Lỗi hệ thống/máy chấm công', 'Đi công tác/Làm việc bên ngoài'].includes(explanationType) && (
                <View style={styles.formItem}>
                  <Text style={styles.formLabel}>
                    Giờ ra thực tế {['Quên Check-out', 'Quên cả In & Out', 'Check-out sớm', 'Check-in muộn & Check-out sớm'].includes(explanationType) ? <Text style={styles.required}>*</Text> : null}
                  </Text>
                  <Pressable style={styles.inputBox} onPress={() => handleOpenTimePicker('end')}>
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
          ) : isBusinessTrip ? (
            <>
              {/* Địa điểm / Vị trí công tác */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Địa điểm / Vị trí công tác <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={[styles.inputText, { flex: 1 }]}
                    placeholder="VD: Chi nhánh Đà Nẵng, Khách sạn Melia..."
                    placeholderTextColor="#94A3B8"
                    value={tripLocation}
                    onChangeText={setTripLocation}
                  />
                  <MaterialCommunityIcons name="map-marker-outline" size={20} color="#0284C7" />
                </View>
              </View>

              {/* Lịch trình công tác: Từ ngày -> Đến ngày */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Từ ngày <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('from')}>
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
                <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('to')}>
                  <Text style={[styles.inputText, !toDate && styles.inputPlaceholder]}>
                    {toDate ? formatDate(toDate) : 'Chọn đến ngày'}
                  </Text>
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                </Pressable>
              </View>

              {/* Khung giờ công tác (Tùy chọn) */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.formItem, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Từ giờ (Tùy chọn)</Text>
                  <Pressable style={styles.inputBox} onPress={() => handleOpenTimePicker('start')}>
                    <Text style={[styles.inputText, !startTime && styles.inputPlaceholder]}>
                      {startTime ? formatTime(startTime) : 'Giờ bắt đầu'}
                    </Text>
                    <MaterialCommunityIcons name="clock-outline" size={18} color="#64748B" />
                  </Pressable>
                </View>

                <View style={[styles.formItem, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Đến giờ (Tùy chọn)</Text>
                  <Pressable style={styles.inputBox} onPress={() => handleOpenTimePicker('end')}>
                    <Text style={[styles.inputText, !endTime && styles.inputPlaceholder]}>
                      {endTime ? formatTime(endTime) : 'Giờ kết thúc'}
                    </Text>
                    <MaterialCommunityIcons name="clock-outline" size={18} color="#64748B" />
                  </Pressable>
                </View>
              </View>

              {/* Banner quyền lợi 1 công / ngày */}
              <View style={[styles.approvalWorkflowBanner, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <MaterialCommunityIcons name="airplane" size={16} color="#0284C7" />
                  <Text style={[styles.approvalWorkflowTitle, { color: '#0369A1', marginLeft: 4 }]}>
                    Quyền lợi chấm công
                  </Text>
                </View>
                <Text style={[styles.approvalWorkflowSubtitle, { color: '#0C4A6E' }]}>
                  Sau khi Leader phê duyệt, hệ thống sẽ tự động ghi nhận 1 công/ngày cho các ngày trong lịch trình công tác.
                </Text>
              </View>

              {/* Lý do / Kế hoạch công tác chi tiết */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Mục đích / Kế hoạch công tác chi tiết <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.textAreaBox}>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder="Nhập nội dung công việc, đối tác làm việc, kế hoạch công tác..."
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

              {/* Hình ảnh minh họa / Lịch trình công tác (Multi-image) */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Hình ảnh minh họa / Kế hoạch (Tùy chọn)</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                  <Pressable 
                    style={[styles.photoButton, { flex: 1 }]} 
                    onPress={handlePickTripImages}
                    disabled={isUploadingTripImages}
                  >
                    {isUploadingTripImages ? (
                      <ActivityIndicator size="small" color="#0284C7" />
                    ) : (
                      <MaterialCommunityIcons name="image-multiple-outline" size={20} color="#0284C7" />
                    )}
                    <Text style={[styles.photoButtonText, { color: '#0284C7', fontWeight: '600' }]}>
                      {isUploadingTripImages ? 'Đang tải...' : 'Thư viện ảnh'}
                    </Text>
                  </Pressable>

                  <Pressable 
                    style={[styles.photoButton, { flex: 1 }]} 
                    onPress={handleTakeTripPhoto}
                    disabled={isUploadingTripImages}
                  >
                    <MaterialCommunityIcons name="camera-outline" size={20} color="#475569" />
                    <Text style={styles.photoButtonText}>Chụp ảnh</Text>
                  </Pressable>
                </View>

                {tripImages.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {tripImages.map((imgUri, index) => {
                      const displayUri = resolveFileUrl(imgUri) || imgUri;
                      return (
                        <View key={index} style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F1F5F9' }}>
                          <TouchableOpacity 
                            onPress={() => {
                              setPhotoUri(displayUri);
                              setIsFullScreenPhoto(true);
                            }} 
                            style={{ width: '100%', height: '100%' }}
                          >
                            <Image source={{ uri: displayUri }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.removePhotoBtn} 
                            onPress={() => handleRemoveTripImage(index)}
                          >
                            <MaterialCommunityIcons name="close" size={14} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
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
                    <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('from')}>
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
                    <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('to')}>
                      <Text style={[styles.inputText, !toDate && styles.inputPlaceholder]}>
                        {toDate ? formatDate(toDate) : 'Chọn đến ngày'}
                      </Text>
                      <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                    </Pressable>
                  </View>

                  {leaveDurationType === 'Nhiều ngày' && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      marginBottom: 14,
                      gap: 8,
                    }}>
                      <MaterialCommunityIcons name="information-outline" size={18} color="#2563EB" />
                      <Text style={{ flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 17 }}>
                        Lưu ý: Đơn xin nghỉ từ 2 ngày trở lên cần được tạo trước ngày bắt đầu nghỉ tối thiểu <Text style={{ fontWeight: '700' }}>3 ngày (72 tiếng)</Text>.
                      </Text>
                    </View>
                  )}
                </>
              ) : ['Theo giờ', '1/2 ngày', 'Nửa ngày'].includes(leaveDurationType) ? (
                <>
                  <View style={styles.formItem}>
                    <Text style={styles.formLabel}>
                      Ngày nghỉ <Text style={styles.required}>*</Text>
                    </Text>
                    <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('single')}>
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
                    <Pressable style={styles.inputBox} onPress={() => handleOpenTimePicker('start')}>
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
                    <Pressable style={styles.inputBox} onPress={() => handleOpenTimePicker('end')}>
                      <Text style={[styles.inputText, !endTime && styles.inputPlaceholder]}>
                        {endTime ? formatTime(endTime) : 'Chọn đến giờ'}
                      </Text>
                      <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                    </Pressable>
                  </View>

                  {leaveDurationType === 'Theo giờ' && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      marginBottom: 14,
                      gap: 8,
                    }}>
                      <MaterialCommunityIcons name="information-outline" size={18} color="#2563EB" />
                      <Text style={{ flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 17 }}>
                        Lưu ý: Đơn nghỉ theo giờ cần được tạo trước thời điểm bắt đầu nghỉ tối thiểu <Text style={{ fontWeight: '700' }}>3 tiếng</Text>.
                      </Text>
                    </View>
                  )}

                  {['1/2 ngày', 'Nửa ngày'].includes(leaveDurationType) && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      marginBottom: 14,
                      gap: 8,
                    }}>
                      <MaterialCommunityIcons name="information-outline" size={18} color="#2563EB" />
                      <Text style={{ flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 17 }}>
                        Lưu ý: Đơn xin nghỉ nửa ngày cần được tạo trước thời điểm bắt đầu nghỉ tối thiểu <Text style={{ fontWeight: '700' }}>24 tiếng (1 ngày)</Text>.
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.formItem}>
                    <Text style={styles.formLabel}>
                      Ngày áp dụng <Text style={styles.required}>*</Text>
                    </Text>
                    <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('single')}>
                      <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                        {fromDate ? formatDate(fromDate) : 'Chọn ngày'}
                      </Text>
                      <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                    </Pressable>
                  </View>

                  {leaveDurationType === 'Trong ngày' && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      marginBottom: 14,
                      gap: 8,
                    }}>
                      <MaterialCommunityIcons name="information-outline" size={18} color="#2563EB" />
                      <Text style={{ flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 17 }}>
                        Lưu ý: Đơn xin nghỉ 1 ngày cần được tạo trước ngày bắt đầu nghỉ tối thiểu <Text style={{ fontWeight: '700' }}>24 tiếng (1 ngày)</Text>.
                      </Text>
                    </View>
                  )}
                </>
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
                <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('single')}>
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
                  <Pressable style={styles.inputBox} onPress={() => handleOpenTimePicker('start')}>
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
                  <Pressable style={styles.inputBox} onPress={() => handleOpenTimePicker('end')}>
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
                <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('single')}>
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
                <Pressable style={styles.inputBox} onPress={() => handleOpenTimePicker('start')}>
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
                <Pressable style={styles.inputBox} onPress={() => handleOpenTimePicker('end')}>
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
          ) : isPurchase ? (
            <>
              {/* Tên sản phẩm */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Tên sản phẩm / vật phẩm <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={[styles.inputText, { flex: 1 }]}
                    placeholder="VD: Chuột máy tính, Giấy in A4, Bàn phím..."
                    placeholderTextColor="#94A3B8"
                    value={purchaseItemName}
                    onChangeText={setPurchaseItemName}
                  />
                  <MaterialCommunityIcons name="cart-outline" size={20} color="#0EA5E9" />
                </View>
              </View>

              {/* Số lượng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Số lượng <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={[styles.inputText, { flex: 1 }]}
                    placeholder="VD: 1 chiếc, 5 cái, 2 ram..."
                    placeholderTextColor="#94A3B8"
                    value={purchaseQuantity}
                    onChangeText={setPurchaseQuantity}
                  />
                  <MaterialCommunityIcons name="numeric" size={20} color="#64748B" />
                </View>
              </View>

              {/* Ngày cần có */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Ngày cần có <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('single')}>
                  <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                    {fromDate ? formatDate(fromDate) : 'Chọn ngày cần có'}
                  </Text>
                  <MaterialCommunityIcons name="calendar-clock" size={20} color="#0284C7" />
                </Pressable>
              </View>

              {/* Lý do chi tiết */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Lý do đề xuất <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.textAreaBox}>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder="Nhập lý do / mục đích sử dụng chi tiết..."
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

              {/* Quy trình duyệt Mua sắm */}
              <View style={styles.approvalWorkflowBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <MaterialCommunityIcons name="transit-connection-variant" size={16} color="#0EA5E9" />
                  <Text style={[styles.approvalWorkflowTitle, { color: '#0369A1' }]}>
                    Quy trình: Đề xuất mua hàng
                  </Text>
                </View>
                <Text style={styles.approvalWorkflowSubtitle}>
                  1. Leader PB duyệt ➔ 2. Kế toán duyệt ➔ 3. HR nhận đơn mua hàng
                </Text>
              </View>
            </>
          ) : isAdvance ? (
            <>
              {/* Policy & Notice Banner Card */}
              <View style={styles.advanceNoticeCard}>
                <View style={styles.advanceNoticeCardHeader}>
                  <MaterialCommunityIcons name="shield-alert-outline" size={20} color="#D97706" />
                  <Text style={styles.advanceNoticeCardTitle}>Quy định tạm ứng lương (Tối đa 50%)</Text>
                </View>
                <Text style={styles.advanceNoticeCardText}>
                  Theo quy định công ty, số tiền tạm ứng khuyến nghị không quá 50% mức lương. Đề xuất của bạn sẽ được gửi tới Trưởng bộ phận (Leader) xem xét tính hợp lý và phê duyệt trước khi Kế toán trưởng tiến hành giải ngân.
                </Text>
              </View>

              {/* Workflow 3-Steps Visual */}
              <View style={styles.advanceWorkflowBox}>
                <Text style={styles.advanceWorkflowBoxTitle}>Quy trình xét duyệt tạm ứng 3 bước:</Text>
                <View style={styles.advanceStepsRow}>
                  <View style={styles.advanceStepCol}>
                    <View style={[styles.advanceStepCircle, styles.advanceStepCircleActive]}>
                      <Text style={styles.advanceStepNum}>1</Text>
                    </View>
                    <Text style={styles.advanceStepName}>Đề xuất</Text>
                    <Text style={styles.advanceStepSub}>Nhân viên (Max 50%)</Text>
                  </View>
                  <View style={styles.advanceStepLine} />
                  <View style={styles.advanceStepCol}>
                    <View style={styles.advanceStepCircle}>
                      <Text style={styles.advanceStepNum}>2</Text>
                    </View>
                    <Text style={styles.advanceStepName}>Duyệt</Text>
                    <Text style={styles.advanceStepSub}>Leader bộ phận</Text>
                  </View>
                  <View style={styles.advanceStepLine} />
                  <View style={styles.advanceStepCol}>
                    <View style={[styles.advanceStepCircle, { backgroundColor: '#ECFDF5', borderColor: '#059669' }]}>
                      <Text style={[styles.advanceStepNum, { color: '#059669' }]}>3</Text>
                    </View>
                    <Text style={styles.advanceStepName}>Đi lương</Text>
                    <Text style={styles.advanceStepSub}>Kế toán trưởng chi</Text>
                  </View>
                </View>
              </View>

              {/* Số tiền muốn tạm ứng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Số tiền muốn tạm ứng <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.advanceAmountInputWrap}>
                  <TextInput
                    style={styles.advanceAmountInput}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={amount ? parseInt(amount, 10).toLocaleString('vi-VN') : ''}
                    onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
                  />
                  <Text style={styles.advanceAmountUnit}>VNĐ</Text>
                </View>

                {/* Quick Pick Chips */}
                <View style={styles.advanceChipsRow}>
                  {[1000000, 2000000, 3000000, 5000000].map((quickVal) => (
                    <Pressable
                      key={quickVal}
                      style={[
                        styles.advanceChip,
                        amount === String(quickVal) && styles.advanceChipActive
                      ]}
                      onPress={() => setAmount(String(quickVal))}
                    >
                      <Text
                        style={[
                          styles.advanceChipText,
                          amount === String(quickVal) && styles.advanceChipTextActive
                        ]}
                      >
                        {quickVal.toLocaleString('vi-VN')}đ
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Tháng tạm ứng / Ngày mong muốn nhận */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Ngày mong muốn nhận lương tạm ứng <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('single')}>
                  <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                    {fromDate ? formatDate(fromDate) : 'Chọn ngày'}
                  </Text>
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#475569" />
                </Pressable>
              </View>

              {/* Lý do tạm ứng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Lý do tạm ứng <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.textAreaBox}>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder="Ví dụ: Tạm ứng giải quyết việc gia đình, khám sức khỏe..."
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

              {/* Bank Info Header */}
              <View style={styles.advanceSectionHeaderRow}>
                <MaterialCommunityIcons name="bank-transfer" size={20} color="#059669" />
                <Text style={styles.advanceSectionHeaderTitle}>Tài khoản nhận tiền (Kế toán chi lương)</Text>
              </View>

              {/* Ngân hàng thụ hưởng */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Ngân hàng thụ hưởng</Text>
                <TextInput
                  style={styles.advanceTextInput}
                  value={advanceBankName}
                  onChangeText={setAdvanceBankName}
                  placeholder="Ví dụ: Vietcombank, MBBank, Techcombank..."
                  placeholderTextColor="#94A3B8"
                />

                {/* Bank quick chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.advanceBankChipsScroll}>
                  {COMMON_BANKS.map((b) => (
                    <Pressable
                      key={b}
                      style={[styles.advanceBankChip, advanceBankName === b && styles.advanceBankChipActive]}
                      onPress={() => setAdvanceBankName(b)}
                    >
                      <Text style={[styles.advanceBankChipText, advanceBankName === b && styles.advanceBankChipTextActive]}>
                        {b}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Số tài khoản & Chủ tài khoản */}
              <View style={styles.advanceInputRow}>
                <View style={[styles.formItem, { flex: 1, marginRight: 8, marginBottom: 0 }]}>
                  <Text style={styles.formLabel}>
                    Số tài khoản <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.advanceTextInput}
                    value={advanceBankAccount}
                    onChangeText={setAdvanceBankAccount}
                    placeholder="0123456789"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formItem, { flex: 1.2, marginBottom: 0 }]}>
                  <Text style={styles.formLabel}>Tên chủ tài khoản</Text>
                  <TextInput
                    style={styles.advanceTextInput}
                    value={advanceAccountHolder}
                    onChangeText={(t) => setAdvanceAccountHolder(t.toUpperCase())}
                    placeholder="NGUYEN VAN A"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </>
          ) : isExpense ? (
            <>
              {/* Số tiền */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Số tiền thanh toán (VNĐ) <Text style={styles.required}>*</Text>
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
                  Ngày phát sinh chi phí <Text style={styles.required}>*</Text>
                </Text>
                <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('single')}>
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
                    placeholder="Nhập hạng mục / lý do thanh toán..."
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

              {/* Phân loại Hóa đơn VAT (chỉ dành cho EXPENSE) */}
              <View style={[styles.formItem, { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={[styles.formLabel, { marginBottom: 2 }]}>Hóa đơn VAT</Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      {hasVat 
                        ? 'Đơn có VAT (Duyệt: Leader ➔ Kế toán giải ngân)' 
                        : 'Đơn K° VAT (≤ 2tr: Kế toán | > 2tr: Ban Giám Đốc ➔ Kế toán)'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setHasVat(!hasVat)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: hasVat ? '#10B981' : '#E2E8F0'
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: hasVat ? '#FFFFFF' : '#475569' }}>
                      {hasVat ? 'CÓ VAT' : 'K° VAT'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quy trình duyệt thông minh Movie Legend */}
              <View style={styles.approvalWorkflowBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <MaterialCommunityIcons 
                    name="transit-connection-variant" 
                    size={16} 
                    color={hasVat || Number(amount || 0) <= 2000000 ? '#16A34A' : '#2563EB'} 
                  />
                  <Text style={[styles.approvalWorkflowTitle, { color: hasVat || Number(amount || 0) <= 2000000 ? '#15803D' : '#1E40AF' }]}>
                    {hasVat 
                      ? 'Quy trình: Có hóa đơn VAT' 
                      : Number(amount || 0) > 2000000 
                        ? 'Quy trình: Không VAT trên 2tr (Ban Giám Đốc duyệt)' 
                        : 'Quy trình: Không VAT dưới 2tr (Kế toán chi)'}
                  </Text>
                </View>
                <Text style={styles.approvalWorkflowSubtitle}>
                  {hasVat
                    ? '1. Leader PB duyệt ➔ 2. Kế toán giải ngân'
                    : Number(amount || 0) > 2000000
                      ? '1. Leader PB duyệt ➔ 2. Ban Giám Đốc duyệt ➔ 3. Kế toán chi'
                      : '1. Leader PB duyệt ➔ 2. Kế toán giải ngân'}
                </Text>
              </View>

              {/* Đính kèm minh chứng / hóa đơn */}
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>
                  Ảnh / Tệp minh chứng <Text style={styles.required}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable style={[styles.photoButton, { flex: 1 }]} onPress={handlePickPhoto}>
                    <MaterialCommunityIcons 
                      name={photoUri ? "check-circle" : "image-plus"} 
                      size={20} 
                      color={photoUri ? "#10B981" : "#475569"} 
                    />
                    <Text style={[styles.photoButtonText, photoUri && styles.photoButtonTextSuccess]}>
                      {photoUri ? 'Đã chọn ảnh' : 'Chọn từ máy'}
                    </Text>
                  </Pressable>
                  <Pressable style={[styles.photoButton, { flex: 1 }]} onPress={handleTakePhoto}>
                    <MaterialCommunityIcons 
                      name="camera-outline" 
                      size={20} 
                      color="#475569" 
                    />
                    <Text style={styles.photoButtonText}>Chụp ảnh</Text>
                  </Pressable>
                </View>
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
                <Pressable style={styles.inputBox} onPress={() => handleOpenDatePicker('single')}>
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
        </>
      )}
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
                  const isSelected = isCompensatory
                    ? (activeCompSlot === 2 ? compensatoryShift2?.id === item.id : compensatoryShift?.id === item.id)
                    : shift?.id === item.id;
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

      {/* Modern High-End Time Picker Modal (Hoạt động mượt mà trên mọi nền tảng: Web, iOS, Android) */}
      <Modal visible={showTimeModal !== null} transparent animationType="fade" onRequestClose={() => setShowTimeModal(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTimeModal(null)} />
          <View style={styles.modernTimeModalContent}>
            {/* Header */}
            <View style={styles.timeHeaderRow}>
              <View style={styles.timeHeaderLeft}>
                <View style={styles.timeHeaderIconCircle}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.timeModalTitle}>
                    {showTimeModal === 'start' ? 'Chọn giờ bắt đầu' : 'Chọn giờ kết thúc'}
                  </Text>
                  <Text style={styles.timeModalSubtitle}>Chạm để chỉnh giờ hoặc phút</Text>
                </View>
              </View>
              <Pressable onPress={() => setShowTimeModal(null)} style={styles.modalCloseBtn} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={18} color="#64748B" />
              </Pressable>
            </View>

            {/* Hero Digital Clock Box with Steppers */}
            <View style={styles.heroClockWrap}>
              {/* Hour Box */}
              <View style={styles.clockBlockCol}>
                <Pressable
                  style={[
                    styles.clockDigitalCard,
                    timePickerTab === 'hour' && styles.clockDigitalCardActive,
                  ]}
                  onPress={() => setTimePickerTab('hour')}
                >
                  <Text style={[
                    styles.clockDigitalNum,
                    timePickerTab === 'hour' && styles.clockDigitalNumActive,
                  ]}>
                    {String(selectedHour).padStart(2, '0')}
                  </Text>
                  <Text style={[
                    styles.clockDigitalLabel,
                    timePickerTab === 'hour' && styles.clockDigitalLabelActive,
                  ]}>
                    GIỜ
                  </Text>
                </Pressable>
                <View style={styles.clockStepperRow}>
                  <TouchableOpacity
                    style={styles.clockStepperBtn}
                    onPress={() => handleStepHour(-1)}
                    hitSlop={6}
                  >
                    <MaterialCommunityIcons name="minus" size={16} color="#475569" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.clockStepperBtn}
                    onPress={() => handleStepHour(1)}
                    hitSlop={6}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color="#475569" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Colon */}
              <View style={styles.clockColonWrap}>
                <Text style={styles.clockColonText}>:</Text>
              </View>

              {/* Minute Box */}
              <View style={styles.clockBlockCol}>
                <Pressable
                  style={[
                    styles.clockDigitalCard,
                    timePickerTab === 'minute' && styles.clockDigitalCardActive,
                  ]}
                  onPress={() => setTimePickerTab('minute')}
                >
                  <Text style={[
                    styles.clockDigitalNum,
                    timePickerTab === 'minute' && styles.clockDigitalNumActive,
                  ]}>
                    {String(selectedMinute).padStart(2, '0')}
                  </Text>
                  <Text style={[
                    styles.clockDigitalLabel,
                    timePickerTab === 'minute' && styles.clockDigitalLabelActive,
                  ]}>
                    PHÚT
                  </Text>
                </Pressable>
                <View style={styles.clockStepperRow}>
                  <TouchableOpacity
                    style={styles.clockStepperBtn}
                    onPress={() => handleStepMinute(-5)}
                    hitSlop={6}
                  >
                    <MaterialCommunityIcons name="minus" size={16} color="#475569" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.clockStepperBtn}
                    onPress={() => handleStepMinute(5)}
                    hitSlop={6}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color="#475569" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Segment Tab Switcher */}
            <View style={styles.timeTabSwitcher}>
              <Pressable
                style={[styles.timeTabItem, timePickerTab === 'hour' && styles.timeTabItemActive]}
                onPress={() => setTimePickerTab('hour')}
              >
                <Text style={[styles.timeTabText, timePickerTab === 'hour' && styles.timeTabTextActive]}>
                  Bảng chọn Giờ (00 - 23)
                </Text>
              </Pressable>
              <Pressable
                style={[styles.timeTabItem, timePickerTab === 'minute' && styles.timeTabItemActive]}
                onPress={() => setTimePickerTab('minute')}
              >
                <Text style={[styles.timeTabText, timePickerTab === 'minute' && styles.timeTabTextActive]}>
                  Bảng chọn Phút (:00 - :55)
                </Text>
              </Pressable>
            </View>

            {/* Numeric Grid Container */}
            <View style={styles.timePadContainer}>
              {timePickerTab === 'hour' ? (
                <View>
                  <Text style={styles.timeGroupLabel}>Giờ ban ngày & hành chính</Text>
                  <View style={styles.timeGrid6}>
                    {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => {
                      const isSel = selectedHour === h;
                      return (
                        <TouchableOpacity
                          key={`h-${h}`}
                          style={[styles.timeChip6, isSel && styles.timeChipActive]}
                          onPress={() => handleSelectHour(h)}
                        >
                          <Text style={[styles.timeChipText, isSel && styles.timeChipTextActive]}>
                            {String(h).padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.timeGroupLabel, { marginTop: 10 }]}>Giờ tối & sáng sớm</Text>
                  <View style={styles.timeGrid6}>
                    {[19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5].map((h) => {
                      const isSel = selectedHour === h;
                      return (
                        <TouchableOpacity
                          key={`h-${h}`}
                          style={[styles.timeChip6, isSel && styles.timeChipActive]}
                          onPress={() => handleSelectHour(h)}
                        >
                          <Text style={[styles.timeChipText, isSel && styles.timeChipTextActive]}>
                            {String(h).padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={styles.timeGroupLabel}>Chọn nhanh theo 5 phút</Text>
                  <View style={styles.timeGrid4}>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                      const isSel = selectedMinute === m;
                      return (
                        <TouchableOpacity
                          key={`m-${m}`}
                          style={[styles.timeChip4, isSel && styles.timeChipActive]}
                          onPress={() => setSelectedMinute(m)}
                        >
                          <Text style={[styles.timeChipText4, isSel && styles.timeChipTextActive]}>
                            :{String(m).padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Quick Presets for work shifts */}
            <Text style={[styles.timeGroupLabel, { marginTop: 12 }]}>Khung giờ làm việc phổ biến</Text>
            <View style={styles.presetPillsRow}>
              {[
                { label: '08:00', h: 8, m: 0 },
                { label: '08:30', h: 8, m: 30 },
                { label: '09:00', h: 9, m: 0 },
                { label: '12:00', h: 12, m: 0 },
                { label: '13:30', h: 13, m: 30 },
                { label: '17:30', h: 17, m: 30 },
                { label: '18:00', h: 18, m: 0 },
              ].map((p, idx) => {
                const isCur = selectedHour === p.h && selectedMinute === p.m;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.presetChip, isCur && styles.presetChipActive]}
                    onPress={() => handleSelectPresetTime(p.h, p.m)}
                  >
                    <Text style={[styles.presetChipText, isCur && styles.presetChipTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer Confirm Actions */}
            <View style={styles.timeFooterActions}>
              <TouchableOpacity style={styles.timeCancelBtnNew} onPress={() => setShowTimeModal(null)}>
                <Text style={styles.timeCancelBtnTextNew}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeConfirmBtnNew} onPress={handleConfirmTime}>
                <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.timeConfirmBtnTextNew}>
                  {`Xác nhận ${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

      {/* Compensatory Type Modal */}
      <Modal visible={showCompensatoryTypeModal} transparent animationType="slide">
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.fullScreenModalContent}>
            <View style={styles.fullScreenModalHeader}>
              <Pressable onPress={() => setShowCompensatoryTypeModal(false)} style={{ padding: 8, marginRight: 8 }}>
                <MaterialCommunityIcons name="close" size={24} color="#111827" />
              </Pressable>
              <Text style={styles.fullScreenModalTitle}>Hình thức làm bù</Text>
            </View>
            <FlatList
              data={compensatoryTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.fullScreenModalItem} 
                  onPress={() => { setCompensatoryType(item); setShowCompensatoryTypeModal(false); }}
                >
                  <Text style={styles.fullScreenModalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Approved Leaves Modal */}
      <Modal visible={showApprovedLeavesModal} transparent animationType="slide">
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.fullScreenModalContent}>
            <View style={styles.fullScreenModalHeader}>
              <Pressable onPress={() => setShowApprovedLeavesModal(false)} style={{ padding: 8, marginRight: 8 }}>
                <MaterialCommunityIcons name="close" size={24} color="#111827" />
              </Pressable>
              <Text style={styles.fullScreenModalTitle}>Chọn đơn nghỉ đã duyệt</Text>
            </View>
            <FlatList
              data={approvedLeaves}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
              ListEmptyComponent={
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>
                    Không có đơn nghỉ phép nào đã được duyệt trong 14 ngày qua.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const meta: any = item.attachmentMetadata || {};
                const isSelected = selectedLeaveRequest?.id === item.id;
                const dateStr = meta.fromDate 
                  ? new Date(meta.fromDate).toLocaleDateString('vi-VN') 
                  : (item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '');
                const durationType = meta.leaveDurationType || 'Nghỉ phép';
                let timeRange = '';
                if (meta.startTime && meta.endTime) {
                  const s = new Date(meta.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  const e = new Date(meta.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  timeRange = `${s} - ${e}`;
                }

                return (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isSelected ? '#86EFAC' : '#E2E8F0',
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 10,
                    }}
                    onPress={() => {
                      applyLeaveRequest(item);
                      setShowApprovedLeavesModal(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, color: '#166534', fontWeight: '700' }}>✓ Đã duyệt</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: '#475569', marginBottom: 2 }}>
                      Ngày nghỉ: <Text style={{ fontWeight: '600', color: '#0F172A' }}>{dateStr}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      Hình thức: <Text style={{ color: '#0284C7', fontWeight: '600' }}>{durationType}</Text>
                      {timeRange ? ` (${timeRange})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              }}
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

      {/* Custom Cross-Platform Calendar Modal */}
      <Modal visible={showDatePicker !== null} transparent animationType="fade" onRequestClose={() => setShowDatePicker(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDatePicker(null)} />
          <View style={styles.calendarModalContent}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ width: 28 }} />
              <Text style={styles.modalTitle}>
                {showDatePicker === 'from' ? 'Chọn ngày bắt đầu' : showDatePicker === 'to' ? 'Chọn ngày kết thúc' : 'Chọn ngày'}
              </Text>
              <Pressable onPress={() => setShowDatePicker(null)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>

            {/* Month / Year Navigator */}
            <View style={styles.calendarNavRow}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn}>
                <MaterialCommunityIcons name="chevron-left" size={24} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {`Tháng ${calendarMonth + 1}, ${calendarYear}`}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn}>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            {/* Day of Week Row */}
            <View style={styles.calendarWeekRow}>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
                <Text key={i} style={[styles.calendarWeekText, (i === 5 || i === 6) && styles.calendarWeekendText]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            {(() => {
              const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
              const rawFirstDay = new Date(calendarYear, calendarMonth, 1).getDay();
              const firstDayOffset = rawFirstDay === 0 ? 6 : rawFirstDay - 1;
              const totalCells = Math.ceil((daysInMonth + firstDayOffset) / 7) * 7;
              
              const activeDate = showDatePicker === 'to' ? toDate : fromDate;
              const today = new Date();

              const cells = [];
              for (let i = 0; i < totalCells; i++) {
                const dayNum = i - firstDayOffset + 1;
                if (dayNum < 1 || dayNum > daysInMonth) {
                  cells.push(<View key={`empty-${i}`} style={styles.calendarDayCell} />);
                } else {
                  const isSelected = activeDate &&
                    activeDate.getFullYear() === calendarYear &&
                    activeDate.getMonth() === calendarMonth &&
                    activeDate.getDate() === dayNum;
                  
                  const isToday = today.getFullYear() === calendarYear &&
                    today.getMonth() === calendarMonth &&
                    today.getDate() === dayNum;

                  cells.push(
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      style={[
                        styles.calendarDayCell,
                        isToday && styles.calendarDayToday,
                        isSelected && styles.calendarDaySelected,
                      ]}
                      onPress={() => handleSelectDay(dayNum)}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          isToday && styles.calendarDayTextToday,
                          isSelected && styles.calendarDayTextSelected,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              }

              return <View style={styles.calendarGrid}>{cells}</View>;
            })()}

            {/* Quick shortcuts */}
            <View style={styles.calendarQuickActions}>
              <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickDateSelect(0)}>
                <Text style={styles.quickDateText}>Hôm nay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickDateBtn} onPress={() => handleQuickDateSelect(1)}>
                <Text style={styles.quickDateText}>Ngày mai</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickDateBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setShowDatePicker(null)}>
                <Text style={[styles.quickDateText, { color: '#64748B' }]}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SafeAreaView edges={['bottom']} style={[styles.footerContainer, isCompensatory && { backgroundColor: '#FFFFFF' }]}>
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
  </View>
  );
}

const styles = StyleSheet.create({
  curvedSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#102739',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 2,
  },
  topAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  topAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#102739',
  },
  sectionHeadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
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
    backgroundColor: '#102739',
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
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
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
    backgroundColor: '#102739',
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  timeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  calendarNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarMonthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarWeekText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  calendarWeekendText: {
    color: '#EF4444',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  calendarDayToday: {
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  calendarDaySelected: {
    backgroundColor: '#102739',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  calendarDayTextToday: {
    color: '#0284C7',
    fontWeight: '700',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  quickDateBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  quickDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
  },
  modernTimeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeHeaderIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeModalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  heroClockWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  clockBlockCol: {
    alignItems: 'center',
  },
  clockDigitalCard: {
    width: 88,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  clockDigitalCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  clockDigitalNum: {
    fontSize: 32,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 1,
  },
  clockDigitalNumActive: {
    color: '#1D4ED8',
  },
  clockDigitalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 1,
  },
  clockDigitalLabelActive: {
    color: '#2563EB',
  },
  clockStepperRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  clockStepperBtn: {
    width: 36,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockColonWrap: {
    paddingHorizontal: 12,
    paddingBottom: 28,
  },
  clockColonText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#64748B',
  },
  timeTabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  timeTabItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
  },
  timeTabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  timeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  timeTabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  timePadContainer: {
    minHeight: 120,
    justifyContent: 'center',
  },
  timeGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  timeGrid6: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  timeChip6: {
    width: '14.8%',
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeGrid4: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  timeChip4: {
    width: '22.8%',
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  timeChipText4: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  presetPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  presetChip: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  presetChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  timeFooterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeCancelBtnNew: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCancelBtnTextNew: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  timeConfirmBtnNew: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  timeConfirmBtnTextNew: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
  // Specific Styles for Tạm Ứng Lương (Matching SalaryAdvanceModal)
  advanceNoticeCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 14,
  },
  advanceNoticeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  advanceNoticeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  advanceNoticeCardText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  advanceWorkflowBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 14,
  },
  advanceWorkflowBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  advanceStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  advanceStepCol: {
    alignItems: 'center',
    flex: 1,
  },
  advanceStepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  advanceStepCircleActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  advanceStepNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  advanceStepName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  advanceStepSub: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 1,
  },
  advanceStepLine: {
    width: 20,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 14,
  },
  advanceAmountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 50,
  },
  advanceAmountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  advanceAmountUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
  },
  advanceChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  advanceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  advanceChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  advanceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  advanceChipTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  advanceSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  advanceSectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  advanceTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
  },
  advanceBankChipsScroll: {
    marginTop: 8,
  },
  advanceBankChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  advanceBankChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  advanceBankChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  advanceBankChipTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  advanceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
});

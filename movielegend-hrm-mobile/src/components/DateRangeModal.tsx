import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DateRangeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (start: Date | null, end: Date | null) => void;
  initialStart?: Date | null;
  initialEnd?: Date | null;
}

export function DateRangeModal({ visible, onClose, onConfirm, initialStart = null, initialEnd = null }: DateRangeModalProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date | null>(initialStart);
  const [endDate, setEndDate] = useState<Date | null>(initialEnd);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDayPress = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    
    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (selectedDate < startDate) {
        setEndDate(startDate);
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '--/--/----';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const isSelected = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    const time = d.getTime();
    const startTime = startDate ? startDate.getTime() : null;
    const endTime = endDate ? endDate.getTime() : null;

    if (startTime === time || endTime === time) return 'selected';
    if (startTime && endTime && time > startTime && time < endTime) return 'inRange';
    return 'none';
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={{ flex: 1, backgroundColor: 'rgba(11, 59, 97, 0.4)', justifyContent: 'center', padding: 16 }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0B3B61' }}>Lọc theo thời gian</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#0B3B61" />
            </Pressable>
          </View>
          
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E6EEF3' }}>
                <Text style={{ fontSize: 12, color: '#98A0A8', marginBottom: 4 }}>Từ ngày</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61' }}>{formatDate(startDate)}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#98A0A8" style={{ marginHorizontal: 8 }} />
              <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E6EEF3' }}>
                <Text style={{ fontSize: 12, color: '#98A0A8', marginBottom: 4 }}>Đến ngày</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61' }}>{formatDate(endDate)}</Text>
              </View>
            </View>

            <View style={{ borderWidth: 1, borderColor: '#E6EEF3', borderRadius: 16, padding: 16 }}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Pressable onPress={prevMonth} style={{ padding: 4 }}>
                     <Ionicons name="chevron-back" size={20} color="#0B3B61" />
                  </Pressable>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0B3B61' }}>
                    Tháng {currentMonth + 1}, {currentYear}
                  </Text>
                  <Pressable onPress={nextMonth} style={{ padding: 4 }}>
                     <Ionicons name="chevron-forward" size={20} color="#0B3B61" />
                  </Pressable>
               </View>

               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                     <View key={d} style={{ width: '13%', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#98A0A8' }}>{d}</Text>
                     </View>
                  ))}
               </View>

               <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {Array.from({length: firstDay}).map((_, i) => (
                     <View key={`empty-${i}`} style={{ width: '14.28%', aspectRatio: 1, marginBottom: 8 }} />
                  ))}
                  {Array.from({length: daysInMonth}).map((_, i) => {
                     const day = i + 1;
                     const status = isSelected(day);
                     const isSel = status === 'selected';
                     const isInRange = status === 'inRange';
                     
                     return (
                        <View key={day} style={{ width: '14.28%', padding: 2 }}>
                          <Pressable 
                            onPress={() => handleDayPress(day)}
                            style={{ 
                              width: '100%', 
                              aspectRatio: 1, 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              backgroundColor: isSel ? '#1E88E5' : isInRange ? '#E3F2FD' : '#F0F8FF', 
                              borderRadius: 8 
                            }}
                          >
                             <Text style={{ 
                               fontSize: 14, 
                               fontWeight: '700', 
                               color: isSel ? '#FFFFFF' : '#1E88E5' 
                             }}>
                               {day}
                             </Text>
                          </Pressable>
                        </View>
                     );
                  })}
               </View>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', padding: 20, paddingTop: 0, gap: 12 }}>
            <Pressable 
              style={{ flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EEF3', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }} 
              onPress={() => {
                setStartDate(null);
                setEndDate(null);
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#98A0A8' }}>Thiết lập lại</Text>
            </Pressable>
            <Pressable 
              style={{ flex: 1.5, backgroundColor: '#1E88E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }} 
              onPress={() => onConfirm(startDate, endDate)}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Xác nhận</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

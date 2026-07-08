import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDepartments } from '../hooks/useDepartments';
import { useScopedEmployees } from '../hooks/useEmployees';

function Dropdown({ label, value, options, onChange, placeholder }: any) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o: any) => o.value === value);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontWeight: '600', marginBottom: 8, color: '#3B4A59' }}>{label}</Text>
      <Pressable onPress={() => setOpen(!open)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, borderWidth: 1, borderColor: '#E6EEF3', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#F7FAFC' }}>
        <Text style={{ color: selectedOption ? '#3B4A59' : '#98A0A8' }}>{selectedOption ? selectedOption.label : placeholder}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color="#98A0A8" />
      </Pressable>
      {open && (
        <View style={{ marginTop: 4, borderWidth: 1, borderColor: '#E6EEF3', borderRadius: 8, backgroundColor: '#FFFFFF', maxHeight: 200 }}>
          <ScrollView nestedScrollEnabled>
            <Pressable onPress={() => { onChange(''); setOpen(false); }} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' }}>
              <Text style={{ color: value === '' ? '#1E88E5' : '#3B4A59', fontWeight: value === '' ? '700' : '400' }}>Tất cả</Text>
            </Pressable>
            {options.map((o: any) => (
              <Pressable key={o.value} onPress={() => { onChange(o.value); setOpen(false); }} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' }}>
                <Text style={{ color: value === o.value ? '#1E88E5' : '#3B4A59', fontWeight: value === o.value ? '700' : '400' }}>{o.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export function TaskFilterModal({ visible, onClose, onApply, currentFilters }: any) {
  const deps = useDepartments({ limit: 100 });
  const emps = useScopedEmployees({ limit: 100, isActive: true });
  const [departmentId, setDepartmentId] = useState(currentFilters.departmentId || '');
  const [assignedUserId, setAssignedUserId] = useState(currentFilters.assignedUserId || '');
  const [createdById, setCreatedById] = useState(currentFilters.createdById || '');

  if (!visible) return null;
  
  const depOptions = deps.data?.items?.map((d: any) => ({ label: d.name, value: d.id })) || [];
  const empOptions = emps.data?.items?.map((e: any) => ({ label: e.profile?.fullName || e.userCode || e.id, value: e.id })) || [];

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 100 }}>
      <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '80%' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0B3B61' }}>Bộ lọc</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color="#98A0A8" /></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          <Dropdown label="Phòng ban" value={departmentId} onChange={setDepartmentId} options={depOptions} placeholder="Chọn phòng ban" />
          <Dropdown label="Người nhận" value={assignedUserId} onChange={setAssignedUserId} options={empOptions} placeholder="Chọn người nhận" />
          <Dropdown label="Người giao" value={createdById} onChange={setCreatedById} options={empOptions} placeholder="Chọn người giao" />
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => { setDepartmentId(''); setAssignedUserId(''); setCreatedById(''); }} style={{ flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#E6EEF3', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontWeight: '600', color: '#3B4A59' }}>Xóa bộ lọc</Text>
          </Pressable>
          <Pressable onPress={() => { onApply({ departmentId, assignedUserId, createdById }); onClose(); }} style={{ flex: 1, height: 44, borderRadius: 8, backgroundColor: '#1E88E5', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontWeight: '600', color: '#FFF' }}>Áp dụng</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

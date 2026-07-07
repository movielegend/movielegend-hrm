import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable, Image } from 'react-native';

export function EmployeeRequestsHomeScreen() {
  const router = useRouter();

  const requests = [
    { id: '1', type: 'Nghỉ phép năm', status: 'Đang chờ', date: '15 Th10 - 17 Th10', reason: 'Giải quyết việc gia đình cá nhân...' }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingTop: 12 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color="#0B3B61" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0B3B61' }}>Yêu cầu của tôi</Text>
        </View>

        {requests.map(req => (
          <Pressable key={req.id} onPress={() => router.push('/employee/requests/' + req.id)} style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E6EEF3' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0B3B61' }}>{req.type}</Text>
              <View style={{ backgroundColor: 'rgba(30,136,229,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 12, color: '#1E88E5', fontWeight: '600' }}>{req.status}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: '#98A0A8', marginBottom: 4 }}>{req.date}</Text>
            <Text style={{ fontSize: 14, color: '#3B4A59' }} numberOfLines={1}>{req.reason}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function CreateEmployeeRequestScreen() {
  return <View />;
}

export function EmployeeRequestDetailScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E6EEF3' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color="#0B3B61" />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0B3B61' }}>Chi Tiết Yêu Cầu</Text>
        </View>
        <Pressable style={{ padding: 4 }}>
          <Ionicons name="share-social-outline" size={24} color="#98A0A8" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* User Card */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E6EEF3' }}>
          <View style={{ position: 'relative' }}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' }} style={{ width: 56, height: 56, borderRadius: 28 }} />
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#16A34A', borderWidth: 2, borderColor: '#F7FAFC' }} />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0B3B61' }}>Nguyễn Văn An</Text>
              <View style={{ backgroundColor: '#F0F4F8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#3B4A59' }}>Đang chờ</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: '#1E88E5', fontWeight: '500', marginTop: 2 }}>Nhân viên Marketing</Text>
            <Text style={{ fontSize: 12, color: '#98A0A8', marginTop: 4 }}>ID: #NV20230501 • Dept: Marketing</Text>
          </View>
        </View>

        {/* THÔNG TIN CHI TIẾT */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Ionicons name="document-text" size={18} color="#1E88E5" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#98A0A8', letterSpacing: 0.5 }}>THÔNG TIN CHI TIẾT</Text>
          </View>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E6EEF3', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#98A0A8', marginBottom: 4 }}>Loại yêu cầu</Text>
                <Text style={{ fontSize: 15, color: '#0B3B61', fontWeight: '500' }}>Nghỉ phép năm</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#98A0A8', marginBottom: 4 }}>Tổng số ngày</Text>
                <Text style={{ fontSize: 15, color: '#0B3B61', fontWeight: '500' }}>03 Ngày</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#98A0A8', marginBottom: 4 }}>Ngày bắt đầu</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar-outline" size={16} color="#1E88E5" />
                  <Text style={{ fontSize: 14, color: '#3B4A59' }}>15 Th10, 2023</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#98A0A8', marginBottom: 4 }}>Ngày kết thúc</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar-outline" size={16} color="#1E88E5" />
                  <Text style={{ fontSize: 14, color: '#3B4A59' }}>17 Th10, 2023</Text>
                </View>
              </View>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: '#98A0A8', marginBottom: 4 }}>Lý do nghỉ</Text>
              <Text style={{ fontSize: 14, color: '#3B4A59', fontStyle: 'italic', lineHeight: 20 }}>"Giải quyết việc gia đình cá nhân và đi thăm họ hàng ở quê. Đã bàn giao công việc cho đồng nghiệp Trần Thu Thủy."</Text>
            </View>
          </View>
        </View>

        {/* TỆP ĐÍNH KÈM */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Ionicons name="attach" size={20} color="#1E88E5" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#98A0A8', letterSpacing: 0.5 }}>TỆP ĐÍNH KÈM (02)</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E6EEF3', width: 200 }}>
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(30,136,229,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Ionicons name="document-text" size={20} color="#1E88E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B4A59', marginBottom: 2 }} numberOfLines={1}>Don_nghi_phep.pdf</Text>
                <Text style={{ fontSize: 11, color: '#98A0A8' }}>1.2 MB</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E6EEF3', width: 200 }}>
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(30,136,229,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Ionicons name="image" size={20} color="#1E88E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#3B4A59', marginBottom: 2 }} numberOfLines={1}>Minh_chung.png</Text>
                <Text style={{ fontSize: 11, color: '#98A0A8' }}>2.5 MB</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* TIẾN ĐỘ PHÊ DUYỆT */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Ionicons name="time" size={18} color="#1E88E5" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#98A0A8', letterSpacing: 0.5 }}>TIẾN ĐỘ PHÊ DUYỆT</Text>
          </View>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E6EEF3' }}>
            
            {/* Step 1 */}
            <View style={{ flexDirection: 'row', marginBottom: 24, position: 'relative' }}>
              <View style={{ position: 'absolute', left: 11, top: 24, bottom: -24, width: 2, backgroundColor: '#E6EEF3' }} />
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#3B4A59', justifyContent: 'center', alignItems: 'center', marginRight: 16, zIndex: 1 }}>
                <Ionicons name="checkmark" size={16} color="#3B4A59" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#0B3B61' }}>Gửi yêu cầu</Text>
                  <Text style={{ fontSize: 11, color: '#98A0A8' }}>08:30 - 12/10</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#98A0A8', marginTop: 2 }}>Bởi Nguyễn Văn An</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={{ flexDirection: 'row', marginBottom: 24, position: 'relative' }}>
              <View style={{ position: 'absolute', left: 11, top: 24, bottom: -24, width: 2, backgroundColor: '#E6EEF3' }} />
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#0B3B61', justifyContent: 'center', alignItems: 'center', marginRight: 16, zIndex: 1 }}>
                <Ionicons name="time" size={14} color="#0B3B61" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#0B3B61' }}>Trưởng phòng xác nhận</Text>
                  <Text style={{ fontSize: 11, color: '#98A0A8' }}>--:--</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#98A0A8', marginTop: 2 }}>Đang chờ Lê Minh Tâm phê duyệt</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Ionicons name="alert" size={14} color="#98A0A8" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#98A0A8' }}>Giám đốc ký duyệt</Text>
                  <Text style={{ fontSize: 11, color: '#98A0A8' }}>--:--</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#98A0A8', marginTop: 2 }}>Bước cuối cùng</Text>
              </View>
            </View>

          </View>
        </View>

      </ScrollView>

      {/* Bottom Actions */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E6EEF3' }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <Pressable style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444', backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '600' }}>Từ chối</Text>
          </Pressable>
          <Pressable style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: '#F0F4F8', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Ionicons name="information-circle-outline" size={20} color="#3B4A59" />
            <Text style={{ color: '#3B4A59', fontSize: 15, fontWeight: '600' }}>Sửa đổi</Text>
          </Pressable>
        </View>
        <Pressable style={{ width: '100%', height: 48, borderRadius: 12, backgroundColor: '#1E88E5', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#1E88E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Phê duyệt ngay</Text>
        </Pressable>
      </View>
    </View>
  );
}

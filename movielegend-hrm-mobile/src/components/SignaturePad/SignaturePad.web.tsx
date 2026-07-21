import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Bản mock cho Web để tránh lỗi "Unable to resolve react-native-signature-canvas"
export default function SignatureScreen(props: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tính năng ký tên chưa được hỗ trợ trên trình duyệt Web.</Text>
      <Text style={styles.subText}>Vui lòng dùng ứng dụng điện thoại (Android/iOS) để ký hợp đồng.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  }
});

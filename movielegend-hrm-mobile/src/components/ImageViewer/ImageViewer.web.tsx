import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

// Bản mock cho Web để tránh lỗi "Unable to resolve" vì react-native-image-viewing không hỗ trợ Web
export default function ImageView({ images, imageIndex, visible, onRequestClose }: any) {
  if (!visible || !images || images.length === 0) return null;
  
  const currentImage = images[imageIndex || 0]?.uri;
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onRequestClose} style={styles.closeButton}>
        <Text style={styles.closeText}>Đóng</Text>
      </TouchableOpacity>
      {currentImage && (
        <Image 
          source={{ uri: currentImage }} 
          style={styles.image} 
          resizeMode="contain" 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10000,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: '80%',
  }
});

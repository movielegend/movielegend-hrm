import React from 'react';
import { Modal, View, Pressable, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ImageViewingWeb({ images, imageIndex, visible, onRequestClose }: any) {
  if (!visible || !images || images.length === 0) return null;
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.imageViewerContainer}>
        <Pressable style={styles.imageViewerCloseBtn} onPress={onRequestClose}>
          <MaterialCommunityIcons name="close" size={32} color="#fff" />
        </Pressable>
        <Image
          source={{ uri: images[imageIndex].uri }}
          style={styles.imageViewerImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageViewerImage: {
    width: '100%',
    height: '80%',
  },
});

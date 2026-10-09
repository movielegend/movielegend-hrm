import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Pressable,
  Image,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ImageItem {
  uri?: string;
  url?: string;
}

interface ImageViewingWebProps {
  images: (ImageItem | string)[];
  imageIndex?: number;
  visible: boolean;
  onRequestClose: () => void;
}

export default function ImageViewingWeb({
  images,
  imageIndex = 0,
  visible,
  onRequestClose,
}: ImageViewingWebProps) {
  const [currentIndex, setCurrentIndex] = useState(imageIndex || 0);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(Math.max(0, Math.min(imageIndex || 0, (images?.length || 1) - 1)));
      setZoomScale(1);
    }
  }, [visible, imageIndex, images]);

  if (!visible || !images || images.length === 0) return null;

  const currentItem = images[currentIndex] || images[0];
  const imageUri =
    typeof currentItem === 'string'
      ? currentItem
      : currentItem?.uri || currentItem?.url || '';

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.3, 4));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.3, 0.5));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setZoomScale(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setZoomScale(1);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.imageViewerContainer}>
        {/* Top Control Bar */}
        <View style={styles.topBar}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </Text>

          {/* Zoom controls */}
          <View style={styles.zoomControls}>
            <Pressable
              style={styles.controlBtn}
              onPress={handleZoomOut}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="magnify-minus-outline" size={22} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={styles.scaleBadge}
              onPress={handleResetZoom}
            >
              <Text style={styles.scaleText}>{Math.round(zoomScale * 100)}%</Text>
            </Pressable>

            <Pressable
              style={styles.controlBtn}
              onPress={handleZoomIn}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="magnify-plus-outline" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Close button */}
          <Pressable
            style={styles.closeBtn}
            onPress={onRequestClose}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Center Image Canvas with Scroll/Pan support */}
        <ScrollView
          style={styles.scrollCanvas}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={4}
          minimumZoomScale={0.5}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.imageViewerImage,
                {
                  transform: [{ scale: zoomScale }],
                },
              ]}
              resizeMode="contain"
            />
          ) : null}
        </ScrollView>

        {/* Prev / Next Navigation Arrows for gallery */}
        {images.length > 1 ? (
          <>
            {currentIndex > 0 ? (
              <Pressable style={styles.prevBtn} onPress={handlePrev}>
                <MaterialCommunityIcons name="chevron-left" size={36} color="#FFFFFF" />
              </Pressable>
            ) : null}

            {currentIndex < images.length - 1 ? (
              <Pressable style={styles.nextBtn} onPress={handleNext}>
                <MaterialCommunityIcons name="chevron-right" size={36} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  counterText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
  },
  controlBtn: {
    padding: 4,
  },
  scaleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  scaleText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  scrollCanvas: {
    width: '100%',
    height: '100%',
    marginTop: 64,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  imageViewerImage: {
    width: Dimensions.get('window').width * 0.95,
    height: Dimensions.get('window').height * 0.85,
  },
  prevBtn: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  nextBtn: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
});

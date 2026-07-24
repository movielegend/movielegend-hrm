import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DotLottieReact } from '@lottiefiles/dotlottie-react'; // Using the installed lottie package
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { OnboardingSlide } from '../../constants/onboardingData';

interface OnboardingModalProps {
  visible: boolean;
  slides: OnboardingSlide[];
  onComplete: () => void;
  onSkip: () => void;
}

const { width } = Dimensions.get('window');

export function OnboardingModal({ visible, slides, onComplete, onSkip }: OnboardingModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset when visible
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
    }
  }, [visible]);

  if (!visible || !slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const isLast = currentIndex === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Skip Button */}
          <Pressable style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </Pressable>

          {/* Visual Area */}
          <View style={styles.visualContainer}>
            {currentSlide.lottieUrl ? (
              <DotLottieReact
                src={currentSlide.lottieUrl}
                loop
                autoplay
                style={styles.lottie}
              />
            ) : (
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name={currentSlide.iconName} size={80} color="#1E3A8A" />
              </View>
            )}
          </View>

          {/* Text Area */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{currentSlide.title}</Text>
            <Text style={styles.description}>{currentSlide.description}</Text>
          </View>

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dot,
                  currentIndex === index && styles.dotActive
                ]} 
              />
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Pressable style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {isLast ? 'Bắt đầu trải nghiệm' : 'Tiếp tục'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  visualContainer: {
    width: width * 0.5,
    height: width * 0.5,
    maxHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xl,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#3B82F6',
  },
  actionsContainer: {
    width: '100%',
  },
  nextButton: {
    backgroundColor: '#111827',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

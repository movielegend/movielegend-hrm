import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

interface VoiceMessageBubbleProps {
  uri: string;
  isMine?: boolean;
}

// Global variable to keep track of the currently playing Sound instance
let globalActiveSound: Audio.Sound | null = null;
let globalActiveStopCallback: (() => void) | null = null;

export function VoiceMessageBubble({ uri, isMine = false }: VoiceMessageBubbleProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);

  // Format milliseconds to M:SS
  const formatTime = (millis: number) => {
    if (!millis || isNaN(millis) || millis < 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        if (globalActiveSound === soundRef.current) {
          globalActiveSound = null;
          globalActiveStopCallback = null;
        }
      }
    };
  }, []);

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Audio playback error:', status.error);
        setIsPlaying(false);
        setIsLoading(false);
      }
      return;
    }

    setPositionMillis(status.positionMillis || 0);
    setDurationMillis(status.durationMillis || 0);
    setIsPlaying(status.isPlaying || false);
    setIsLoading(false);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMillis(0);
    }
  };

  const handleTogglePlay = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
            return;
          } else {
            // Stop any other currently playing audio
            if (globalActiveSound && globalActiveSound !== soundRef.current) {
              if (globalActiveStopCallback) globalActiveStopCallback();
              await globalActiveSound.pauseAsync().catch(() => {});
            }

            globalActiveSound = soundRef.current;
            globalActiveStopCallback = () => {
              setIsPlaying(false);
            };

            if (status.positionMillis >= (status.durationMillis || 0) && (status.durationMillis || 0) > 0) {
              await soundRef.current.setPositionAsync(0);
            }
            await soundRef.current.setRateAsync(playbackSpeed, true);
            await soundRef.current.playAsync();
            setIsPlaying(true);
            return;
          }
        }
      }

      // Load new sound
      setIsLoading(true);

      // Stop any other currently playing audio
      if (globalActiveSound) {
        if (globalActiveStopCallback) globalActiveStopCallback();
        await globalActiveSound.pauseAsync().catch(() => {});
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, rate: playbackSpeed, shouldCorrectPitch: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      globalActiveSound = sound;
      globalActiveStopCallback = () => {
        setIsPlaying(false);
      };
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing voice note:', error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handleSliderValueChange = async (value: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(value);
      setPositionMillis(value);
    }
  };

  const handleSpeedToggle = async () => {
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (soundRef.current) {
      await soundRef.current.setRateAsync(nextSpeed, true);
    }
  };

  const activeColor = isMine ? '#FFFFFF' : '#2563EB';
  const trackColor = isMine ? 'rgba(255, 255, 255, 0.3)' : '#E2E8F0';
  const textColor = isMine ? 'rgba(255, 255, 255, 0.85)' : '#64748B';

  return (
    <View style={styles.container}>
      {/* Play/Pause Button */}
      <TouchableOpacity
        onPress={handleTogglePlay}
        disabled={isLoading}
        style={[
          styles.playBtn,
          { backgroundColor: isMine ? 'rgba(255, 255, 255, 0.2)' : '#DBEAFE' }
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={activeColor} />
        ) : (
          <MaterialCommunityIcons
            name={isPlaying ? 'pause' : 'play'}
            size={22}
            color={activeColor}
          />
        )}
      </TouchableOpacity>

      {/* Progress & Waveform */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={durationMillis || 1000}
          value={positionMillis}
          minimumTrackTintColor={activeColor}
          maximumTrackTintColor={trackColor}
          thumbTintColor={activeColor}
          onSlidingComplete={handleSliderValueChange}
        />
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: textColor }]}>
            {formatTime(positionMillis)}
          </Text>
          <Text style={[styles.timeText, { color: textColor }]}>
            {durationMillis > 0 ? formatTime(durationMillis) : '--:--'}
          </Text>
        </View>
      </View>

      {/* Speed Button */}
      <TouchableOpacity
        onPress={handleSpeedToggle}
        style={[
          styles.speedBtn,
          { backgroundColor: isMine ? 'rgba(255, 255, 255, 0.2)' : '#F1F5F9' }
        ]}
      >
        <Text style={[styles.speedText, { color: activeColor }]}>
          {playbackSpeed}x
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 220,
    paddingVertical: 4,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 24,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: -4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  speedBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

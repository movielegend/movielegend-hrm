import type { Audio as AudioType } from 'expo-av';

let SafeAudio: typeof AudioType | null = null;
let isAudioAvailable = false;

try {
  const av = require('expo-av');
  if (av && av.Audio) {
    SafeAudio = av.Audio;
    isAudioAvailable = true;
  }
} catch (error) {
  console.warn('[SafeAudio] Native module ExponentAV is not available in the current native build:', error);
  SafeAudio = null;
  isAudioAvailable = false;
}

export { SafeAudio, isAudioAvailable };

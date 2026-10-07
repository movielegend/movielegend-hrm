// expo-av is unmaintained and causes native crash (UnsatisfiedLinkError libexpo-av.so on RN 0.86)
// Safe mock export so chat features do not crash when referencing audio
export const SafeAudio: any = null;
export const isAudioAvailable = false;

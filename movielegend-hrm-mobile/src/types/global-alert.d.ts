import type { AlertButton } from 'react-native';

declare global {
  const CustomAlert: {
    alert: (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: { cancelable?: boolean; onDismiss?: () => void }
    ) => void;
    hide: () => void;
  };
}

export {};

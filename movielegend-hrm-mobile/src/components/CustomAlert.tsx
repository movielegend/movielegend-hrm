import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  AlertButton} from 'react-native';

type CustomAlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: { cancelable?: boolean; onDismiss?: () => void };
};

let globalShowAlert: (opts: CustomAlertOptions) => void;
let globalHideAlert: () => void;

/**
 * Imperative API to trigger the global custom alert modal.
 * Mirrors the native React Native `Alert.alert` API.
 */
export const CustomAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { cancelable?: boolean; onDismiss?: () => void }
  ) => {
    if (globalShowAlert) {
      // If no buttons are provided, default to an "OK" button
      const finalButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'OK', onPress: () => {} }];
      globalShowAlert({ title, message, buttons: finalButtons, options });
    } else {
      console.warn('CustomAlertProvider is not mounted. Make sure to render it in your app root.');
    }
  },
  hide: () => {
    if (globalHideAlert) globalHideAlert();
  },
};

// Bind to global and globalThis so all components can call CustomAlert.alert without explicit imports
if (typeof globalThis !== 'undefined') {
  (globalThis as any).CustomAlert = CustomAlert;
}
if (typeof global !== 'undefined') {
  (global as any).CustomAlert = CustomAlert;
}
if (typeof window !== 'undefined') {
  (window as any).CustomAlert = CustomAlert;
}

declare global {
  var CustomAlert: {
    alert: (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: { cancelable?: boolean; onDismiss?: () => void }
    ) => void;
    hide: () => void;
  };
}


export function CustomAlertProvider() {
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState<CustomAlertOptions | null>(null);

  useEffect(() => {
    globalShowAlert = (options: CustomAlertOptions) => {
      setOpts(options);
      setVisible(true);
    };

    globalHideAlert = () => {
      setVisible(false);
      if (opts?.options?.onDismiss) {
        opts.options.onDismiss();
      }
      setOpts(null);
    };

    return () => {
      globalShowAlert = () => {};
      globalHideAlert = () => {};
    };
  }, [opts]);

  const handleClose = () => {
    if (opts?.options?.cancelable !== false) {
      CustomAlert.hide();
    }
  };

  const handleButtonPress = (btn: AlertButton) => {
    CustomAlert.hide();
    if (btn.onPress) {
      // Small timeout to allow the modal to close smoothly before executing action
      setTimeout(() => {
        btn.onPress!();
      }, 50);
    }
  };

  if (!visible || !opts) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <View style={styles.modalBox}>
          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{opts.title}</Text>
            {!!opts.message && <Text style={styles.message}>{opts.message}</Text>}
          </View>

          {/* Buttons */}
          <View
            style={[
              styles.buttonContainer,
              opts.buttons && opts.buttons.length > 2 ? styles.buttonContainerVertical : styles.buttonContainerHorizontal,
            ]}
          >
            {opts.buttons?.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel;

              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.button,
                    opts.buttons && opts.buttons.length > 2 ? styles.buttonVertical : styles.buttonHorizontal,
                    index > 0 && (opts.buttons && opts.buttons.length <= 2 ? styles.buttonBorderLeft : styles.buttonBorderTop),
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => handleButtonPress(btn)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isPrimary && styles.buttonTextPrimary,
                      isDestructive && styles.buttonTextDestructive,
                      isCancel && styles.buttonTextCancel,
                    ]}
                  >
                    {btn.text || 'OK'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    padding: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#4B5563',
    textAlign: 'center',
  },
  buttonContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  buttonContainerHorizontal: {
    flexDirection: 'row',
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  buttonHorizontal: {
    flex: 1,
  },
  buttonVertical: {
    width: '100%',
  },
  buttonBorderLeft: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  buttonBorderTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  buttonPressed: {
    backgroundColor: '#F3F4F6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#2563EB',
  },
  buttonTextCancel: {
    color: '#6B7280',
    fontWeight: '500',
  },
  buttonTextDestructive: {
    color: '#DC2626',
  },
});

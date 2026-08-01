import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

interface AlertOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  hideCancel?: boolean;
}

interface AlertContextProps {
  showAlert: (title: string, message?: string, onConfirm?: () => void) => void;
  showConfirm: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions>({
    title: '',
  });

  const showAlert = useCallback((title: string, message?: string, onConfirm?: () => void) => {
    setConfig({
      title,
      message,
      hideCancel: true,
      confirmLabel: 'OK',
      onConfirm: () => {
        setVisible(false);
        if (onConfirm) onConfirm();
      }
    });
    setVisible(true);
  }, []);

  const showConfirm = useCallback((options: AlertOptions) => {
    setConfig({
      ...options,
      hideCancel: options.hideCancel ?? false,
      confirmLabel: options.confirmLabel ?? 'Xác nhận',
      onConfirm: () => {
        setVisible(false);
        if (options.onConfirm) options.onConfirm();
      },
      onCancel: () => {
        setVisible(false);
        if (options.onCancel) options.onCancel();
      }
    });
    setVisible(true);
  }, []);

  const handleCancel = useCallback(() => {
    setVisible(false);
    if (config.onCancel) config.onCancel();
  }, [config]);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <ConfirmModal
        visible={visible}
        title={config.title}
        message={config.message}
        confirmLabel={config.confirmLabel}
        hideCancel={config.hideCancel}
        onCancel={handleCancel}
        onConfirm={config.onConfirm || (() => setVisible(false))}
      />
    </AlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAppAlert must be used within an AlertProvider');
  }
  return context;
}

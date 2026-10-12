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

const TITLE_CODE_MAP: Record<string, string> = {
  // Lỗi mạng & hệ thống
  NETWORK_ERROR: 'Lỗi kết nối',
  TIMEOUT: 'Hết thời gian chờ',
  SERVER_ERROR: 'Lỗi hệ thống',
  UNAUTHORIZED: 'Chưa đăng nhập',
  FORBIDDEN: 'Không có quyền truy cập',
  RATE_LIMITED: 'Thao tác quá nhanh',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  BUSINESS_ERROR: 'Không thể xử lý',
  UNKNOWN_ERROR: 'Đã có lỗi xảy ra',
  NOT_FOUND: 'Không tìm thấy',
  BAD_REQUEST: 'Yêu cầu không hợp lệ',
  CONFLICT: 'Trạng thái không hợp lệ',
  INVALID_FORM: 'Thông tin chưa hợp lệ',
  INVALID_CREDENTIALS: 'Đăng nhập thất bại',

  // Báo cáo OT & Ca làm
  OT_REPORT_INVALID_STATE: 'Trạng thái không hợp lệ',
  OT_REPORT_NOT_FOUND: 'Không tìm thấy báo cáo OT',
  OT_REPORT_ALREADY_EXISTS: 'Báo cáo OT đã tồn tại',
  OVERTIME_REQUEST_INVALID: 'Yêu cầu tăng ca không hợp lệ',
  OVERTIME_NOT_FOUND: 'Không tìm thấy đơn tăng ca',
  SHIFT_NOT_FOUND: 'Không tìm thấy ca làm',
  SHIFT_INACTIVE: 'Ca làm đã đóng',
  ALREADY_CHECKED_IN: 'Đã điểm danh vào ca',
  ALREADY_CHECKED_OUT: 'Đã điểm danh ra ca',
  NOT_CHECKED_IN: 'Chưa điểm danh vào ca',

  // Nhiệm vụ & Nhóm
  TASK_NOT_FOUND: 'Không tìm thấy nhiệm vụ',
  TASK_INVALID_STATE: 'Trạng thái nhiệm vụ không hợp lệ',
  TASK_ALREADY_COMPLETED: 'Nhiệm vụ đã hoàn thành',
  UNACCEPTED_TASKS: 'Chưa nhận nhiệm vụ',

  // Phê duyệt & Nghỉ phép
  LEAVE_REQUEST_NOT_FOUND: 'Không tìm thấy đơn xin nghỉ',
  LEAVE_REQUEST_INVALID: 'Đơn xin nghỉ không hợp lệ',
  APPROVAL_REQUEST_NOT_FOUND: 'Không tìm thấy yêu cầu duyệt',
  APPROVAL_REQUEST_NOT_PENDING: 'Yêu cầu không còn chờ duyệt',
  APPROVAL_SCOPE_DENIED: 'Không có quyền phê duyệt',

  // Tài chính & Yêu cầu nhân viên
  EMPLOYEE_REQUEST_NOT_FOUND: 'Không tìm thấy yêu cầu',
  EMPLOYEE_REQUEST_NOT_PENDING: 'Yêu cầu không còn chờ xử lý',
  FORBIDDEN_DEPARTMENT_SCOPE: 'Không có quyền phòng ban này',
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  USER_NOT_ACTIVE: 'Tài khoản chưa kích hoạt',
};

function formatAlertTitle(title: string): string {
  if (!title || !title.trim()) return 'Thông báo';
  const trimmed = title.trim();
  if (TITLE_CODE_MAP[trimmed]) {
    return TITLE_CODE_MAP[trimmed];
  }
  // Nếu là dạng UPPER_SNAKE_CASE (ví dụ: OT_REPORT_INVALID_STATE)
  if (/^[A-Z0-9_]{3,}$/.test(trimmed)) {
    return 'Thông báo';
  }
  return trimmed;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions>({
    title: '',
  });

  const showAlert = useCallback((title: string, message?: string, onConfirm?: () => void) => {
    setConfig({
      title: formatAlertTitle(title),
      message,
      hideCancel: true,
      confirmLabel: 'Đồng ý',
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
      title: formatAlertTitle(options.title),
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

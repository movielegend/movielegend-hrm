import { CustomAlert } from '../components/CustomAlert';


export function useSnackbar() {
  const showSnackbar = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    let title = 'Thông báo';
    if (type === 'error') title = 'Lỗi';
    else if (type === 'success') title = 'Thành công';
    else if (type === 'warning') title = 'Cảnh báo';

    CustomAlert.alert(title, message);
  };

  return { showSnackbar };
}

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { assertApiUrl } from '../constants/env';
import { getAccessToken } from '../storage/secure-token.storage';
import { CustomAlert } from '../components/CustomAlert';

export interface ExportExcelOptions {
  date?: string; // YYYY-MM-DD hoặc 'ALL'
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  vatOption?: 'ALL' | 'VAT_ONLY' | 'NO_VAT_ONLY';
  type?: string;
  status?: string;
}

export async function exportAndShareFinancialExcel(options: ExportExcelOptions = {}): Promise<boolean> {
  try {
    const token = await getAccessToken();
    const dateStr = options.date || (options.fromDate && options.toDate ? `${options.fromDate}-den-${options.toDate}` : new Date().toISOString().split('T')[0]);
    const vatOption = options.vatOption || 'ALL';
    const filename = `De-xuat-mua-hang-HCNS-Ke-toan-theo-doi-${dateStr}.xlsx`;

    const searchParams = new URLSearchParams();
    if (options.date) {
      searchParams.append('date', String(options.date));
    }
    if (options.fromDate) {
      searchParams.append('fromDate', String(options.fromDate));
    }
    if (options.toDate) {
      searchParams.append('toDate', String(options.toDate));
    }
    if (vatOption && vatOption !== 'ALL') {
      searchParams.append('vatOption', String(vatOption));
    }
    if (options.type && options.type !== 'ALL') {
      searchParams.append('type', String(options.type));
    }
    if (options.status && options.status !== 'ALL') {
      searchParams.append('status', String(options.status));
    }

    const downloadUrl = `${assertApiUrl()}/employee-requests/export/daily-transactions?${searchParams.toString()}`;

    if (Platform.OS === 'web') {
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'bypass-tunnel-reminder': 'true',
        },
      });

      if (!response.ok) {
        throw new Error('Lỗi khi tải file từ máy chủ.');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      return true;
    }

    // Native Mobile (iOS / Android)
    const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
    const localUri = `${docDir}${filename}`;

    const result = await FileSystem.downloadAsync(downloadUrl, localUri, {
      headers: {
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        'bypass-tunnel-reminder': 'true',
      },
    });

    if (result.status === 200) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Xuất Excel giao dịch ngày ${dateStr}`,
          UTI: 'com.microsoft.excel.xlsx',
        });
        return true;
      } else {
        CustomAlert.alert('Thành công', `Đã tải file Excel vào thư mục ứng dụng: ${filename}`);
        return true;
      }
    } else {
      throw new Error(`Tải file thất bại với mã trạng thái ${result.status}`);
    }
  } catch (error: any) {
    console.error('exportAndShareFinancialExcel error:', error);
    CustomAlert.alert('Lỗi xuất Excel', error?.message || 'Không thể xuất file Excel giao dịch. Vui lòng thử lại sau.');
    return false;
  }
}

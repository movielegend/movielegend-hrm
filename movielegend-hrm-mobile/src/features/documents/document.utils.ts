export interface DocumentCategoryOption {
  value: string;
  label: string;
  description?: string;
}

export const CATEGORIES: DocumentCategoryOption[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'QUY_DINH', label: 'Quy định & Nội quy' },
  { value: 'BIEU_MAU', label: 'Biểu mẫu & Hồ sơ' },
  { value: 'DAO_TAO', label: 'Tài liệu Đào tạo' },
  { value: 'HUONG_DAN', label: 'Hướng dẫn công việc' },
  { value: 'BAN_GIAO', label: 'Biên bản & Bàn giao' },
  { value: 'KHAC', label: 'Khác' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  QUY_DINH: 'Quy định & Nội quy',
  BIEU_MAU: 'Biểu mẫu & Hồ sơ',
  DAO_TAO: 'Tài liệu Đào tạo',
  HUONG_DAN: 'Hướng dẫn công việc',
  BAN_GIAO: 'Biên bản & Bàn giao',
  KHAC: 'Khác',
};

export function getCategoryColor(category: string): { bg: string; text: string } {
  switch (category) {
    case 'QUY_DINH':
      return { bg: '#FEE2E2', text: '#DC2626' };
    case 'BIEU_MAU':
      return { bg: '#EFF6FF', text: '#2563EB' };
    case 'DAO_TAO':
      return { bg: '#FEF3C7', text: '#D97706' };
    case 'HUONG_DAN':
      return { bg: '#ECFDF5', text: '#059669' };
    case 'BAN_GIAO':
      return { bg: '#E0F2FE', text: '#0284C7' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280' };
  }
}

export function getFileIcon(fileName: string, mimeType?: string | null): {
  name: 'file-pdf-box' | 'file-word-box' | 'file-excel-box' | 'file-image-outline' | 'file-document-outline';
  color: string;
} {
  const name = (fileName || '').toLowerCase();
  if (name.endsWith('.pdf') || mimeType?.includes('pdf')) {
    return { name: 'file-pdf-box', color: '#EF4444' };
  }
  if (name.endsWith('.docx') || name.endsWith('.doc') || mimeType?.includes('word')) {
    return { name: 'file-word-box', color: '#2563EB' };
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || mimeType?.includes('sheet') || mimeType?.includes('excel')) {
    return { name: 'file-excel-box', color: '#10B981' };
  }
  if (name.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) || mimeType?.includes('image')) {
    return { name: 'file-image-outline', color: '#8B5CF6' };
  }
  return { name: 'file-document-outline', color: '#64748B' };
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return 'Không rõ';
  if (bytes > 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function formatDocumentDate(dateStr?: string | null): string {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

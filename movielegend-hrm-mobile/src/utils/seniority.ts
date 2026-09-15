/**
 * Tính thâm niên làm việc dựa trên ngày vào làm (joinDate) hoặc ngày duyệt/tạo tài khoản.
 * Trả về chuỗi mô tả thân thiện: "Ngày đầu tiên", "X ngày", "X tháng Y ngày", "X năm Y tháng", v.v.
 */
export function formatSeniority(joinDate?: string | Date | null): string {
  if (!joinDate) return 'Chưa cập nhật';
  const start = new Date(joinDate);
  if (isNaN(start.getTime())) return 'Chưa cập nhật';

  const now = new Date();
  if (start > now) return 'Chưa bắt đầu';

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) {
    return 'Ngày đầu tiên';
  }

  if (years === 0 && months === 0) {
    if (days <= 1) return 'Ngày đầu tiên';
    return `${days} ngày`;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} năm`);
  if (months > 0) parts.push(`${months} tháng`);
  if (years === 0 && days > 0) parts.push(`${days} ngày`);

  return parts.join(' ');
}

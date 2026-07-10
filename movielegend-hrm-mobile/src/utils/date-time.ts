export const BUSINESS_TIME_ZONE = 'Asia/Ho_Chi_Minh';

type DateInput = string | number | Date | null | undefined;

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: BUSINESS_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
});

export function businessDateToday(date: Date = new Date()): string {
  return dateFormatter.format(date);
}

export function formatDate(value: DateInput): string {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : '-';
}

export function formatTime(value: DateInput): string {
  const date = toDate(value);
  return date ? timeFormatter.format(date) : '-';
}

export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : '-';
}

export function formatShiftRange(startTime?: string | null, endTime?: string | null): string {
  if (!startTime || !endTime) return '-';
  const overnight = isOvernightShift(startTime, endTime);
  return `${startTime} - ${endTime}${overnight ? ' (+1)' : ''}`;
}

export function isOvernightShift(startTime?: string | null, endTime?: string | null): boolean {
  if (!startTime || !endTime) return false;
  return minutesOfDay(endTime) <= minutesOfDay(startTime);
}

export function minutesBetween(start: DateInput, end: DateInput): number | null {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) return null;
  return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 60_000));
}

export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (typeof minutes !== 'number') return '-';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return `${hours}h ${rest}m`;
}

export function toDate(value: DateInput): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function minutesOfDay(time: string): number {
  const [hour = '0', minute = '0'] = time.split(':');
  return Number(hour) * 60 + Number(minute);
}

export function timeAgo(value: DateInput): string {
  const date = toDate(value);
  if (!date) return '-';
  
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval >= 1) return Math.floor(interval) + ' năm trước';
  
  interval = seconds / 2592000;
  if (interval >= 1) return Math.floor(interval) + ' tháng trước';
  
  interval = seconds / 86400;
  if (interval >= 1) return Math.floor(interval) + ' ngày trước';
  
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + ' giờ trước';
  
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + ' phút trước';
  
  return 'Vừa xong';
}

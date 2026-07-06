export function maskPhone(phone?: string | null): string {
  if (!phone) return '-';
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 3)}***${phone.slice(-3)}`;
}

export function maskIdCard(value?: string | null): string {
  if (!value) return '-';
  return value.length <= 4 ? '****' : `********${value.slice(-4)}`;
}

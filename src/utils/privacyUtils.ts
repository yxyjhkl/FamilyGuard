// src/utils/privacyUtils.ts

// 隐私脱敏处理
export function maskName(name: string, showName: boolean): string {
  if (showName) return name;
  if (name.length <= 1) return '*';
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

export function maskPhone(phone: string, showAgentInfo: boolean): string {
  if (showAgentInfo) return phone;
  if (!phone || phone.length < 7) return '***';
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

export function maskAmount(amount: number | undefined, showName: boolean): string {
  if (showName) return amount?.toLocaleString() ?? '0';
  return '***';
}

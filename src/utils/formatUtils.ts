// src/utils/formatUtils.ts

// 生成 UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 格式化金额
export function formatAmount(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0';
  return amount.toLocaleString('zh-CN');
}

// 格式化日期
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

// 格式化时间戳
export function formatTimestamp(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

// 获取当前时间戳字符串
export function getNowTimestamp(): string {
  return formatTimestamp(new Date().toISOString());
}

// 隐藏敏感信息
export function maskString(str: string, keepStart: number = 1): string {
  if (!str) return '';
  if (str.length <= keepStart + 1) {
    return str[0] + '*'.repeat(Math.max(0, str.length - 1));
  }
  return str.substring(0, keepStart) + '*'.repeat(str.length - keepStart - 1) + str[str.length - 1];
}

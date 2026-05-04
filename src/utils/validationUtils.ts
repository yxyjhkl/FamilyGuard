// src/utils/validationUtils.ts
// 输入验证工具 — 确保金额/年龄等字段的合法性

/** 保额/保费验证结果 */
export interface AmountValidation {
  valid: boolean;
  value: number;
  error?: string;
}

/** 验证保额/保费输入（单位：万元） */
export function validateAmount(input: string, maxValue: number = 10000): AmountValidation {
  if (!input || input.trim() === '') {
    return { valid: false, value: 0, error: '请输入金额' };
  }

  const value = parseFloat(input);
  if (isNaN(value)) {
    return { valid: false, value: 0, error: '请输入有效数字' };
  }

  if (value < 0) {
    return { valid: false, value: 0, error: '金额不能为负数' };
  }

  if (value > maxValue) {
    return { valid: false, value: maxValue, error: `金额不能超过${maxValue}万元` };
  }

  // 限制最多 2 位小数
  const decimalParts = input.split('.');
  if (decimalParts.length > 1 && decimalParts[1].length > 2) {
    const rounded = Math.round(value * 100) / 100;
    return { valid: true, value: rounded };
  }

  return { valid: true, value };
}

/** 格式化金额显示（保留最多 2 位小数，去除尾部零） */
export function formatAmountDisplay(value: number): string {
  return parseFloat(value.toFixed(2)).toString();
}

/** 验证年龄输入 */
export function validateAge(input: string): { valid: boolean; value: number; error?: string } {
  if (!input || input.trim() === '') {
    return { valid: false, value: 0, error: '请输入年龄' };
  }

  const value = parseInt(input, 10);
  if (isNaN(value)) {
    return { valid: false, value: 0, error: '请输入有效整数' };
  }

  if (value < 0) {
    return { valid: false, value: 0, error: '年龄不能为负数' };
  }

  if (value > 120) {
    return { valid: false, value: 0, error: '请输入有效年龄（0-120）' };
  }

  return { valid: true, value };
}

/** 验证姓名输入 */
export function validateName(input: string): { valid: boolean; value: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, value: '', error: '姓名不能为空' };
  }
  if (trimmed.length > 20) {
    return { valid: false, value: trimmed.slice(0, 20), error: '姓名不能超过20个字符' };
  }
  return { valid: true, value: trimmed };
}

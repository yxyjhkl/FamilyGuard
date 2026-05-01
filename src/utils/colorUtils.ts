// src/utils/colorUtils.ts

// 保障状态颜色映射
export function getCoverageStatusColor(
  hasCoverage: boolean,
  gapAmount?: number,
): string {
  if (!hasCoverage) return '#FF3B30'; // 红色-缺失
  if (gapAmount && gapAmount > 0) return '#FF9500'; // 橙色-部分覆盖
  return '#34C759'; // 绿色-充足
}

// 保障状态文字
export function getCoverageStatusText(
  hasCoverage: boolean,
  gapAmount?: number,
): string {
  if (!hasCoverage) return '缺失';
  if (gapAmount && gapAmount > 0) return '部分覆盖';
  return '充足';
}

// 权益状态颜色
export function getRightStatusColor(hasRight: boolean): string {
  return hasRight ? '#34C759' : '#8E8EA0';
}

// 家庭角色颜色
export const MEMBER_ROLE_COLORS: Record<string, string> = {
  husband: '#2B5EA7',
  wife: '#AF52DE',
  son: '#007AFF',
  daughter: '#FF9500',
  father: '#1A3A6B',
  mother: '#D4A843',
  other: '#8E8EA0',
};

// 保障项图标颜色（18项统一规则）
export const COVERAGE_COLORS: Record<string, string> = {
  // 寿险/身价
  death: '#8E44AD',
  pension: '#E67E22',
  // 重疾类
  criticalIllness: '#E74C3C',
  moderateIllness: '#C0392B',
  minorIllness: '#E74C3C',
  specificCritical: '#D35400',
  proton: '#16A085',
  // 意外类
  accident: '#7F8C8D',
  disability: '#636E72',
  maternity: '#FD79A8',
  // 医疗类
  millionMedical: '#3498DB',
  medical: '#2980B9',
  overseasMedical: '#1ABC9C',
  hospital: '#FDCB6E',
  // 其他
  education: '#27AE60',
  waiver: '#00B894',
  schoolAccident: '#00CEC9',
  shortTermFree: '#A29BFE',
};

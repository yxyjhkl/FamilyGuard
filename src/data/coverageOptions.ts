// src/data/coverageOptions.ts
// 保险保障选项（19项统一规则）
// 此文件已废弃，请使用 constants/insurance.ts

import type {CoverageType} from '../types';
import {INSURANCE_COVERAGES} from '../constants/insurance';

// 保留旧接口以兼容，向后兼容导出
export interface CoverageOption {
  type: CoverageType;
  label: string;
  icon: string;
  description: string;
  defaultRecommended: number;
  unit: string;
  applicableRoles: string[];
}

// 兼容导出：从统一配置转换
export const coverageOptions: CoverageOption[] = INSURANCE_COVERAGES.map(c => ({
  type: c.type,
  label: c.fullLabel,
  icon: c.icon,
  description: c.description,
  defaultRecommended: c.defaultAmount,
  unit: c.unit,
  applicableRoles: c.applicableRoles,
}));

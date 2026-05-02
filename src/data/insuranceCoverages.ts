// src/data/insuranceCoverages.ts
// 保险保障配置（19项统一规则）
// 此文件已废弃，请使用 constants/insurance.ts

import type {CoverageType} from '../types';
import {
  INSURANCE_COVERAGES,
  getCoverageCategoryOrder,
  getCoverageDisplayOrder,
} from '../constants/insurance';

// 保留旧接口以兼容
export interface InsuranceCoverage {
  type: CoverageType;
  shortLabel: string;
  fullLabel: string;
  color: string;
  defaultAmount: number;
  unit: string;
  category: 'life' | 'critical' | 'accident' | 'medical' | 'education' | 'special';
  description: string;
}

// 兼容导出：从统一配置转换
export const insuranceCoverages: InsuranceCoverage[] = INSURANCE_COVERAGES.map(c => ({
  type: c.type,
  shortLabel: c.shortLabel,
  fullLabel: c.fullLabel,
  color: c.color,
  defaultAmount: c.defaultAmount,
  unit: c.unit,
  category: c.category,
  description: c.description,
}));

// 保留辅助函数
export const getCoverageCategoryOrderFunc = (category: InsuranceCoverage['category']): number =>
  getCoverageCategoryOrder(category);

export const getCoverageDisplayOrderFunc = (type: CoverageType): number =>
  getCoverageDisplayOrder(type);

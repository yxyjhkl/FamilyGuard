// src/data/defaultCoverages.ts
// 默认保障配置 - 20项

import {CoverageConfig} from '../types';

export const DEFAULT_COVERAGES: CoverageConfig[] = [
  // ========== 社保类 ==========
  {
    id: 'socialInsurance',
    label: '基础社保',
    shortLabel: '社',
    category: 'medical',
    icon: '🏥',
    color: '#4A90D9',
    recommendedAmount: 30,
    isDefault: true,
    sortOrder: 1,
  },
  {
    id: 'accident',
    label: '意外伤害',
    shortLabel: '伤',
    category: 'accident',
    icon: '⚠️',
    color: '#4A90D9',
    recommendedAmount: 50,
    isDefault: true,
    sortOrder: 2,
  },
  {
    id: 'death',
    label: '身故保障',
    shortLabel: '寿',
    category: 'life',
    icon: '⚰️',
    color: '#4A90D9',
    recommendedAmount: 100,
    isDefault: true,
    sortOrder: 3,
  },
  {
    id: 'pension',
    label: '养老年金',
    shortLabel: '养',
    category: 'life',
    icon: '🏠',
    color: '#4A90D9',
    recommendedAmount: 200,
    isDefault: true,
    sortOrder: 4,
  },
  {
    id: 'childPension',
    label: '增额年金',
    shortLabel: '增',
    category: 'life',
    icon: '👶',
    color: '#4A90D9',
    recommendedAmount: 30,
    isDefault: true,
    sortOrder: 5,
  },

  // ========== 重疾类 ==========
  {
    id: 'criticalIllness',
    label: '重疾保障',
    shortLabel: '重',
    category: 'critical',
    icon: '🏥',
    color: '#8E44AD',  // 深紫色，与已理赔红色区分
    recommendedAmount: 50,
    isDefault: true,
    sortOrder: 6,
  },
  {
    id: 'moderateIllness',
    label: '中度重疾',
    shortLabel: '中',
    category: 'critical',
    icon: '💊',
    color: '#9B59B6',  // 浅紫色
    recommendedAmount: 30,
    isDefault: true,
    sortOrder: 7,
  },
  {
    id: 'minorIllness',
    label: '轻度重疾',
    shortLabel: '轻',
    category: 'critical',
    icon: '💉',
    color: '#BB8FCE',  // 淡紫色
    recommendedAmount: 15,
    isDefault: true,
    sortOrder: 8,
  },
  {
    id: 'specificCritical',
    label: '特定重疾',
    shortLabel: '特',
    category: 'critical',
    icon: '🎗️',
    color: '#7D3C98',  // 中紫色
    recommendedAmount: 30,
    isDefault: true,
    sortOrder: 9,
  },

  // ========== 意外类 ==========
  {
    id: 'disability',
    label: '意外医疗',
    shortLabel: '意',
    category: 'accident',
    icon: '🦯',
    color: '#F39C12',
    recommendedAmount: 50,
    isDefault: true,
    sortOrder: 10,
  },
  {
    id: 'maternity',
    label: '孕妇保障',
    shortLabel: '孕',
    category: 'accident',
    icon: '🤰',
    color: '#F39C12',
    recommendedAmount: 20,
    isDefault: true,
    sortOrder: 11,
  },

  // ========== 医疗类 ==========
  {
    id: 'millionMedical',
    label: '百万医疗',
    shortLabel: '百',
    category: 'medical',
    icon: '💰',
    color: '#27AE60',
    recommendedAmount: 200,
    isDefault: true,
    sortOrder: 12,
  },
  {
    id: 'medical',
    label: '一般医疗',
    shortLabel: '医',
    category: 'medical',
    icon: '🏨',
    color: '#27AE60',
    recommendedAmount: 3,
    isDefault: true,
    sortOrder: 13,
  },
  {
    id: 'overseasMedical',
    label: '海外医疗',
    shortLabel: '海',
    category: 'medical',
    icon: '✈️',
    color: '#27AE60',
    recommendedAmount: 100,
    isDefault: true,
    sortOrder: 14,
  },
  {
    id: 'hospital',
    label: '住院津贴',
    shortLabel: '日',
    category: 'medical',
    icon: '🛏️',
    color: '#27AE60',
    recommendedAmount: 0.2, // 万元/天
    isDefault: true,
    sortOrder: 15,
  },

  // ========== 其他类 ==========
  {
    id: 'education',
    label: '教育年金',
    shortLabel: '教',
    category: 'other',
    icon: '📚',
    color: '#9B59B6',
    recommendedAmount: 50,
    isDefault: true,
    sortOrder: 16,
  },
  {
    id: 'wealthTransfer',
    label: '财富传承',
    shortLabel: '传',
    category: 'life',
    icon: '💎',
    color: '#4A90D9',
    recommendedAmount: 100,
    isDefault: true,
    sortOrder: 17,
  },
  {
    id: 'waiver',
    label: '保费豁免',
    shortLabel: '豁',
    category: 'other',
    icon: '🛡️',
    color: '#9B59B6',
    recommendedAmount: 0,
    isDefault: true,
    sortOrder: 17,
  },
  {
    id: 'schoolAccident',
    label: '学平险',
    shortLabel: '学',
    category: 'other',
    icon: '🎒',
    color: '#9B59B6',
    recommendedAmount: 10,
    isDefault: true,
    sortOrder: 18,
  },
  {
    id: 'longTermCare',
    label: '长期护理',
    shortLabel: '护',
    category: 'other',
    icon: '🛁',
    color: '#9B59B6',
    recommendedAmount: 0,
    isDefault: true,
    sortOrder: 19,
  },
];

// 辅助函数：根据ID获取保障配置
export const getCoverageConfigById = (id: string): CoverageConfig | undefined => {
  return DEFAULT_COVERAGES.find(c => c.id === id);
};

// 辅助函数：根据分类获取保障列表
export const getCoveragesByCategory = (category: CoverageConfig['category']): CoverageConfig[] => {
  return DEFAULT_COVERAGES.filter(c => c.category === category).sort((a, b) => a.sortOrder - b.sortOrder);
};

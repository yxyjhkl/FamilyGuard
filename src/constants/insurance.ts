// src/constants/insurance.ts
// 保险保障常量（18项统一规则）- 所有数据唯一来源

import type {CoverageType} from '../types';

export interface InsuranceCoverageConfig {
  type: CoverageType;
  shortLabel: string;      // 简称（导出用）：如"寿"
  fullLabel: string;      // 全称：如"身故保障"
  color: string;           // 导出可视化颜色
  icon: string;            // Material Design 图标名
  description: string;     // 描述
  defaultAmount: number;   // 默认建议保额（万）
  unit: string;            // 单位
  applicableRoles: string[]; // 适用角色
  category: 'life' | 'critical' | 'accident' | 'medical' | 'education' | 'special'; // 分类
}

// 保险保障配置（18项统一规则）
export const INSURANCE_COVERAGES: InsuranceCoverageConfig[] = [
  // ========== 寿险/身价 ==========
  {
    type: 'death',
    shortLabel: '寿',
    fullLabel: '身故保障',
    color: '#8E44AD',
    icon: 'shield-account',
    description: '身故赔付，保障家人',
    defaultAmount: 100,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
    category: 'life',
  },
  {
    type: 'pension',
    shortLabel: '养',
    fullLabel: '养老年金',
    color: '#E67E22',
    icon: 'bank',
    description: '退休年金，品质养老',
    defaultAmount: 200,
    unit: '万',
    applicableRoles: ['husband', 'wife'],
    category: 'life',
  },

  // ========== 重疾类 ==========
  {
    type: 'criticalIllness',
    shortLabel: '重',
    fullLabel: '重疾保障',
    color: '#8E44AD',  // 深紫色
    icon: 'heart-pulse',
    description: '确诊即赔，收入补偿',
    defaultAmount: 50,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
    category: 'critical',
  },
  {
    type: 'moderateIllness',
    shortLabel: '中',
    fullLabel: '中度重疾',
    color: '#9B59B6',  // 浅紫色
    icon: 'heart-half-full',
    description: '中度重疾，阶梯保障',
    defaultAmount: 30,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
    category: 'critical',
  },
  {
    type: 'minorIllness',
    shortLabel: '轻',
    fullLabel: '轻度重疾',
    color: '#BB8FCE',  // 淡紫色
    icon: 'heart-outline',
    description: '轻度重疾，早期关怀',
    defaultAmount: 15,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
    category: 'critical',
  },
  {
    type: 'specificCritical',
    shortLabel: '特',
    fullLabel: '特定重疾',
    color: '#7D3C98',  // 中紫色
    icon: 'needle',
    description: '特定重疾，专项防护',
    defaultAmount: 30,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
    category: 'critical',
  },
  // ========== 意外类 ==========
  {
    type: 'accident',
    shortLabel: '意',
    fullLabel: '意外保障',
    color: '#7F8C8D',
    icon: 'flash-alert',
    description: '意外伤害保障',
    defaultAmount: 50,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'son', 'daughter'],
    category: 'accident',
  },
  {
    type: 'socialInsurance',
    shortLabel: '社',
    fullLabel: '社保医保',
    color: '#95A5A6',
    icon: 'hospital-box',
    description: '基本医疗保障',
    defaultAmount: 100,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'son', 'daughter'],
    category: 'medical',
  },
  {
    type: 'disability',
    shortLabel: '意',
    fullLabel: '意外医疗',
    color: '#636E72',
    icon: 'human',
    description: '意外医疗，费用报销',
    defaultAmount: 50,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'son', 'daughter'],
    category: 'accident',
  },
  {
    type: 'maternity',
    shortLabel: '孕',
    fullLabel: '孕妇保障',
    color: '#FD79A8',
    icon: 'baby-face',
    description: '孕产保障，安心孕育',
    defaultAmount: 20,
    unit: '万',
    applicableRoles: ['wife'],
    category: 'accident',
  },

  // ========== 医疗类 ==========
  {
    type: 'millionMedical',
    shortLabel: '百',
    fullLabel: '百万医疗',
    color: '#3498DB',
    icon: 'hospital-box',
    description: '大额医疗，社保补充',
    defaultAmount: 200,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
    category: 'medical',
  },
  {
    type: 'medical',
    shortLabel: '医',
    fullLabel: '一般医疗',
    color: '#2980B9',
    icon: 'medical-bag',
    description: '住院报销，覆盖广泛',
    defaultAmount: 3,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
    category: 'medical',
  },
  {
    type: 'overseasMedical',
    shortLabel: '海',
    fullLabel: '海外医疗',
    color: '#1ABC9C',
    icon: 'earth',
    description: '海外就医，全球资源',
    defaultAmount: 100,
    unit: '万',
    applicableRoles: ['husband', 'wife'],
    category: 'medical',
  },
  {
    type: 'hospital',
    shortLabel: '日',
    fullLabel: '住院津贴',
    color: '#FDCB6E',
    icon: 'cash',
    description: '住院补贴，安心养病',
    defaultAmount: 0.2,
    unit: '万/天',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
    category: 'medical',
  },

  // ========== 其他类 ==========
  {
    type: 'education',
    shortLabel: '教',
    fullLabel: '教育年金',
    color: '#27AE60',
    icon: 'school',
    description: '子女教育，提前规划',
    defaultAmount: 50,
    unit: '万',
    applicableRoles: ['son', 'daughter'],
    category: 'education',
  },
  {
    type: 'childPension',
    shortLabel: '增',
    fullLabel: '增额年金',
    color: '#9B59B6',
    icon: 'piggy-bank',
    description: '提前储备，财富增值',
    defaultAmount: 30,
    unit: '万',
    applicableRoles: ['son', 'daughter'],
    category: 'life',
  },
  {
    type: 'waiver',
    shortLabel: '豁',
    fullLabel: '保费豁免',
    color: '#00B894',
    icon: 'umbrella',
    description: '投保人豁免，爱不变质',
    defaultAmount: 0,
    unit: '',
    applicableRoles: ['husband', 'wife'],
    category: 'special',
  },
  {
    type: 'schoolAccident',
    shortLabel: '学',
    fullLabel: '学平险',
    color: '#00CEC9',
    icon: 'account-group',
    description: '学生综合保障险，低价高保障',
    defaultAmount: 10,
    unit: '万',
    applicableRoles: ['son', 'daughter'],
    category: 'special',
  },
  {
    type: 'longTermCare',
    shortLabel: '护',
    fullLabel: '长期护理',
    color: '#A29BFE',
    icon: 'shield-heart',
    description: '长期护理保障，守护健康生活',
    defaultAmount: 0,
    unit: '',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
    category: 'special',
  },
];

// ========== 辅助函数 ==========

// 根据分类获取分组顺序
export const getCoverageCategoryOrder = (category: InsuranceCoverageConfig['category']): number => {
  switch (category) {
    case 'life': return 0;
    case 'critical': return 1;
    case 'accident': return 2;
    case 'medical': return 3;
    case 'education': return 4;
    case 'special': return 5;
    default: return 6;
  }
};

// 获取保障类型的显示顺序
export const getCoverageDisplayOrder = (type: CoverageType): number => {
  const order: Record<CoverageType, number> = {
    death: 0,
    pension: 1,
    childPension: 2,
    criticalIllness: 3,
    moderateIllness: 4,
    minorIllness: 5,
    specificCritical: 6,
    accident: 7,
    disability: 8,
    maternity: 9,
    socialInsurance: 10,
    millionMedical: 11,
    medical: 12,
    overseasMedical: 13,
    hospital: 14,
    education: 15,
    waiver: 16,
    schoolAccident: 17,
    longTermCare: 18,
  };
  return order[type] ?? 99;
};

// 根据 type 查找保障配置
export const getCoverageByType = (type: CoverageType): InsuranceCoverageConfig | undefined => {
  return INSURANCE_COVERAGES.find(c => c.type === type);
};

// src/data/insuranceCoverages.ts
// 保险保障配置（18项统一规则）

import type {CoverageType} from '../types';

export interface InsuranceCoverage {
  type: CoverageType;
  shortLabel: string;      // 简称：如"寿"
  fullLabel: string;       // 全称：如"身故保障"
  color: string;           // 已激活颜色
  defaultAmount: number;   // 默认推荐保额（万）
  unit: string;            // 单位
  category: 'life' | 'critical' | 'accident' | 'medical' | 'education' | 'special';  // 分类
  description: string;      // 描述
}

// 保险保障（18项统一规则）
export const insuranceCoverages: InsuranceCoverage[] = [
  // ========== 寿险/身价 ==========
  {
    type: 'death',
    shortLabel: '寿',
    fullLabel: '身故保障',
    color: '#8E44AD',
    defaultAmount: 100,
    unit: '万',
    category: 'life',
    description: '身故赔付，保障家人',
  },
  {
    type: 'pension',
    shortLabel: '养',
    fullLabel: '养老年金',
    color: '#E67E22',
    defaultAmount: 200,
    unit: '万',
    category: 'life',
    description: '退休年金，品质养老',
  },

  // ========== 重疾类 ==========
  {
    type: 'criticalIllness',
    shortLabel: '重',
    fullLabel: '重疾保障',
    color: '#E74C3C',
    defaultAmount: 50,
    unit: '万',
    category: 'critical',
    description: '确诊即赔，收入补偿',
  },
  {
    type: 'moderateIllness',
    shortLabel: '中',
    fullLabel: '中度重疾',
    color: '#C0392B',
    defaultAmount: 30,
    unit: '万',
    category: 'critical',
    description: '中度重疾，阶梯保障',
  },
  {
    type: 'minorIllness',
    shortLabel: '轻',
    fullLabel: '轻度重疾',
    color: '#E74C3C',
    defaultAmount: 15,
    unit: '万',
    category: 'critical',
    description: '轻度重疾，早期关怀',
  },
  {
    type: 'specificCritical',
    shortLabel: '特',
    fullLabel: '特定重疾',
    color: '#D35400',
    defaultAmount: 30,
    unit: '万',
    category: 'critical',
    description: '特定重疾，专项防护',
  },
  {
    type: 'proton',
    shortLabel: '质',
    fullLabel: '质子重离子',
    color: '#16A085',
    defaultAmount: 100,
    unit: '万',
    category: 'critical',
    description: '尖端疗法，肿瘤克星',
  },

  // ========== 意外类 ==========
  {
    type: 'accident',
    shortLabel: '意',
    fullLabel: '意外保障',
    color: '#7F8C8D',
    defaultAmount: 100,
    unit: '万',
    category: 'accident',
    description: '意外伤害，全方位保障',
  },
  {
    type: 'disability',
    shortLabel: '残',
    fullLabel: '意外伤残',
    color: '#636E72',
    defaultAmount: 50,
    unit: '万',
    category: 'accident',
    description: '意外伤残，等级赔付',
  },
  {
    type: 'maternity',
    shortLabel: '孕',
    fullLabel: '孕妇保障',
    color: '#FD79A8',
    defaultAmount: 20,
    unit: '万',
    category: 'accident',
    description: '孕产保障，安心孕育',
  },

  // ========== 医疗类 ==========
  {
    type: 'millionMedical',
    shortLabel: '百',
    fullLabel: '百万医疗',
    color: '#3498DB',
    defaultAmount: 200,
    unit: '万',
    category: 'medical',
    description: '大额医疗，社保补充',
  },
  {
    type: 'medical',
    shortLabel: '医',
    fullLabel: '一般医疗',
    color: '#2980B9',
    defaultAmount: 300,
    unit: '万',
    category: 'medical',
    description: '住院报销，覆盖广泛',
  },
  {
    type: 'overseasMedical',
    shortLabel: '海',
    fullLabel: '海外医疗',
    color: '#1ABC9C',
    defaultAmount: 100,
    unit: '万',
    category: 'medical',
    description: '海外就医，全球资源',
  },
  {
    type: 'hospital',
    shortLabel: '日',
    fullLabel: '住院津贴',
    color: '#FDCB6E',
    defaultAmount: 0.2,
    unit: '万/天',
    category: 'medical',
    description: '住院补贴，安心养病',
  },

  // ========== 其他类 ==========
  {
    type: 'education',
    shortLabel: '教',
    fullLabel: '教育金',
    color: '#27AE60',
    defaultAmount: 50,
    unit: '万',
    category: 'education',
    description: '子女教育，提前规划',
  },
  {
    type: 'waiver',
    shortLabel: '豁',
    fullLabel: '保费豁免',
    color: '#00B894',
    defaultAmount: 0,
    unit: '',
    category: 'special',
    description: '投保人豁免，爱不变质',
  },
  {
    type: 'schoolAccident',
    shortLabel: '学',
    fullLabel: '学平险',
    color: '#00CEC9',
    defaultAmount: 10,
    unit: '万',
    category: 'special',
    description: '学生平安险，低价高保障',
  },
  {
    type: 'shortTermFree',
    shortLabel: '赠',
    fullLabel: '短期赠险',
    color: '#A29BFE',
    defaultAmount: 0,
    unit: '',
    category: 'special',
    description: '短期赠送，保障先行',
  },
];

// 根据分类获取分组索引
export const getCoverageCategoryOrder = (category: InsuranceCoverage['category']): number => {
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
    // 寿险/身价
    death: 0,
    pension: 1,
    // 重疾类
    criticalIllness: 2,
    moderateIllness: 3,
    minorIllness: 4,
    specificCritical: 5,
    proton: 6,
    // 意外类
    accident: 7,
    disability: 8,
    maternity: 9,
    // 医疗类
    millionMedical: 10,
    medical: 11,
    overseasMedical: 12,
    hospital: 13,
    // 其他
    education: 14,
    waiver: 15,
    schoolAccident: 16,
    shortTermFree: 17,
  };
  return order[type] ?? 99;
};

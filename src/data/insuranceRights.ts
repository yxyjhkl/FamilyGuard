// src/data/insuranceRights.ts
// 保险权益配置（8项统一规则）

import type {RightType} from '../types';

export interface InsuranceRight {
  type: RightType;
  shortLabel: string;      // 简称：如"居"
  fullLabel: string;       // 全称：如"居家养老"
  color: string;           // 已激活颜色
  description: string;    // 描述
  category: 'healthcare' | 'wealth' | 'eldercare';  // 分类
}

// 保险权益（8项统一规则）
export const insuranceRights: InsuranceRight[] = [
  // 康养类
  {
    type: 'homeCare',
    shortLabel: '居',
    fullLabel: '居家养老',
    color: '#34C759',
    description: '居家养老服务权益',
    category: 'eldercare',
  },
  {
    type: 'communityCare',
    shortLabel: '康',
    fullLabel: '康养社区',
    color: '#00B894',
    description: '康养社区入住权益',
    category: 'eldercare',
  },
  // 医疗类
  {
    type: 'familyDoctor',
    shortLabel: '医',
    fullLabel: '臻享家医',
    color: '#0984E3',
    description: '专属家庭医生健康管理',
    category: 'healthcare',
  },
  {
    type: 'nationalMedical',
    shortLabel: '国',
    fullLabel: '御享国医',
    color: '#1ABC9C',
    description: '国家级名医预约绿色通道',
    category: 'healthcare',
  },
  {
    type: 'superMedical',
    shortLabel: '超',
    fullLabel: '超级疗法',
    color: '#9B59B6',
    description: '超体医疗资源整合服务',
    category: 'healthcare',
  },
  {
    type: 'specialDrugs',
    shortLabel: '特',
    fullLabel: '特药服务',
    color: '#E74C3C',
    description: '特定药品采购与费用直付',
    category: 'healthcare',
  },
  // 财富类
  {
    type: 'trust',
    shortLabel: '信',
    fullLabel: '保险金信托',
    color: '#F39C12',
    description: '保险金信托，财富传承规划',
    category: 'wealth',
  },
  {
    type: 'taxBenefits',
    shortLabel: '税',
    fullLabel: '税延政策',
    color: '#E67E22',
    description: '税收优惠政策享用',
    category: 'wealth',
  },
];

// 根据分类获取分组索引（用于排列）
export const getRightCategoryOrder = (category: InsuranceRight['category']): number => {
  switch (category) {
    case 'eldercare': return 0;
    case 'healthcare': return 1;
    case 'wealth': return 2;
    default: return 3;
  }
};

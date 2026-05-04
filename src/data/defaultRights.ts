// src/data/defaultRights.ts
// 默认权益配置 - 8项

import {RightConfig} from '../types';

export const DEFAULT_RIGHTS: RightConfig[] = [
  {
    id: 'homeCare',
    label: '居家养老',
    shortLabel: '居',
    icon: '🏡',
    color: '#1ABC9C',
    isDefault: true,
    sortOrder: 1,
  },
  {
    id: 'familyDoctor',
    label: '臻享家医',
    shortLabel: '医',
    icon: '👨‍⚕️',
    color: '#3498DB',
    isDefault: true,
    sortOrder: 2,
  },
  {
    id: 'trust',
    label: '保险金信托',
    shortLabel: '信',
    icon: '🏦',
    color: '#9B59B6',
    isDefault: true,
    sortOrder: 3,
  },
  {
    id: 'nationalMedical',
    label: '御享国医',
    shortLabel: '国',
    icon: '🏛️',
    color: '#E74C3C',
    isDefault: true,
    sortOrder: 4,
  },
  {
    id: 'communityCare',
    label: '康养社区',
    shortLabel: '康',
    icon: '🌳',
    color: '#27AE60',
    isDefault: true,
    sortOrder: 5,
  },
  {
    id: 'superMedical',
    label: '超级疗法',
    shortLabel: '超',
    icon: '🔬',
    color: '#F39C12',
    isDefault: true,
    sortOrder: 6,
  },
  {
    id: 'specialDrugs',
    label: '特药服务',
    shortLabel: '特',
    icon: '💊',
    color: '#E91E63',
    isDefault: true,
    sortOrder: 7,
  },
  {
    id: 'taxBenefits',
    label: '税延政策',
    shortLabel: '税',
    icon: '📋',
    color: '#00BCD4',
    isDefault: true,
    sortOrder: 8,
  },
];

// 辅助函数：根据ID获取权益配置
export const getRightConfigById = (id: string): RightConfig | undefined => {
  return DEFAULT_RIGHTS.find(r => r.id === id);
};

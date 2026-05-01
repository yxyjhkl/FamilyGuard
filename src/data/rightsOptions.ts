// src/data/rightsOptions.ts
// 保险权益选项（8项统一规则）

import type {RightType} from '../types';

export interface RightOption {
  type: RightType;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const rightsOptions: RightOption[] = [
  {
    type: 'homeCare',
    label: '居家养老',
    icon: 'home-heart',
    color: '#34C759',
    description: '居家养老服务权益',
  },
  {
    type: 'communityCare',
    label: '康养社区',
    icon: 'home-city',
    color: '#00B894',
    description: '康养社区入住权益',
  },
  {
    type: 'familyDoctor',
    label: '臻享家医',
    icon: 'doctor',
    color: '#0984E3',
    description: '专属家庭医生健康管理',
  },
  {
    type: 'nationalMedical',
    label: '御享国医',
    icon: 'medical-bag',
    color: '#1ABC9C',
    description: '国家级名医预约绿色通道',
  },
  {
    type: 'superMedical',
    label: '超级疗法',
    icon: 'star-shooting',
    color: '#9B59B6',
    description: '超体医疗资源整合服务',
  },
  {
    type: 'specialDrugs',
    label: '特药服务',
    icon: 'pill',
    color: '#E74C3C',
    description: '特定药品采购与费用直付',
  },
  {
    type: 'trust',
    label: '保险金信托',
    icon: 'safe',
    color: '#F39C12',
    description: '保险金信托，财富传承规划',
  },
  {
    type: 'taxBenefits',
    label: '税延政策',
    icon: 'currency-cny',
    color: '#E67E22',
    description: '税收优惠政策享用',
  },
];

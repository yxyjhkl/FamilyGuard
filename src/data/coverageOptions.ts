// src/data/coverageOptions.ts
// 保险保障选项（18项统一规则）

import type {CoverageType} from '../types';

export interface CoverageOption {
  type: CoverageType;
  label: string;
  icon: string;
  description: string;
  defaultRecommended: number;
  unit: string;
  applicableRoles: string[];
}

export const coverageOptions: CoverageOption[] = [
  // ========== 寿险/身价 ==========
  {
    type: 'death',
    label: '身故保障',
    icon: 'shield-account',
    description: '身故赔付，保障家人',
    defaultRecommended: 100,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'grandfather', 'grandmother'],
  },
  {
    type: 'pension',
    label: '养老年金',
    icon: 'bank',
    description: '退休年金，品质养老',
    defaultRecommended: 200,
    unit: '万',
    applicableRoles: ['husband', 'wife'],
  },

  // ========== 重疾类 ==========
  {
    type: 'criticalIllness',
    label: '重疾保障',
    icon: 'heart-pulse',
    description: '确诊即赔，收入补偿',
    defaultRecommended: 50,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
  },
  {
    type: 'moderateIllness',
    label: '中度重疾',
    icon: 'heart-half-full',
    description: '中度重疾，阶梯保障',
    defaultRecommended: 30,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'grandfather', 'grandmother'],
  },
  {
    type: 'minorIllness',
    label: '轻度重疾',
    icon: 'heart-outline',
    description: '轻度重疾，早期关怀',
    defaultRecommended: 15,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'grandfather', 'grandmother'],
  },
  {
    type: 'specificCritical',
    label: '特定重疾',
    icon: 'needle',
    description: '特定重疾，专项防护',
    defaultRecommended: 30,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'grandfather', 'grandmother'],
  },
  {
    type: 'proton',
    label: '质子重离子',
    icon: 'atom',
    description: '尖端疗法，肿瘤克星',
    defaultRecommended: 100,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'grandfather', 'grandmother'],
  },

  // ========== 意外类 ==========
  {
    type: 'accident',
    label: '意外保障',
    icon: 'flash-alert',
    description: '意外伤害，全方位保障',
    defaultRecommended: 100,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'son', 'daughter'],
  },
  {
    type: 'disability',
    label: '意外伤残',
    icon: 'human',
    description: '意外伤残，等级赔付',
    defaultRecommended: 50,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'son', 'daughter'],
  },
  {
    type: 'maternity',
    label: '孕妇保障',
    icon: 'baby-face',
    description: '孕产保障，安心孕育',
    defaultRecommended: 20,
    unit: '万',
    applicableRoles: ['wife'],
  },

  // ========== 医疗类 ==========
  {
    type: 'millionMedical',
    label: '百万医疗',
    icon: 'hospital-box',
    description: '大额医疗，社保补充',
    defaultRecommended: 200,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
  },
  {
    type: 'medical',
    label: '一般医疗',
    icon: 'medical-bag',
    description: '住院报销，覆盖广泛',
    defaultRecommended: 300,
    unit: '万',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
  },
  {
    type: 'overseasMedical',
    label: '海外医疗',
    icon: 'earth',
    description: '海外就医，全球资源',
    defaultRecommended: 100,
    unit: '万',
    applicableRoles: ['husband', 'wife'],
  },
  {
    type: 'hospital',
    label: '住院津贴',
    icon: 'cash',
    description: '住院补贴，安心养病',
    defaultRecommended: 0.2,
    unit: '万/天',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
  },

  // ========== 其他类 ==========
  {
    type: 'education',
    label: '教育金',
    icon: 'school',
    description: '子女教育，提前规划',
    defaultRecommended: 50,
    unit: '万',
    applicableRoles: ['son', 'daughter'],
  },
  {
    type: 'waiver',
    label: '保费豁免',
    icon: 'umbrella',
    description: '投保人豁免，爱不变质',
    defaultRecommended: 0,
    unit: '',
    applicableRoles: ['husband', 'wife'],
  },
  {
    type: 'schoolAccident',
    label: '学平险',
    icon: 'account-group',
    description: '学生平安险，低价高保障',
    defaultRecommended: 10,
    unit: '万',
    applicableRoles: ['son', 'daughter'],
  },
  {
    type: 'shortTermFree',
    label: '短期赠险',
    icon: 'gift',
    description: '短期赠送，保障先行',
    defaultRecommended: 0,
    unit: '',
    applicableRoles: ['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'grandfather', 'grandmother'],
  },
];

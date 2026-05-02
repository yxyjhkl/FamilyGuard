// src/types/index.ts - 核心类型定义

export type MemberRole = 'husband' | 'wife' | 'son' | 'daughter' | 'father' | 'mother' | 'grandfather' | 'grandmother' | 'other';

// 成员覆盖状态类型
export type MemberStatus = 'none' | 'owned' | 'claimed'; // 未有 | 已有 | 理赔过

// 成员保障详情
export interface MemberCoverageDetail {
  status: MemberStatus;
  amount?: number;        // 保额（万）
  validityDate?: string;  // 有效期
}

// 保险保障类型（19项统一规则）
export type CoverageType =
  // 寿险/身价
  | 'death'            // 身故保障（寿）
  | 'pension'          // 养老年金（养）
  | 'childPension'     // 少儿年金（少）
  // 重疾类
  | 'criticalIllness'  // 重疾保障（重）
  | 'moderateIllness'   // 中度重疾（中）
  | 'minorIllness'      // 轻度重疾（轻）
  | 'specificCritical'  // 特定重疾（特）
  | 'proton'            // 质子重离子（质）
  // 意外类
  | 'accident'          // 意外保障（意）
  | 'disability'        // 意外伤残（残）
  | 'maternity'         // 孕妇保障（孕）
  // 医疗类
  | 'millionMedical'    // 百万医疗（百）
  | 'medical'           // 一般医疗（医）
  | 'overseasMedical'   // 海外医疗（海）
  | 'hospital'          // 住院津贴（日）
  // 其他
  | 'education'         // 教育金（教）
  | 'waiver'            // 保费豁免（豁）
  | 'schoolAccident'     // 学平险（学）
  | 'shortTermFree';    // 短期赠险（赠）

// 保险权益类型（8项统一规则）
export type RightType =
  | 'homeCare'           // 居家养老（居）
  | 'familyDoctor'       // 臻享家医（医）
  | 'trust'              // 保险金信托（信）
  | 'nationalMedical'    // 御享国医（国）
  | 'communityCare'      // 康养社区（康）
  | 'superMedical'        // 超级疗法（超）
  | 'specialDrugs'       // 特药服务（特）
  | 'taxBenefits';       // 税延政策（税）

export interface Coverage {
  type: CoverageType;
  label: string;
  hasCoverage: boolean;
  coverageAmount?: number;   // 已有保额（万元）
  recommendedAmount?: number; // 建议保额（万元）
  gapAmount?: number;        // 保障缺口（自动计算=recommendedAmount - coverageAmount）
  policyDetails?: string;    // 保单详情说明
}

export interface Right {
  type: RightType;
  label: string;
  hasRight: boolean;
  validityDate?: string;     // 有效期，格式 YYYY-MM-DD
  notes?: string;            // 备注
}

export interface Member {
  id: string;
  familyId: string;
  role: MemberRole;
  name: string;
  age: number;
  coverage: Coverage[];
  rights: Right[];
  notes?: string;
  // 新增：成员权益/保障编辑状态
  coverageDetails?: {[key: string]: MemberCoverageDetail}; // 详细保障配置
  claimedItems?: string[];   // 已理赔项目列表
}

export interface ExportSettings {
  showName: boolean;
  showAgentInfo: boolean;
  agentName: string;
  agentPhone: string;
  customNotes: string;
  selectedMotto: string;
  aiSummary?: string;  // 预留AI总结
}

export interface Family {
  id: string;
  name: string;
  structureType: string;
  structureLabel: string;
  createdAt: string;
  updatedAt: string;
  members: Member[];
  exportSettings: ExportSettings;
}

export interface FamilyTemplate {
  id: string;
  label: string;
  description: string;
  category: 'common' | 'special';
  members: {
    role: MemberRole;
    defaultName: string;
    defaultAge: number;
  }[];
}

export type RootStackParamList = {
  Home: undefined;
  FamilySelect: undefined;
  MemberList: {familyId: string};
  MemberDetail: {familyId: string; memberId: string};
  ExportPreview: {familyId: string};
  MemberDetailExport: {familyId: string; memberId: string};
  AIAnalysis: {familyId: string};
  Help: undefined;
  Settings: undefined;
};

// 保险保障标签（19项统一规则）
export const COVERAGE_LABELS: Record<CoverageType, string> = {
  // 寿险/身价
  death: '身故保障（寿）',
  pension: '养老年金（养）',
  childPension: '少儿年金（少）',
  // 重疾类
  criticalIllness: '重疾保障（重）',
  moderateIllness: '中度重疾（中）',
  minorIllness: '轻度重疾（轻）',
  specificCritical: '特定重疾（特）',
  proton: '质子重离子（质）',
  // 意外类
  accident: '意外保障（意）',
  disability: '意外伤残（残）',
  maternity: '孕妇保障（孕）',
  // 医疗类
  millionMedical: '百万医疗（百）',
  medical: '一般医疗（医）',
  overseasMedical: '海外医疗（海）',
  hospital: '住院津贴（日）',
  // 其他
  education: '教育金（教）',
  waiver: '保费豁免（豁）',
  schoolAccident: '学平险（学）',
  shortTermFree: '短期赠险（赠）',
};

// 保险权益标签（8项统一规则）
export const RIGHT_LABELS: Record<RightType, string> = {
  homeCare: '居家养老（居）',
  familyDoctor: '臻享家医（医）',
  trust: '保险金信托（信）',
  nationalMedical: '御享国医（国）',
  communityCare: '康养社区（康）',
  superMedical: '超级疗法（超）',
  specialDrugs: '特药服务（特）',
  taxBenefits: '税延政策（税）',
};

// 默认推荐保额
export const DEFAULT_RECOMMENDED_AMOUNTS: Record<CoverageType, number> = {
  death: 100,
  pension: 200,
  childPension: 30,
  criticalIllness: 50,
  moderateIllness: 30,
  minorIllness: 15,
  specificCritical: 30,
  proton: 100,
  accident: 100,
  disability: 50,
  maternity: 20,
  millionMedical: 200,
  medical: 300,
  overseasMedical: 100,
  hospital: 0.2, // 万元/天
  education: 50,
  waiver: 0,
  schoolAccident: 10,
  shortTermFree: 0,
};

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  husband: '丈夫',
  wife: '妻子',
  son: '儿子',
  daughter: '女儿',
  father: '父亲',
  mother: '母亲',
  grandfather: '爷爷',
  grandmother: '奶奶',
  other: '其他',
};

// 角色简笔画图标
export const MEMBER_ROLE_ICONS: Record<MemberRole, string> = {
  husband: '👨',  // 丈夫
  wife: '👩',     // 妻子
  son: '👦',      // 儿子
  daughter: '👧', // 女儿
  father: '👨',   // 父亲
  mother: '👩',   // 母亲
  grandfather: '👴', // 爷爷
  grandmother: '👵', // 奶奶
  other: '👤',    // 其他
};

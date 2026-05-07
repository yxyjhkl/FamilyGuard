// src/types/index.ts - 核心类型定义

// ========== 分析模式类型 ==========
export type AnalysisMode = 'professional' | 'quick';

// 家庭成员角色
export type MemberRole = 
  // 核心成员
  | 'husband'        // 丈夫
  | 'wife'           // 妻子
  | 'son'            // 儿子
  | 'daughter'       // 女儿
  // 父母
  | 'father'         // 父亲
  | 'mother'         // 母亲
  // 祖父母
  | 'grandfather'    // 爷爷/外公
  | 'grandmother'    // 奶奶/外婆
  // 岳父母/公婆
  | 'father_in_law'  // 岳父/公公
  | 'mother_in_law'  // 岳母/婆婆
  // 兄弟姐妹
  | 'brother'        // 兄弟
  | 'sister'         // 姐妹
  // 女婿/儿媳
  | 'son_in_law'     // 女婿
  | 'daughter_in_law' // 儿媳
  // 其他
  | 'other';

// 成员覆盖状态类型
export type MemberStatus = 'none' | 'owned' | 'claimed'; // 未有 | 已有 | 理赔过

// 成员保障详情
export interface MemberCoverageDetail {
  status: MemberStatus;
  amount?: number;        // 保额（万）
  premium?: number;       // 保费（万元/年）
  validityDate?: string;  // 有效期
}

// ========== 保障配置类型 ==========

// 保障项配置（用于设置界面和成员数据）
export interface CoverageConfig {
  id: string;           // 唯一标识符
  label: string;        // 显示名称，如"身故保障"
  shortLabel: string;   // 简称，如"寿"
  category: 'life' | 'critical' | 'accident' | 'medical' | 'other'; // 分类
  icon: string;         // 图标emoji
  color: string;        // 颜色
  recommendedAmount: number; // 建议保额（万元）
  isDefault: boolean;   // 是否系统默认项
  sortOrder: number;    // 排序顺序
}

// ========== 权益配置类型 ==========

// 权益项配置（用于设置界面和成员数据）
export interface RightConfig {
  id: string;            // 唯一标识符
  label: string;        // 显示名称
  shortLabel: string;   // 简称
  icon: string;         // 图标emoji
  color: string;        // 颜色
  isDefault: boolean;   // 是否系统默认项
  sortOrder: number;    // 排序顺序
}

// ========== 兼容旧类型定义（保留但标记为废弃）==========

// 保险保障类型（19项统一规则）- 已废弃，使用CoverageConfig
// @deprecated 使用 CoverageConfig.id 代替
export type CoverageType =
  // 寿险/身价
  | 'death'            // 身故保障（寿）
  | 'pension'          // 养老年金（养）
  | 'childPension'     // 增额年金（增）
  // 重疾类
  | 'criticalIllness'  // 重疾保障（重）
  | 'moderateIllness'   // 中度重疾（中）
  | 'minorIllness'      // 轻度重疾（轻）
  | 'specificCritical'  // 特定重疾（特）
  | 'proton'            // 质子重离子（质）- 已移除，但保留兼容
  // 意外类
  | 'accident'          // 意外伤害（残）
  | 'disability'        // 意外医疗（意）
  | 'maternity'         // 孕妇保障（孕）
  // 社保类
  | 'socialInsurance'  // 社保医保（社）
  // 医疗类
  | 'millionMedical'    // 百万医疗（百）
  | 'medical'           // 一般医疗（医）
  | 'overseasMedical'   // 海外医疗（海）
  | 'hospital'          // 住院津贴（日）
  // 其他
  | 'education'         // 教育年金（教）
  | 'waiver'            // 保费豁免（豁）
  | 'schoolAccident'    // 学平险（学）
  | 'longTermCare';     // 长期护理（护）

// 保险权益类型（8项统一规则）- 已废弃，使用RightConfig
// @deprecated 使用 RightConfig.id 代替
export type RightType =
  | 'homeCare'           // 居家养老（居）
  | 'familyDoctor'       // 臻享家医（医）
  | 'trust'              // 保险金信托（信）
  | 'nationalMedical'    // 御享国医（国）
  | 'communityCare'      // 康养社区（康）
  | 'superMedical'        // 超级疗法（超）
  | 'specialDrugs'       // 特药服务（特）
  | 'taxBenefits';       // 税延政策（税）

// 成员保险保障项（使用配置的ID）
export interface MemberCoverage {
  id: string;              // 对应CoverageConfig.id
  hasCoverage: boolean;
  coverageAmount?: number;   // 已有保额（万元）
  premium?: number;         // 年缴保费（万元）
  recommendedAmount?: number; // 建议保额（万元）
  gapAmount?: number;        // 保障缺口（自动计算）
  policyDetails?: string;    // 保单详情说明
}

// 成员保险权益项（使用配置的ID）
export interface MemberRight {
  id: string;              // 对应RightConfig.id
  hasRight: boolean;
  validityDate?: string;     // 有效期，格式 YYYY-MM-DD
  notes?: string;            // 备注
}

// 向后兼容的类型别名
export interface Coverage extends MemberCoverage {}
export interface Right extends MemberRight {}

// 家庭成员类型别名（用于分析和计算）
export interface FamilyMember {
  id: string;
  name: string;
  role: MemberRole | string;  // 支持 MemberRole 或中文角色名
  age?: number;
  annualIncome?: number;
  coverage?: MemberCoverage[];
}

export interface Member {
  id: string;
  familyId: string;
  role: MemberRole;
  name: string;
  age: number;
  annualIncome?: number;  // 年收入（万元），用于精细版分析
  coverage: MemberCoverage[];
  rights: MemberRight[];
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

// 保险产品类型（用于分析和计算）
export interface InsuranceProduct {
  id: string;
  name: string;
  type: string;
  coverage?: number;
  premium?: number;
  insuredMembers?: string[];
  coverageDetails?: Coverage[];
}

// 家庭结构类型
export type FamilyStructureType = 
  | 'couple_only'      // 二人世界
  | 'couple_child'     // 夫妻+子女
  | 'three_generation' // 三代同堂
  | 'single_parent'    // 单亲家庭
  | 'dink'             // 丁克家庭
  | 'single'           // 独居
  | 'blended'          // 重组家庭
  | 'empty_nest'       // 空巢老人
  | 'grandparent'      // 隔代家庭
  | 'other';           // 其他

export interface Family {
  id: string;
  name: string;
  structureType: FamilyStructureType;
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
  FamilySelect: {mode?: AnalysisMode};  // mode: 精细版/快速版
  MemberList: {familyId: string; mode?: AnalysisMode};
  MemberDetail: {familyId: string; memberId: string};
  ExportPreview: {familyId: string; mode?: AnalysisMode};
  MemberDetailExport: {familyId: string; memberId: string; mode?: AnalysisMode};
  AIAnalysis: {familyId: string; mode?: AnalysisMode};  // mode: 精细版/快速版
  Help: undefined;
  Settings: undefined;
  SpeechManagement: undefined;  // 话术管理
};

// ========== 保障配置相关常量 ==========

// 保障类别配置
export const COVERAGE_CATEGORIES = {
  life: {label: '寿险/身价', color: '#4A90D9'},
  critical: {label: '重疾类', color: '#E74C3C'},
  accident: {label: '意外类', color: '#F39C12'},
  medical: {label: '医疗类', color: '#27AE60'},
  other: {label: '其他类', color: '#9B59B6'},
} as const;

// 向后兼容：旧版标签映射（已废弃）
// @deprecated 使用 CoverageConfig 代替
export const COVERAGE_LABELS: Record<CoverageType, string> = {
  // 寿险/身价
  death: '身故保障（寿）',
  pension: '养老年金（养）',
  childPension: '增额年金（增）',
  // 重疾类
  criticalIllness: '重疾保障（重）',
  moderateIllness: '中度重疾（中）',
  minorIllness: '轻度重疾（轻）',
  specificCritical: '特定重疾（特）',
  proton: '质子重离子（质）', // 保留兼容
  // 意外类
  accident: '意外伤害（残）',
  disability: '意外医疗（意）',
  maternity: '孕妇保障（孕）',
  // 社保类
  socialInsurance: '社保医保（社）',
  // 医疗类
  millionMedical: '百万医疗（百）',
  medical: '一般医疗（医）',
  overseasMedical: '海外医疗（海）',
  hospital: '住院津贴（日）',
  // 其他
  education: '教育年金（教）',
  waiver: '保费豁免（豁）',
  schoolAccident: '学平险（学）',
  longTermCare: '长期护理（护）',
};

// 向后兼容：旧版权益标签映射（已废弃）
// @deprecated 使用 RightConfig 代替
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

// 向后兼容：默认推荐保额（已废弃）
// @deprecated 使用 CoverageConfig.recommendedAmount 代替
export const DEFAULT_RECOMMENDED_AMOUNTS: Record<CoverageType, number> = {
  death: 100,
  pension: 200,
  childPension: 30,
  criticalIllness: 50,
  moderateIllness: 30,
  minorIllness: 15,
  specificCritical: 30,
  proton: 100, // 保留兼容
  accident: 50,  // 意外伤害
  disability: 50,
  maternity: 20,
  socialInsurance: 100,  // 社保医保
  millionMedical: 200,
  medical: 300,
  overseasMedical: 100,
  hospital: 0.2, // 万元/天
  education: 50,
  waiver: 0,
  schoolAccident: 10,
  longTermCare: 0,
};

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  // 核心成员
  husband: '丈夫',
  wife: '妻子',
  son: '儿子',
  daughter: '女儿',
  // 父母
  father: '父亲',
  mother: '母亲',
  // 祖父母
  grandfather: '爷爷',
  grandmother: '奶奶',
  // 岳父母/公婆
  father_in_law: '岳父/公公',
  mother_in_law: '岳母/婆婆',
  // 兄弟姐妹
  brother: '兄弟',
  sister: '姐妹',
  // 女婿/儿媳
  son_in_law: '女婿',
  daughter_in_law: '儿媳',
  // 其他
  other: '其他',
};

// 角色简笔画图标
export const MEMBER_ROLE_ICONS: Record<MemberRole, string> = {
  // 核心成员
  husband: '👨',     // 丈夫
  wife: '👩',        // 妻子
  son: '👦',         // 儿子
  daughter: '👧',    // 女儿
  // 父母
  father: '👨',      // 父亲
  mother: '👩',      // 母亲
  // 祖父母
  grandfather: '👴', // 爷爷
  grandmother: '👵', // 奶奶
  // 岳父母/公婆
  father_in_law: '👴', // 岳父/公公
  mother_in_law: '👵', // 岳母/婆婆
  // 兄弟姐妹
  brother: '🧑',     // 兄弟
  sister: '👩',      // 姐妹
  // 女婿/儿媳
  son_in_law: '🧑',  // 女婿
  daughter_in_law: '👩', // 儿媳
  // 其他
  other: '👤',       // 其他
};

// 家庭结构类型标签
export const FAMILY_STRUCTURE_LABELS: Record<FamilyStructureType, string> = {
  couple_only: '二人世界',
  couple_child: '夫妻+子女',
  three_generation: '三代同堂',
  single_parent: '单亲家庭',
  dink: '丁克家庭',
  single: '独居',
  blended: '重组家庭',
  empty_nest: '空巢老人',
  grandparent: '隔代家庭',
  other: '其他',
};

// ========== 辅助函数 ==========

// 判断是否为配偶角色
export const isSpouse = (role: MemberRole): boolean => 
  role === 'husband' || role === 'wife';

// 判断是否为子女角色
export const isChild = (role: MemberRole): boolean => 
  role === 'son' || role === 'daughter';

// 判断是否为父母角色
export const isParent = (role: MemberRole): boolean => 
  role === 'father' || role === 'mother';

// 判断是否为祖父母角色
export const isGrandparent = (role: MemberRole): boolean => 
  role === 'grandfather' || role === 'grandmother';

// 判断是否为配偶父母角色
export const isParentInLaw = (role: MemberRole): boolean => 
  role === 'father_in_law' || role === 'mother_in_law';

// 判断是否为配偶角色（包括岳父母/公婆）
export const isSpouseFamily = (role: MemberRole): boolean => 
  isSpouse(role) || isParentInLaw(role);

// 判断角色是否需要配置身故保障（经济支柱）
export const needsDeathCoverage = (role: MemberRole): boolean => 
  isSpouse(role) || role === 'father' || role === 'mother';

// 判断角色是否需要配置重疾保障
export const needsCriticalCoverage = (role: MemberRole): boolean => 
  !isGrandparent(role) && role !== 'other';

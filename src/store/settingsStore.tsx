// src/store/settingsStore.tsx
// 全局设置状态管理 - 支持自定义建议保额、保障配置、权益配置、客户经理信息、金句等

import React, {createContext, useContext, useReducer, useEffect, useCallback, useMemo} from 'react';
import type {CoverageType, CoverageConfig, RightConfig} from '../types';
import {DEFAULT_RECOMMENDED_AMOUNTS} from '../types';
import {DEFAULT_COVERAGES} from '../data/defaultCoverages';
import {DEFAULT_RIGHTS} from '../data/defaultRights';
import {storageService} from './storageService';
import {logger} from '../utils/logger';

// ========== 类型定义 ==========

// 客户经理信息
export interface AgentInfo {
  name: string;
  employeeId: string;
  phone: string;
  department: string;
}

// 自定义建议保额 - 使用字符串索引以支持动态配置
export interface CustomRecommendedAmounts {
  [key: string]: number | undefined;
}

// 收款码配置
export interface DonationConfig {
  wechatQrCode: string;      // 微信收款码图片（Base64或本地路径）
  alipayQrCode: string;      // 支付宝收款码图片（Base64或本地路径）
  alipayRedPacketCode: string; // 支付宝红包口令
  showWechat: boolean;       // 是否显示微信收款码
  showAlipay: boolean;       // 是否显示支付宝收款码
}

// 设置状态
export interface SettingsState {
  // 自定义建议保额
  customRecommendedAmounts: CustomRecommendedAmounts;
  useGlobalCustom: boolean;
  
  // 自定义保障配置
  customCoverages: CoverageConfig[];
  coverageOrder: string[];  // 保障项排序
  
  // 自定义权益配置
  customRights: RightConfig[];
  rightsOrder: string[];    // 权益项排序
  
  // 客户经理信息
  agentInfo: AgentInfo;
  
  // 默认金句
  defaultMotto: string;
  useDefaultMotto: boolean;
  
  // 收款码配置
  donationConfig: DonationConfig;
  
  // 加载状态
  loaded: boolean;
}

// Action 类型
type SettingsAction =
  | {type: 'LOAD_SETTINGS'; payload: Partial<SettingsState>}
  | {type: 'SET_CUSTOM_AMOUNT'; payload: {type: CoverageType; amount: number | undefined}}
  | {type: 'SET_ALL_CUSTOM_AMOUNTS'; payload: CustomRecommendedAmounts}
  | {type: 'RESET_TO_DEFAULTS'}
  | {type: 'TOGGLE_USE_GLOBAL'; payload: boolean}
  | {type: 'SET_AGENT_INFO'; payload: Partial<AgentInfo>}
  | {type: 'SET_DEFAULT_MOTTO'; payload: string}
  | {type: 'TOGGLE_USE_DEFAULT_MOTTO'; payload: boolean}
  | {type: 'SET_CUSTOM_COVERAGES'; payload: {coverages: CoverageConfig[]; order: string[]}}
  | {type: 'SET_CUSTOM_RIGHTS'; payload: {rights: RightConfig[]; order: string[]}}
  | {type: 'ADD_COVERAGE'; payload: CoverageConfig}
  | {type: 'REMOVE_COVERAGE'; payload: string}
  | {type: 'UPDATE_COVERAGE'; payload: CoverageConfig}
  | {type: 'REORDER_COVERAGES'; payload: string[]}
  | {type: 'ADD_RIGHT'; payload: RightConfig}
  | {type: 'REMOVE_RIGHT'; payload: string}
  | {type: 'UPDATE_RIGHT'; payload: RightConfig}
  | {type: 'REORDER_RIGHTS'; payload: string[]}
  | {type: 'RESET_COVERAGES_TO_DEFAULT'}
  | {type: 'RESET_RIGHTS_TO_DEFAULT'}
  | {type: 'SET_DONATION_CONFIG'; payload: Partial<DonationConfig>};

const initialAgentInfo: AgentInfo = {
  name: '',
  employeeId: '',
  phone: '',
  department: '',
};

// 初始收款码配置
const initialDonationConfig: DonationConfig = {
  wechatQrCode: '',
  alipayQrCode: '',
  alipayRedPacketCode: '',
  showWechat: true,
  showAlipay: true,
};

// 初始化保障顺序
const initialCoverageOrder: string[] = DEFAULT_COVERAGES.map(c => c.id);
// 初始化权益顺序
const initialRightsOrder: string[] = DEFAULT_RIGHTS.map(r => r.id);

const initialState: SettingsState = {
  customRecommendedAmounts: {},
  useGlobalCustom: true,
  customCoverages: [...DEFAULT_COVERAGES],
  coverageOrder: initialCoverageOrder,
  customRights: [...DEFAULT_RIGHTS],
  rightsOrder: initialRightsOrder,
  agentInfo: initialAgentInfo,
  defaultMotto: '',
  useDefaultMotto: false,
  donationConfig: initialDonationConfig,
  loaded: false,
};

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'LOAD_SETTINGS': {
      const payload = action.payload;
      // 防御性检查：确保数组字段不会因 payload 不完整而被覆盖为 undefined
      return {
        ...state,
        ...payload,
        customCoverages: (Array.isArray(payload.customCoverages) && payload.customCoverages.length > 0)
          ? payload.customCoverages
          : [...DEFAULT_COVERAGES],
        coverageOrder: (Array.isArray(payload.coverageOrder) && payload.coverageOrder.length > 0)
          ? payload.coverageOrder
          : initialCoverageOrder,
        customRights: (Array.isArray(payload.customRights) && payload.customRights.length > 0)
          ? payload.customRights
          : [...DEFAULT_RIGHTS],
        rightsOrder: (Array.isArray(payload.rightsOrder) && payload.rightsOrder.length > 0)
          ? payload.rightsOrder
          : initialRightsOrder,
        loaded: true,
      };
    }

    case 'SET_CUSTOM_AMOUNT':
      return {
        ...state,
        customRecommendedAmounts: {
          ...state.customRecommendedAmounts,
          [action.payload.type]: action.payload.amount,
        },
      };

    case 'SET_ALL_CUSTOM_AMOUNTS':
      return {
        ...state,
        customRecommendedAmounts: action.payload,
      };

    case 'RESET_TO_DEFAULTS':
      return {
        ...state,
        customRecommendedAmounts: {},
      };

    case 'TOGGLE_USE_GLOBAL':
      return {
        ...state,
        useGlobalCustom: action.payload,
      };

    case 'SET_AGENT_INFO':
      return {
        ...state,
        agentInfo: {...state.agentInfo, ...action.payload},
      };

    case 'SET_DEFAULT_MOTTO':
      return {
        ...state,
        defaultMotto: action.payload,
      };

    case 'TOGGLE_USE_DEFAULT_MOTTO':
      return {
        ...state,
        useDefaultMotto: action.payload,
      };

    // ========== 保障配置相关 ==========
    case 'SET_CUSTOM_COVERAGES':
      return {
        ...state,
        customCoverages: action.payload.coverages,
        coverageOrder: action.payload.order,
      };

    case 'ADD_COVERAGE':
      return {
        ...state,
        customCoverages: [...state.customCoverages, action.payload],
        coverageOrder: [...state.coverageOrder, action.payload.id],
      };

    case 'REMOVE_COVERAGE':
      return {
        ...state,
        customCoverages: state.customCoverages.filter(c => c.id !== action.payload),
        coverageOrder: state.coverageOrder.filter(id => id !== action.payload),
      };

    case 'UPDATE_COVERAGE':
      return {
        ...state,
        customCoverages: state.customCoverages.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case 'REORDER_COVERAGES':
      return {
        ...state,
        coverageOrder: action.payload,
      };

    case 'RESET_COVERAGES_TO_DEFAULT':
      return {
        ...state,
        customCoverages: [...DEFAULT_COVERAGES],
        coverageOrder: initialCoverageOrder,
      };

    // ========== 权益配置相关 ==========
    case 'SET_CUSTOM_RIGHTS':
      return {
        ...state,
        customRights: action.payload.rights,
        rightsOrder: action.payload.order,
      };

    case 'ADD_RIGHT':
      return {
        ...state,
        customRights: [...state.customRights, action.payload],
        rightsOrder: [...state.rightsOrder, action.payload.id],
      };

    case 'REMOVE_RIGHT':
      return {
        ...state,
        customRights: state.customRights.filter(r => r.id !== action.payload),
        rightsOrder: state.rightsOrder.filter(id => id !== action.payload),
      };

    case 'UPDATE_RIGHT':
      return {
        ...state,
        customRights: state.customRights.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };

    case 'REORDER_RIGHTS':
      return {
        ...state,
        rightsOrder: action.payload,
      };

    case 'RESET_RIGHTS_TO_DEFAULT':
      return {
        ...state,
        customRights: [...DEFAULT_RIGHTS],
        rightsOrder: initialRightsOrder,
      };

    case 'SET_DONATION_CONFIG':
      return {
        ...state,
        donationConfig: {...state.donationConfig, ...action.payload},
      };

    default:
      return state;
  }
}

// ========== Context ==========

interface SettingsContextType {
  state: SettingsState;
  setCustomAmount: (type: CoverageType, amount: number | undefined) => void;
  setAllCustomAmounts: (amounts: CustomRecommendedAmounts) => void;
  resetToDefaults: () => void;
  toggleUseGlobal: (use: boolean) => void;
  getRecommendedAmount: (type: CoverageType) => number;
  setAgentInfo: (info: Partial<AgentInfo>) => void;
  setDefaultMotto: (motto: string) => void;
  toggleUseDefaultMotto: (use: boolean) => void;
  exportSettings: () => string;
  importSettings: (data: string) => boolean;
  clearAllData: () => Promise<void>;
  
  // 保障配置相关方法
  getCoverageConfig: (id: string) => CoverageConfig | undefined;
  getActiveCoverages: () => CoverageConfig[];
  addCoverage: (coverage: CoverageConfig) => void;
  removeCoverage: (id: string) => void;
  updateCoverage: (coverage: CoverageConfig) => void;
  reorderCoverages: (order: string[]) => void;
  resetCoveragesToDefault: () => void;
  
  // 权益配置相关方法
  getRightConfig: (id: string) => RightConfig | undefined;
  getActiveRights: () => RightConfig[];
  addRight: (right: RightConfig) => void;
  removeRight: (id: string) => void;
  updateRight: (right: RightConfig) => void;
  reorderRights: (order: string[]) => void;
  resetRightsToDefault: () => void;

  // 收款码配置
  setDonationConfig: (config: Partial<DonationConfig>) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// ========== 工具函数 ==========

export const getDefaultAmount = (type: CoverageType): number => {
  return DEFAULT_RECOMMENDED_AMOUNTS[type] ?? 0;
};

// ========== Provider ==========

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  const loadSettings = useCallback(async () => {
    try {
      const data = await storageService.getSettings();
      if (data) {
        const settings = JSON.parse(data);
        dispatch({
          type: 'LOAD_SETTINGS',
          payload: {
            customRecommendedAmounts: settings.customRecommendedAmounts || {},
            useGlobalCustom: settings.useGlobalCustom ?? true,
            agentInfo: settings.agentInfo || initialAgentInfo,
            defaultMotto: settings.defaultMotto || '',
            useDefaultMotto: settings.useDefaultMotto || false,
            // 数组字段统一由 reducer 处理兜底（见 LOAD_SETTINGS case）
            customCoverages: settings.customCoverages,
            coverageOrder: settings.coverageOrder,
            customRights: settings.customRights,
            rightsOrder: settings.rightsOrder,
            donationConfig: settings.donationConfig || initialDonationConfig,
          },
        });
      } else {
        dispatch({type: 'LOAD_SETTINGS', payload: {}});
      }
    } catch {
      dispatch({type: 'LOAD_SETTINGS', payload: {}});
    }
  }, []);

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 构建持久化快照的字段集合
  const persistSnapshot = useMemo(() => ({
    customRecommendedAmounts: state.customRecommendedAmounts,
    useGlobalCustom: state.useGlobalCustom,
    agentInfo: state.agentInfo,
    defaultMotto: state.defaultMotto,
    useDefaultMotto: state.useDefaultMotto,
    customCoverages: state.customCoverages,
    coverageOrder: state.coverageOrder,
    customRights: state.customRights,
    rightsOrder: state.rightsOrder,
    donationConfig: state.donationConfig,
  }), [
    state.customRecommendedAmounts,
    state.useGlobalCustom,
    state.agentInfo,
    state.defaultMotto,
    state.useDefaultMotto,
    state.customCoverages,
    state.coverageOrder,
    state.customRights,
    state.rightsOrder,
    state.donationConfig,
  ]);

  // 自动持久化
  useEffect(() => {
    if (state.loaded) {
      const timer = setTimeout(() => {
        storageService.saveSettings(JSON.stringify(persistSnapshot)).catch(
          err => logger.error('SettingsStore', '持久化设置失败', err),
        );
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.loaded, persistSnapshot]);

  const setCustomAmount = useCallback((type: CoverageType, amount: number | undefined) => {
    dispatch({type: 'SET_CUSTOM_AMOUNT', payload: {type, amount}});
  }, []);

  const setAllCustomAmounts = useCallback((amounts: CustomRecommendedAmounts) => {
    dispatch({type: 'SET_ALL_CUSTOM_AMOUNTS', payload: amounts});
  }, []);

  const resetToDefaults = useCallback(() => {
    dispatch({type: 'RESET_TO_DEFAULTS'});
  }, []);

  const toggleUseGlobal = useCallback((use: boolean) => {
    dispatch({type: 'TOGGLE_USE_GLOBAL', payload: use});
  }, []);

  // 获取推荐保额（优先使用自定义，否则使用默认值）
  const getRecommendedAmount = useCallback(
    (type: CoverageType): number => {
      if (state.useGlobalCustom && state.customRecommendedAmounts[type] !== undefined) {
        return state.customRecommendedAmounts[type] as number;
      }
      return getDefaultAmount(type);
    },
    [state.useGlobalCustom, state.customRecommendedAmounts],
  );

  const setAgentInfo = useCallback((info: Partial<AgentInfo>) => {
    dispatch({type: 'SET_AGENT_INFO', payload: info});
  }, []);

  const setDefaultMotto = useCallback((motto: string) => {
    dispatch({type: 'SET_DEFAULT_MOTTO', payload: motto});
  }, []);

  const toggleUseDefaultMotto = useCallback((use: boolean) => {
    dispatch({type: 'TOGGLE_USE_DEFAULT_MOTTO', payload: use});
  }, []);

  // 导出设置（用于数据备份）
  const exportSettings = useCallback((): string => {
    return JSON.stringify({
      customRecommendedAmounts: state.customRecommendedAmounts,
      useGlobalCustom: state.useGlobalCustom,
      agentInfo: state.agentInfo,
      defaultMotto: state.defaultMotto,
      useDefaultMotto: state.useDefaultMotto,
      customCoverages: state.customCoverages,
      coverageOrder: state.coverageOrder,
      customRights: state.customRights,
      rightsOrder: state.rightsOrder,
      donationConfig: state.donationConfig,
      exportedAt: new Date().toISOString(),
      version: '2.3.3',
    });
  }, [state]);

  // 导入设置
  const importSettings = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.customRecommendedAmounts) {
        dispatch({type: 'SET_ALL_CUSTOM_AMOUNTS', payload: parsed.customRecommendedAmounts});
      }
      if (parsed.useGlobalCustom !== undefined) {
        dispatch({type: 'TOGGLE_USE_GLOBAL', payload: parsed.useGlobalCustom});
      }
      if (parsed.agentInfo) {
        dispatch({type: 'SET_AGENT_INFO', payload: parsed.agentInfo});
      }
      if (parsed.defaultMotto !== undefined) {
        dispatch({type: 'SET_DEFAULT_MOTTO', payload: parsed.defaultMotto});
      }
      if (parsed.useDefaultMotto !== undefined) {
        dispatch({type: 'TOGGLE_USE_DEFAULT_MOTTO', payload: parsed.useDefaultMotto});
      }
      if (parsed.customCoverages && parsed.coverageOrder) {
        dispatch({type: 'SET_CUSTOM_COVERAGES', payload: {
          coverages: parsed.customCoverages,
          order: parsed.coverageOrder,
        }});
      }
      if (parsed.customRights && parsed.rightsOrder) {
        dispatch({type: 'SET_CUSTOM_RIGHTS', payload: {
          rights: parsed.customRights,
          order: parsed.rightsOrder,
        }});
      }
      if (parsed.donationConfig) {
        dispatch({type: 'SET_DONATION_CONFIG', payload: parsed.donationConfig});
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  // 清除所有数据
  const clearAllData = useCallback(async () => {
    await storageService.clearAll();
    dispatch({type: 'LOAD_SETTINGS', payload: {}});
  }, []);

  // ========== 保障配置相关方法 ==========
  
  const getCoverageConfig = useCallback(
    (id: string): CoverageConfig | undefined => {
      return state.customCoverages.find(c => c.id === id);
    },
    [state.customCoverages],
  );

  const getActiveCoverages = useCallback((): CoverageConfig[] => {
    return state.coverageOrder
      .map(id => state.customCoverages.find(c => c.id === id))
      .filter((c): c is CoverageConfig => c !== undefined);
  }, [state.coverageOrder, state.customCoverages]);

  const addCoverage = useCallback((coverage: CoverageConfig) => {
    dispatch({type: 'ADD_COVERAGE', payload: coverage});
  }, []);

  const removeCoverage = useCallback((id: string) => {
    dispatch({type: 'REMOVE_COVERAGE', payload: id});
  }, []);

  const updateCoverage = useCallback((coverage: CoverageConfig) => {
    dispatch({type: 'UPDATE_COVERAGE', payload: coverage});
  }, []);

  const reorderCoverages = useCallback((order: string[]) => {
    dispatch({type: 'REORDER_COVERAGES', payload: order});
  }, []);

  const resetCoveragesToDefault = useCallback(() => {
    dispatch({type: 'RESET_COVERAGES_TO_DEFAULT'});
  }, []);

  // ========== 权益配置相关方法 ==========
  
  const getRightConfig = useCallback(
    (id: string): RightConfig | undefined => {
      return state.customRights.find(r => r.id === id);
    },
    [state.customRights],
  );

  const getActiveRights = useCallback((): RightConfig[] => {
    return state.rightsOrder
      .map(id => state.customRights.find(r => r.id === id))
      .filter((r): r is RightConfig => r !== undefined);
  }, [state.rightsOrder, state.customRights]);

  const addRight = useCallback((right: RightConfig) => {
    dispatch({type: 'ADD_RIGHT', payload: right});
  }, []);

  const removeRight = useCallback((id: string) => {
    dispatch({type: 'REMOVE_RIGHT', payload: id});
  }, []);

  const updateRight = useCallback((right: RightConfig) => {
    dispatch({type: 'UPDATE_RIGHT', payload: right});
  }, []);

  const reorderRights = useCallback((order: string[]) => {
    dispatch({type: 'REORDER_RIGHTS', payload: order});
  }, []);

  const resetRightsToDefault = useCallback(() => {
    dispatch({type: 'RESET_RIGHTS_TO_DEFAULT'});
  }, []);

  // 收款码配置
  const setDonationConfig = useCallback((config: Partial<DonationConfig>) => {
    dispatch({type: 'SET_DONATION_CONFIG', payload: config});
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        state,
        setCustomAmount,
        setAllCustomAmounts,
        resetToDefaults,
        toggleUseGlobal,
        getRecommendedAmount,
        setAgentInfo,
        setDefaultMotto,
        toggleUseDefaultMotto,
        exportSettings,
        importSettings,
        clearAllData,
        // 保障配置
        getCoverageConfig,
        getActiveCoverages,
        addCoverage,
        removeCoverage,
        updateCoverage,
        reorderCoverages,
        resetCoveragesToDefault,
        // 权益配置
        getRightConfig,
        getActiveRights,
        addRight,
        removeRight,
        updateRight,
        reorderRights,
        resetRightsToDefault,
        // 收款码配置
        setDonationConfig,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// ========== 辅助函数 ==========

export const hasCustomAmounts = (customAmounts: CustomRecommendedAmounts): boolean => {
  return Object.keys(customAmounts).length > 0;
};

export const getCustomCount = (customAmounts: CustomRecommendedAmounts): number => {
  return Object.keys(customAmounts).filter(k => customAmounts[k as CoverageType] !== undefined).length;
};

export const isAgentInfoComplete = (agentInfo: AgentInfo): boolean => {
  return !!(agentInfo.name && agentInfo.phone);
};

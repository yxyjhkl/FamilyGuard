// src/store/settingsStore.tsx
// 全局设置状态管理 - 支持自定义建议保额、业务员信息、金句等

import React, {createContext, useContext, useReducer, useEffect, useCallback} from 'react';
import type {CoverageType} from '../types';
import {DEFAULT_RECOMMENDED_AMOUNTS} from '../types';
import {storageService} from './storageService';

// ========== 类型定义 ==========

// 业务员信息
export interface AgentInfo {
  name: string;
  employeeId: string;
  phone: string;
  department: string;
}

// 自定义建议保额
export interface CustomRecommendedAmounts {
  [key: CoverageType]: number | undefined;
}

// 设置状态
export interface SettingsState {
  // 自定义建议保额
  customRecommendedAmounts: CustomRecommendedAmounts;
  useGlobalCustom: boolean;
  
  // 业务员信息
  agentInfo: AgentInfo;
  
  // 默认金句
  defaultMotto: string;
  useDefaultMotto: boolean;
  
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
  | {type: 'TOGGLE_USE_DEFAULT_MOTTO'; payload: boolean};

const initialAgentInfo: AgentInfo = {
  name: '',
  employeeId: '',
  phone: '',
  department: '',
};

const initialState: SettingsState = {
  customRecommendedAmounts: {},
  useGlobalCustom: true,
  agentInfo: initialAgentInfo,
  defaultMotto: '',
  useDefaultMotto: false,
  loaded: false,
};

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'LOAD_SETTINGS':
      return {
        ...state,
        ...action.payload,
        loaded: true,
      };

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
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// ========== 工具函数 ==========

const getDefaultAmount = (type: CoverageType): number => {
  return DEFAULT_RECOMMENDED_AMOUNTS[type] ?? 0;
};

// ========== Provider ==========

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  // 自动持久化
  useEffect(() => {
    if (state.loaded) {
      const timer = setTimeout(() => {
        const dataToSave = {
          customRecommendedAmounts: state.customRecommendedAmounts,
          agentInfo: state.agentInfo,
          defaultMotto: state.defaultMotto,
          useDefaultMotto: state.useDefaultMotto,
        };
        storageService.saveSettings(JSON.stringify(dataToSave));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state, state.loaded]);

  const loadSettings = async () => {
    const data = await storageService.getSettings();
    if (data) {
      try {
        const settings = JSON.parse(data);
        dispatch({
          type: 'LOAD_SETTINGS',
          payload: {
            customRecommendedAmounts: settings.customRecommendedAmounts || {},
            agentInfo: settings.agentInfo || initialAgentInfo,
            defaultMotto: settings.defaultMotto || '',
            useDefaultMotto: settings.useDefaultMotto || false,
          },
        });
      } catch {
        dispatch({type: 'LOAD_SETTINGS', payload: {}});
      }
    } else {
      dispatch({type: 'LOAD_SETTINGS', payload: {}});
    }
  };

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
      agentInfo: state.agentInfo,
      defaultMotto: state.defaultMotto,
      useDefaultMotto: state.useDefaultMotto,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    });
  }, [state]);

  // 导入设置
  const importSettings = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.customRecommendedAmounts) {
        dispatch({type: 'SET_ALL_CUSTOM_AMOUNTS', payload: parsed.customRecommendedAmounts});
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

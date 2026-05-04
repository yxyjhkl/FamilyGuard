// src/theme/colors.ts

// 功能性颜色类型
export interface FunctionalColors {
  success: string;
  warning: string;
  danger: string;
  error: string;
  info: string;
  infoLight: string;
  purple: string;
  gold: string;
}

// 完整颜色对象类型
export interface Colors {
  primary: readonly [string, string, string];
  secondary: readonly [string, string, string];
  background: readonly [string, string, string];
  text: readonly [string, string, string, string];
  functional: FunctionalColors;
  gradient: {
    start: string;
    end: string;
    warmStart: string;
    warmEnd: string;
  };
  card: {
    shadow: string;
    border: string;
  };
}

export const colors: Colors = {
  primary: ['#1A3A6B', '#2B5EA7', '#4A90D9'],
  secondary: ['#6366F1', '#818CF8', '#A5B4FC'],  // 紫色系
  background: ['#F5F7FA', '#FFFFFF', '#EBF0F8'],
  text: ['#1A1A2E', '#4A4A6A', '#8E8EA0', '#FFFFFF'],
  functional: {
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    error: '#FF3B30', // 兼容别名
    info: '#007AFF',
    infoLight: '#E3F2FD',
    purple: '#AF52DE',
    gold: '#D4A843',
  },
  gradient: {
    start: '#1A3A6B',
    end: '#4A90D9',
    warmStart: '#D4A843',
    warmEnd: '#FF9500',
  },
  card: {
    shadow: '#000000',
    border: '#E8EDF2',
  },
};

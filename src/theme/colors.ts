// src/theme/colors.ts

export const colors = {
  primary: ['#1A3A6B', '#2B5EA7', '#4A90D9'] as const,
  secondary: ['#6366F1', '#818CF8', '#A5B4FC'] as const,  // 紫色系
  background: ['#F5F7FA', '#FFFFFF', '#EBF0F8'] as const,
  text: ['#1A1A2E', '#4A4A6A', '#8E8EA0', '#FFFFFF'] as const,
  functional: {
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    info: '#007AFF',
    purple: '#AF52DE',
    gold: '#D4A843',
  } as const,
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

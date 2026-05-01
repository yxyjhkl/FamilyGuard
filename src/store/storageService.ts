// src/store/storageService.ts
// 使用内存存储替代 AsyncStorage（因 NDK 兼容性问题）

// 简单的内存存储
const memoryStorage: Record<string, string> = {};

const STORAGE_KEYS = {
  families: '@familyguard_families',
  settings: '@familyguard_settings',
} as const;

export interface StorageData {
  families: string;
  settings: string;
}

export const storageService = {
  // 家庭数据
  async getFamilies(): Promise<string | null> {
    return memoryStorage[STORAGE_KEYS.families] || null;
  },

  async saveFamilies(data: string): Promise<void> {
    memoryStorage[STORAGE_KEYS.families] = data;
  },

  // 应用设置
  async getSettings(): Promise<string | null> {
    return memoryStorage[STORAGE_KEYS.settings] || null;
  },

  async saveSettings(data: string): Promise<void> {
    memoryStorage[STORAGE_KEYS.settings] = data;
  },

  // 清空所有数据
  async clearAll(): Promise<void> {
    delete memoryStorage[STORAGE_KEYS.families];
    delete memoryStorage[STORAGE_KEYS.settings];
  },
};

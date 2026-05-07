// src/store/storageService.ts
// 基于 AsyncStorage 的持久化存储服务

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../utils/logger';

const MODULE = 'StorageService';

const STORAGE_KEYS = {
  families: '@familyguard_families',
  settings: '@familyguard_settings',
  // AI 相关数据存储键
  aiConfig: '@family_guard_ai_config',
  analysisHistory: '@family_guard_analysis_history',
  speechHistory: '@family_guard_speech_history',
  customSpeeches: '@family_guard_custom_speeches',  // 自定义话术
} as const;

class StorageService {
  // ========== 家庭数据 ==========
  async getFamilies(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.families);
    } catch (error) {
      logger.error(MODULE, '读取家庭数据失败', error);
      return null;
    }
  }

  async saveFamilies(data: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.families, data);
    } catch (error) {
      logger.error(MODULE, '保存家庭数据失败', error);
      throw error;
    }
  }

  // ========== 应用设置 ==========
  async getSettings(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.settings);
    } catch (error) {
      logger.error(MODULE, '读取设置数据失败', error);
      return null;
    }
  }

  async saveSettings(data: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.settings, data);
    } catch (error) {
      logger.error(MODULE, '保存设置数据失败', error);
      throw error;
    }
  }

  // ========== AI 配置 ==========
  async getAIConfig(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.aiConfig);
    } catch (error) {
      logger.error(MODULE, '读取AI配置失败', error);
      return null;
    }
  }

  async saveAIConfig(config: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.aiConfig, config);
    } catch (error) {
      logger.error(MODULE, '保存AI配置失败', error);
      throw error;
    }
  }

  async clearAIConfig(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.aiConfig);
    } catch (error) {
      logger.error(MODULE, '清除AI配置失败', error);
      throw error;
    }
  }

  // ========== 分析历史 ==========
  async getAnalysisHistory(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.analysisHistory);
    } catch (error) {
      logger.error(MODULE, '读取分析历史失败', error);
      return null;
    }
  }

  async saveAnalysisHistory(history: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.analysisHistory, history);
    } catch (error) {
      logger.error(MODULE, '保存分析历史失败', error);
      throw error;
    }
  }

  // ========== 话术历史 ==========
  async getSpeechHistory(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.speechHistory);
    } catch (error) {
      logger.error(MODULE, '读取话术历史失败', error);
      return null;
    }
  }

  async saveSpeechHistory(history: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.speechHistory, history);
    } catch (error) {
      logger.error(MODULE, '保存话术历史失败', error);
      throw error;
    }
  }

  // ========== 自定义话术 ==========
  async getCustomSpeeches(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.customSpeeches);
    } catch (error) {
      logger.error(MODULE, '读取自定义话术失败', error);
      return null;
    }
  }

  async saveCustomSpeeches(speeches: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.customSpeeches, speeches);
    } catch (error) {
      logger.error(MODULE, '保存自定义话术失败', error);
      throw error;
    }
  }

  async clearCustomSpeeches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.customSpeeches);
    } catch (error) {
      logger.error(MODULE, '清除自定义话术失败', error);
      throw error;
    }
  }

  // ========== 清空所有数据 ==========
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.families,
        STORAGE_KEYS.settings,
        STORAGE_KEYS.aiConfig,
        STORAGE_KEYS.analysisHistory,
        STORAGE_KEYS.speechHistory,
        STORAGE_KEYS.customSpeeches,
      ]);
    } catch (error) {
      logger.error(MODULE, '清除数据失败', error);
      throw error;
    }
  }

  // ========== 清理废弃的保障项 ==========
  // 清理所有家庭成员中的 shortTermFree（旧版"短期赠险"）记录
  async cleanupDeprecatedCoverages(): Promise<void> {
    try {
      const familiesData = await this.getFamilies();
      if (!familiesData) return;

      const families = JSON.parse(familiesData);
      let totalCleaned = 0;

      const cleanedFamilies = families.map((family: any) => {
        if (!family.members) return family;

        const cleanedMembers = family.members.map((member: any) => {
          // 清理 coverage 数组中的 shortTermFree
          const originalLength = member.coverage?.length || 0;
          member.coverage = (member.coverage || []).filter(
            (c: any) => c.id !== 'shortTermFree'
          );
          const cleanedCount = originalLength - member.coverage.length;
          totalCleaned += cleanedCount;

          // 清理 rights 数组中的 shortTermFree（如果存在）
          const rightsOriginalLength = member.rights?.length || 0;
          member.rights = (member.rights || []).filter(
            (r: any) => r.id !== 'shortTermFree'
          );
          totalCleaned += rightsOriginalLength - (member.rights?.length || 0);

          return member;
        });

        return {...family, members: cleanedMembers};
      });

      await this.saveFamilies(JSON.stringify(cleanedFamilies));
      logger.info(MODULE, `已清理 ${totalCleaned} 个废弃保障项记录`);
    } catch (error) {
      logger.error(MODULE, '清理废弃保障项失败', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();

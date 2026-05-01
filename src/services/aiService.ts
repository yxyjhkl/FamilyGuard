// src/services/aiService.ts
// AI服务接口 - 预留，后期通过API Key激活
import type {Family} from '../types';

export interface AIConfig {
  apiKey: string;
  model: string;
  endpoint: string;
}

export interface AISummaryRequest {
  familyName: string;
  members: {
    name: string;
    role: string;
    age: number;
    coverageSummary: string;
    rightsSummary: string;
  }[];
}

export interface AISummaryResponse {
  summary: string;
  suggestions: string[];
  riskWarnings: string[];
}

class AIService {
  private config: AIConfig | null = null;

  // 初始化AI配置（由用户填入API Key时调用）
  configure(config: AIConfig) {
    this.config = config;
  }

  // 检查AI是否已配置
  isConfigured(): boolean {
    return this.config !== null && this.config.apiKey.length > 0;
  }

  // 生成保障检视AI总结（预留接口）
  async generateSummary(_family: Family): Promise<string> {
    if (!this.isConfigured()) {
      // 未配置时返回引导文案
      return 'AI智能总结即将上线，配置API Key后可自动生成专业的保障检视报告总结。';
    }

    // ---- 以下为预留实现 ----
    // const request: AISummaryRequest = {
    //   familyName: family.name,
    //   members: family.members.map(m => ({
    //     name: m.name,
    //     role: m.role,
    //     age: m.age,
    //     coverageSummary: m.coverage
    //       .filter(c => c.hasCoverage)
    //       .map(c => `${c.label}: ${c.coverageAmount}万`).join('、'),
    //     rightsSummary: m.rights
    //       .filter(r => r.hasRight)
    //       .map(r => r.label).join('、'),
    //   })),
    // };

    // const response = await fetch(this.config.endpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${this.config.apiKey}`,
    //   },
    //   body: JSON.stringify({...}),
    // });
    // const data = await response.json();
    // return data.summary;

    return 'AI智能总结即将上线，配置API Key后可自动生成专业的保障检视报告总结。';
  }
}

export const aiService = new AIService();

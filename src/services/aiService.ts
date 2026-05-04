// src/services/aiService.ts
// AI服务接口 - 支持多种预设提供商及自定义API
import React from 'react';
import { Alert } from 'react-native';
import type {Family, FamilyMember, InsuranceProduct, Member, MemberCoverage} from '../types';
import { MEMBER_ROLE_LABELS } from '../types';
import { DEFAULT_COVERAGES } from '../data/defaultCoverages';
import {logger} from '../utils/logger';
import {storageService} from '../store/storageService';

const MODULE = 'AIService';

// ============================================
// 优化 #3: 总结风格类型
// ============================================
export type SummaryStyle = 'professional' | 'simple' | 'concise';

// 优化 #7: 加载状态类型
export type LoadingState = 'idle' | 'analyzing' | 'generating' | 'complete' | 'error';

// 优化 #1: 缓存结果类型
interface CacheEntry {
  result: FamilyAnalysisResult;
  timestamp: number;
}

// 优化 #6: 历史记录类型
export interface AnalysisHistory {
  id: string;
  familyId: string;
  date: string;
  score: number;
  gaps: number;
  summary: string;
  aiSummary?: string;
}

// ============================================
// AI提供商预设配置
// ============================================
export type AIProvider = 'deepseek' | 'moonshot' | 'doubao' | 'minimax' | 'wenxin' | 'zhipu' | 'hunyuan' | 'custom';

export interface ProviderConfig {
  id: AIProvider;
  name: string;                    // 显示名称
  nameEn: string;                   // 英文名称
  logo?: string;                    // Logo emoji
  defaultEndpoint: string;         // 默认API地址
  defaultModel: string;            // 默认模型
  supportsStreaming: boolean;      // 是否支持流式输出
  needsSystemPrompt: boolean;       // 是否需要系统提示词
  maxContextTokens?: number;       // 最大上下文token
  models?: { id: string; name: string; description?: string }[];  // 模型列表
}

// 预设AI提供商列表
export const AI_PROVIDERS: ProviderConfig[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    nameEn: 'DeepSeek',
    logo: '🔮',
    defaultEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    supportsStreaming: true,
    needsSystemPrompt: true,
    maxContextTokens: 64000,
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', description: '通用对话模型' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', description: '推理模型，擅长复杂推理' },
    ],
  },
  {
    id: 'moonshot',
    name: '月之暗面',
    nameEn: 'Moonshot',
    logo: '🌙',
    defaultEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    supportsStreaming: true,
    needsSystemPrompt: true,
    maxContextTokens: 32000,
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K', description: '基础版本，32K上下文' },
      { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', description: '中等等级，128K上下文' },
      { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K', description: '最高等级，200K上下文' },
    ],
  },
  {
    id: 'doubao',
    name: '字节豆包',
    nameEn: 'Doubao',
    logo: '🫛',
    defaultEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    defaultModel: 'doubao-pro-32k',
    supportsStreaming: true,
    needsSystemPrompt: true,
    maxContextTokens: 32000,
    models: [
      { id: 'doubao-pro-32k', name: '豆包 Pro 32K', description: '32K上下文' },
      { id: 'doubao-lite-32k', name: '豆包 Lite 32K', description: '轻量版，性价比高' },
    ],
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    nameEn: 'MiniMax',
    logo: '🎯',
    defaultEndpoint: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    defaultModel: 'abab6.5s-chat',
    supportsStreaming: true,
    needsSystemPrompt: true,
    maxContextTokens: 32000,
    models: [
      { id: 'abab6.5s-chat', name: 'ABAB 6.5S', description: '标准版' },
      { id: 'abab6.5g-chat', name: 'ABAB 6.5G', description: '增强版' },
    ],
  },
  {
    id: 'wenxin',
    name: '文心一言',
    nameEn: 'Baidu Wenxin',
    logo: '📝',
    defaultEndpoint: 'https://qianfan.baidubce.com/v2/chat/completions',
    defaultModel: 'ernie-4.0-8k-latest',
    supportsStreaming: true,
    needsSystemPrompt: true,
    maxContextTokens: 32000,
    models: [
      { id: 'ernie-4.0-8k-latest', name: '文心一言 4.0', description: '最新旗舰模型' },
      { id: 'ernie-3.5-8k', name: '文心一言 3.5', description: '性价比版本' },
    ],
  },
  {
    id: 'zhipu',
    name: '智谱AI',
    nameEn: 'Zhipu AI',
    logo: '💎',
    defaultEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4-flash',
    supportsStreaming: true,
    needsSystemPrompt: true,
    maxContextTokens: 128000,
    models: [
      { id: 'glm-4-flash', name: 'GLM-4 Flash', description: '快速响应版' },
      { id: 'glm-4', name: 'GLM-4', description: '标准版，128K上下文' },
      { id: 'glm-4-plus', name: 'GLM-4 Plus', description: '增强版' },
    ],
  },
  {
    id: 'hunyuan',
    name: '腾讯混元',
    nameEn: 'Tencent Hunyuan',
    logo: '🐧',
    defaultEndpoint: 'https://hunyuan.cloud.tencent.com/v1/chat/completions',
    defaultModel: 'hunyuan-pro',
    supportsStreaming: true,
    needsSystemPrompt: true,
    maxContextTokens: 32000,
    models: [
      { id: 'hunyuan-pro', name: '混元 Pro', description: '旗舰模型' },
      { id: 'hunyuan-standard', name: '混元 Standard', description: '标准版' },
      { id: 'hunyuan-lite', name: '混元 Lite', description: '轻量版' },
    ],
  },
  {
    id: 'custom',
    name: '自定义',
    nameEn: 'Custom',
    logo: '⚙️',
    defaultEndpoint: '',
    defaultModel: '',
    supportsStreaming: true,
    needsSystemPrompt: true,
    maxContextTokens: 0,
    models: [],
  },
];

// ============================================
// 用户配置接口
// ============================================
export interface AIUserConfig {
  provider: AIProvider;            // 选择的提供商
  apiKey: string;                   // API密钥
  customName?: string;              // 自定义名称（自定义时使用）
  endpoint: string;                // API地址
  model: string;                    // 模型名称
  temperature: number;               // 温度参数 (0-2)
  maxTokens: number;                // 最大输出token
  customHeaders?: Record<string, string>; // 自定义请求头
}

// 内部运行时配置
export interface AIRuntimeConfig {
  apiKey: string;
  model: string;
  endpoint: string;
  provider: AIProvider;
  temperature: number;
  maxTokens: number;
  headers: Record<string, string>;
}

// ============================================
// 分析结果类型
// ============================================

// 保障缺口详情
export interface CoverageGap {
  label: string;
  currentCoverage: number;
  recommendedCoverage: number;
  gap: number;
  priority: 'high' | 'medium' | 'low';
}

// 成员分析结果
export interface MemberAnalysisResult {
  memberId: string;
  memberName: string;
  memberRole: string;
  age: number;
  riskScore: number;
  coverageScore: number;
  products: Array<{
    id: string;
    name: string;
    type: string;
    coverage: number;
    premium: number;
  }>;
  coverageGaps: CoverageGap[];
  suggestions: string[];
  warnings: string[];
  summary: string;
}

// 家庭分析结果
export interface FamilyAnalysisResult {
  id: string;
  familyId: string;
  date: string;
  overallRiskScore: number;
  totalGaps: number;
  highPriorityGaps: number;
  familyProtectionScore: number;
  familyPremiumTotal: number;
  memberResults: MemberAnalysisResult[];
  overallAdvice: string;
  aiSummary?: string;
}

// ============================================
// AI服务类
// ============================================
class AIService {
  private runtimeConfig: AIRuntimeConfig | null = null;
  private userConfig: AIUserConfig | null = null;

  // 优化 #1: 分析结果缓存（基于 family hash）
  private analysisCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 缓存有效期 5 分钟

  // 优化 #6: 分析历史记录
  private analysisHistory: Map<string, AnalysisHistory[]> = new Map();
  private readonly MAX_HISTORY_COUNT = 10; // 最多保存 10 条历史

  // ----------------------------------------
  // 优化 #4: 按句子截断文本
  // ----------------------------------------
  private truncateToSentence(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    // 找到最后一个完整句子结束位置
    const sentenceEnders = /[。！？；\n]/g;
    let lastEndIndex = -1;
    let match;

    while ((match = sentenceEnders.exec(text)) !== null) {
      if (match.index <= maxLength) {
        lastEndIndex = match.index + 1;
      } else {
        break;
      }
    }

    if (lastEndIndex > 0) {
      return text.slice(0, lastEndIndex);
    }

    // 如果没有找到句子结束符，尝试在最后一个完整词处截断
    const lastSpace = text.lastIndexOf(' ', maxLength);
    if (lastSpace > maxLength * 0.7) {
      return text.slice(0, lastSpace) + '...';
    }

    // 最坏情况：直接截断
    return text.slice(0, maxLength - 3) + '...';
  }

  // 优化 #1: 计算 family 数据的 hash 值
  private computeFamilyHash(family: Family): string {
    const data = JSON.stringify({
      id: family.id,
      members: family.members?.map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        age: m.age,
        coverage: m.coverage,
        rights: m.rights,
        claimedItems: m.claimedItems,
      })),
      version: '1.0', // 版本号用于缓存失效
    });

    // 简单的 hash 实现
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // 优化 #6: 保存分析历史
  private saveAnalysisHistory(result: FamilyAnalysisResult): void {
    const historyEntry: AnalysisHistory = {
      id: result.id,
      familyId: result.familyId,
      date: result.date,
      score: result.familyProtectionScore,
      gaps: result.totalGaps,
      summary: result.overallAdvice,
      aiSummary: result.aiSummary,
    };

    const history = this.analysisHistory.get(result.familyId) || [];
    history.unshift(historyEntry);

    // 限制历史记录数量
    if (history.length > this.MAX_HISTORY_COUNT) {
      history.pop();
    }

    this.analysisHistory.set(result.familyId, history);
  }

  // ----------------------------------------
  // 配置管理
  // ----------------------------------------

  // 设置用户配置（从设置页面调用）
  setUserConfig(config: AIUserConfig): void {
    this.userConfig = config;
    this.runtimeConfig = this.buildRuntimeConfig(config);
    // 同时保存到 AsyncStorage
    this.saveConfig(config);
  }

  // 兼容旧版本的 setConfig 方法
  setConfig(config: Partial<AIUserConfig> & { provider: AIProvider; apiKey: string }): void {
    const fullConfig: AIUserConfig = {
      provider: config.provider,
      apiKey: config.apiKey,
      endpoint: config.endpoint || '',
      model: config.model || '',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000,
      customHeaders: config.customHeaders,
    };
    this.setUserConfig(fullConfig);
  }

  // 获取用户当前配置
  getUserConfig(): AIUserConfig | null {
    return this.userConfig;
  }

  // 获取提供商配置
  getProviderConfig(providerId: AIProvider): ProviderConfig | undefined {
    return AI_PROVIDERS.find(p => p.id === providerId);
  }

  // 获取所有提供商列表
  getAllProviders(): ProviderConfig[] {
    return AI_PROVIDERS;
  }

  // 根据提供商创建默认配置
  createDefaultConfig(provider: AIProvider): Partial<AIUserConfig> {
    const providerConfig = this.getProviderConfig(provider);
    if (!providerConfig) {
      return {provider, endpoint: '', model: '', temperature: 0.7, maxTokens: 2000};
    }
    return {
      provider,
      endpoint: providerConfig.defaultEndpoint,
      model: providerConfig.defaultModel,
      temperature: 0.7,
      maxTokens: 2000,
    };
  }

  // 构建运行时配置
  private buildRuntimeConfig(userConfig: AIUserConfig): AIRuntimeConfig {
    const providerConfig = this.getProviderConfig(userConfig.provider);

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 根据不同提供商添加认证头
    switch (userConfig.provider) {
      case 'deepseek':
      case 'moonshot':
      case 'doubao':
      case 'minimax':
      case 'wenxin':
      case 'zhipu':
      case 'hunyuan':
        headers['Authorization'] = `Bearer ${userConfig.apiKey}`;
        break;
      case 'custom':
        headers['Authorization'] = `Bearer ${userConfig.apiKey}`;
        // 添加自定义头
        if (userConfig.customHeaders) {
          Object.assign(headers, userConfig.customHeaders);
        }
        break;
    }

    return {
      apiKey: userConfig.apiKey,
      model: userConfig.model,
      endpoint: userConfig.endpoint,
      provider: userConfig.provider,
      temperature: userConfig.temperature,
      maxTokens: userConfig.maxTokens,
      headers,
    };
  }

  // 从存储加载配置
  async loadConfig(): Promise<AIUserConfig | null> {
    try {
      const stored = await storageService.getAIConfig();
      if (stored) {
        const config = JSON.parse(stored);
        this.userConfig = config;
        this.runtimeConfig = this.buildRuntimeConfig(config);
        return config;
      }
      return null;
    } catch (error) {
      logger.error(MODULE, '加载AI配置失败', error);
      return null;
    }
  }

  // 保存配置到存储
  async saveConfig(config: AIUserConfig): Promise<void> {
    try {
      await storageService.saveAIConfig(JSON.stringify(config));
    } catch (error) {
      logger.error(MODULE, '保存AI配置失败', error);
    }
  }

  // 检查AI是否已配置
  isConfigured(): boolean {
    return this.runtimeConfig !== null &&
           this.runtimeConfig.apiKey.length > 0 &&
           this.runtimeConfig.endpoint.length > 0;
  }

  // 获取当前提供商信息
  getCurrentProvider(): ProviderConfig | null {
    if (!this.runtimeConfig) return null;
    return this.getProviderConfig(this.runtimeConfig.provider) || null;
  }

  // ----------------------------------------
  // API调用
  // ----------------------------------------

  // 通用API调用（带指数退避重试）
  async callAPI(
    messages: Array<{role: string; content: string}>,
    systemPrompt?: string,
    options?: { retries?: number; baseDelay?: number }
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI未配置，请先在设置中配置API Key');
    }

    const config = this.runtimeConfig!;
    const provider = config.provider;
    const maxRetries = options?.retries ?? 3;
    const baseDelay = options?.baseDelay ?? 1000;

    // 优化 #5: 指数退避重试机制
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 根据不同提供商构建请求
        switch (provider) {
          case 'deepseek':
          case 'moonshot':
          case 'doubao':
          case 'minimax':
          case 'zhipu':
          case 'wenxin':
          case 'hunyuan':
            return await this.callOpenAICompatibleAPI(config, messages, systemPrompt);
          case 'custom':
            return await this.callCustomAPI(config, messages, systemPrompt);
          default:
            throw new Error(`不支持的提供商: ${provider}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 如果还有重试次数，等待后重试
        if (attempt < maxRetries) {
          // 指数退避: 1s, 2s, 4s...
          const delay = baseDelay * Math.pow(2, attempt);
          // 添加随机抖动避免雷暴效应
          const jitter = delay * 0.2 * Math.random();
          logger.warn(MODULE, `API调用失败，第${attempt + 1}次重试，延迟${Math.round(delay + jitter)}ms`, lastError);

          await new Promise(resolve => setTimeout(resolve, delay + jitter));
        }
      }
    }

    // 所有重试都失败
    throw lastError || new Error('API调用失败');
  }

  // OpenAI兼容格式API调用
  private async callOpenAICompatibleAPI(
    config: AIRuntimeConfig,
    messages: Array<{role: string; content: string}>,
    systemPrompt?: string
  ): Promise<string> {
    const allMessages = systemPrompt
      ? [{role: 'system', content: systemPrompt}, ...messages]
      : messages;

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify({
        model: config.model,
        messages: allMessages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API调用失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // 自定义API调用
  private async callCustomAPI(
    config: AIRuntimeConfig,
    messages: Array<{role: string; content: string}>,
    systemPrompt?: string
  ): Promise<string> {
    const allMessages = systemPrompt
      ? [{role: 'system', content: systemPrompt}, ...messages]
      : messages;

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify({
        model: config.model,
        messages: allMessages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API调用失败: ${response.status} - ${errorText}`);
    }

    // 尝试多种响应格式
    const data = await response.json();
    return data.choices?.[0]?.message?.content ||
           data.response ||
           data.result ||
           JSON.stringify(data);
  }

  // ----------------------------------------
  // 业务功能
  // ----------------------------------------

  // 生成保障检视AI总结
  async generateSummary(
    family: Family,
    options?: {
      summaryStyle?: SummaryStyle;
      maxLength?: number;
      customRecommendedAmounts?: Record<string, number>;
    }
  ): Promise<string> {
    const maxLength = options?.maxLength || 300;
    const summaryStyle = options?.summaryStyle || 'professional';

    if (!this.isConfigured()) {
      // 降级：本地生成总结
      const result = this.analyzeFamily(family);
      return this.truncateToSentence(result.overallAdvice, maxLength);
    }

    // AI 增强总结
    try {
      const result = this.analyzeFamily(family);
      const familyProfile = this.buildFamilyProfileFromData(
        family,
        options?.customRecommendedAmounts
      );

      // 优化 #3: 根据风格调整提示词
      const systemPrompts = {
        professional: '你是一位专业的保险规划顾问。请根据提供的家庭保障数据，生成一段保障检视总结，语气专业、客观、有人情味。',
        simple: '请用通俗易懂的语言总结家庭保障情况，避免专业术语，让普通人也能理解。',
        concise: '请简洁总结家庭保障的核心问题和建议，控制在50字以内。',
      };

      const systemPrompt = systemPrompts[summaryStyle];
      const userMessage = `以下是家庭保障数据：\n${familyProfile}\n\n本地分析：${result.overallAdvice}\n\n请生成一段${summaryStyle === 'concise' ? '简洁' : summaryStyle === 'simple' ? '通俗易懂' : '专业'}的保障检视总结。`;

      const aiSummary = await this.callAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ]);

      return aiSummary || result.overallAdvice;
    } catch (error) {
      logger.error(MODULE, 'AI总结生成失败，使用本地总结', error);
      const result = this.analyzeFamily(family);
      return result.overallAdvice;
    }
  }

  // 测试API连接
  async testConnection(): Promise<{success: boolean; message: string}> {
    if (!this.isConfigured()) {
      return {success: false, message: '未配置API'};
    }

    try {
      await this.callAPI(
        [{role: 'user', content: '你好，请回复"连接成功"。'}],
        '你是一个友好的AI助手。'
      );
      return {success: true, message: '连接成功'};
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接失败'
      };
    }
  }

  // 清除配置
  async clearConfig(): Promise<void> {
    this.userConfig = null;
    this.runtimeConfig = null;
    await storageService.clearAIConfig();
  }

  // ----------------------------------------
  // 家庭保障分析
  // ----------------------------------------

  // 检查成员是否为家庭经济支柱角色
  private isBreadwinner(role: string): boolean {
    // 丈夫和妻子通常为经济支柱
    return role === 'husband' || role === 'wife';
  }

  // 本地家庭保障分析（基于实际成员 coverage 数据）
  analyzeFamily(family: Family): FamilyAnalysisResult {
    const members = family.members || [];

    // 分析每个成员（基于实际的 coverage 数据）
    const memberResults: MemberAnalysisResult[] = members.map(member => {
      const coverages = member.coverage || [];
      const coverageGaps = this.calculateCoverageGapsFromData(member);
      const warnings = this.generateWarningsFromData(member);
      const suggestions = this.generateSuggestionsFromData(member);

      // 判断是否为男性（男性不计入孕妇保障）
      const isMale = ['father', 'husband', 'son', 'grandfather', 'other'].includes(member.role);
      
      // 保障覆盖率：根据性别动态计算有效保障项数量
      // 男性 = 19 - 1 = 18项，女性 = 19项
      const totalDefaultItems = isMale ? DEFAULT_COVERAGES.length - 1 : DEFAULT_COVERAGES.length;
      const coveredItems = coverages.filter(c => c.hasCoverage && !(isMale && c.id === 'maternity')).length;
      // 覆盖率 = 已覆盖项 / 有效保障项总数
      // 规则：有任何一项保障就不显示0分，最低显示5分
      let coverageScore = totalDefaultItems > 0
        ? Math.round((coveredItems / totalDefaultItems) * 100)
        : 0;
      if (coveredItems > 0 && coverageScore < 5) {
        coverageScore = 5;
      }

      // 风险评分：100 - (高优先缺口*25 + 中等缺口*10)
      // 规则：有任何一项保障就不显示0分，最低显示10分
      const highPriorityCount = coverageGaps.filter(g => g.priority === 'high').length;
      const mediumPriorityCount = coverageGaps.filter(g => g.priority === 'medium').length;
      let riskScore = Math.max(0, 100 - highPriorityCount * 25 - mediumPriorityCount * 10);
      if (coveredItems > 0 && riskScore < 10) {
        riskScore = 10;
      }

      // 保费合计
      const totalPremium = coverages.reduce((sum, c) => sum + (c.premium || 0), 0);

      return {
        memberId: member.id,
        memberName: member.name,
        memberRole: member.role,
        age: member.age || 0,
        riskScore,
        coverageScore,
        products: coverages
          .filter(c => c.hasCoverage)
          .map(c => ({
            id: c.id,
            name: this.getCoverageLabel(c.id),
            type: this.getCoverageCategory(c.id),
            coverage: c.coverageAmount || 0,
            premium: c.premium || 0,
          })),
        coverageGaps,
        suggestions,
        warnings,
        summary: this.generateMemberSummary(member, coverageScore, coverageGaps),
      };
    });

    // 计算整体数据
    const totalGaps = memberResults.reduce((sum, m) => sum + m.coverageGaps.length, 0);
    const highPriorityGaps = memberResults.reduce(
      (sum, m) => sum + m.coverageGaps.filter(g => g.priority === 'high').length, 0
    );
    const mediumPriorityGaps = memberResults.reduce(
      (sum, m) => sum + m.coverageGaps.filter(g => g.priority === 'medium').length, 0
    );
    
    // 家庭保障评分 = 各成员评分的加权平均（基于覆盖率）
    const familyProtectionScore = members.length > 0
      ? Math.round(memberResults.reduce((s, m) => s + m.coverageScore, 0) / members.length)
      : 0;
    const familyPremiumTotal = memberResults.reduce(
      (sum, m) => sum + m.products.reduce((pSum, p) => pSum + p.premium, 0), 0
    );
    
    // 整体风险评分：基于家庭保障覆盖率
    // 计算方式：覆盖率得分 × (1 - 高优先缺口比例×0.3) × (1 - 中等缺口比例×0.1)
    // 高优先缺口扣30%权重，中等缺口扣10%权重
    const totalCoverageItems = memberResults.reduce((sum, m) => sum + m.coverageGaps.length + m.products.length, 0);
    const highPriorityRatio = totalCoverageItems > 0 ? highPriorityGaps / Math.max(totalCoverageItems, 1) : 0;
    const mediumPriorityRatio = totalCoverageItems > 0 ? mediumPriorityGaps / Math.max(totalCoverageItems, 1) : 0;
    const overallRiskScore = Math.round(
      Math.max(0, Math.min(100, 
        familyProtectionScore * (1 - highPriorityRatio * 0.5) * (1 - mediumPriorityRatio * 0.2)
      ))
    );
    const overallAdvice = this.generateOverallAdvice(
      { totalScore: familyProtectionScore, totalPremium: familyPremiumTotal, coverageRate: members.length > 0 ? Math.round(memberResults.filter(m => m.coverageScore > 0).length / members.length * 100) : 0 },
      totalGaps,
      highPriorityGaps
    );

    const result: FamilyAnalysisResult = {
      id: `analysis_${Date.now()}`,
      familyId: family.id,
      date: new Date().toISOString(),
      overallRiskScore,
      totalGaps,
      highPriorityGaps,
      familyProtectionScore,
      familyPremiumTotal,
      memberResults,
      overallAdvice,
    };

    // 保存分析历史
    this.saveAnalysisHistory(result);

    return result;
  }

  // 基于实际数据的保障缺口计算
  // 修复：遍历所有默认保障项，对未添加的项也计为缺口
  // 注意：孕妇保障只适用于成年女性，跳过男性和未成年女孩
  private calculateCoverageGapsFromData(member: Member): CoverageGap[] {
    const gaps: CoverageGap[] = [];
    const coverages = member.coverage || [];
    const coverageMap = new Map(coverages.map(c => [c.id, c]));

    // 男性角色列表
    const maleRoles = ['husband', 'father', 'son', 'son_in_law', 'grandfather', 'father_in_law'];
    const isMale = maleRoles.includes(member.role);
    // 未成年女孩（女儿且年龄 < 18）
    const isMinorGirl = member.role === 'daughter' && member.age < 18;

    // 遍历所有默认保障项
    DEFAULT_COVERAGES.forEach(config => {
      // 孕妇保障：跳过男性和未成年女孩
      if (config.id === 'maternity' && (isMale || isMinorGirl)) {
        return;
      }

      const memberCoverage = coverageMap.get(config.id);
      const recommendedAmount = memberCoverage?.recommendedAmount ?? config.recommendedAmount ?? 0;

      // 如果 recommendedAmount 为 0，不需要检查（如豁免类）
      if (recommendedAmount <= 0) {
        return;
      }

      // 经济支柱角色检查
      const breadwinnerRoles = ['husband', 'wife'];
      const isBreadwinner = breadwinnerRoles.includes(member.role);

      // 如果成员没有添加这个保障项
      if (!memberCoverage || !memberCoverage.hasCoverage) {
        // 对于经济支柱，缺少寿险和重疾类保障是高优先级缺口
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (isBreadwinner && (config.category === 'life' || config.category === 'critical')) {
          priority = 'high';
        } else if (config.category === 'accident' || config.category === 'medical') {
          // 意外和医疗类对所有人都比较重要
          priority = 'medium';
        } else {
          priority = 'low';
        }

        gaps.push({
          label: config.label,
          currentCoverage: 0,
          recommendedCoverage: recommendedAmount,
          gap: recommendedAmount,
          priority,
        });
        return;
      }

      // 如果成员有这个保障项但保额不足
      const currentCoverage = memberCoverage.coverageAmount ?? 0;
      if (currentCoverage < recommendedAmount) {
        const gapAmount = Math.max(0, recommendedAmount - currentCoverage);
        const coverageRatio = recommendedAmount > 0 ? currentCoverage / recommendedAmount : 0;

        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (coverageRatio < 0.3) {
          priority = 'high';
        } else if (coverageRatio >= 0.7) {
          priority = 'low';
        }

        // 对经济支柱的寿险和重疾类缺口提升优先级
        if (isBreadwinner && (config.category === 'life' || config.category === 'critical')) {
          if (priority === 'medium') priority = 'high';
        }

        gaps.push({
          label: config.label,
          currentCoverage,
          recommendedCoverage: recommendedAmount,
          gap: gapAmount,
          priority,
        });
      }
    });

    return gaps;
  }

  // 获取保障项显示名称
  private getCoverageLabel(coverageId: string): string {
    const config = DEFAULT_COVERAGES.find(c => c.id === coverageId);
    return config?.label || coverageId;
  }

  // 获取保障项分类
  private getCoverageCategory(coverageId: string): string {
    const config = DEFAULT_COVERAGES.find(c => c.id === coverageId);
    return config?.category || '其他';
  }

  // 生成成员总结
  private generateMemberSummary(
    member: Member,
    coverageScore: number,
    gaps: CoverageGap[]
  ): string {
    const roleLabel = MEMBER_ROLE_LABELS[member.role] || member.role;
    const isMale = ['father', 'husband', 'son', 'grandfather', 'other'].includes(member.role);
    const sufficientCount = (member.coverage || []).filter(c => c.hasCoverage && !(isMale && c.id === 'maternity')).length;
    const totalDefaultCount = isMale ? DEFAULT_COVERAGES.length - 1 : DEFAULT_COVERAGES.length;

    if (gaps.length === 0) {
      return `${member.name}(${roleLabel})的保障配置较为完善，建议定期检视保额是否足够。`;
    }
    if (gaps.filter(g => g.priority === 'high').length > 0) {
      return `${member.name}(${roleLabel})存在${gaps.filter(g => g.priority === 'high').length}项高优先级保障缺口，建议尽快补充。`;
    }
    return `${member.name}(${roleLabel})已有${sufficientCount}/${totalDefaultCount}项保障，保障覆盖率${coverageScore}%，建议关注${gaps.length}项保障缺口并适时补充。`;
  }

  // 生成成员警告（基于实际数据）
  private generateWarningsFromData(member: Member): string[] {
    const warnings: string[] = [];
    const coverages = member.coverage || [];

    if (coverages.length === 0) {
      warnings.push('当前无任何保障配置，存在较大风险');
      return warnings;
    }

    const hasMedicalCoverage = coverages.some(c =>
      c.hasCoverage && (c.id === 'medical' || c.id === 'millionMedical' || c.id === 'overseasMedical')
    );
    if (!hasMedicalCoverage && (member.age || 0) > 50) {
      warnings.push('年龄较大，建议优先配置医疗险');
    }

    const hasMedical = coverages.some(c =>
      c.hasCoverage && (c.id === 'socialInsurance' || c.id === 'medical' || c.id === 'millionMedical')
    );
    if (!hasMedical) {
      warnings.push('缺少医疗保障，建议配置社保或商业医疗险');
    }

    const hasAccident = coverages.some(c =>
      c.hasCoverage && (c.id === 'accident' || c.id === 'disability')
    );
    if (!hasAccident) {
      warnings.push('缺少意外伤害保障，建议配置意外险');
    }

    const breadwinnerRoles = ['husband', 'wife'];
    if (breadwinnerRoles.includes(member.role)) {
      const hasLifeCoverage = coverages.some(c =>
        c.hasCoverage && c.id === 'death'
      );
      if (!hasLifeCoverage) {
        warnings.push('作为家庭经济支柱，缺少寿险保障会带来较大风险');
      }
    }

    const childRoles = ['son', 'daughter'];
    if (childRoles.includes(member.role) && (member.age || 0) < 18) {
      const hasEducationCoverage = coverages.some(c =>
        c.hasCoverage && c.id === 'education'
      );
      if (!hasEducationCoverage) {
        warnings.push('缺少教育年金规划，建议提前准备');
      }
    }

    return warnings;
  }

  // 生成成员建议（基于实际数据）
  private generateSuggestionsFromData(member: Member): string[] {
    const suggestions: string[] = [];
    const coverages = member.coverage || [];

    const breadwinnerRoles = ['husband', 'wife'];
    if (breadwinnerRoles.includes(member.role)) {
      const hasLifeCoverage = coverages.some(c => c.hasCoverage && c.id === 'death');
      const hasCriticalCoverage = coverages.some(c => c.hasCoverage && c.id === 'criticalIllness');
      if (!hasLifeCoverage) {
        suggestions.push('建议配置定期寿险，保障家庭责任期');
      }
      if (!hasCriticalCoverage) {
        suggestions.push('重疾险保额建议覆盖3-5年年收入');
      }
    }

    if ((member.age || 0) > 50) {
      const hasMedicalCoverage = coverages.some(c => c.hasCoverage && ['medical', 'millionMedical'].includes(c.id));
      if (!hasMedicalCoverage) {
        suggestions.push('建议关注医疗险和防癌险');
      }
      suggestions.push('注意健康告知，如实填写');
    }

    const childRoles = ['son', 'daughter'];
    if (childRoles.includes(member.role) && (member.age || 0) < 18) {
      const hasAccident = coverages.some(c => c.hasCoverage && c.id === 'accident');
      const hasSocialInsurance = coverages.some(c => c.hasCoverage && c.id === 'socialInsurance');
      const hasMedical = coverages.some(c => c.hasCoverage && (c.id === 'medical' || c.id === 'millionMedical'));
      const hasEducation = coverages.some(c => c.hasCoverage && c.id === 'education');
      if (!hasSocialInsurance || !hasMedical) {
        suggestions.push('优先配置医疗保障');
      }
      if (!hasAccident) {
        suggestions.push('建议配置意外险');
      }
      if (!hasEducation) {
        suggestions.push('教育年金可在基础保障完善后考虑');
      }
    }

    // 如果没有特别建议，给出通用建议
    if (suggestions.length === 0 && coverages.length > 0) {
      const uncoveredCount = coverages.filter(c => !c.hasCoverage).length;
      if (uncoveredCount > 0) {
        suggestions.push(`还有${uncoveredCount}项保障未覆盖，建议逐步完善`);
      }
    }

    return suggestions;
  }

  // 生成整体建议
  private generateOverallAdvice(
    familyScore: { totalScore: number; totalPremium: number; coverageRate: number },
    totalGaps: number,
    highPriorityGaps: number
  ): string {
    if (totalGaps === 0) {
      return '家庭保障配置完善，建议每年进行一次保障检视，确保保额与家庭需求匹配。';
    }

    let advice = `家庭保障存在${totalGaps}项缺口`;
    if (highPriorityGaps > 0) {
      advice += `，其中${highPriorityGaps}项为高优先级。`;
    } else {
      advice += '，建议逐步补充。';
    }

    if (familyScore.totalPremium > 0) {
      advice += ` 当前年保费${familyScore.totalPremium}万元。`;
    }

    if (familyScore.totalScore >= 70) {
      advice += ' 家庭保障整体良好，可重点关注个别缺口。';
    } else if (familyScore.totalScore >= 40) {
      advice += ' 家庭保障中等，建议优先补充高优先级缺口。';
    } else {
      advice += ' 家庭保障偏低，建议尽快完善基础保障。';
    }

    return advice;
  }

  // AI增强分析
  async analyzeWithAI(
    family: Family,
    options?: {
      summaryStyle?: SummaryStyle;
      customRecommendedAmounts?: Record<string, number>;
    }
  ): Promise<FamilyAnalysisResult> {
    if (!this.isConfigured()) {
      throw new Error('请先在设置中配置AI服务');
    }

    // 优化 #1: 检查缓存
    const cacheKey = this.computeFamilyHash(family);
    const cachedEntry = this.analysisCache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < this.CACHE_TTL) {
      logger.info(MODULE, '使用缓存的分析结果');
      return cachedEntry.result;
    }

    // 先做本地分析（基于实际数据）
    const localResult = this.analyzeFamily(family);
    const summaryStyle = options?.summaryStyle || 'professional';
    const customAmounts = options?.customRecommendedAmounts;

    // 优化 #3: 根据风格调整提示词
    const systemPromptStyles = {
      professional: '你是一位专业的家庭保险规划师，擅长分析家庭保障缺口并给出专业建议。请基于提供的信息进行分析，语气专业但亲切，给出的建议要实际可行。',
      simple: '你是一位耐心的保险顾问。请用通俗易懂的语言分析家庭保障情况，避免过多专业术语，让客户容易理解。',
      concise: '请简洁分析家庭保障情况，直接给出核心问题和关键建议，控制字数。',
    };

    const systemPrompt = systemPromptStyles[summaryStyle];

    // 优化 #8: 将自定义保额引入上下文
    const familyProfile = this.buildFamilyProfileFromData(family, customAmounts);

    const userMessage = `请分析以下家庭的保险保障情况：

${familyProfile}

本地分析结果：
- 家庭保障评分：${localResult.familyProtectionScore}分
- 年保费：${localResult.familyPremiumTotal}万元
- 总缺口数：${localResult.totalGaps}项
- 高优先级缺口：${localResult.highPriorityGaps}项

${customAmounts ? '注意：客户有自定义的保障保额配置，参考上述家庭档案中的建议保额。' : ''}

请从以下维度进行AI增强分析：
1. 家庭整体风险评估
2. 各成员保障缺口分析
3. 优先配置建议
4. 保险配置顺序建议`;

    try {
      const response = await this.callAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ]);

      // 解析AI响应并合并到结果中
      const result: FamilyAnalysisResult = {
        ...localResult,
        id: `ai_analysis_${Date.now()}`,
        aiSummary: response,
        overallAdvice: localResult.overallAdvice + '\n\n🤖 AI增强建议：\n' + response,
      };

      // 优化 #1: 保存到缓存
      this.analysisCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      // 优化 #6: 保存到历史记录
      this.saveAnalysisHistory(result);

      return result;
    } catch (error) {
      logger.error(MODULE, 'AI分析失败', error);
      throw error;
    }
  }

  // 优化 #6: 获取分析历史
  getAnalysisHistory(familyId: string): AnalysisHistory[] {
    return this.analysisHistory.get(familyId) || [];
  }

  // 优化 #6: 清除分析历史
  clearAnalysisHistory(familyId?: string): void {
    if (familyId) {
      this.analysisHistory.delete(familyId);
    } else {
      this.analysisHistory.clear();
    }
  }

  // 构建家庭档案（基于实际数据）
  private buildFamilyProfileFromData(
    family: Family,
    customRecommendedAmounts?: Record<string, number>
  ): string {
    const members = family.members || [];

    let profile = '## 家庭成员信息\n';
    members.forEach(m => {
      const roleLabel = MEMBER_ROLE_LABELS[m.role] || m.role;
      profile += `- ${m.name}（${roleLabel}）：${m.age || '未知'}岁\n`;
    });

    // 优化 #8: 如果有自定义保额，添加到配置说明
    if (customRecommendedAmounts && Object.keys(customRecommendedAmounts).length > 0) {
      profile += '\n## 客户自定义保障配置\n';
      Object.entries(customRecommendedAmounts).forEach(([type, amount]) => {
        if (amount !== undefined) {
          const config = DEFAULT_COVERAGES.find(c => c.id === type);
          const label = config?.label || type;
          profile += `- ${label}：建议保额 ${amount}万\n`;
        }
      });
    }

    profile += '\n## 已有保障配置\n';
    let hasAnyCoverage = false;
    members.forEach(m => {
      const coveredItems = (m.coverage || []).filter(c => c.hasCoverage);
      if (coveredItems.length > 0) {
        hasAnyCoverage = true;
        profile += `\n### ${m.name}\n`;
        coveredItems.forEach(c => {
          const config = DEFAULT_COVERAGES.find(dc => dc.id === c.id);
          profile += `- ${config?.label || c.id}：保额${c.coverageAmount || 0}万，年缴${c.premium || 0}万元\n`;
        });
      }
    });

    if (!hasAnyCoverage) {
      profile += '暂无保障配置\n';
    }

    return profile;
  }

  // ----------------------------------------
  // 话术生成
  // ----------------------------------------

  // 话术模板库
  private readonly SPEECH_TEMPLATES: Record<string, {
    empathy: string;
    response: string;
    followUp?: string;
  }> = {
    '贵': {
      empathy: '您的顾虑我非常理解，买保险确实是一笔不小的支出。',
      response: '其实保费贵不贵，要看保障是否充足、保额是否足够。我们可以根据您的预算，灵活调整保障方案，既确保保障全面，又不让缴费压力太大。您看每年预算大概是多少呢？',
      followUp: '其实保费支出有个"双十原则"，即年收入的10%用于购买保险，保额是年收入的10倍，这样可以确保保障充足又不会影响生活质量。',
    },
    '没钱': {
      empathy: '我理解现在经济压力不小，很多家庭都有这方面的考虑。',
      response: '其实保险是一种风险管理工具，越是没钱的家庭，越需要保险来转移风险。您看我们可以先从最基础的重疾险和医疗险开始，每年投入不大，但关键时刻能起大作用。',
      followUp: '我们可以先规划基础保障，等经济宽裕了再加保，这样既不会增加现在的负担，又能让家庭有基本的保障。',
    },
    '考虑': {
      empathy: '您说考虑考虑很正常，毕竟买保险是一辈子的事，确实需要慎重。',
      response: '我很欣赏您这种负责任的态度。不过我建议您可以先了解一下具体方案，这样考虑的时候也有个参照。您看方便的话，我给您做个保障方案讲解？',
      followUp: '另外，保障规划越早做越好，因为年龄越大、保费越高，身体状况也可能影响投保。',
    },
    '不需要': {
      empathy: '您觉得不需要买保险，这种想法我也很理解。',
      response: '其实很多人都觉得自己不需要保险，直到风险真的发生。我见过太多因为没买保险而陷入困境的家庭。您看这样行不行，我先给您做个保障需求分析，您先了解一下自己家庭的保障缺口，不一定要买，但至少心里有数。',
      followUp: '保障就像是雨伞，平时觉得没用，下雨的时候才发现它的价值。',
    },
    '有社保': {
      empathy: '您有社保确实很好，社保是国家给每个人的基础保障。',
      response: '不过您知道吗？社保就像保暖内衣，能保暖但不够暖和。商业保险就像羽绒服，在保暖内衣外面再加一层防护。社保只能报销一部分医疗费用，而且有封顶线，重大疾病需要的进口药、特效药很多都不在社保范围内。',
      followUp: '所以有社保的人更需要商业保险来补充，两者结合才能形成完整的保障体系。',
    },
    '买过了': {
      empathy: '您已经买过保险了，说明您很有风险意识。',
      response: '太好了！那我们可以帮您做个保单检视，看看现有保障是否充足、有没有重复投保或者保障缺口。很多家庭的保障其实是不够的，或者保障配置不合理。',
      followUp: '买过保险不等于保障充足，建议每年做一次保单检视，根据家庭变化及时调整保障方案。',
    },
    'default': {
      empathy: '您的顾虑我听到了，这个问题很常见。',
      response: '保险确实是一种比较复杂的商品，需要根据每个家庭的实际情况来规划。您可以把您的具体想法告诉我，我来帮您分析一下，看看怎么能既解决您的顾虑，又让保障更完善。',
      followUp: '买保险最重要的是"适合"，不是越贵越好，也不是越多越好。关键是找对专业的顾问，配对合适的产品。',
    },
  };

  // 本地话术生成
  generateLocalSpeech(objection: string): {
    empathy: string;
    response: string;
    followUp?: string;
  } {
    const keywords = Object.keys(this.SPEECH_TEMPLATES);
    const matchedKeyword = keywords.find(keyword =>
      keyword !== 'default' && objection.includes(keyword)
    );

    const template = matchedKeyword
      ? this.SPEECH_TEMPLATES[matchedKeyword]
      : this.SPEECH_TEMPLATES['default'];

    return {
      empathy: template.empathy,
      response: template.response,
      followUp: template.followUp,
    };
  }

  // AI话术生成
  async generateAISpeech(objection: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('请先在设置中配置AI服务');
    }

    const systemPrompt = `你是一位经验丰富的保险代理人，擅长与客户沟通并处理各种异议。
你的回答应该：
1. 理解客户的真实顾虑
2. 用专业知识消除疑虑
3. 保持友好、耐心、真诚的态度
4. 不夸大产品，不贬低竞争对手`;

    const userMessage = `客户提出以下异议：${objection}

请生成一段专业、亲切的回应话术，帮助客户理解并化解顾虑。`;

    try {
      const response = await this.callAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ]);

      // 保存话术历史
      this.saveSpeechHistory({
        id: `speech_${Date.now()}`,
        objection,
        response,
        context: {},
        createdAt: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      logger.error(MODULE, '话术生成失败', error);
      throw error;
    }
  }

  // ----------------------------------------
  // 历史记录管理
  // ----------------------------------------

  async saveAnalysisHistory(analysis: FamilyAnalysisResult): Promise<void> {
    try {
      const history = await this.getAnalysisHistory();
      history.unshift(analysis);
      const trimmed = history.slice(0, 10);
      await storageService.saveAnalysisHistory(JSON.stringify(trimmed));
    } catch (error) {
      logger.error(MODULE, '保存分析历史失败', error);
    }
  }

  async getAnalysisHistory(): Promise<FamilyAnalysisResult[]> {
    try {
      const stored = await storageService.getAnalysisHistory();
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error(MODULE, '获取分析历史失败', error);
      return [];
    }
  }

  async saveSpeechHistory(speech: {
    id: string;
    objection: string;
    response: string;
    context: Record<string, unknown>;
    createdAt: string;
  }): Promise<void> {
    try {
      const history = await this.getSpeechHistory();
      history.unshift(speech);
      const trimmed = history.slice(0, 20);
      await storageService.saveSpeechHistory(JSON.stringify(trimmed));
    } catch (error) {
      logger.error(MODULE, '保存话术历史失败', error);
    }
  }

  async getSpeechHistory(): Promise<Array<{
    id: string;
    objection: string;
    response: string;
    context: Record<string, unknown>;
    createdAt: string;
  }>> {
    try {
      const stored = await storageService.getSpeechHistory();
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error(MODULE, '获取话术历史失败', error);
      return [];
    }
  }

  // ----------------------------------------
  // 工具方法
  // ----------------------------------------

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}

// 导出单例
export const aiService = new AIService();
export default aiService;

// ============================================
// 预设系统提示词（可在设置中修改）
// ============================================
export const DEFAULT_SYSTEM_PROMPTS = {
  insuranceAdvisor: `你是专业的保险规划顾问。请根据用户提供的家庭保障信息，给出专业、客观的保险建议。注意：
1. 只能基于用户提供的保障信息进行分析
2. 不得承诺任何收益
3. 不得夸大保障范围
4. 使用通俗易懂的语言解释专业术语
5. 建议要具体、可操作`,

  simple: `你是一个专业的保险顾问。请简洁地总结以下保障信息，并给出实用建议。`,

  custom: '',
};

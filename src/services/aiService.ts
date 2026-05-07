// src/services/aiService.ts
// AI服务接口 - 支持多种预设提供商及自定义API
import React from 'react';
import { Alert } from 'react-native';
import type {Family, FamilyMember, InsuranceProduct, Member, MemberCoverage, AnalysisMode, CoverageConfig} from '../types';
import { MEMBER_ROLE_LABELS } from '../types';
import { DEFAULT_COVERAGES } from '../data/defaultCoverages';
import { QUICK_COVERAGES } from '../data/quickCoverages';
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

  // 自定义话术模板（用户导入）
  private customSpeechTemplates: Record<string, Array<{
    empathy: string;
    response: string;
    followUp?: string;
  }>> = {};

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
      mode?: AnalysisMode;
    }
  ): Promise<string> {
    const maxLength = options?.maxLength || 300;
    const summaryStyle = options?.summaryStyle || 'professional';
    const mode = options?.mode || 'professional';

    if (!this.isConfigured()) {
      // 降级：本地生成总结
      const result = this.analyzeFamily(family, mode);
      return this.truncateToSentence(result.overallAdvice, maxLength);
    }

    // AI 增强总结
    try {
      const result = this.analyzeFamily(family, mode);
      const familyProfile = this.buildFamilyProfileFromData(
        family,
        options?.customRecommendedAmounts,
        mode
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
      const result = this.analyzeFamily(family, mode);
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
  // mode: 'professional' 精细版(默认) | 'quick' 快速版
  analyzeFamily(family: Family, mode: AnalysisMode = 'professional'): FamilyAnalysisResult {
    const members = family.members || [];
    // 根据模式选择保障配置
    const coverages = mode === 'quick' ? QUICK_COVERAGES : DEFAULT_COVERAGES;

    // 分析每个成员（基于实际的 coverage 数据）
    const memberResults: MemberAnalysisResult[] = members.map(member => {
      const memberCoverages = member.coverage || [];
      const coverageGaps = this.calculateCoverageGapsFromData(member, coverages);
      const warnings = this.generateWarningsFromData(member, coverages);
      const suggestions = this.generateSuggestionsFromData(member, coverages);

      // 判断是否为男性（男性不计入孕妇保障）
      const isMale = ['father', 'husband', 'son', 'grandfather', 'other'].includes(member.role);
      
      // 保障覆盖率：根据性别动态计算有效保障项数量
      // 男性 = 20 - 1 = 19项，女性 = 20项（精细版）
      // 快速版统一8项，不含孕妇保障
      const totalDefaultItems = mode === 'quick' 
        ? coverages.length 
        : (isMale ? DEFAULT_COVERAGES.length - 1 : DEFAULT_COVERAGES.length);
      // 从成员的 member.coverage 中统计已覆盖的保障项
      const coveredItems = memberCoverages.filter(c => c.hasCoverage && !(isMale && c.id === 'maternity')).length;
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

      // 保费合计 - 从实际成员保障数据中计算
      const totalPremium = Number(memberCoverages.reduce((sum, c) => sum + (c.premium || 0), 0).toFixed(2));

      return {
        memberId: member.id,
        memberName: member.name,
        memberRole: member.role,
        age: member.age || 0,
        riskScore,
        coverageScore,
        products: memberCoverages
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
        summary: this.generateMemberSummary(member, coverageScore, coverageGaps, mode),
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
    const familyPremiumTotal = Number(memberResults.reduce(
      (sum, m) => sum + m.products.reduce((pSum, p) => pSum + p.premium, 0), 0
    ).toFixed(2));
    
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
  // coverages: 要分析的保障配置列表（精细版或快速版）
  private calculateCoverageGapsFromData(member: Member, coverages: CoverageConfig[]): CoverageGap[] {
    const gaps: CoverageGap[] = [];
    const memberCoverages = member.coverage || [];
    const coverageMap = new Map(memberCoverages.map(c => [c.id, c]));

    // 男性角色列表
    const maleRoles = ['husband', 'father', 'son', 'son_in_law', 'grandfather', 'father_in_law'];
    const isMale = maleRoles.includes(member.role);
    // 未成年女孩（女儿且年龄 < 18）
    const isMinorGirl = member.role === 'daughter' && member.age < 18;

    // 遍历所有配置的保障项
    coverages.forEach(config => {
      // 孕妇保障：只适用于育龄期女性（18-50岁）
      if (config.id === 'maternity') {
        // 女性角色列表
        const femaleRoles = ['wife', 'mother', 'daughter', 'daughter_in_law', 'grandmother', 'mother_in_law'];
        const isFemale = femaleRoles.includes(member.role);
        // 育龄期女性：18-50岁
        const age = member.age || 0;
        if (isMale || isMinorGirl || age < 18 || age > 50) {
          return;
        }
      }

      // 教育金和学平险：只适用于23岁及以下（学生群体）
      if ((config.id === 'education' || config.id === 'schoolAccident') && (member.age || 0) > 23) {
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
  // mode: 分析模式，用于确定总项数
  private generateMemberSummary(
    member: Member,
    coverageScore: number,
    gaps: CoverageGap[],
    mode: AnalysisMode = 'professional'
  ): string {
    const roleLabel = MEMBER_ROLE_LABELS[member.role] || member.role;
    const isMale = ['father', 'husband', 'son', 'grandfather', 'other'].includes(member.role);
    const sufficientCount = (member.coverage || []).filter(c => c.hasCoverage && !(isMale && c.id === 'maternity')).length;
    const totalDefaultCount = mode === 'quick' 
      ? 8 
      : (isMale ? DEFAULT_COVERAGES.length - 1 : DEFAULT_COVERAGES.length);

    if (gaps.length === 0) {
      return `${member.name}(${roleLabel})的保障配置较为完善，建议定期检视保额是否足够。`;
    }
    if (gaps.filter(g => g.priority === 'high').length > 0) {
      return `${member.name}(${roleLabel})存在${gaps.filter(g => g.priority === 'high').length}项高优先级保障缺口，建议尽快补充。`;
    }
    return `${member.name}(${roleLabel})已有${sufficientCount}/${totalDefaultCount}项保障，保障覆盖率${coverageScore}%，建议关注${gaps.length}项保障缺口并适时补充。`;
  }

  // 生成成员警告（基于实际数据）
  // coverages: 要分析的保障配置列表
  private generateWarningsFromData(member: Member, coverages: CoverageConfig[]): string[] {
    const warnings: string[] = [];
    const memberCoverages = member.coverage || [];
    // 提取保障ID列表用于快速判断
    const coverageIds = memberCoverages.map(c => c.id);

    if (memberCoverages.length === 0) {
      warnings.push('当前无任何保障配置，存在较大风险');
      return warnings;
    }

    const hasMedicalCoverage = coverageIds.includes('medical') || coverageIds.includes('millionMedical') || coverageIds.includes('overseasMedical');
    if (!hasMedicalCoverage && (member.age || 0) > 50) {
      warnings.push('年龄较大，建议优先配置医疗险');
    }

    const hasMedical = coverageIds.includes('socialInsurance') || coverageIds.includes('medical') || coverageIds.includes('millionMedical');
    if (!hasMedical) {
      warnings.push('缺少医疗保障，建议配置社保或商业医疗险');
    }

    const hasAccident = coverageIds.includes('accident') || coverageIds.includes('disability');
    if (!hasAccident) {
      warnings.push('缺少意外伤害保障，建议配置意外险');
    }

    const breadwinnerRoles = ['husband', 'wife'];
    if (breadwinnerRoles.includes(member.role)) {
      const hasLifeCoverage = coverageIds.includes('death');
      if (!hasLifeCoverage) {
        warnings.push('作为家庭经济支柱，缺少寿险保障会带来较大风险');
      }
    }

    const childRoles = ['son', 'daughter'];
    // 教育金警告：只适用于23岁及以下的子女
    if (childRoles.includes(member.role) && (member.age || 0) <= 23) {
      const hasEducationCoverage = coverageIds.includes('education');
      if (!hasEducationCoverage) {
        warnings.push('缺少教育年金规划，建议提前准备');
      }
    }

    return warnings;
  }

  // 生成成员建议（基于实际数据）
  // coverages: 要分析的保障配置列表
  private generateSuggestionsFromData(member: Member, coverages: CoverageConfig[]): string[] {
    const suggestions: string[] = [];
    const memberCoverages = member.coverage || [];
    // 提取保障ID列表用于快速判断
    const coverageIds = memberCoverages.map(c => c.id);

    const breadwinnerRoles = ['husband', 'wife'];
    if (breadwinnerRoles.includes(member.role)) {
      const hasLifeCoverage = coverageIds.includes('death');
      const hasCriticalCoverage = coverageIds.includes('criticalIllness');
      if (!hasLifeCoverage) {
        suggestions.push('建议配置定期寿险，保障家庭责任期');
      }
      if (!hasCriticalCoverage) {
        suggestions.push('重疾险保额建议覆盖3-5年年收入');
      }
    }

    if ((member.age || 0) > 50) {
      const hasMedicalCoverage = coverageIds.includes('medical') || coverageIds.includes('millionMedical');
      if (!hasMedicalCoverage) {
        suggestions.push('建议关注医疗险和防癌险');
      }
      suggestions.push('注意健康告知，如实填写');
    }

    const childRoles = ['son', 'daughter'];
    // 未成年人保障建议：只适用于23岁及以下的子女
    if (childRoles.includes(member.role) && (member.age || 0) <= 23) {
      const hasAccident = coverageIds.includes('accident');
      const hasSocialInsurance = coverageIds.includes('socialInsurance');
      const hasMedical = coverageIds.includes('medical') || coverageIds.includes('millionMedical');
      const hasEducation = coverageIds.includes('education');
      if (!hasSocialInsurance || !hasMedical) {
        suggestions.push('优先配置医疗保障');
      }
      if (!hasAccident) {
        suggestions.push('建议配置意外险');
      }
      // 学平险建议：只适用于未成年的子女（< 18岁）
      if (!hasEducation && (member.age || 0) < 18) {
        suggestions.push('教育年金可在基础保障完善后考虑');
      }
    }

    // 如果没有特别建议，给出通用建议
    if (suggestions.length === 0 && memberCoverages.length > 0) {
      const uncoveredCount = memberCoverages.filter(c => !c.hasCoverage).length;
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
      advice += ` 当前年保费${Number(familyScore.totalPremium.toFixed(2))}万元。`;
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
      mode?: AnalysisMode;
    }
  ): Promise<FamilyAnalysisResult> {
    if (!this.isConfigured()) {
      throw new Error('请先在设置中配置AI服务');
    }

    const mode = options?.mode || 'professional';

    // 优化 #1: 检查缓存（包含模式）
    const cacheKey = `${this.computeFamilyHash(family)}_${mode}`;
    const cachedEntry = this.analysisCache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < this.CACHE_TTL) {
      logger.info(MODULE, `使用缓存的分析结果 (${mode}模式)`);
      return cachedEntry.result;
    }

    // 先做本地分析（基于实际数据）
    const localResult = this.analyzeFamily(family, mode);
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
    const familyProfile = this.buildFamilyProfileFromData(family, customAmounts, mode);

    const userMessage = `请分析以下家庭的保险保障情况：

${familyProfile}

本地分析结果：
- 家庭保障评分：${localResult.familyProtectionScore}分
- 年保费：${Number(localResult.familyPremiumTotal.toFixed(2))}万元
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

  // 构建家庭档案（精简版，用于AI分析）
  // mode: 分析模式
  private buildFamilyProfileFromData(
    family: Family,
    customRecommendedAmounts?: Record<string, number>,
    mode: AnalysisMode = 'professional'
  ): string {
    const members = family.members || [];
    const coverages = mode === 'quick' ? QUICK_COVERAGES : DEFAULT_COVERAGES;

    // 精简版家庭档案
    let profile = `家庭成员(${members.length}人)：\n`;
    members.forEach(m => {
      const roleLabel = MEMBER_ROLE_LABELS[m.role] || m.role;
      const coverageCount = (m.coverage || []).filter(c => c.hasCoverage).length;
      profile += `• ${m.name}(${roleLabel})，${m.age || '?'}岁，已有${coverageCount}项保障\n`;
    });

    // 只列出高优先级缺口
    const allGaps = members.flatMap(m => {
      const memberCoverage = new Map((m.coverage || []).map(c => [c.id, c]));
      return (m.coverage || []).filter(c => {
        if (c.hasCoverage) return false;
        const config = coverages.find(dc => dc.id === c.id);
        return config && (config.category === 'life' || config.category === 'critical');
      }).map(c => ({ member: m.name, coverage: coverages.find(dc => dc.id === c.id)?.label || c.id }));
    });

    if (allGaps.length > 0) {
      profile += `\n重要缺口(${allGaps.length}项)：\n`;
      allGaps.slice(0, 5).forEach(g => {
        profile += `• ${g.member}缺少${g.coverage}\n`;
      });
    }

    return profile;
  }

  // ----------------------------------------
  // 话术生成
  // ----------------------------------------

  // 话术模板库 - 每个话题多条话术，随机选择
  // 【系统预设话术】 - 用户可导入自定义话术覆盖
  private readonly DEFAULT_SPEECH_TEMPLATES: Record<string, Array<{
    empathy: string;
    response: string;
    followUp?: string;
  }>> = {

    // ========== 原有问题话题 ==========
    '贵': [
      {
        empathy: '您的顾虑我非常理解，买保险确实是一笔不小的支出。',
        response: '其实保费贵不贵，要看保障是否充足、保额是否足够。我们可以根据您的预算，灵活调整保障方案，既确保保障全面，又不让缴费压力太大。您看每年预算大概是多少呢？',
        followUp: '其实保费支出有个"双十原则"，即年收入的10%用于购买保险，保额是年收入的10倍，这样可以确保保障充足又不会影响生活质量。',
      },
      {
        empathy: '我完全理解您对价格的关注，毕竟每个家庭的开销都要精打细算。',
        response: '保费高低的感受因人而异，更重要的是看保障的性价比。我建议我们可以先了解一下您的具体需求，然后给您推荐几款性价比高的产品做个对比，您看怎么样？',
        followUp: '其实好的保险规划不一定是买最贵的，而是买最对的。我们可以根据您的情况找到最适合您的保障方案。',
      },
      {
        empathy: '您觉得保费贵，这种想法很正常，说明您是个会过日子的人。',
        response: '保险就像买车一样，有经济型也有豪华型，关键看您的需求和预算。我们可以先确定必须的保障有哪些，然后再看怎么用最合适的价格买到。我先给您做个方案看看？',
        followUp: '另外，保费是可以分期的，比如重疾险可以选20年交，每年分摊下来压力就不大了。',
      },
      {
        empathy: '您提到保费贵，说明您是真的在认真考虑这件事。',
        response: '其实保费贵不贵是相对的，关键看保障值不值。我给您举个例子，同样是50万保额的重疾险，有的每年要交一万多，有的只要五六千，保障内容可能差不多。您愿意让我帮您对比一下吗？',
        followUp: '先了解清楚再决定，总比稀里糊涂买了个贵的或者不合适的强，您说对吧？',
      },
      {
        empathy: '您说得对，买保险确实需要考虑经济承受能力。',
        response: '我见过很多家庭，最初都觉得保费贵，但算了一笔账后就明白了：一年交一万块钱，看起来多，但平均到每天才不到30块钱，却能换来几十万的保障。这样想是不是就不觉得贵了？',
        followUp: '而且很多保险还有豁免功能，万一中途发生风险，后面的保费就不用交了，保障继续有效。',
      },
    ],
    '没钱': [
      {
        empathy: '我理解现在经济压力不小，很多家庭都有这方面的考虑。',
        response: '其实保险是一种风险管理工具，越是没钱的家庭，越需要保险来转移风险。您看我们可以先从最基础的重疾险和医疗险开始，每年投入不大，但关键时刻能起大作用。',
        followUp: '我们可以先规划基础保障，等经济宽裕了再加保，这样既不会增加现在的负担，又能让家庭有基本的保障。',
      },
      {
        empathy: '您说没钱，我能感受到您的压力，其实很多家庭都是这样的。',
        response: '正因为没钱，才更怕生病出事。万一有个大病，没保险就得花光积蓄，甚至借债。有保险的话，每年花点小钱，关键时刻能救整个家庭。您看能不能每个月省下300块钱来买个医疗险？',
        followUp: '300块钱可能只是一顿饭钱，但关键时刻能换来几十万的报销额度，值不值您自己算算。',
      },
      {
        empathy: '我能理解您的难处，现在挣钱确实不容易。',
        response: '但您想想，越没钱越承受不起意外打击。有个客户就是的例子，去年查出癌症，因为买了医疗险，社保报完还能再报，自费药也能报销大半。如果没有保险，几十万的医疗费真的会让家庭陷入困境。',
        followUp: '我们可以先买最便宜的百万医疗险，一年几百块钱，保额几百万，等以后宽裕了再补充其他保障。',
      },
      {
        empathy: '您说没钱，我特别理解，不过我想跟您聊聊我的想法。',
        response: '其实保险不是奢侈品，而是必需品。就像您平时吃饭，再没钱也得吃，穿衣再紧张也得穿。保险也是一样的，关键时候能救命的钱，怎么能省呢？',
        followUp: '我们可以从最基础的保障开始买，每月只要一两百块钱，等收入增加了再加保，这样总比一点保障都没有强。',
      },
      {
        empathy: '我听到您说没钱，但我必须提醒您：没钱的时候更需要有保险。',
        response: '有句话叫"穷人买保险是保命，富人买保险是传承"，说的就是这个道理。穷人抵御风险的能力本来就弱，一旦生病或者出意外，没有保险就只能靠自己那点积蓄，甚至倾家荡产。',
        followUp: '所以越是没钱，越要想办法先把最基础的保障买上。您看我们能不能从一年几百块的医疗险开始？',
      },
      {
        empathy: '您说很想买但确实没钱，我特别理解。',
        response: '如果您真的没钱，反倒更需要购买保险。钱多多买，钱少少买，保险必须要买，多少由您决定，我来当您的参谋。而且风险是无情的，它不会因为我们没钱就不光顾我们，为什么不让保险为您付账呢？',
        followUp: '风险或意外不会因为我们没钱就不发生，正是因为承受风险的能力更低，所以您才更需要加入保险这个温暖的大家庭。',
      },
      {
        empathy: '您说再等一段时间，资金紧张。',
        response: '根据您刚才所说的资产情况，在债务中税务占有极大的比例，不论是税务局还是您的债权人，他们是不会等您一段时间的。万一有什么不幸的事情发生，您的家人却会因为您的等待而损失急需的大笔现金。',
        followUp: '保险体现的是一种"我为人人，人人为我"的精神，风险损失大家来分摊。正因为手头拮据，抵御风险的能力小，所以才更需要加入保险享受保障。',
      },
      {
        empathy: '您说现在手头紧、负担重，我完全理解。',
        response: '但您想想，我们现在有固定的收入，都依然感到负担很重。一旦家庭缺少了保障、断了经济来源，情况岂不是更可怕？保险就是把不可预测的大额风险化为现在的小额日常支出，而现在的小额支出对您来说又是微不足道的。',
        followUp: '保险不是奢侈品，而是一种必需品，它是家庭生活的经济支柱。越是觉得没有钱，就越要为将来着想啊！',
      },
    ],
    '考虑': [
      {
        empathy: '您说考虑考虑很正常，毕竟买保险是一辈子的事，确实需要慎重。',
        response: '我很欣赏您这种负责任的态度。不过我建议您可以先了解一下具体方案，这样考虑的时候也有个参照。您看方便的话，我给您做个保障方案讲解？',
        followUp: '另外，保障规划越早做越好，因为年龄越大、保费越高，身体状况也可能影响投保。',
      },
      {
        empathy: '您说要考虑，我完全理解，毕竟这关系到家庭的经济规划。',
        response: '考虑是对的，不过我想给您一个小建议：在您考虑的这段时间里，方案我可以先给您留着，但投保的事情其实等不起，因为保费是跟着年龄涨的，每大一岁保费就会贵一点。',
        followUp: '而且投保还有一个等待期，如果在这期间发生风险，可能就赔不了。所以与其等太久，不如先把保障建立起来。',
      },
      {
        empathy: '您愿意考虑说明您已经认可保险的价值了，只是不够了解。',
        response: '这样吧，我把详细的方案和条款都整理好给您，您带回去慢慢看，看完有不清楚的地方随时问我。看清楚想明白了再决定也不迟，您看怎么样？',
        followUp: '不过我建议您考虑的时间不要太长，因为您现在年轻身体好，投保容易，保费也便宜。',
      },
      {
        empathy: '考虑是应该的，买保险确实需要认真想一想。',
        response: '但我想说的是，买保险其实有时候就像买房子，您不能一直看一直等，等来等去可能房价涨了，保障也贵了。我见过太多人一直"再考虑考虑"，结果等到身体出问题了，想买都买不了了。',
        followUp: '您今天了解的这款产品，保障内容我很熟悉，如果您有意向的话，我建议可以先占个投保资格，等保单生效后再仔细考虑也不迟。',
      },
      {
        empathy: '您说再考虑考虑，我尊重您的决定。',
        response: '不过我有个小请求：能不能告诉我您主要在考虑什么方面？是保费的问题，还是对产品的担忧，还是其他原因？您告诉我，我好针对性地给您解答，帮助您做决定。',
        followUp: '买保险这件事，多了解一些信息总是好的。希望我能帮到您。',
      },
    ],
    '不需要': [
      {
        empathy: '您觉得不需要买保险，这种想法我也很理解。',
        response: '其实很多人都觉得自己不需要保险，直到风险真的发生。我见过太多因为没买保险而陷入困境的家庭。您看这样行不行，我先给您做个保障需求分析，您先了解一下自己家庭的保障缺口，不一定要买，但至少心里有数。',
        followUp: '保障就像是雨伞，平时觉得没用，下雨的时候才发现它的价值。',
      },
      {
        empathy: '您说不需要，我能理解，可能您觉得风险离自己很远。',
        response: '但您知道吗？保险界有句话叫"保险是后门"，意思是如果前门出事（比如生病、意外），后门有保险就能兜底。没有人想走这个后门，但万一真的需要的时候，没有这个门就麻烦了。',
        followUp: '我不敢说每个人都需要保险，但至少每个家庭都应该了解清楚自己的保障缺口在哪里，您愿意让我给您分析一下吗？',
      },
      {
        empathy: '您觉得不需要保险，这种想法以前的我可能也会有。',
        response: '但自从做了保险这行，见过太多真实的案例，我的心态变了。有一个客户，40多岁，一直觉得自己身体好不需要保险，结果去年突发心梗，前前后后花了30多万，一分都没得报销。',
        followUp: '其实买保险不是为了用上，而是为了安心。就像我们给车买保险一样，谁也不想出事故，但还是年年买。',
      },
      {
        empathy: '您说不需要，我理解您可能对保险不太了解，或者有过不好的经历。',
        response: '其实我不需要您现在就买，我只想让您了解清楚。保障这个东西，不怕用不上，就怕用上了没有。您花10分钟了解一下，看看到底需不需要，说不定对您有好处呢？',
        followUp: '了解清楚再做决定，这是您的权利。但千万别因为不了解就盲目拒绝，那样吃亏的可能是自己。',
      },
      {
        empathy: '您觉得不需要，我尊重您的想法。',
        response: '不过我想问您一个问题：如果明天您突然生了一场大病，需要30万医疗费，您会怎么办？是动用存款，还是卖房子，还是向亲戚朋友借？',
        followUp: '我不是要吓您，只是想帮您想清楚：风险是不挑人的，我们能做的就是在风险来临之前做好准备。您可以再想想。',
      },
    ],
    '有社保': [
      {
        empathy: '您有社保确实很好，社保是国家给每个人的基础保障。',
        response: '不过您知道吗？社保就像保暖内衣，能保暖但不够暖和。商业保险就像羽绒服，在保暖内衣外面再加一层防护。社保只能报销一部分医疗费用，而且有封顶线，重大疾病需要的进口药、特特效药很多都不在社保范围内。',
        followUp: '所以有社保的人更需要商业保险来补充，两者结合才能形成完整的保障体系。',
      },
      {
        empathy: '有社保确实不错，这是国家给我们的福利。',
        response: '但我想给您算一笔账：社保的报销是有范围的，进口药、自费药、特效药很多都要自己掏腰包。而且社保是先花钱后报销，出院了才能报，中间那段现金流也很麻烦。商业医疗险可以帮您解决这个问题。',
        followUp: '我有好几个客户都是有社保的，但一场大病下来，社保报完自己还要掏十几二十万，就是因为很多自费药社保报不了。',
      },
      {
        empathy: '您有社保很好，说明您有基础的保障意识。',
        response: '不过我经常跟客户说，社保是"保而不包"。它能保障基本医疗，但遇到大病、重病的时候，社保的额度往往不够用。您想想，万一得了癌症，需要用靶向药，一个疗程可能要几万块，社保能报多少？',
        followUp: '商业保险就是来补这个缺的。重疾险一次性给付，想怎么用就怎么用；医疗险报销社保报不了的费用，两者配合才是完美的保障。',
      },
      {
        empathy: '您有社保，这很好，但不是有了社保就高枕无忧了。',
        response: '我跟您说说社保的几个限制：第一，有起付线，看病要花到一定金额才能报；第二，有封顶线，超过上限就不报了；第三，进口药、自费项目不报销。而一场大病，往往最花钱的就是这些社保报不了的部分。',
        followUp: '所以商业保险的作用就是把这些漏洞补上。有社保再加商业保险，保障才完整，您说是不是？',
      },
      {
        empathy: '有社保确实让人安心，但我想请您思考一个问题。',
        response: '社保就像一条短裤，能遮住基本的，但要想穿得暖和、穿得体面，还得再添置其他衣物。商业保险就是那些外衣、鞋子、帽子，让您的保障更加完整和温暖。',
        followUp: '我建议您可以考虑加一份商业医疗险，每年几百块钱，关键时刻能报销社保报不了的部分，您觉得呢？',
      },
    ],
    '买过了': [
      {
        empathy: '您已经买过保险了，说明您很有风险意识。',
        response: '太好了！那我们可以帮您做个保单检视，看看现有保障是否充足、有没有重复投保或者保障缺口。很多家庭的保障其实是不够的，或者保障配置不合理。',
        followUp: '买过保险不等于保障充足，建议每年做一次保单检视，根据家庭变化及时调整保障方案。',
      },
      {
        empathy: '您买过保险，说明您很有保障意识，这很好。',
        response: '不过我很好奇，您买的是什么类型的保险？保额是多少？现在很多家庭的保险配置其实是有问题的，比如给小孩买了教育金，却没给家庭经济支柱买重疾险，这样其实是不合理的。',
        followUp: '您方便的话，我可以帮您看看现有保单，做个分析，看看保障是否充足，有没有什么漏洞需要补。',
      },
      {
        empathy: '买过保险很好，但我想问您一个问题。',
        response: '您知道自己的保单都保什么吗？万一发生风险，能赔多少钱？我遇到很多客户，说买了保险，但问到具体保什么的时候，却说不清楚。',
        followUp: '其实买保险只是第一步，更重要的是要清楚自己买了什么、保了多少、够不够用。我可以帮您做个保单检视，您看方便吗？',
      },
      {
        empathy: '您已经买了保险，这说明您很有远见。',
        response: '但我想提醒您，买完保险不是终点，而是起点。随着时间推移，您的家庭情况会变化，收入会增加，家庭成员会变化，那时候保障需求也会变化。建议每隔几年就做一次保单检视。',
        followUp: '您最近一次检视保单是什么时候？如果时间长了，建议重新看看，说不定发现有需要调整的地方。',
      },
      {
        empathy: '有保险保障很好！不过我有个小小的疑问。',
        response: '您知道自己每年交多少保费，保额是多少，保障哪些风险吗？很多人买了保险后就把合同锁起来了，等到要用的时候才发现买错了或者买少了。',
        followUp: '如果您愿意的话，我可以帮您做个保单分析，看看您的保障够不够全面，保额够不够应对风险。您觉得怎么样？',
      },
    ],
    'default': [
      {
        empathy: '您的顾虑我听到了，这个问题很常见。',
        response: '保险确实是一种比较复杂的商品，需要根据每个家庭的实际情况来规划。您可以把您的具体想法告诉我，我来帮您分析一下，看看怎么能既解决您的顾虑，又让保障更完善。',
        followUp: '买保险最重要的是"适合"，不是越贵越好，也不是越多越好。关键是找对专业的顾问，配对合适的产品。',
      },
      {
        empathy: '您提出了一个很好的问题。',
        response: '其实买保险就像看病一样，得先了解清楚症状才能对症下药。您能跟我说说，您主要担心的是什么问题吗？是保费压力，还是对产品的信任度，还是其他原因？',
        followUp: '只有了解了您的真实想法，我才能给您最合适的建议。保险没有最好的，只有最适合的。',
      },
      {
        empathy: '您说的这个问题，我经常遇到客户问起。',
        response: '保险确实是个专业性很强的东西，很多人不了解也很正常。我建议您可以先不要急着做决定，把疑问都问清楚，把方案都看清楚，然后再慢慢考虑。',
        followUp: '您现在最想了解的是哪方面？保障内容？保费价格？还是投保条件？我可以给您详细讲解。',
      },
      {
        empathy: '我听到您的顾虑了，非常感谢您愿意跟我交流。',
        response: '保险这种东西，确实需要多了解才能做决定。我不敢说一定要您买，但我希望能让您了解清楚保障的意义和作用。等您了解了，心里有数了，再决定买不买也不迟。',
        followUp: '您有什么疑问尽管问，我尽量给您解释清楚。您现在的顾虑是什么呢？',
      },
      {
        empathy: '您提出了这个问题，说明您在认真考虑这件事。',
        response: '其实买保险最重要的是想清楚一件事：您希望通过保险解决什么问题？是担心生病没钱治，还是担心意外身故影响家人，还是想给孩子存教育金？不同的需求，对应不同的保险产品。',
        followUp: '您能跟我说说，您最担心的是什么风险吗？这样我可以给您推荐最适合的方案。',
      },
    ],
    // ========== 新增话题 ==========
    '忙': [
      {
        empathy: '您很忙，这是成功人士的写照，我理解。',
        response: '正因为您很忙，才更需要一份保障来兜底。您想想，万一哪天有个意外或者生病，不仅身体受罪，工作也会受影响。但如果有了保险，至少经济上不用操心，可以安心养病。',
        followUp: '我不需要占用您太多时间，十几分钟就够了。您看明天中午一起吃个午饭怎么样？如果太忙，我可以带点心到您办公室。',
      },
      {
        empathy: '您没空谈保险，说明您是个珍惜时间的人。',
        response: '但我想说一句：有些事情可以等，有些事实在等不起。将来事故的发生会给我们带来损失，但任何人都无法预知未来。投保刻不容缓，否则一旦有事发生就来不及了。',
        followUp: '我用十分钟给您做一个全面介绍，不会耽误您太多时间。即使不买，也当作了解一点信息，好不好？',
      },
      {
        empathy: '您每天都很忙，这我太理解了。',
        response: '但您知道吗？保险营销人员最重视时间观念，能用几分钟和您交流一下吗？其实投保是越早越好的，因为保费和年龄挂钩，而且等待期也是早过早安心。',
        followUp: '寸金难买寸光阴，认为该做的事情就要马上去做。早一点投保，保费便宜，还能早日得到保障，您说值不值？',
      },
      {
        empathy: '您说最近都忙，改天再说，我能感受到您时间紧。',
        response: '但我想提醒您：今年发生了那么多灾难，很多人都说"早知会发生这种不幸，应该多保一点"。可惜，到灾难发生的时候已经来不及了。所以凡是需要的，都应当及早作决定。',
        followUp: '明日的，明日何其多？现代社会无休止的等待其实是浪费时间。您给我十分钟，相信我，不会让您失望的。',
      },
      {
        empathy: '您太忙走不开，这种感觉我明白。',
        response: '但您想过没有，要是在我们没有准备好之前发生了意外，家人该怎么办呢？风险是没有假期的，疾病、伤残、意外这些无形的"敌人"，并不会等我们作好了准备才来侵犯。',
        followUp: '您安排不出时间，我来找时间。哪怕是视频通话十分钟，让我先帮您做个需求分析，您觉得怎么样？',
      },
    ],

    '不吉利': [
      {
        empathy: '您说保险不吉利，这种想法我理解，但买保险和吉不吉利真的没有必然联系。',
        response: '飞机起飞降落，旅客要系好安全带；乘轮船要备救生衣；杂技演员高空表演要系保险绳。保险就是人生旅途中的安全带、救生衣，虽不常用，但必须常备不懈。',
        followUp: '买保险等于买安心，至于是否发生意外，与买不买保险没有什么关系。',
      },
      {
        empathy: '您担心买保险不吉利，我理解这是一种传统观念。',
        response: '但我们要讲科学。天有不测风云，人有旦夕祸福。生老病死是谁也逃不过的，所以没必要忌讳谈生死。发达国家的人并不忌讳这些，但经济发达、生活幸福、保险意识强，这说明我们不必太在乎传统的吉利观念。',
        followUp: '求神拜佛保不了您，因为您没法与它签约。只有保险才能保您遇事时逢凶化吉。',
      },
      {
        empathy: '您说买保险不吉利，其实这只是一个心理问题。',
        response: '我想问您：世界上是先有风险再有保险，还是先有保险才有风险？如果有人认为买了保险才会出事，岂不是和"有了医院才会有人生病"的观点一样荒唐吗？',
        followUp: '世界上最吉利的事情不是每天听好话，而是生活安定、经济富足、事业有成。保险正是帮助我们实现这个愿望的工具，您说保险怎么会不吉利呢？',
      },
      {
        empathy: '您有这个顾虑很正常，说明您是个讲究的人。',
        response: '但我想说，如果买了保险就会出事，那保险公司每天面临赔偿，岂不是早关门大吉了？调查发现，买了保险的人反而不容易出事，因为愿意买保险的人都是有责任感并知道自我爱护的人。',
        followUp: '当我们出门在外，第一个保佑我们安全的是家，其次就是保险公司。您买保险之后，只要出事，保险公司就要赔一大笔钱，这是好事啊！',
      },
      {
        empathy: '您担心买保险不吉利，我想和您换个角度聊聊。',
        response: '如果我们因为担心不吉利就不买保险，那是不是也应该拆掉所有医院和警察局？因为没有了医院就没有人生病，没有警察局就不会有人杀人放火！这种逻辑显然站不住脚。',
        followUp: '保险体现的是"我为人人，人人为我"的精神。买了保险，保险公司才能在我们需要的时候拿出一大笔钱，帮我们渡过难关，这才是真正的吉利。',
      },
    ],

    '不信任': [
      {
        empathy: '您不信任保险推销员，我能理解，可能您遇到过不够专业的从业者。',
        response: '大多数客户都是友善的，接触陌生人时每个人都会本能地抗拒，这很正常。我想说的是，我不是要卖东西给您，我是真心想和您交个朋友。',
        followUp: '您可以不买保险，但我希望您能给我一个机会，让您了解保险到底是怎么回事。您觉得呢？',
      },
      {
        empathy: '您说从来不信任我们这些推销人员，这我能理解。',
        response: '但我想说的是，人们购买的是对推销员的信任，而非产品本身。我这个人不一定让您马上信任，但保险行业里确实有认真做事、真心为客户着想的人。',
        followUp: '您可以先把我当朋友，不一定要买保险。如果我这个人值得交，您再向您的好朋友推荐我，好不好？',
      },
      {
        empathy: '您不信任我，我一点都不生气。',
        response: '其实我交朋友也不是一见面就交心的。我只是想跟您认识认识，并不是一来就谈保险。除非您自己愿意跟我聊，否则我们只是见个面、交个朋友，不会有任何压力。',
        followUp: '您看这样行不行，我们先认识一下，如果您觉得我这个人还靠谱，愿意聊几句，我们再谈保险。您觉得呢？',
      },
      {
        empathy: '您说对我不信任，这个感觉我尊重。',
        response: '我想让您知道，我做保险的原则是：觉得对方确实需要购买保险，我会坦白告诉对方并替他做一个最合适的计划；如果对方不需要，我绝不勉强。',
        followUp: '您现在不信任我不要紧，我可以先给您留一些资料看看，有问题随时问我。信任是需要时间建立的，我不急。',
      },
      {
        empathy: '您说对保险推销员不信任，我能感受到您之前可能有不好的经历。',
        response: '正因为有些不专业的从业人员，让整个行业都受了影响。但我想说的是，专业和真诚是可以赢得信任的。我愿意用行动来证明，我不是那种只想着卖保险的人。',
        followUp: '您愿意给我一个机会，让我用专业的方式为您做需求分析吗？您的信任我会珍惜的。',
      },
    ],

    '不感兴趣': [
      {
        empathy: '您对保险不感兴趣，对，我跟您一样。',
        response: '我对灭火器有兴趣吗？没有，但我为什么买？汽车为什么放备用胎？人们决定对事物的取舍，不是因为兴趣，而是因为需要。买保险是因为它可以带来很多利益。',
        followUp: '有兴趣买保险的人，可能已经不适合买保险了；而您对保险没兴趣，恰恰说明您是很好的承保对象。',
      },
      {
        empathy: '您说不想买保险，我理解您的想法。',
        response: '但我想问您一句：您对晚年有钱过上好日子感不感兴趣？五年前或许可以不考虑，但现在每个月收入超过家庭支出，我这份计划只需要您把每月节余的钱拿出一部分，就能为您的家庭"多赚"一些钱并提供一份保障。',
        followUp: '了解以后就有兴趣了，好多事情都是这样的，知道了用处，就有兴趣去拥有它。',
      },
      {
        empathy: '您说对保险不感兴趣，我能理解。',
        response: '但我想说，油价上涨没人感兴趣，但汽油不买不行呀，没油车怎么开？所以很多事情不是兴趣的问题，而是需求的问题。我们每个人就好比一辆车，都开在人生的高速路上，保险就是我们油箱里的油和备胎，不是有没有兴趣的问题，而是必须要有。',
        followUp: '您说是不是这个道理？',
      },
      {
        empathy: '您对保险没兴趣，这太好了。',
        response: '如果您对保险充满兴趣，不但是保险公司，连我都会觉得害怕，因为一个对保险有兴趣的人，肯定是有问题存在的。而您对保险没兴趣，表明您是健康的，正是我们考虑的承保对象。',
        followUp: '我想提供给您最佳的承保资料作参考，好吗？',
      },
      {
        empathy: '您说对保险不感兴趣，我能理解您的想法。',
        response: '但风险并不会因为我们没有兴趣就不发生。我们可以对保险不感兴趣，但保险不会因此不对我们感兴趣。有些人因为个别保险公司和推销人员的问题就拒绝所有保险，但这不应该成为您的理由。',
        followUp: '正确的做法是寻找一个负责任、专业的保险顾问，来为您设计最合适的方案，这个我很有信心能帮到您。',
      },
    ],

    '观望': [
      {
        empathy: '您说等别人都买了再买，这个想法我理解。',
        response: '但正是因为您现在可以拒绝，所以才更应该买保险。如果有一天您连拒绝的机会都没有时，您觉得还会这样讲吗？别人买不买是别人的事，自己的事自己要仔细掂量。',
        followUp: '幸福生活掌握在自己手里，到底是享受生活还是提心吊胆地过日子，很大程度上取决于您是否买足了保险。',
      },
      {
        empathy: '您想等一等、看一看，这种心态很正常。',
        response: '但我要说：现在每天都有很多人在买保险，只是您不知道罢了。不然我国的寿险收入不会每年都以很高的速度增长。买不买保险、买什么保险，关键看需不需要，不应该跟别人盲目攀比。',
        followUp: '别人不买保险，但万一发生不测，没有人能帮得上忙。除了保险公司，没有谁愿意收取保险费就承诺到时候出钱。',
      },
      {
        empathy: '您说等别人都买了，我来分析一下这个逻辑。',
        response: '没有保险，将来万一发生不测，可没人能帮我们忙的。自己不买保险还劝别人不要买的人，其实是一时糊涂。等到真的需要保险的时候，往往已经买不了了。',
        followUp: '买保险划不划算您自己来掂量一下吧。实际上，很多别人都已经买了，只是您不知道而已。',
      },
      {
        empathy: '您想等一等再做决定，我尊重您的想法。',
        response: '但我必须告诉您一个事实：退休后还有二三十年要过，要花掉一生中三分之一的钱。社保的退休金那么少，商业保险怎能不买？年轻时要准备年老时的钱。',
        followUp: '您年轻时只要每年花一小部分钱，就能帮助这三分之一的钱在您年老时发挥作用。早做决定，早受益。',
      },
      {
        empathy: '您说等别人买了再买，我想帮您算一笔账。',
        response: '别人买不买保险是别人的事，但风险发生的时候，它不会挑人。有些人劝您别买保险，但如果将来出事，他们能帮您付医药费吗？他们负得起这个责任吗？',
        followUp: '自己有没有需要、风险会不会发生、和别人买不买没有任何关系。关键是您自己需不需要保障。',
      },
    ],

    '死后': [
      {
        empathy: '您说人死了保险有什么用，我理解这种想法。',
        response: '但人活在这个世界上不是孤立的。您走了，意味着父母失去儿子，老婆失去丈夫，孩子失去父亲。您想想，如果没有保险，他们除了失去亲人，还要面对经济上的困难；但有保险的人，家人可以领取保险金继续生活。',
        followUp: '保险能让人的价值延伸到死后，代替您延续对家人的爱，以保险金的形式继续关爱家人。',
      },
      {
        empathy: '您说人死了保险没用了，我想问您一个问题。',
        response: '请问活着的人值钱还是死去的牛值钱？当然是人。那人死了，牛也死了，谁值钱？还是人——有保险的人。家里人可以领取保险金，而没有保险的人走了，家里还要花丧葬费，就像报废的机器。',
        followUp: '保险的意义，就是即使人不在了，依然可以保护家人。',
      },
      {
        empathy: '您考虑人死后保险的用处，说明您是个有责任感的人。',
        response: '我也很认同这一点。正是因为我们爱家人，才会想着万一自己不在了，家人怎么办？除了多挣钱之外，还有两个因素要把握：一是适当控制消费，二是管理您的风险。保险是用来转化风险的。',
        followUp: '如果您不在了，保险公司可以代替您继续照顾家人，这份爱不会因为生命的结束而消失。',
      },
      {
        empathy: '您问人死了保险有什么用，这个问题问得好。',
        response: '我们每个人都想给家人足够的爱和保护，对吧？但人生无常，谁也不知道明天会发生什么。如果有一份保险，万一风险发生，保险公司就会拿出一笔钱，帮助家人渡过难关。',
        followUp: '这不是为了自己，而是为了家人。即使我们不在了，对家人的爱依然可以通过保险延续。',
      },
      {
        empathy: '您说人死了保险没有用，我理解您的感受。',
        response: '但我想说，买保险不是为了自己，而是为了家人。您想想：万一您不在了，房子贷款还没还清，家人怎么生活？孩子的教育费用从哪里来？',
        followUp: '保险是一种责任，是对家人的爱。即使人不在了，保险金可以代替您继续照顾家人，让他们的生活质量不受影响。这才是保险真正的意义。',
      },
    ],

    '理赔': [
      {
        empathy: '您说投保容易理赔难，这种说法我听到过不少。',
        response: '但我想问：您自己遇到过这样的事吗？很多说理赔难的人，其实是自己或周围人没有真正了解条款。保险理赔严格，是因为保险公司要掏钱，要对所有客户的保费负责。只要符合条款，就一定会赔。',
        followUp: '我今天给您讲解，会把每一个条款都解释清楚，力求让您明明白白投保，避免埋下理赔隐患。',
      },
      {
        empathy: '您担心理赔难，这种顾虑很正常。',
        response: '其实"理赔难"大多是因为投保时埋下了隐患：有的是不专业的销售人员误导，有的是客户自己对条款没有认真了解。我给客户投保前，都会把条款逐条解释清楚，把不保什么都告诉客户。',
        followUp: '只要认真了解条款、如实告知，理赔其实一点都不难。',
      },
      {
        empathy: '您说保险公司收保费时热情，理赔时死抠条款，我能理解您的感受。',
        response: '但我想说，严格按条款理赔是对所有客户的负责。如果不严格，谁都可以来赔，那保费就会越来越高，对认真投保的人反而不公平。',
        followUp: '我建议您在投保前把条款看清楚，有任何不明白的地方我都会给您解释。做到明明白白消费，清清楚楚理赔。',
      },
      {
        empathy: '您担心理赔难，我来给您解释一下保险公司的运作原理。',
        response: '保险就像单位的互助金，大家把钱放在一起，遇到困难的人可以申请使用。理赔严格是因为这是大家的钱，必须按规矩用。但只要符合条件，保险公司一定会赔，这是写在合同里的法律责任。',
        followUp: '投保时做好如实告知，看清楚条款，理赔时准备好材料，其实很简单。我会全程协助您处理理赔事宜。',
      },
      {
        empathy: '您说理赔难，我可以理解。社会上确实有一些这样的传闻。',
        response: '但我想说，很多理赔纠纷是因为投保时没有认真了解条款。保险条款主要说明几个问题：什么人可以投、保什么、保多少、怎么领钱、保多长时间、不保什么。搞清楚这些，理赔就不难了。',
        followUp: '我会帮您把这些问题都列出来，逐一在条款里找答案，做到明明白白投保。这样将来万一出险，理赔就会很顺利。',
      },
    ],

    '骗人': [
      {
        empathy: '您说保险是骗人的，我能理解您可能听到过一些负面的消息。',
        response: '其实保险本身不是骗人的，保险合同白纸黑字写得清清楚楚。之所以有人觉得被骗，往往是因为买的时候没搞清楚保什么、不保什么。我今天给您讲解的时候，一定会跟您说得明明白白。',
        followUp: '您之前是不是有过什么不好的经历？可以跟我说说，我帮您分析一下是怎么回事。',
      },
      {
        empathy: '您对保险有这样的印象，我能理解。',
        response: '保险骗人的说法，其实很多是误解。保险是一种法律合同，条款怎么写就怎么赔。之所以有些人觉得被骗，往往是因为买之前没有认真了解条款，或者被不专业的销售人员误导了。',
        followUp: '我今天给您讲解，会把每一个条款都解释清楚，力求让您清楚了解后再做决定。',
      },
      {
        empathy: '您说保险是骗人的，我想说这话的人可能没有真正了解保险。',
        response: '保险是合同行为，白纸黑字写着保障内容，只要符合条款就能申请理赔。保险行业的整体理赔情况良好，绝大部分人都是能顺利拿到理赔款的。',
        followUp: '您要是不信，我可以给您看一些真实的理赔案例，这些都是实实在在帮助到人的。',
      },
      {
        empathy: '您有这个顾虑很正常，因为确实有一些不规范的保险销售行为。',
        response: '不过随着监管越来越严格，保险行业越来越规范。现在购买保险有15天的犹豫期，在这期间退保没有任何损失。您完全可以先了解清楚，不满意就退，没有任何风险。',
        followUp: '您愿意给我一个机会，让我用专业的方式给您讲解一下吗？我会尽力让您清清楚楚。',
      },
      {
        empathy: '我能理解您对保险的担忧，可能您听过一些负面的故事。',
        response: '但我想说的是，那些负面故事往往是个案，不代表整个行业。中国有近百家保险公司，每年理赔几千亿，如果保险都是骗人的，这个行业早就不存在了。',
        followUp: '您可以先去网上查查保险公司的年报，看看他们的理赔数据，这样心里更有底。',
      },
    ],

    '倒闭': [
      {
        empathy: '您担心保险公司会倒闭，这种担心很多人都有。',
        response: '我非常理解您的顾虑。事实上，保险公司是可以倒闭的，但概率极低极低。国家对保险公司的监管非常严格，有"偿二代"监管体系，要求保险公司时刻保持足够的偿付能力。',
        followUp: '而且就算保险公司真的经营不下去了，银保监会也会安排其他保险公司接管，您的保单权益不会受到影响，该赔的钱一分不少。',
      },
      {
        empathy: '您问到保险公司会不会倒闭，说明您是个很谨慎的人。',
        response: '我直接告诉您：保险公司理论上可以倒闭，但在中国这种情况极为罕见。为什么？因为国家对保险公司的监管非常严格，保险公司的设立和运营需符合严格规定，还要缴纳保证金、保险保障基金等。',
        followUp: '而且《保险法》规定，经营有人寿保险业务的保险公司，除分立、合并外，不得解散。就算真出了问题，您的保单也会被转移到其他公司。',
      },
      {
        empathy: '您担心公司安全问题，这个意识很好。',
        response: '您知道吗？在所有金融产品中，保险是较为安全的一类。银行存款有存款保险保障50万上限，但保险不一样，您的保障是写进合同里的，就算保险公司没了，合同约定的保障继续有效。',
        followUp: '而且我们买保险的时候，可以选择实力强、口碑好的大公司，这样更放心。',
      },
      {
        empathy: '您提到保险公司倒闭的问题，我来给您解释一下。',
        response: '保险是社会的稳定器，国家不会轻易让它出问题的。每家保险公司都要向银保监会缴纳保险保障基金，这个基金就是用来应对极端情况的。到目前为止，中国的保险公司还没有一家因为经营问题让消费者受损的。',
        followUp: '所以您放心买，选一家靠谱的保险公司，保障是一定有保障的。',
      },
      {
        empathy: '您的担心我理解，但这个担心其实没有必要。',
        response: '我来跟您说说保险公司的"安全锁"：第一，注册资本门槛很高，需符合相关规定；第二，要交保证金和保障基金；第三，每年都要接受监管部门的检查；第四，偿付能力不足时会被监管强制整改。',
        followUp: '这么多重保护，您说能轻易倒闭吗？',
      },
    ],

    '老婆': [
      {
        empathy: '您说老婆不同意，这种家庭意见不统一的情况很常见。',
        response: '我理解，买保险确实需要全家达成共识。不过我想说，保障规划其实是对家人的责任体现。您可以回去跟太太好好沟通一下，把保障的意义和作用讲清楚。',
        followUp: '您太太不同意，主要是担心什么？是觉得保费贵，还是觉得没必要？您可以告诉我，我来帮您想怎么说服她。',
      },
      {
        empathy: '您说老婆不同意，这说明您很尊重家人的意见，这是好事。',
        response: '其实很多家庭最初都会有分歧，关键是要把道理讲清楚。您看这样行不行：我先给您做个方案，您拿回去跟太太一起看，一起商量，咱们把保障规划做成一个家庭决策。',
        followUp: '有些时候，太太不同意是因为不了解，等了解清楚了反而会更支持。您可以先让她听听我的讲解？',
      },
      {
        empathy: '我遇到过很多客户家里是这种情况，很正常。',
        response: '您太太不同意，可能是因为对保险不够了解。我建议您可以先让她了解一下保障的意义，不用急着做决定。等她认同了保障理念，自然就会支持了。',
        followUp: '您方便的话，下次可以带太太一起来了解，我给您两口子一起讲，这样可能效果更好。',
      },
      {
        empathy: '您说需要和老婆商量，这说明您是个顾家的好男人。',
        response: '买保险是家里的大事，和家人商量是对的。不过您可以先了解清楚方案，然后把保障的意义和太太讲清楚。我想她也会理解的，毕竟保障是为了整个家庭。',
        followUp: '您觉得太太最关心的是哪方面？保费问题还是其他？我们可以一起想办法。',
      },
      {
        empathy: '家庭意见需要统一，这个我完全理解。',
        response: '很多家庭一开始都有不同意见，关键是要多沟通。我建议您可以先让太太了解保险的必要性，比如可以给她看看一些真实的理赔案例，让她知道保险真的能帮到人。',
        followUp: '或者您可以先了解一下，等自己搞清楚了，再去影响家人。保障这件事，早规划早受益。',
      },
    ],

    '商量': [
      {
        empathy: '您说要和家人商量，这是应该的，买保险本来就是家庭大事。',
        response: '不过我想提醒您，和家人商量是好事，但也别商量太久。因为保费是跟着年龄涨的，每大一岁保费就会贵一些。而且投保还有等待期，越早买越早过等待期，保障越早生效。',
        followUp: '您看这样行不行，我先把方案和资料给您，您带回去和家人商量，商量好了随时联系我。',
      },
      {
        empathy: '和家人商量很正常，我支持您的决定。',
        response: '但我想跟您说一句话：保障不能等。我见过太多客户说"再商量商量"，结果一拖就是好几年，等到想买的时候，要么保费贵了，要么身体出问题买不了了。',
        followUp: '您今天先了解清楚，把方案带回去商量，有问题随时问我。这样既尽了了解的责任，也不耽误保障。',
      },
      {
        empathy: '您说要想一想、和家里人商量，这个想法很成熟。',
        response: '我完全支持您和家人商量。但我想给您一个小建议：在您商量期间，我可以先帮您保留这个方案的报价，这个价格是有限时的。您先了解一下，不满意的话不买也没关系。',
        followUp: '了解清楚再决定，这是您的权利。但千万别因为"再等等"而错过了最好的投保时机。',
      },
      {
        empathy: '您说回去商量商量，我理解，这是大事。',
        response: '但我有个小小的请求：能不能在商量之前，先让您对保障方案有个清楚的了解？这样您回去和家人商量的时候，才能讲清楚保什么、多少钱、有什么用。',
        followUp: '您方便的话，我们可以约个时间给您详细讲解，然后您再回去和家人商量。您觉得怎么样？',
      },
      {
        empathy: '和家人商量是对的，这是负责任的表现。',
        response: '不过我建议您在和家人商量之前，先自己把方案搞明白。您可以先了解清楚，等回去商量的时候，就能跟家人讲清楚为什么需要这个保障、每年要花多少钱、有什么样的保障。',
        followUp: '商量是为了达成共识，而共识来自于理解。您先把保障搞清楚，商量的时候就顺利多了。',
      },
    ],

    '年龄': [
      {
        empathy: '您说年龄大了买保险会不会太贵？',
        response: '您问得很好，年龄确实是影响保费的重要因素。不过越晚买越贵，所以现在投保其实是最划算的。而且有些保险产品对年龄大的人很友好，比如防癌险，60多岁都能买。',
        followUp: '您今年多大？我来看看有哪些产品适合您。年龄大不代表买不到保险，关键是选对产品。',
      },
      {
        empathy: '您担心年龄大了保费贵，这个担心是正常的。',
        response: '但您想想，年龄大了生病风险本来就更高，更需要保障啊！正因为这样，才更应该在还能投保的时候抓紧投保。而且有些产品是均衡费率的，年轻时买锁定长期费率，一直享受年轻时的价格。',
        followUp: '我现在帮您算算，看看怎么用最合适的价格买到足够的保障。',
      },
      {
        empathy: '您说年龄大了，我来帮您分析一下。',
        response: '年龄大确实保费会贵一些，但不代表不能买保险。现在市场上有很多专门针对中老年人的产品，比如防癌险、百万医疗险等，50多岁、60多岁都能买。而且保障内容很实用。',
        followUp: '您先别担心年龄的问题，让我先帮您看看有什么产品可以选。',
      },
      {
        empathy: '年龄大了想买保险，您的意识很好。',
        response: '很多人觉得年龄大了就不需要保险了，其实恰恰相反。年龄越大，疾病风险越高，越需要保障。只是要选对产品，比如医疗险、防癌险这类产品，对老年人非常实用。',
        followUp: '您方便的话告诉我您的年龄和身体状况，我帮您看看有哪些合适的产品。',
      },
      {
        empathy: '您担心年龄大买保险不划算？',
        response: '其实年龄大买保险，不是划算不划算的问题，而是有没有的问题。一旦身体出问题，可能就买不了了。所以趁着还能投保，先把保障建立起来，这才是明智的选择。',
        followUp: '我现在帮您看看有哪些产品可以选，保费情况怎么样，您再决定要不要买。',
      },
    ],

    '身体': [
      {
        empathy: '您说身体不太好，担心投保会有问题？',
        response: '您的担心我理解，但"身体不好"不代表买不了保险。现在很多保险产品的健康告知比以前宽松很多，有的甚至支持带病投保。关键是要如实告知，保险公司会根据实际情况来评估。',
        followUp: '您方便告诉我具体是什么身体情况吗？我帮您看看有没有可以投保的产品。',
      },
      {
        empathy: '您担心身体状况影响投保，这个很常见。',
        response: '其实不同的保险公司、不同的产品，对身体状况的要求是不一样的。有的客户在A公司被拒保了，在B公司却能标体承保。所以您可以多试试几家公司，说不定就能找到愿意承保的产品。',
        followUp: '您可以先让我帮您看看您的体检报告或者就医记录，我来帮您评估一下投保的可能性。',
      },
      {
        empathy: '身体有些小问题，这个很常见。',
        response: '其实现代人嘛，谁还没点小毛病呢？但这不代表买不了保险。现在保险产品的设计越来越人性化，针对一些常见疾病，比如甲状腺结节、乳腺结节等，都有可以投保的产品。',
        followUp: '您具体是什么情况？让我帮您看看有没有适合的产品。',
      },
      {
        empathy: '您说身体不太好，我可以理解您的担忧。',
        response: '但我想告诉您，现在投保越来越方便了，很多产品都是智能核保，几分钟就能出结果。就算有一些健康问题，也可能有条件承保、加费承保等方式。关键是不要隐瞒，要如实告知。',
        followUp: '您方便的话告诉我具体的健康情况，我帮您评估一下可以买什么产品。',
      },
      {
        empathy: '身体不好才更需要保险，这个道理很多人不明白。',
        response: '正因为身体不好，发生风险的概率更高，才更需要保障。但投保的时候确实要更谨慎。我建议您可以考虑一些健康告知宽松的产品，比如意外险、防癌险等，这些对健康要求相对较低。',
        followUp: '您告诉我具体的身体情况，我帮您找找有没有可以投保的产品。',
      },
    ],

    '太多': [
      {
        empathy: '您说产品太多了不知道怎么选，这太正常了。',
        response: '中国有近百家保险公司，产品成千上万，普通人确实很难选择。这也正是您需要专业顾问的原因。我会根据您的需求、预算、家庭情况，帮您筛选出最合适的产品，不用您自己一家一家去比较。',
        followUp: '您把您的需求告诉我，我来帮您做减法，选出最适合您的产品组合。',
      },
      {
        empathy: '产品太多挑花眼，这个我太理解了。',
        response: '其实产品多不是坏事，说明有更多的选择。但普通消费者确实很难判断哪个好、哪个坑。我给您做方案的时候，会把每个产品的优缺点都讲清楚，让您买得明白、买得放心。',
        followUp: '您不用操心选哪个，把您的需求和预算告诉我，我来帮您选。',
      },
      {
        empathy: '您说市场上产品太多，眼花缭乱的。',
        response: '产品多说明市场成熟，但对消费者来说确实增加了选择难度。不过您放心，我会站在您的角度，帮您从上千款产品里挑出最适合您的几款。',
        followUp: '您先把您的需求告诉我，比如想保障什么、每年预算多少，我来帮您做专业的筛选。',
      },
      {
        empathy: '产品太多不知道选哪个，这个困惑很多人都有。',
        response: '我给您打个比方：产品多就像手机品牌多一样，普通消费者不懂配置，很难选对。但如果有懂行的人帮你参考，就能选到性价比最高的。',
        followUp: '您信任我的话，把您的需求和预算告诉我，我帮您做对比筛选，您只需要从我推荐的几款里选就行。',
      },
      {
        empathy: '您说产品挑花眼了，其实这说明您很认真。',
        response: '选产品确实要谨慎，毕竟一交就是几十年。我的作用就是帮您省心省力，我会把市面上主流的产品都对比一遍，筛选出保障好、价格合理、服务也跟得上的产品给您。',
        followUp: '您告诉我最看重什么，我来帮您匹配。',
      },
    ],

    '网上': [
      {
        empathy: '您说网上买更便宜，这个说法有一定道理。',
        response: '确实，网上直销的产品省去了代理人的环节，价格可能便宜一些。但便宜不等于好，而且网上买保险需要自己理解条款、自己做健康告知，万一有遗漏可能影响理赔。',
        followUp: '线上和线下产品各有优劣，关键看您更看重什么。如果看重专业服务和后续理赔支持，找我买更放心；如果只看重价格，可以自己网上买。',
      },
      {
        empathy: '您说网上买保险便宜，这个我知道。',
        response: '网上的保险产品确实便宜一些，因为省去了人工成本。但您想过没有，万一出险要理赔的时候，谁来帮您？网上的客服能像我们一样一对一服务吗？',
        followUp: '保险不只是买的时候便宜就行，更重要的是用的时候有人服务。我能给您提供的，是一辈子的服务保障。',
      },
      {
        empathy: '您说网上买更划算，这个想法有道理。',
        response: '网上买保险确实方便也便宜一些，但您要考虑到几点：第一，条款要自己看懂；第二，健康告知要自己把握；第三，理赔要自己跑流程。如果这些您都能搞定，那确实可以省一些钱。',
        followUp: '如果您希望有人全程服务、有问题随时有人解答，那通过我买可能更合适。',
      },
      {
        empathy: '您提到网上买保险，我来分析一下利弊。',
        response: '网上产品确实便宜，但"便宜"往往意味着服务缩水。没有专业人士讲解条款，没有专人协助理赔，遇到问题找不到人问。您买的时候可能觉得省钱，万一要用的时候才发现服务跟不上。',
        followUp: '买保险不是为了省钱，而是为了用的时候有人管。您觉得服务值多少钱？',
      },
      {
        empathy: '网上买保险便宜，这个没错。',
        response: '但我经常跟客户说一句话：买保险不是买菜，买了就完事了。保险涉及到一辈子的保障，需要专业的人来服务。从规划、投保、到万一出险的理赔，有个专业的人在身边，会省心很多。',
        followUp: '您觉得是省几百块钱重要，还是一辈子的服务保障重要？',
      },
    ],

    '亲戚': [
      {
        empathy: '您说亲戚在做保险，这个情况很常见。',
        response: '如果您亲戚是认真负责的类型，那跟着他买也未尝不可。但如果只是因为人情关系，而不是真正适合您的产品，那就要慎重考虑了。毕竟买保险是为了保障，不是为了还人情。',
        followUp: '您方便告诉我，亲戚给您推荐的是什么产品吗？我可以帮您看看是不是真的适合您。',
      },
      {
        empathy: '您说朋友在卖保险，这个我理解。',
        response: '买保险找熟人也没问题，但关键要看产品是否适合您、服务是否跟得上。我见过很多人因为不好意思拒绝亲戚朋友，结果买了一大堆用不上的保险。',
        followUp: '您可以先听听亲戚的方案，然后也可以让我给您做一份对比参考。您再决定买谁的，不买谁的。',
      },
      {
        empathy: '您说找熟人买保险，其实找谁买不重要，重要的是买对。',
        response: '如果您的亲戚朋友是专业的，能给您推荐合适的产品，那当然好。但如果不是特别了解，可以先让他给您讲讲方案，然后也可以找我对比一下，货比三家不吃亏嘛。',
        followUp: '保障是自己的，不用碍于情面。哪个方案好、保障实在、服务到位，就选哪个。',
      },
      {
        empathy: '您说有人情单，这个在中国很常见。',
        response: '人情单不是不能买，关键是要看清楚产品内容。有的人情单确实产品不错，但也有的人情单是专门针对熟人的"杀熟"产品，保费贵保障还一般。',
        followUp: '您要是已经买了，可以让我帮您看看保单内容，看看到底怎么样。',
      },
      {
        empathy: '您说找熟人买保险，我支持您的想法。',
        response: '但我想给您一个小建议：不管是谁推荐的，都建议您自己看清楚条款再决定。买保险是一辈子的事，要对自己和家人负责。',
        followUp: '您可以先让熟人给您讲讲方案，有不清楚的地方随时问我，我帮您分析分析。',
      },
    ],

    '返还': [
      {
        empathy: '您问返还型好还是消费型好，这个问题很多人都在纠结。',
        response: '其实这两种没有绝对的好坏，关键看您的需求和预算。消费型保费便宜，保障高，适合预算有限或者加保的情况；返还型保费贵一些，但满期能拿回钱，相当于强制储蓄。',
        followUp: '您更看重保障还是储蓄功能？我帮您分析一下哪种更适合您。',
      },
      {
        empathy: '您说返还型和消费型不知道怎么选，这很正常。',
        response: '我给您举个例子：消费型就像租房，租金便宜但房子不是你的；返还型就像买房，每月还贷多但房子最后是你的。就看您现在的经济情况和需求了。',
        followUp: '如果您现在预算有限，先买消费型把保障做足，等以后宽裕了再加保返还型，这样更灵活。',
      },
      {
        empathy: '返还型和消费型的选择，要看您具体情况。',
        response: '消费型保险的优势是保费低、保障高，适合预算有限或者投资能力强的人；返还型的优势是既有保障又能存钱，适合不擅长理财、想强制储蓄的人。',
        followUp: '您平时理财吗？如果理财收益能超过保险返还的收益，那买消费型更划算；如果钱存不住，那返还型可能更适合您。',
      },
      {
        empathy: '您纠结返还型和消费型，我可以帮您分析。',
        response: '其实您可以从两个角度看：第一，预算多少？返还型保费一般是消费型的2-3倍，如果预算充足可以考虑返还型；第二，看您需不需要储蓄功能？如果您有其他投资渠道，消费型更划算。',
        followUp: '没有绝对的对错，关键看哪个更适合您的实际情况。',
      },
      {
        empathy: '返还型和消费型的选择，我来帮您分析。',
        response: '很多客户买返还型，是因为觉得"不出险钱就白交了"的心理。实际上，保险的本质是保障，不是理财。买保险应该先保后富，先把保障做足，再考虑返还。',
        followUp: '我建议您可以先配置足够的消费型保障，如果还有预算，再考虑返还型做储蓄。',
      },
    ],

    '通胀': [
      {
        empathy: '您担心通货膨胀会让保额贬值，这个担心很有道理。',
        response: '但您想过没有，通货膨胀影响的不仅是保险，所有资产都会贬值。关键是如何让贬值的速度慢一点。一份50万的重疾险，看起来不多，但您想想，30年前的50万和现在的50万，购买力确实不同。',
        followUp: '但正因为通胀存在，我们才更需要现在就建立保障，等到以后再买，钱更不值钱，保障也不值钱了。',
      },
      {
        empathy: '您担心通胀让保额缩水，这个问题问得好。',
        response: '确实，几十年前的10万和现在的10万购买力差很多。但我要说的是：第一，通胀是宏观的，任何投资都有这个问题；第二，保额可以根据情况调整，现在买了定期，以后可以加保。',
        followUp: '而且换个角度想，买了保险万一出险，能拿到一笔钱，这钱不管是10万还是50万，都是雪中送炭。',
      },
      {
        empathy: '您担心通胀影响保险价值，说明您很理性。',
        response: '但我要说，保障不是投资。保险的作用是在风险发生的时候，给您一笔钱渡过难关。这笔钱不管是贬值还是升值，首先得有。',
        followUp: '而且如果您真的担心通胀，可以考虑买一些带分红功能的保险，或者定期加保，让保障跟上通胀水平。',
      },
      {
        empathy: '您说的通胀问题确实存在，但我想换个角度跟您聊聊。',
        response: '通胀意味着未来的钱不值钱，但同时也意味着未来的保费更贵。所以趁现在保费还算便宜，先把保障锁定，这才是明智的选择。',
        followUp: '而且买保险不是为了跑赢通胀，而是为了转移风险。风险管理好了，财富才能安心增值。',
      },
      {
        empathy: '您担心通胀让保险不划算？',
        response: '我给您算个账：假设每年通胀3%，现在的50万保额，30年后实际购买力相当于现在的20万左右。但每年保费是固定的，不会因为通胀涨价。',
        followUp: '所以现在买保险，其实是提前锁定了低成本。而且万一这30年里出险，那就是50万，怎么算都赚了。',
      },
    ],

    '收益': [
      {
        empathy: '您说保险收益太低，不如买理财产品。',
        response: '这个说法有一定的道理，但混淆了保险和理财的功能。保险的作用是转移风险，不是赚钱。保险解决的是万一发生风险时的问题，理财解决的是财富增值的问题。',
        followUp: '它们不是非此即彼的关系，而是各有各的功能。科学的家庭资产配置，应该既有保险保障，也有理财投资。',
      },
      {
        empathy: '您觉得保险收益不高，这个我承认。',
        response: '保险的本质是保障，不是投资。如果您想要高收益，应该去找股票、基金等产品。但那些产品能给您提供保障吗？万一投资亏损，保障从哪来？',
        followUp: '所以正确的做法是：先买保险解决保障问题，有余钱再做投资理财。这样无论投资赚赔，保障都在。',
      },
      {
        empathy: '您说收益低不如存银行或者买理财，我理解您的想法。',
        response: '但您想想，银行理财能给您报销医疗费吗？股票能给您给付重疾保险金吗？保险的核心价值是风险保障，不是收益。这一点没搞清楚，就容易觉得保险不划算。',
        followUp: '正确的顺序应该是：先保障，后投资。保障做好了，家庭财务才有根基。',
      },
      {
        empathy: '您说保险收益低，我给您分析一下。',
        response: '保险和银行理财、基金股票，是完全不同的金融工具，没有可比性。保险的核心功能是保障，是用小钱撬动大保障；其他金融产品的核心功能是增值。',
        followUp: '所以正确的配置是：拿出一部分钱买保险，保障家庭财务安全；剩下的钱做投资，追求财富增值。这样攻守兼备。',
      },
      {
        empathy: '您觉得保险收益不如理财产品，这个想法很普遍。',
        response: '但我经常问客户一句话：您投资理财，是为了什么？是为了让生活更好，还是为了有一天动用积蓄看病？我想大部分人是前者。那既然是为了更好的生活，为什么不给生活加一个保障底线呢？',
        followUp: '保险不能让我们变富，但能防止我们变穷。这个逻辑您认同吗？',
      },
    ],

    '家医': [
      {
        empathy: '您问到臻享RUN或其他家医服务，和臻享家医有什么区别？',
        response: '在臻享RUN1级中，只有专科医生图文咨询和慢病管理5选1（1次/年），臻享RUN2级有门诊预约挂号协助和陪诊（一年3次），臻享RUN3级有专科医生图文问诊不限次数，臻享RUN4级有家庭医生但没有预约和陪诊服务。而臻享家医有专业医生团队支持，慢病管理有标准化7个流程，所有医生更高资质（5大国内国际认证同时满足，15-20年经验），一对一服务客户，主动跟进客户的小病、大病和慢病全流程，服务响应及时，没有次数限制。',
        followUp: '更重要的是，臻享家医启动权益后，目前最少一家3口、最多6个人可享受，覆盖人数更多，一份权益解决全家医疗和健康。',
      },
      {
        empathy: '您担心缴费期内享有家医服务，时间太短？',
        response: '医疗资源永远是最稀缺的资源，只有稀缺品才有时间限制。我国14亿人口，每年去医院看病的人次高达100多亿次，人均7次左右。而全国所有医院总共只有1017万张床位，总共只有428万个医生，副高职级医生只有194万人。挂号难，好医院好医生挂号更难。某东家医也是交一年费用服务一年，我们是交费期内，如果交费期是20年，直接享受全家3个人，每个都是20年，在服务期限和覆盖人数上有明显优势。',
        followUp: '既然是稀缺品，您更应该珍惜和抓住机会，抢先获取资格！',
      },
      {
        empathy: '您说某东也有家医，想了解区别？',
        response: '某东家医上线多年。区别如下：1.价格方面：某东家医年费较高（数千元至近万元不等），而臻享家医是保费达标后的免费权益。2.医生方面：某东家医的资质目前没有明确向社会公开，而臻享家医的医生必须有国际和国内资质认证（20年以上经验的副高职级、北大医院认证、中华医学会全科分会、世界家庭卫生WONCA认证和澳大利亚皇家医学会认证）。3.服务期限：某东是交一年服务一年，我们是交费期内一直享受。',
        followUp: '重疾险既能带给你保障，养老险还能给您带来财富增值，同时免费获得家医权益，何乐而不为？',
      },
      {
        empathy: '您想了解臻享家医和其他家医服务的区别？',
        response: '付费与免费的差距；消费与储蓄的差距；普院与三甲的差距；普医与高医的差距；专科与全科的差距；短期与长期的差距；个人与全家的差距；无档与建档的差距；单医与团队的差距；被动与主动的差距；不保与保障的差距；懂医与懂你的差距。',
        followUp: '臻享家医是全方位的家庭医生服务，不是单一功能的健康咨询。',
      },
      {
        empathy: '您提到70岁以上有些服务不能享受，担心不能写进合同？',
        response: '家医最值钱的，就是40-70岁这个黄金就医期，这是我们人生最重要的关键期。的确70岁以上人群有些服务不能使用，但在线问诊、音视频问诊、名医大咖、特色体检、21天社群训练营、用药服务、数字化管理、门诊预约协助、就医陪诊、心理咨询、海外远程书面咨询、海外重疾住院安排协助、康复训练管理这些服务70岁以上仍可使用，也是父母最常用的服务。',
        followUp: '臻享家医不是单独买的服务，是保险公司给高净值客户的专属增值权益，不是商品更不是保险责任，所以不能写进保险合同。权益是送您的，交多少年享多少年，就像银行1000万存款赠送机场贵宾厅资格一样，都是属于增值权益。',
      },
    ],

  };

  // 获取合并后的话术模板（自定义优先于默认）
  private getSpeechTemplates(): Record<string, Array<{
    empathy: string;
    response: string;
    followUp?: string;
  }>> {
    const merged: Record<string, Array<{
      empathy: string;
      response: string;
      followUp?: string;
    }>> = { ...this.DEFAULT_SPEECH_TEMPLATES };

    // 合并自定义话术到对应的分类
    Object.keys(this.customSpeechTemplates).forEach(keyword => {
      if (merged[keyword]) {
        // 追加自定义话术到现有分类
        merged[keyword] = [...merged[keyword], ...this.customSpeechTemplates[keyword]];
      } else {
        // 新建分类
        merged[keyword] = [...this.customSpeechTemplates[keyword]];
      }
    });

    return merged;
  }

  // 本地话术生成 - 从多个模板中随机选择（支持自定义话术）
  generateLocalSpeech(objection: string): {
    empathy: string;
    response: string;
    followUp?: string;
  } {
    const templates = this.getSpeechTemplates();
    const keywords = Object.keys(templates);
    const matchedKeyword = keywords.find(keyword =>
      keyword !== 'default' && objection.includes(keyword)
    );

    const topicTemplates = matchedKeyword
      ? templates[matchedKeyword]
      : templates['default'];

    // 随机选择一条话术
    const randomIndex = Math.floor(Math.random() * topicTemplates.length);
    const template = topicTemplates[randomIndex];

    return {
      empathy: template.empathy,
      response: template.response,
      followUp: template.followUp,
    };
  }

  // 获取所有话术模板（包括自定义）
  getAllSpeechTemplates(): {
    default: Record<string, Array<{ empathy: string; response: string; followUp?: string }>>;
    custom: Record<string, Array<{ empathy: string; response: string; followUp?: string }>>;
    keywords: string[];
  } {
    return {
      default: this.DEFAULT_SPEECH_TEMPLATES,
      custom: this.customSpeechTemplates,
      keywords: Object.keys(this.DEFAULT_SPEECH_TEMPLATES).filter(k => k !== 'default'),
    };
  }

  // 添加自定义话术
  addCustomSpeech(keyword: string, speech: {
    empathy: string;
    response: string;
    followUp?: string;
  }): void {
    if (!this.customSpeechTemplates[keyword]) {
      this.customSpeechTemplates[keyword] = [];
    }
    this.customSpeechTemplates[keyword].push(speech);
    this.saveCustomSpeeches();
  }

  // 删除自定义话术
  removeCustomSpeech(keyword: string, index: number): boolean {
    if (this.customSpeechTemplates[keyword] && this.customSpeechTemplates[keyword][index]) {
      this.customSpeechTemplates[keyword].splice(index, 1);
      if (this.customSpeechTemplates[keyword].length === 0) {
        delete this.customSpeechTemplates[keyword];
      }
      this.saveCustomSpeeches();
      return true;
    }
    return false;
  }

  // 导入自定义话术（JSON格式）
  importCustomSpeeches(jsonData: string): { success: boolean; message: string; count: number } {
    try {
      const data = JSON.parse(jsonData);

      // 支持两种格式：1. {"keyword": [...]} 2. [...} 每个元素有keyword字段
      if (typeof data === 'object' && !Array.isArray(data)) {
        // 格式1: {"骗人": [...], "没钱": [...]}
        Object.keys(data).forEach(keyword => {
          const speeches = data[keyword];
          if (Array.isArray(speeches)) {
            this.customSpeechTemplates[keyword] = speeches;
          }
        });
      } else if (Array.isArray(data)) {
        // 格式2: [{keyword: "骗人", empathy: "...", ...}, ...]
        data.forEach((item: any) => {
          if (item.keyword && item.empathy && item.response) {
            if (!this.customSpeechTemplates[item.keyword]) {
              this.customSpeechTemplates[item.keyword] = [];
            }
            this.customSpeechTemplates[item.keyword].push({
              empathy: item.empathy,
              response: item.response,
              followUp: item.followUp,
            });
          }
        });
      } else {
        return { success: false, message: '数据格式不正确', count: 0 };
      }

      this.saveCustomSpeeches();
      const count = Object.values(this.customSpeechTemplates).reduce((sum, arr) => sum + arr.length, 0);
      return { success: true, message: '导入成功', count };
    } catch (error) {
      return { success: false, message: 'JSON解析失败，请检查格式', count: 0 };
    }
  }

  // 导出自定义话术
  exportCustomSpeeches(): string {
    return JSON.stringify(this.customSpeechTemplates, null, 2);
  }

  // 加载自定义话术
  async loadCustomSpeeches(): Promise<void> {
    try {
      const stored = await storageService.getCustomSpeeches();
      if (stored) {
        this.customSpeechTemplates = JSON.parse(stored);
      }
    } catch (error) {
      logger.error(MODULE, '加载自定义话术失败', error);
    }
  }

  // 保存自定义话术
  async saveCustomSpeeches(): Promise<void> {
    try {
      await storageService.saveCustomSpeeches(JSON.stringify(this.customSpeechTemplates));
    } catch (error) {
      logger.error(MODULE, '保存自定义话术失败', error);
    }
  }

  // 清除自定义话术
  async clearCustomSpeeches(): Promise<void> {
    this.customSpeechTemplates = {};
    await storageService.clearCustomSpeeches();
  }

  // 检查是否有自定义话术
  hasCustomSpeeches(): boolean {
    return Object.keys(this.customSpeechTemplates).length > 0;
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

// src/services/aiService.ts
// AI服务接口 - 支持多种预设提供商及自定义API
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Family, FamilyMember, InsuranceProduct} from '../types';
import { getCoverageScore, getFamilyProtectionScore } from '../utils/insuranceCalculator';

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
// 存储键名
// ============================================
const AI_CONFIG_KEY = '@family_guard_ai_config';
const ANALYSIS_HISTORY_KEY = '@family_guard_analysis_history';
const SPEECH_HISTORY_KEY = '@family_guard_speech_history';

// ============================================
// AI服务类
// ============================================
class AIService {
  private runtimeConfig: AIRuntimeConfig | null = null;
  private userConfig: AIUserConfig | null = null;

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
      const stored = await AsyncStorage.getItem(AI_CONFIG_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        this.userConfig = config;
        this.runtimeConfig = this.buildRuntimeConfig(config);
        return config;
      }
      return null;
    } catch (error) {
      console.error('加载AI配置失败:', error);
      return null;
    }
  }

  // 保存配置到存储
  async saveConfig(config: AIUserConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('保存AI配置失败:', error);
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

  // 通用API调用
  async callAPI(messages: Array<{role: string; content: string}>, systemPrompt?: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI未配置，请先在设置中配置API Key');
    }

    const config = this.runtimeConfig!;
    const provider = config.provider;

    // 根据不同提供商构建请求
    switch (provider) {
      case 'deepseek':
      case 'moonshot':
      case 'doubao':
      case 'minimax':
      case 'zhipu':
      case 'wenxin':
      case 'hunyuan':
        return this.callOpenAICompatibleAPI(config, messages, systemPrompt);
      case 'custom':
        return this.callCustomAPI(config, messages, systemPrompt);
      default:
        throw new Error(`不支持的提供商: ${provider}`);
    }
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
  async generateSummary(_family: Family): Promise<string> {
    if (!this.isConfigured()) {
      return 'AI智能总结即将上线，配置API Key后可自动生成专业的保障检视报告总结。';
    }

    // TODO: 实现完整的总结生成逻辑
    return 'AI智能总结即将上线，配置API Key后可自动生成专业的保障检视报告总结。';
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
  clearConfig(): void {
    this.userConfig = null;
    this.runtimeConfig = null;
    AsyncStorage.removeItem(AI_CONFIG_KEY);
  }

  // ----------------------------------------
  // 家庭保障分析
  // ----------------------------------------

  // 本地家庭保障分析（无需AI）
  analyzeFamily(family: Family): FamilyAnalysisResult {
    const members = family.members || [];
    const products = family.products || [];

    // 使用 insuranceCalculator 计算评分
    const calculatorMembers = members.map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      age: m.age,
      annualIncome: m.annualIncome,
    }));

    const familyScore = getFamilyProtectionScore(calculatorMembers, products);

    // 分析每个成员
    const memberResults: MemberAnalysisResult[] = members.map(member => {
      const memberProducts = products.filter(p =>
        p.insuredMembers?.includes(member.id) ||
        p.insuredMembers?.includes('all')
      );

      const coverageScore = getCoverageScore(
        { id: member.id, name: member.name, role: member.role, age: member.age },
        memberProducts
      );

      // 计算保障缺口
      const coverageGaps = this.calculateCoverageGaps(member, memberProducts);
      const gaps = this.identifyGaps(member, memberProducts);
      const suggestions = this.generateSuggestions(member, memberProducts);
      const warnings = this.generateWarnings(member, memberProducts);

      // 风险评分 = 100 - 缺口数量 * 15（简化计算）
      const riskScore = Math.max(0, 100 - coverageGaps.length * 15);

      return {
        memberId: member.id,
        memberName: member.name,
        memberRole: member.role,
        age: member.age || 0,
        riskScore,
        coverageScore,
        products: memberProducts.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          coverage: p.coverage || 0,
          premium: p.premium || 0,
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
      (sum, m) => sum + m.coverageGaps.filter(g => g.priority === 'high').length,
      0
    );
    const overallRiskScore = familyScore.totalScore; // 使用保障评分作为风险评分
    const overallAdvice = this.generateOverallAdvice(familyScore, totalGaps, highPriorityGaps);

    const result: FamilyAnalysisResult = {
      id: `analysis_${Date.now()}`,
      familyId: family.id,
      date: new Date().toISOString(),
      overallRiskScore,
      totalGaps,
      highPriorityGaps,
      familyProtectionScore: familyScore.totalScore,
      familyPremiumTotal: familyScore.totalPremium,
      memberResults,
      overallAdvice,
    };

    // 保存分析历史
    this.saveAnalysisHistory(result);

    return result;
  }

  // 计算保障缺口详情
  private calculateCoverageGaps(
    member: FamilyMember,
    products: InsuranceProduct[]
  ): CoverageGap[] {
    const gaps: CoverageGap[] = [];
    const productTypes = new Set(products.map(p => p.type));
    const totalCoverage = products.reduce((sum, p) => sum + (p.coverage || 0), 0);

    // 检查各类型保障
    const coverageChecks = [
      { type: '重疾险', label: '重疾保障', recommended: 50, priority: member.role === '家庭支柱' ? 'high' : 'medium' as const },
      { type: '医疗险', label: '医疗保障', recommended: 200, priority: 'high' as const },
      { type: '意外险', label: '意外保障', recommended: 50, priority: 'medium' as const },
      { type: '寿险', label: '寿险保障', recommended: 100, priority: member.role === '家庭支柱' ? 'high' : 'low' as const },
    ];

    coverageChecks.forEach(check => {
      const hasProduct = productTypes.has(check.type);
      const currentCoverage = hasProduct
        ? products.filter(p => p.type === check.type).reduce((sum, p) => sum + (p.coverage || 0), 0)
        : 0;

      if (!hasProduct || currentCoverage < check.recommended) {
        gaps.push({
          label: check.label,
          currentCoverage,
          recommendedCoverage: check.recommended,
          gap: Math.max(0, check.recommended - currentCoverage),
          priority: hasProduct ? 'medium' : check.priority,
        });
      }
    });

    return gaps;
  }

  // 生成成员总结
  private generateMemberSummary(
    member: FamilyMember,
    coverageScore: number,
    gaps: CoverageGap[]
  ): string {
    if (gaps.length === 0) {
      return `${member.name}的保障配置较为完善，建议定期检视保额是否足够。`;
    }
    if (gaps.filter(g => g.priority === 'high').length > 0) {
      return `${member.name}存在高优先级保障缺口，建议尽快补充。`;
    }
    return `${member.name}保障基本覆盖，建议关注保障缺口并适时补充。`;
  }

  // 生成成员警告
  private generateWarnings(
    member: FamilyMember,
    products: InsuranceProduct[]
  ): string[] {
    const warnings: string[] = [];
    const productTypes = new Set(products.map(p => p.type));

    if (!productTypes.has('医疗险') && (member.age || 0) > 50) {
      warnings.push('年龄较大，建议优先配置医疗险');
    }
    if (!productTypes.has('意外险')) {
      warnings.push('缺少意外保障，意外风险较高');
    }
    if (products.length === 0) {
      warnings.push('当前无任何保障配置，存在较大风险');
    }

    return warnings;
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
      advice += ` 当前年保费${familyScore.totalPremium}元，保费支出合理。`;
    }

    return advice;
  }

  // AI增强分析
  async analyzeWithAI(family: Family): Promise<FamilyAnalysisResult> {
    if (!this.isConfigured()) {
      throw new Error('请先在设置中配置AI服务');
    }

    // 先做本地分析
    const localResult = this.analyzeFamily(family);

    // 构建提示词
    const systemPrompt = `你是一位专业的家庭保险规划师，擅长分析家庭保障缺口并给出专业建议。
请基于提供的信息进行分析，语气专业但亲切，给出的建议要实际可行。`;

    const familyProfile = this.buildFamilyProfile(family);

    const userMessage = `请分析以下家庭的保险保障情况：

${familyProfile}

本地分析结果：
- 家庭保障评分：${localResult.familyProtectionScore}分
- 家庭年保费：${localResult.familyPremiumTotal}元

请从以下维度进行AI增强分析：
1. 家庭整体风险评估
2. 各成员保障缺口
3. 优先配置建议
4. 保险配置顺序建议`;

    try {
      const response = await this.callAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ]);

      // 解析AI响应并合并到结果中
      return {
        ...localResult,
        id: `ai_analysis_${Date.now()}`,
        aiSummary: response,
        overallAdvice: localResult.overallAdvice + '\n\n🤖 AI增强建议：\n' + response,
      };
    } catch (error) {
      console.error('AI分析失败:', error);
      throw error;
    }
  }

  // 构建家庭档案
  private buildFamilyProfile(family: Family): string {
    const members = family.members || [];
    const products = family.products || [];

    let profile = '## 家庭成员信息\n';
    members.forEach(m => {
      profile += `- ${m.name}（${m.role}）：${m.age || '未知'}岁`;
      if (m.annualIncome) {
        profile += `，年收入${m.annualIncome}元`;
      }
      profile += '\n';
    });

    profile += '\n## 已配置保险\n';
    if (products.length === 0) {
      profile += '暂无保险配置\n';
    } else {
      products.forEach(p => {
        const insuredNames = p.insuredMembers?.map(id => {
          const member = members.find(m => m.id === id);
          return member?.name || id;
        }).join('、') || '全体成员';

        profile += `- ${p.name}（${p.type}）：保额${p.coverage || 0}万，年费${p.premium || 0}元，承保人：${insuredNames}\n`;
      });
    }

    return profile;
  }

  // 识别保障缺口
  private identifyGaps(member: FamilyMember, products: InsuranceProduct[]): string[] {
    const gaps: string[] = [];

    // 检查基础保障
    const hasHealth = products.some(p =>
      p.type === '重疾险' || p.type === '医疗险'
    );
    if (!hasHealth) {
      gaps.push(`${member.name}缺少健康类保障（重疾险/医疗险）`);
    }

    // 检查意外保障
    const hasAccident = products.some(p => p.type === '意外险');
    if (!hasAccident) {
      gaps.push(`${member.name}缺少意外保障`);
    }

    // 检查寿险
    if (member.role === '家庭支柱' && !products.some(p => p.type === '寿险')) {
      gaps.push(`${member.name}作为家庭支柱，建议配置寿险`);
    }

    // 检查教育金/养老金
    if (member.role === '子女' && !products.some(p => p.type === '教育金')) {
      gaps.push(`${member.name}缺少教育金规划`);
    }

    if (member.role === '父母' && !products.some(p => p.type === '养老金')) {
      gaps.push(`${member.name}缺少养老规划`);
    }

    return gaps;
  }

  // 生成建议
  private generateSuggestions(member: FamilyMember, products: InsuranceProduct[]): string[] {
    const suggestions: string[] = [];

    if (member.role === '家庭支柱') {
      suggestions.push('建议配置定期寿险，保障家庭责任期');
      suggestions.push('重疾险保额建议覆盖3-5年年收入');
    }

    if ((member.age || 0) > 50) {
      suggestions.push('建议关注医疗险和防癌险');
      suggestions.push('注意健康告知，如实填写');
    }

    if ((member.age || 0) < 18 && member.role === '子女') {
      suggestions.push('优先配置医疗险和意外险');
      suggestions.push('教育金可在基础保障完善后考虑');
    }

    return suggestions;
  }

  // 生成整体建议
  private generateOverallSuggestions(
    members: FamilyMember[],
    memberAnalyses: MemberAnalysisResult[]
  ): string[] {
    const suggestions: string[] = [];

    // 整体性建议
    const allGaps = memberAnalyses.flatMap(m => m.gaps);
    if (allGaps.length > 5) {
      suggestions.push('家庭整体保障缺口较大，建议分阶段补充');
    }

    // 保费支出建议
    const totalPremium = memberAnalyses.reduce(
      (sum, m) => sum + m.products.reduce((pSum, p) => pSum + p.premium, 0),
      0
    );
    if (totalPremium > 0) {
      suggestions.push(`当前家庭年保费支出约${totalPremium}元，建议控制在家庭年收入10%-20%`);
    }

    // 保障顺序建议
    const hasMainBreadwinner = members.some(m => m.role === '家庭支柱');
    if (!hasMainBreadwinner) {
      suggestions.push('建议优先为家庭经济支柱配置保障');
    }

    return suggestions;
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
      console.error('话术生成失败:', error);
      throw error;
    }
  }

  // ----------------------------------------
  // 历史记录管理
  // ----------------------------------------

  async saveAnalysisHistory(analysis: any): Promise<void> {
    try {
      const history = await this.getAnalysisHistory();
      history.unshift(analysis);
      const trimmed = history.slice(0, 10);
      await AsyncStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('保存分析历史失败:', error);
    }
  }

  async getAnalysisHistory(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem(ANALYSIS_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取分析历史失败:', error);
      return [];
    }
  }

  async saveSpeechHistory(speech: {
    id: string;
    objection: string;
    response: string;
    context: Record<string, any>;
    createdAt: string;
  }): Promise<void> {
    try {
      const history = await this.getSpeechHistory();
      history.unshift(speech);
      const trimmed = history.slice(0, 20);
      await AsyncStorage.setItem(SPEECH_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('保存话术历史失败:', error);
    }
  }

  async getSpeechHistory(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem(SPEECH_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取话术历史失败:', error);
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

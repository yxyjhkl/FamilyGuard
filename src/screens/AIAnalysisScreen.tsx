// src/screens/AIAnalysisScreen.tsx
// AI智能分析页面 - 整合到保障检视流程
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useFamily } from '../hooks/useFamily';
import { aiService } from '../services/aiService';
import type { FamilyAnalysisResult, MemberAnalysisResult } from '../services/aiService';
import AppHeader from '../components/common/AppHeader';
import { colors, typography, spacing, borderRadius } from '../theme';

// ============================================
// 骨架屏组件
// ============================================
const SkeletonBox: React.FC<{ width?: number | string; height?: number; borderRadius?: number; style?: any }> = ({
  width = '100%',
  height = 20,
  borderRadius = 6,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBox,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

// 成员分析骨架屏
const MemberAnalysisSkeleton: React.FC<{ count?: number }> = ({ count = 2 }) => (
  <View style={styles.skeletonContainer}>
    {Array.from({ length: count }).map((_, idx) => (
      <View key={idx} style={styles.skeletonCard}>
        <View style={styles.skeletonHeaderRow}>
          <View style={styles.skeletonHeaderLeft}>
            <SkeletonBox width={100} height={18} />
            <SkeletonBox width={80} height={14} style={{ marginTop: 6 }} />
          </View>
          <SkeletonBox width={60} height={32} borderRadius={12} />
        </View>
        <SkeletonBox height={60} style={{ marginTop: 12 }} />
        <SkeletonBox height={40} style={{ marginTop: 8 }} />
        <SkeletonBox height={40} style={{ marginTop: 8 }} />
      </View>
    ))}
  </View>
);

// 概览骨架屏
const OverviewSkeleton: React.FC = () => (
  <View style={styles.overviewCardSkeleton}>
    <View style={styles.skeletonOverviewHeader}>
      <SkeletonBox width={80} height={20} />
      <SkeletonBox width={70} height={32} borderRadius={16} />
    </View>
    <View style={styles.skeletonStatsRow}>
      <SkeletonBox width={60} height={40} />
      <SkeletonBox width={1} height={40} />
      <SkeletonBox width={60} height={40} />
      <SkeletonBox width={1} height={40} />
      <SkeletonBox width={60} height={40} />
    </View>
    <SkeletonBox height={40} style={{ marginTop: 12 }} />
  </View>
);

type Props = NativeStackScreenProps<RootStackParamList, 'AIAnalysis'>;

const AIAnalysisScreen: React.FC<Props> = ({ route, navigation }) => {
  const { familyId } = route.params;
  const { getFamilyById, updateExportSettings } = useFamily();
  const [analysisResult, setAnalysisResult] = useState<FamilyAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [objection, setObjection] = useState('');
  const [scriptResult, setScriptResult] = useState<{
    empathy: string;
    response: string;
    followUp?: string;
    isAI?: boolean;
  } | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  
  // AI配置状态 - 使用 state 避免单例状态不同步问题
  const [isAIConfigured, setIsAIConfigured] = useState(() => aiService.isConfigured());

  // 每次页面获得焦点时同步 AI 配置状态
  useFocusEffect(
    useCallback(() => {
      setIsAIConfigured(aiService.isConfigured());
    }, [])
  );

  const family = useMemo(() => getFamilyById(familyId), [familyId, getFamilyById]);

  // 执行本地分析
  const handleLocalAnalysis = useCallback(async () => {
    if (!family) return;

    setIsAnalyzing(true);
    try {
      // 本地分析（无需API）
      const result = aiService.analyzeFamily(family);
      setAnalysisResult(result);
      setSelectedMember(null);
      
      // 生成并保存 AI 总结
      const summaryText = `【${family.name}家庭保障分析】
综合评分: ${result.familyProtectionScore}分
家庭保费: ${result.familyPremiumTotal.toLocaleString()}元/年

保障缺口:
${result.overallSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

💡建议: 请根据以上分析，合理配置家庭保障。`.slice(0, 300);
      
      await updateExportSettings(familyId, { aiSummary: summaryText });
    } catch (error) {
      console.error('分析失败:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [family, familyId, updateExportSettings]);

  // AI增强分析（需要API Key）
  const handleAIAnalysis = useCallback(async () => {
    if (!family) return;

    setIsAnalyzing(true);
    try {
      const result = await aiService.analyzeWithAI(family);
      setAnalysisResult(result);
      setSelectedMember(null);
      
      // 保存 AI 总结
      const summaryText = `【${family.name}家庭保障分析】
AI智能分析结果

${result.summary}

风险提示:
${result.risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

配置建议:
${result.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

💡家庭画像: ${result.familyProfile}`.slice(0, 300);
      
      await updateExportSettings(familyId, { aiSummary: summaryText });
    } catch (error) {
      console.error('AI分析失败:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [family, familyId, updateExportSettings]);

  // 本地生成话术
  const handleLocalScript = useCallback(() => {
    if (!objection.trim()) return;
    setIsGeneratingScript(true);
    try {
      const result = aiService.generateLocalSpeech(objection);
      setScriptResult({ ...result, isAI: false });
    } finally {
      setIsGeneratingScript(false);
    }
  }, [objection]);

  // AI生成话术
  const handleAIScript = useCallback(async () => {
    if (!objection.trim()) return;
    
    if (!isAIConfigured) {
      Alert.alert('提示', '请先在设置中配置AI服务');
      return;
    }

    setIsGeneratingScript(true);
    try {
      const result = await aiService.generateAISpeech(objection);
      setScriptResult({
        empathy: '',
        response: result,
        isAI: true,
      });
    } catch (error) {
      Alert.alert('生成失败', 'AI话术生成失败，请检查网络或API配置');
    } finally {
      setIsGeneratingScript(false);
    }
  }, [objection, isAIConfigured]);

  // 获取风险颜色
  const getRiskColor = (score: number) => {
    if (score >= 70) return colors.functional.error;
    if (score >= 40) return colors.functional.warning;
    return colors.functional.success;
  };

  // 获取优先级标签颜色
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return colors.functional.error;
      case 'medium': return colors.functional.warning;
      case 'low': return colors.functional.success;
    }
  };

  if (!family) {
    return (
      <View style={styles.container}>
        <AppHeader title="AI智能分析" />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>未找到家庭数据</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="AI智能分析"
        rightAction={
          isAIConfigured && (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI已配置</Text>
            </View>
          )
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* 分析按钮区 - 无分析结果且非加载中时显示 */}
        {!analysisResult && !isAnalyzing && (
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>保障检视分析</Text>
            <Text style={styles.sectionDesc}>
              基于19项保障标准，为您的{family.name}进行智能分析
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLocalAnalysis}
              disabled={isAnalyzing}
            >
              <Text style={styles.primaryButtonIcon}>📊</Text>
              <Text style={styles.primaryButtonText}>本地智能分析</Text>
            </TouchableOpacity>

            {isAIConfigured ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleAIAnalysis}
                disabled={isAnalyzing}
              >
                <Text style={styles.secondaryButtonIcon}>🤖</Text>
                <Text style={styles.secondaryButtonText}>AI增强分析</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Text style={styles.secondaryButtonIcon}>⚙️</Text>
                <Text style={styles.secondaryButtonText}>配置AI（获取更精准分析）</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 加载骨架屏 - 分析中时显示 */}
        {isAnalyzing && (
          <View style={styles.skeletonSection}>
            <View style={styles.skeletonHeader}>
              <Text style={styles.skeletonTitle}>正在分析中...</Text>
            </View>
            <OverviewSkeleton />
            <MemberAnalysisSkeleton count={family.members.length} />
          </View>
        )}

        {/* 分析结果 */}
        {analysisResult && (
          <>
            {/* 整体概览 */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Text style={styles.overviewTitle}>整体分析</Text>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(analysisResult.overallRiskScore) + '20' }]}>
                  <Text style={[styles.riskScore, { color: getRiskColor(analysisResult.overallRiskScore) }]}>
                    {analysisResult.overallRiskScore}分
                  </Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{analysisResult.totalGaps}</Text>
                  <Text style={styles.statLabel}>保障缺口</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.functional.error }]}>
                    {analysisResult.highPriorityGaps}
                  </Text>
                  <Text style={styles.statLabel}>高优先级</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{family.members.length}</Text>
                  <Text style={styles.statLabel}>家庭成员</Text>
                </View>
              </View>
              <Text style={styles.adviceText}>{analysisResult.overallAdvice}</Text>

              {/* AI总结（如果有） */}
              {analysisResult.aiSummary && (
                <View style={styles.aiSummaryCard}>
                  <Text style={styles.aiSummaryLabel}>🤖 AI分析</Text>
                  <Text style={styles.aiSummaryText}>{analysisResult.aiSummary}</Text>
                </View>
              )}
            </View>

            {/* 成员选择 */}
            <View style={styles.memberSelector}>
              <Text style={styles.sectionTitle}>成员分析详情</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.memberChip, !selectedMember && styles.memberChipActive]}
                  onPress={() => setSelectedMember(null)}
                >
                  <Text style={[styles.memberChipText, !selectedMember && styles.memberChipTextActive]}>
                    全部成员
                  </Text>
                </TouchableOpacity>
                {analysisResult.memberResults.map(member => (
                  <TouchableOpacity
                    key={member.memberId}
                    style={[styles.memberChip, selectedMember === member.memberId && styles.memberChipActive]}
                    onPress={() => setSelectedMember(member.memberId)}
                  >
                    <Text style={[styles.memberChipText, selectedMember === member.memberId && styles.memberChipTextActive]}>
                      {member.memberName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 成员详情 */}
            {(selectedMember ? analysisResult.memberResults.filter(m => m.memberId === selectedMember) : analysisResult.memberResults).map(member => (
              <MemberAnalysisCard
                key={member.memberId}
                member={member}
                getRiskColor={getRiskColor}
                getPriorityColor={getPriorityColor}
              />
            ))}

            {/* 重新分析按钮 */}
            <TouchableOpacity
              style={styles.reAnalyzeButton}
              onPress={() => setAnalysisResult(null)}
            >
              <Text style={styles.reAnalyzeText}>← 重新分析</Text>
            </TouchableOpacity>
          </>
        )}

        {/* 话术生成区 */}
        <View style={styles.scriptSection}>
          <Text style={styles.sectionTitle}>💬 谈单话术生成</Text>
          <Text style={styles.sectionDesc}>输入客户异议，自动生成专业回应话术</Text>
          <TextInput
            style={styles.scriptInput}
            placeholder="输入客户异议，如：保费太贵了"
            value={objection}
            onChangeText={setObjection}
            multiline
          />
          
          {/* 两个生成按钮 */}
          <View style={styles.scriptButtonRow}>
            <TouchableOpacity
              style={[styles.scriptButtonHalf, (!objection.trim() || isGeneratingScript) && styles.scriptButtonDisabled]}
              onPress={handleLocalScript}
              disabled={!objection.trim() || isGeneratingScript}
            >
              {isGeneratingScript && !scriptResult?.isAI ? (
                <ActivityIndicator size="small" color={colors.text[3]} />
              ) : (
                <Text style={styles.scriptButtonText}>📝 本地生成</Text>
              )}
            </TouchableOpacity>

            {isAIConfigured ? (
              <TouchableOpacity
                style={[styles.scriptButtonHalf, styles.scriptButtonAI, (!objection.trim() || isGeneratingScript) && styles.scriptButtonDisabled]}
                onPress={handleAIScript}
                disabled={!objection.trim() || isGeneratingScript}
              >
                {isGeneratingScript && scriptResult?.isAI ? (
                  <ActivityIndicator size="small" color={colors.text[3]} />
                ) : (
                  <Text style={styles.scriptButtonText}>🤖 AI生成</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.scriptButtonHalf, styles.scriptButtonAI, styles.scriptButtonConfig]}
                onPress={() => navigation.navigate('Settings')}
              >
                <Text style={styles.scriptButtonText}>⚙️ 配置AI</Text>
              </TouchableOpacity>
            )}
          </View>

          {scriptResult && (
            <View style={styles.scriptResult}>
              {scriptResult.isAI && (
                <View style={styles.scriptSourceBadge}>
                  <Text style={styles.scriptSourceText}>🤖 AI生成 · 更精准个性化</Text>
                </View>
              )}
              {!scriptResult.isAI && (
                <View style={styles.scriptSourceBadgeLocal}>
                  <Text style={styles.scriptSourceTextLocal}>📝 本地生成 · 无需联网</Text>
                </View>
              )}
              {scriptResult.empathy && (
                <View style={styles.scriptItem}>
                  <Text style={styles.scriptLabel}>共情表达</Text>
                  <Text style={styles.scriptContent}>{scriptResult.empathy}</Text>
                </View>
              )}
              <View style={styles.scriptItem}>
                <Text style={styles.scriptLabel}>回应话术</Text>
                <Text style={styles.scriptContent}>{scriptResult.response}</Text>
              </View>
              {scriptResult.followUp && (
                <View style={styles.scriptItem}>
                  <Text style={styles.scriptLabel}>后续跟进</Text>
                  <Text style={styles.scriptContent}>{scriptResult.followUp}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ============================================
// 成员分析卡片组件
// ============================================
interface MemberAnalysisCardProps {
  member: MemberAnalysisResult;
  getRiskColor: (score: number) => string;
  getPriorityColor: (priority: 'high' | 'medium' | 'low') => string;
}

const MemberAnalysisCard: React.FC<MemberAnalysisCardProps> = ({
  member,
  getRiskColor,
  getPriorityColor,
}) => (
  <View style={styles.memberCard}>
    <View style={styles.memberHeader}>
      <View>
        <Text style={styles.memberName}>{member.memberName}</Text>
        <Text style={styles.memberInfo}>
          {member.memberRole} · {member.age}岁
        </Text>
      </View>
      <View style={[styles.memberRisk, { backgroundColor: getRiskColor(member.riskScore) + '20' }]}>
        <Text style={[styles.memberRiskScore, { color: getRiskColor(member.riskScore) }]}>
          {member.riskScore}分
        </Text>
      </View>
    </View>

    {/* 保障缺口 */}
    {member.coverageGaps.length > 0 && (
      <View style={styles.gapsSection}>
        <Text style={styles.gapsTitle}>保障缺口（{member.coverageGaps.length}项）</Text>
        {member.coverageGaps.map((gap, index) => (
          <View key={index} style={styles.gapItem}>
            <View style={styles.gapHeader}>
              <View style={[styles.gapDot, { backgroundColor: getPriorityColor(gap.priority) }]} />
              <Text style={styles.gapLabel}>{gap.label}</Text>
              <Text style={[styles.gapPriority, { color: getPriorityColor(gap.priority) }]}>
                {gap.priority === 'high' ? '高' : gap.priority === 'medium' ? '中' : '低'}
              </Text>
            </View>
            <View style={styles.gapDetails}>
              <Text style={styles.gapAmount}>当前 {gap.currentCoverage}万</Text>
              <Text style={styles.gapArrow}>→</Text>
              <Text style={styles.gapAmount}>建议 {gap.recommendedCoverage}万</Text>
              <View style={styles.gapBadge}>
                <Text style={styles.gapBadgeText}>缺口 {gap.gap}万</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    )}

    {/* 建议 */}
    {member.suggestions.length > 0 && (
      <View style={styles.suggestionsSection}>
        <Text style={styles.suggestionsTitle}>优化建议</Text>
        {member.suggestions.map((s, i) => (
          <Text key={i} style={styles.suggestionText}>• {s}</Text>
        ))}
      </View>
    )}

    {/* 警告 */}
    {member.warnings.length > 0 && (
      <View style={styles.warningsSection}>
        <Text style={styles.warningsTitle}>⚠️ 风险提示</Text>
        {member.warnings.map((w, i) => (
          <Text key={i} style={styles.warningText}>• {w}</Text>
        ))}
      </View>
    )}

    {/* 总结 */}
    <Text style={styles.memberSummary}>{member.summary}</Text>
  </View>
);

// ============================================
// 样式
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text[2],
  },
  aiBadge: {
    backgroundColor: colors.functional.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 12,
    color: colors.functional.success,
    fontWeight: '600',
  },

  // 按钮区
  actionSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text[0],
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    ...typography.caption,
    color: colors.text[2],
    marginBottom: spacing.lg,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary[1],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.text[3],
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: colors.background[1],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[1] + '40',
  },
  secondaryButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.primary[1],
    fontWeight: '500',
  },

  // 概览卡片
  overviewCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  overviewTitle: {
    ...typography.subheading,
    color: colors.text[0],
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  riskScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary[1],
  },
  statLabel: {
    ...typography.caption,
    color: colors.text[2],
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.card.border,
  },
  adviceText: {
    ...typography.body,
    color: colors.text[1],
    lineHeight: 22,
  },
  aiSummaryCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary[2] + '15',
    borderRadius: borderRadius.md,
  },
  aiSummaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[1],
    marginBottom: 6,
  },
  aiSummaryText: {
    fontSize: 14,
    color: colors.text[1],
    lineHeight: 22,
  },

  // 成员选择
  memberSelector: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  memberChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background[1],
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memberChipActive: {
    backgroundColor: colors.primary[1] + '15',
    borderColor: colors.primary[1],
  },
  memberChipText: {
    fontSize: 14,
    color: colors.text[1],
  },
  memberChipTextActive: {
    color: colors.primary[1],
    fontWeight: '600',
  },

  // 成员卡片
  memberCard: {
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text[0],
  },
  memberInfo: {
    fontSize: 13,
    color: colors.text[2],
    marginTop: 4,
  },
  memberRisk: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberRiskScore: {
    fontSize: 16,
    fontWeight: '700',
  },

  // 缺口
  gapsSection: {
    marginBottom: spacing.md,
  },
  gapsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text[1],
    marginBottom: spacing.sm,
  },
  gapItem: {
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: 6,
  },
  gapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  gapLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text[0],
  },
  gapPriority: {
    fontSize: 11,
    fontWeight: '600',
  },
  gapDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gapAmount: {
    fontSize: 12,
    color: colors.text[2],
  },
  gapArrow: {
    marginHorizontal: 8,
    color: colors.text[3],
  },
  gapBadge: {
    marginLeft: 'auto',
    backgroundColor: colors.functional.error + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gapBadgeText: {
    fontSize: 11,
    color: colors.functional.error,
    fontWeight: '600',
  },

  // 建议
  suggestionsSection: {
    marginBottom: spacing.md,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text[1],
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 13,
    color: colors.text[1],
    lineHeight: 20,
  },

  // 警告
  warningsSection: {
    backgroundColor: colors.functional.warning + '15',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  warningsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.functional.warning,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: colors.text[1],
  },

  // 总结
  memberSummary: {
    fontSize: 13,
    color: colors.text[2],
    fontStyle: 'italic',
  },

  // 重新分析
  reAnalyzeButton: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  reAnalyzeText: {
    ...typography.body,
    color: colors.primary[1],
  },

  // 话术区
  scriptSection: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
  },
  scriptInput: {
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text[0],
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  scriptButton: {
    backgroundColor: colors.primary[1],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  scriptButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scriptButtonHalf: {
    flex: 1,
    backgroundColor: colors.primary[1],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scriptButtonAI: {
    backgroundColor: colors.secondary[1] || '#6366F1',
  },
  scriptButtonConfig: {
    backgroundColor: colors.text[2],
  },
  scriptButtonDisabled: {
    backgroundColor: colors.primary[1] + '60',
  },
  scriptButtonText: {
    color: colors.text[3],
    fontWeight: '600',
    fontSize: 15,
  },
  scriptSourceBadge: {
    backgroundColor: (colors.secondary[1] || '#6366F1') + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  scriptSourceText: {
    fontSize: 12,
    color: colors.secondary[1] || '#6366F1',
    fontWeight: '500',
  },
  scriptSourceBadgeLocal: {
    backgroundColor: colors.primary[2] + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  scriptSourceTextLocal: {
    fontSize: 12,
    color: colors.primary[1],
    fontWeight: '500',
  },
  scriptResult: {
    marginTop: spacing.md,
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  scriptItem: {
    marginBottom: spacing.md,
  },
  scriptLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[1],
    marginBottom: 4,
  },
  scriptContent: {
    fontSize: 14,
    color: colors.text[1],
    lineHeight: 22,
  },

  // ============================================
  // 骨架屏样式
  // ============================================
  skeletonSection: {
    padding: spacing.lg,
  },
  skeletonTitle: {
    fontSize: 14,
    color: colors.text[2],
  },
  skeletonContainer: {
    gap: spacing.md,
  },
  skeletonCard: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  skeletonHeaderLeft: {
    flex: 1,
  },
  skeletonBox: {
    backgroundColor: colors.card.border,
  },
  overviewCardSkeleton: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  skeletonOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

export default AIAnalysisScreen;

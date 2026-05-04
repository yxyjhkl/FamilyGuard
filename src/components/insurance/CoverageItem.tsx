// src/components/insurance/CoverageItem.tsx
import React, {useState, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput, Alert} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {MemberCoverage} from '../../types';
import StatusBadge from '../common/StatusBadge';
import {getCoverageStatusText} from '../../utils/colorUtils';
import {useSettings} from '../../store/settingsStore';
import {validateAmount} from '../../utils/validationUtils';

interface CoverageItemProps {
  coverage: MemberCoverage;
  onToggle: () => void;
  onAmountChange: (field: 'coverageAmount' | 'gapAmount' | 'policyDetails' | 'recommendedAmount' | 'premium') => (value: string) => void;
  onRecommendedAmountChange?: (amount: number) => void; // 建议保额变化回调
}

const CoverageItem: React.FC<CoverageItemProps> = ({coverage, onToggle, onAmountChange, onRecommendedAmountChange}) => {
  const [expanded, setExpanded] = useState(false);
  const [editingRecommended, setEditingRecommended] = useState(false);
  const [recommendedInput, setRecommendedInput] = useState('');
  const {getCoverageConfig} = useSettings();

  // 获取保障配置
  const config = useMemo(() => {
    return getCoverageConfig(coverage.id);
  }, [coverage.id, getCoverageConfig]);

  const label = config?.label || coverage.id;
  const shortLabel = config?.shortLabel || '定';
  const color = config?.color || colors.primary[1];

  // 开始编辑建议保额
  const startEditRecommended = () => {
    setRecommendedInput(String(coverage.recommendedAmount ?? 0));
    setEditingRecommended(true);
  };

  // 保存建议保额
  const saveRecommended = () => {
    const result = validateAmount(recommendedInput, 10000);
    if (!result.valid) {
      Alert.alert('输入有误', result.error || '请输入有效金额');
      return;
    }
    onAmountChange('recommendedAmount')(String(result.value));
    // 同时更新缺口
    const currentCoverage = coverage.coverageAmount ?? 0;
    onAmountChange('gapAmount')(String(Math.max(0, result.value - currentCoverage)));
    if (onRecommendedAmountChange) {
      onRecommendedAmountChange(result.value);
    }
    setEditingRecommended(false);
  };

  // 取消编辑
  const cancelEditRecommended = () => {
    setEditingRecommended(false);
    setRecommendedInput('');
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}>
        <View style={styles.leftSection}>
          <View style={[styles.icon, {backgroundColor: color + '20'}]}>
            <Text style={[styles.iconText, {color: color}]}>
              {shortLabel}
            </Text>
          </View>
          <View style={styles.titleArea}>
            <Text style={styles.title}>{label}</Text>
            {coverage.hasCoverage && (
              <Text style={styles.amount}>{Number(coverage.coverageAmount) || 0}万</Text>
            )}
          </View>
        </View>
        <View style={styles.rightSection}>
          <StatusBadge
            status={
              !coverage.hasCoverage
                ? 'missing'
                : (coverage.gapAmount ?? 0) > 0
                ? 'partial'
                : 'sufficient'
            }
            text={getCoverageStatusText(coverage.hasCoverage, coverage.gapAmount)}
          />
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {backgroundColor: coverage.hasCoverage ? color : colors.card.border},
            ]}
            onPress={onToggle}
            activeOpacity={0.7}>
            <Text style={styles.toggleText}>
              {coverage.hasCoverage ? '有' : '无'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* 展开详情 */}
      {expanded && (
        <View style={styles.details}>
          {coverage.hasCoverage && (
            <>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>已有保额（万）</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={String(coverage.coverageAmount ?? '')}
                  onChangeText={(text) => {
                    // 允许输入过程和删除（空字符串/小数点）
                    if (text === '' || text === '.' || text.endsWith('.')) {
                      onAmountChange('coverageAmount')(text);
                      return;
                    }
                    const result = validateAmount(text, 10000);
                    onAmountChange('coverageAmount')(String(result.value));
                  }}
                  placeholder="请输入"
                  placeholderTextColor={colors.text[2]}
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>年缴保费（万）</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={String(coverage.premium ?? '')}
                  onChangeText={(text) => {
                    if (text === '' || text === '.' || text.endsWith('.')) {
                      onAmountChange('premium')(text);
                      return;
                    }
                    const result = validateAmount(text, 10000);
                    onAmountChange('premium')(String(result.value));
                  }}
                  placeholder="请输入"
                  placeholderTextColor={colors.text[2]}
                />
              </View>

              {/* 可点击的建议保额 */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>建议保额（万）</Text>
                {editingRecommended ? (
                  <View style={styles.recommendedEditRow}>
                    <TextInput
                      style={styles.recommendedInput}
                      value={recommendedInput}
                      onChangeText={setRecommendedInput}
                      keyboardType="decimal-pad"
                      autoFocus
                      selectTextOnFocus
                    />
                    <TouchableOpacity
                      style={styles.recommendedSaveBtn}
                      onPress={saveRecommended}
                      activeOpacity={0.7}>
                      <Text style={styles.recommendedSaveText}>确定</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.recommendedCancelBtn}
                      onPress={cancelEditRecommended}
                      activeOpacity={0.7}>
                      <Text style={styles.recommendedCancelText}>取消</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.recommendedDisplay}
                    onPress={startEditRecommended}
                    activeOpacity={0.7}>
                    <Text style={styles.suggestAmount}>
                      {Number(coverage.recommendedAmount) || 0}
                    </Text>
                    <Text style={styles.editHint}>点击修改</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>保障缺口（万）</Text>
                <Text style={[styles.gapAmount, (Number(coverage.gapAmount) || 0) > 0 && styles.gapNegative]}>
                  {Number(coverage.gapAmount) || 0}
                </Text>
              </View>

              {/* 保障效率提示 */}
              {coverage.coverageAmount && coverage.premium && coverage.premium > 0 && (
                <View style={styles.efficiencyRow}>
                  <Text style={styles.efficiencyLabel}>保障效率</Text>
                  <Text style={styles.efficiencyValue}>
                    {Math.round((coverage.coverageAmount / coverage.premium) * 10) / 10} 倍
                  </Text>
                </View>
              )}
            </>
          )}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>保单详情</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={coverage.policyDetails ?? ''}
              onChangeText={onAmountChange('policyDetails')}
              placeholder="填写保单号或产品说明"
              placeholderTextColor={colors.text[2]}
              multiline
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  titleArea: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text[0],
  },
  amount: {
    fontSize: 12,
    color: colors.functional.success,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleButton: {
    width: 32,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 11,
    color: colors.text[3],
    fontWeight: '600',
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    color: colors.text[1],
    width: 90,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text[0],
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  suggestAmount: {
    fontSize: 14,
    color: colors.primary[1],
    fontWeight: '600',
  },
  gapAmount: {
    fontSize: 14,
    color: colors.functional.success,
    fontWeight: '600',
  },
  gapNegative: {
    color: colors.functional.warning,
  },
  recommendedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[2] + '15',
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  editHint: {
    fontSize: 11,
    color: colors.text[2],
  },
  recommendedEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recommendedInput: {
    width: 80,
    height: 32,
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[1],
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.primary[1],
  },
  recommendedSaveBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[1],
    borderRadius: borderRadius.sm,
  },
  recommendedSaveText: {
    fontSize: 12,
    color: colors.text[3],
    fontWeight: '600',
  },
  recommendedCancelBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background[2],
    borderRadius: borderRadius.sm,
  },
  recommendedCancelText: {
    fontSize: 12,
    color: colors.text[2],
  },
  efficiencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[2] + '10',
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  efficiencyLabel: {
    fontSize: 13,
    color: colors.text[1],
  },
  efficiencyValue: {
    fontSize: 14,
    color: colors.primary[1],
    fontWeight: '600',
  },
});

export default CoverageItem;

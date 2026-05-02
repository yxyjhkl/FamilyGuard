// src/components/insurance/CoverageItem.tsx
import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {Coverage} from '../../types';
import StatusBadge from '../common/StatusBadge';
import {getCoverageStatusText, getCoverageStatusColor, COVERAGE_COLORS} from '../../utils/colorUtils';

interface CoverageItemProps {
  coverage: Coverage;
  onToggle: () => void;
  onAmountChange: (field: 'coverageAmount' | 'gapAmount' | 'policyDetails' | 'recommendedAmount') => (value: string) => void;
  onRecommendedAmountChange?: (amount: number) => void; // 建议保额变化回调
}

const CoverageItem: React.FC<CoverageItemProps> = ({coverage, onToggle, onAmountChange, onRecommendedAmountChange}) => {
  const [expanded, setExpanded] = useState(false);
  const [editingRecommended, setEditingRecommended] = useState(false);
  const [recommendedInput, setRecommendedInput] = useState('');
  const iconColor = COVERAGE_COLORS[coverage.type] || colors.primary[1];

  // 开始编辑建议保额
  const startEditRecommended = () => {
    setRecommendedInput(String(coverage.recommendedAmount ?? 0));
    setEditingRecommended(true);
  };

  // 保存建议保额
  const saveRecommended = () => {
    const value = parseFloat(recommendedInput);
    if (!isNaN(value) && value >= 0) {
      onAmountChange('recommendedAmount')(recommendedInput);
      // 同时更新缺口
      const currentCoverage = coverage.coverageAmount ?? 0;
      onAmountChange('gapAmount')(String(Math.max(0, value - currentCoverage)));
      if (onRecommendedAmountChange) {
        onRecommendedAmountChange(value);
      }
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
          <View style={[styles.icon, {backgroundColor: iconColor + '20'}]}>
            <Text style={[styles.iconText, {color: iconColor}]}>
              {/* 19项统一规则图标 */}
              {coverage.type === 'death' ? '寿' :
               coverage.type === 'pension' ? '养' :
               coverage.type === 'criticalIllness' ? '重' :
               coverage.type === 'moderateIllness' ? '中' :
               coverage.type === 'minorIllness' ? '轻' :
               coverage.type === 'specificCritical' ? '特' :
               coverage.type === 'proton' ? '质' :
               coverage.type === 'accident' ? '意' :
               coverage.type === 'disability' ? '残' :
               coverage.type === 'maternity' ? '孕' :
               coverage.type === 'millionMedical' ? '百' :
               coverage.type === 'medical' ? '医' :
               coverage.type === 'overseasMedical' ? '海' :
               coverage.type === 'hospital' ? '日' :
               coverage.type === 'education' ? '教' :
               coverage.type === 'waiver' ? '豁' :
               coverage.type === 'schoolAccident' ? '学' :
               coverage.type === 'shortTermFree' ? '赠' : '定'}
            </Text>
          </View>
          <View style={styles.titleArea}>
            <Text style={styles.title}>{coverage.label}</Text>
            {coverage.hasCoverage && (
              <Text style={styles.amount}>{coverage.coverageAmount ?? 0}万</Text>
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
              {backgroundColor: coverage.hasCoverage ? iconColor : colors.card.border},
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
                  keyboardType="numeric"
                  value={String(coverage.coverageAmount ?? '')}
                  onChangeText={onAmountChange('coverageAmount')}
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
                      keyboardType="numeric"
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
                      {coverage.recommendedAmount ?? 0}
                    </Text>
                    <Text style={styles.editHint}>点击修改</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>保障缺口（万）</Text>
                <Text style={[styles.gapAmount, (coverage.gapAmount ?? 0) > 0 && styles.gapNegative]}>
                  {coverage.gapAmount ?? 0}
                </Text>
              </View>
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
});

export default CoverageItem;

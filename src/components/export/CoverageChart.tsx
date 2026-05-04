// src/components/export/CoverageChart.tsx
import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {MemberCoverage} from '../../types';
import {getCoverageStatusColor} from '../../utils/colorUtils';
import {maskAmount} from '../../utils/privacyUtils';
import {useSettings} from '../../store/settingsStore';
import {DEFAULT_COVERAGES} from '../../data/defaultCoverages';

// 保障ID到中文标签的映射，用于找不到配置时的fallback
const COVERAGE_ID_LABELS: Record<string, string> = {
  socialInsurance: '社保医保',
  accident: '意外伤害',
  death: '身故保障',
  pension: '养老年金',
  childPension: '增额年金',
  criticalIllness: '重疾保障',
  moderateIllness: '中度重疾',
  minorIllness: '轻度重疾',
  specificCritical: '特定重疾',
  disability: '意外医疗',
  maternity: '孕妇保障',
  millionMedical: '百万医疗',
  medical: '一般医疗',
  // 过滤旧版废弃的保障项ID（不再映射，避免显示）
  // shortTermFree、shortTerm、free 已废弃
};

interface CoverageChartProps {
  coverage: MemberCoverage[];
  showName: boolean;
}

const CoverageChart: React.FC<CoverageChartProps> = ({coverage, showName}) => {
  const {getCoverageConfig} = useSettings();
  
  const visibleCoverage = useMemo(() => {
    // 过滤掉废弃的旧版保障项
    const deprecatedIds = ['shortTermFree', 'shortTerm', 'free'];
    return coverage.filter(item => !deprecatedIds.includes(item.id));
  }, [coverage]);

  if (visibleCoverage.length === 0) {
    return <Text style={styles.empty}>暂无保障数据</Text>;
  }

  return (
    <View style={styles.chart}>
      {visibleCoverage.map(item => {
        const config = getCoverageConfig(item.id);
        // 优先级：配置中的shortLabel > 默认配置中的shortLabel > 中文映射 > 原始ID
        const defaultConfig = DEFAULT_COVERAGES.find(c => c.id === item.id);
        const label = config?.shortLabel || defaultConfig?.shortLabel || COVERAGE_ID_LABELS[item.id] || item.id;
        return (
          <View key={item.id} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.barOuter}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: item.hasCoverage ? `${Math.min(100, ((item.coverageAmount ?? 0) / Math.max(item.recommendedAmount ?? 1, 1)) * 100)}%` : '0%',
                    backgroundColor: getCoverageStatusColor(item.hasCoverage, item.gapAmount),
                    opacity: item.hasCoverage ? 1 : 0.3,
                  },
                ]}
              />
            </View>
            <Text style={[styles.value, {color: getCoverageStatusColor(item.hasCoverage, item.gapAmount)}]}>
              {item.hasCoverage
                ? `${maskAmount(item.coverageAmount, showName)}万`
                : '缺失'}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  chart: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    width: 56,
    fontSize: 11,
    color: colors.text[1],
    fontWeight: '500',
  },
  barOuter: {
    flex: 1,
    height: 8,
    backgroundColor: colors.card.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  value: {
    width: 48,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  empty: {
    fontSize: 11,
    color: colors.text[2],
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});

export default CoverageChart;

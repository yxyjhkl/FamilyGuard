// src/components/export/CoverageChart.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {Coverage} from '../../types';
import {getCoverageStatusColor} from '../../utils/colorUtils';
import {maskAmount} from '../../utils/privacyUtils';

interface CoverageChartProps {
  coverage: Coverage[];
  showName: boolean;
}

const CoverageChart: React.FC<CoverageChartProps> = ({coverage, showName}) => {
  const visibleCoverage = coverage.filter(c => c.type !== 'shortTermFree'); // 过滤短期赠险

  if (visibleCoverage.length === 0) {
    return <Text style={styles.empty}>暂无保障数据</Text>;
  }

  return (
    <View style={styles.chart}>
      {visibleCoverage.map(item => (
        <View key={item.type} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
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
      ))}
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

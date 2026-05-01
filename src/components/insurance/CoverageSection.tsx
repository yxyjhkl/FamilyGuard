// src/components/insurance/CoverageSection.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {Coverage} from '../../types';
import CoverageItem from './CoverageItem';
import StatusBadge from '../common/StatusBadge';
import {getCoverageStatusText, getCoverageStatusColor, COVERAGE_COLORS} from '../../utils/colorUtils';

interface CoverageSectionProps {
  coverage: Coverage[];
  onToggle: (index: number) => void;
  onUpdate: (index: number, field: 'coverageAmount' | 'gapAmount' | 'policyDetails' | 'recommendedAmount', value: string | number) => void;
}

const CoverageSection: React.FC<CoverageSectionProps> = ({coverage, onToggle, onUpdate}) => {
  if (coverage.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无保障配置</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {coverage.map((item, index) => (
        <CoverageItem
          key={item.type}
          coverage={item}
          onToggle={() => onToggle(index)}
          onAmountChange={field => (value: string) => onUpdate(index, field, value)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  empty: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text[2],
  },
});

export default CoverageSection;

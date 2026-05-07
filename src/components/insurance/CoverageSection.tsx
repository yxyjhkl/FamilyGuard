// src/components/insurance/CoverageSection.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {MemberCoverage} from '../../types';
import CoverageItem from './CoverageItem';

// 废弃的旧版保障项ID列表
const DEPRECATED_COVERAGE_IDS = ['shortTermFree', 'shortTerm', 'free'];

interface CoverageSectionProps {
  coverage: MemberCoverage[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, field: 'coverageAmount' | 'gapAmount' | 'policyDetails' | 'recommendedAmount' | 'premium', value: string | number) => void;
  claimedItems?: string[];
  onClaimToggle?: (id: string) => void;
}

const CoverageSection: React.FC<CoverageSectionProps> = ({coverage, onToggle, onUpdate, claimedItems, onClaimToggle}) => {
  // 过滤掉废弃的旧版保障项
  const visibleCoverage = coverage.filter(item => !DEPRECATED_COVERAGE_IDS.includes(item.id));
  const claimedSet = new Set(claimedItems || []);

  if (visibleCoverage.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无保障配置</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {visibleCoverage.map(item => (
        <CoverageItem
          key={item.id}
          coverage={item}
          onToggle={() => onToggle(item.id)}
          onAmountChange={field => (value: string) => onUpdate(item.id, field, value)}
          isClaimed={claimedSet.has(item.id)}
          onClaimToggle={onClaimToggle ? () => onClaimToggle(item.id) : undefined}
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

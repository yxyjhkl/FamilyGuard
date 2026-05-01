// src/components/insurance/RightsGrid.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {Right} from '../../types';
import RightsChip from './RightsChip';

interface RightsGridProps {
  rights: Right[];
  onToggle: (index: number) => void;
  onUpdate: (index: number, field: 'validityDate' | 'notes', value: string) => void;
}

const RightsGrid: React.FC<RightsGridProps> = ({rights, onToggle, onUpdate}) => {
  if (rights.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无权益配置</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {rights.map((right, index) => (
        <RightsChip
          key={right.type}
          right={right}
          onToggle={() => onToggle(index)}
          onUpdate={(field, value) => onUpdate(index, field, value)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
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

export default RightsGrid;

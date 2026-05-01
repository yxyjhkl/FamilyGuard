// src/components/insurance/RightsChip.tsx
import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {Right} from '../../types';

interface RightsChipProps {
  right: Right;
  onToggle: () => void;
  onUpdate: (field: 'validityDate' | 'notes', value: string) => void;
}

const RightsChip: React.FC<RightsChipProps> = ({right, onToggle, onUpdate}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.chipOuter}>
      <TouchableOpacity
        style={[
          styles.chip,
          right.hasRight && styles.chipActive,
        ]}
        onPress={() => {
          onToggle();
          if (!right.hasRight) setExpanded(false);
        }}
        onLongPress={() => right.hasRight && setExpanded(!expanded)}
        activeOpacity={0.7}>
        <View style={[styles.indicator, {backgroundColor: right.hasRight ? colors.functional.success : colors.text[2]}]} />
        <Text style={[styles.chipText, right.hasRight && styles.chipTextActive]}>
          {right.label}
        </Text>
      </TouchableOpacity>

      {expanded && right.hasRight && (
        <View style={styles.details}>
          <TextInput
            style={styles.input}
            value={right.validityDate ?? ''}
            onChangeText={v => onUpdate('validityDate', v)}
            placeholder="有效期（如：2026-12-31）"
            placeholderTextColor={colors.text[2]}
          />
          <TextInput
            style={styles.input}
            value={right.notes ?? ''}
            onChangeText={v => onUpdate('notes', v)}
            placeholder="备注信息"
            placeholderTextColor={colors.text[2]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chipOuter: {
    width: '45%',
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background[0],
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  chipActive: {
    backgroundColor: '#E8F8E8',
    borderColor: colors.functional.success,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  chipText: {
    fontSize: 13,
    color: colors.text[1],
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#1E7E34',
    fontWeight: '600',
  },
  details: {
    marginTop: spacing.xs,
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  input: {
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    color: colors.text[0],
    borderWidth: 1,
    borderColor: colors.card.border,
  },
});

export default RightsChip;

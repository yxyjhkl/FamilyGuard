// src/components/insurance/RightsChip.tsx
import React, {useState, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {MemberRight, RightConfig} from '../../types';
import {useSettings} from '../../store/settingsStore';

interface RightsChipProps {
  right: MemberRight;
  onToggle: () => void;
  onUpdate: (field: 'validityDate' | 'notes', value: string) => void;
}

const RightsChip: React.FC<RightsChipProps> = ({right, onToggle, onUpdate}) => {
  const [expanded, setExpanded] = useState(false);
  const {getRightConfig} = useSettings();

  // 获取权益配置信息
  const config: RightConfig | undefined = useMemo(() => {
    return getRightConfig(right.id);
  }, [right.id, getRightConfig]);

  const label = config?.label || right.id;
  const icon = config?.icon || '✨';
  const color = config?.color || colors.primary[1];

  return (
    <View style={styles.chipOuter}>
      <TouchableOpacity
        style={[
          styles.chip,
          right.hasRight && styles.chipActive,
          right.hasRight && {borderColor: color},
        ]}
        onPress={() => {
          onToggle();
          if (!right.hasRight) setExpanded(false);
        }}
        onLongPress={() => right.hasRight && setExpanded(!expanded)}
        activeOpacity={0.7}>
        <Text style={styles.chipIcon}>{icon}</Text>
        <View style={[styles.indicator, {backgroundColor: right.hasRight ? color : colors.text[2]}]} />
        <Text style={[styles.chipText, right.hasRight && styles.chipTextActive]}>
          {label}
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
  },
  chipIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  chipText: {
    fontSize: 13,
    color: colors.text[1],
    fontWeight: '500',
  },
  chipTextActive: {
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

// src/components/family/FamilyCard.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {Family} from '../../types';
import {MEMBER_ROLE_LABELS} from '../../types';
import {formatTimestamp} from '../../utils/formatUtils';

interface FamilyCardProps {
  family: Family;
  onPress: (family: Family) => void;
  onLongPress?: (family: Family) => void;
}

const FamilyCard: React.FC<FamilyCardProps> = ({family, onPress, onLongPress}) => {
  const memberCount = family.members.length;
  const roles = family.members.map(m => MEMBER_ROLE_LABELS[m.role]).join('、');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(family)}
      onLongPress={() => onLongPress?.(family)}
      activeOpacity={0.85}>
      {/* 顶部渐变条 */}
      <View style={styles.topBar}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{family.structureLabel}</Text>
        </View>
      </View>

      {/* 家庭信息 */}
      <View style={styles.content}>
        <Text style={styles.familyName}>{family.name}</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{memberCount}</Text>
            <Text style={styles.infoLabel}>位成员</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{roles}</Text>
            <Text style={styles.infoLabel}>角色构成</Text>
          </View>
        </View>

        {/* 保障概览 */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, {backgroundColor: colors.functional.success}]} />
            <Text style={styles.summaryText}>
              {family.members.reduce(
                (sum, m) => sum + m.coverage.filter(c => c.hasCoverage).length,
                0,
              )}{' '}
              项已有保障
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, {backgroundColor: colors.functional.warning}]} />
            <Text style={styles.summaryText}>
              {family.members.reduce(
                (sum, m) =>
                  sum +
                  m.coverage.filter(c => !c.hasCoverage || (c.gapAmount ?? 0) > 0).length,
                0,
              )}{' '}
              项待完善
            </Text>
          </View>
        </View>
      </View>

      {/* 底部时间戳 */}
      <View style={styles.footer}>
        <Text style={styles.timeText}>更新于 {formatTimestamp(family.updatedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    elevation: 3,
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  categoryBadge: {
    backgroundColor: colors.primary[2] + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  categoryText: {
    fontSize: 12,
    color: colors.primary[1],
    fontWeight: '500',
  },
  content: {
    padding: spacing.lg,
  },
  familyName: {
    ...typography.subheading,
    color: colors.text[0],
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text[0],
  },
  infoLabel: {
    fontSize: 11,
    color: colors.text[2],
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: colors.card.border,
  },
  summaryRow: {
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  summaryText: {
    fontSize: 13,
    color: colors.text[1],
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  timeText: {
    fontSize: 11,
    color: colors.text[2],
  },
});

export default FamilyCard;

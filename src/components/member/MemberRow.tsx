// src/components/member/MemberRow.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {Member} from '../../types';
import {MEMBER_ROLE_LABELS} from '../../types';
import RoleAvatar from '../common/RoleAvatar';
import StatusBadge from '../common/StatusBadge';
import {getCoverageStatusColor} from '../../utils/colorUtils';

interface MemberRowProps {
  member: Member;
  onPress: (member: Member) => void;
}

const MemberRow: React.FC<MemberRowProps> = ({member, onPress}) => {
  const totalCoverage = member.coverage.length;
  const coveredCount = member.coverage.filter(c => c.hasCoverage).length;
  const missingCount = member.coverage.filter(c => !c.hasCoverage).length;
  const partialCount = member.coverage.filter(
    c => c.hasCoverage && (c.gapAmount ?? 0) > 0,
  ).length;

  const getStatusBadge = () => {
    if (coveredCount === 0) return <StatusBadge status="missing" text="未配置" />;
    if (missingCount > 0 || partialCount > 0) return <StatusBadge status="partial" text="部分覆盖" />;
    return <StatusBadge status="sufficient" text="配置完善" />;
  };

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(member)} activeOpacity={0.8}>
      {/* 头像 */}
      <View
        style={[
          styles.avatar,
          {backgroundColor: getCoverageStatusColor(coveredCount > 0, 0) + '30'},
        ]}>
        <RoleAvatar role={member.role} size={36} />
      </View>

      {/* 信息 */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.role}>{MEMBER_ROLE_LABELS[member.role]}</Text>
          <Text style={styles.age}>{member.age}岁</Text>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {width: `${(coveredCount / Math.max(totalCoverage, 1)) * 100}%`},
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {coveredCount}/{totalCoverage}
          </Text>
        </View>
      </View>

      {/* 状态 */}
      {getStatusBadge()}

      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background[1],
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    elevation: 1,
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text[0],
  },
  role: {
    fontSize: 11,
    color: colors.text[2],
    backgroundColor: colors.background[2],
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  age: {
    fontSize: 11,
    color: colors.text[2],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.card.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.functional.success,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: colors.text[2],
    fontWeight: '500',
  },
  arrow: {
    fontSize: 22,
    color: colors.text[2],
    marginLeft: spacing.sm,
  },
});

export default MemberRow;

// src/components/export/ExportCard.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {Family} from '../../types';
import {MEMBER_ROLE_LABELS} from '../../types';
import {formatTimestamp} from '../../utils/formatUtils';
import {maskName, maskPhone} from '../../utils/privacyUtils';
import CoverageChart from './CoverageChart';
import RightsSummary from './RightsSummary';

interface ExportCardProps {
  family: Family;
  motto: string;
  timestamp: string;
  showName: boolean;
  showAgentInfo: boolean;
  agentName: string;
  agentPhone: string;
}

const ExportCard: React.FC<ExportCardProps> = ({
  family,
  motto,
  timestamp,
  showName,
  showAgentInfo,
  agentName,
  agentPhone,
}) => {
  return (
    <View style={styles.card}>
      {/* 顶部金句 */}
      <View style={styles.mottoSection}>
        <Text style={styles.mottoIcon}>✦</Text>
        <Text style={styles.mottoText}>{motto}</Text>
      </View>

      {/* 家庭名称 */}
      <View style={styles.titleSection}>
        <Text style={styles.titleIcon}>🏠</Text>
        <Text style={styles.familyName}>
          {showName ? family.name : '**家庭'}
        </Text>
        <Text style={styles.familyType}>{family.structureLabel}</Text>
      </View>

      {/* 成员保障总览 */}
      {family.members.map(member => (
        <View key={member.id} style={styles.memberSection}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberName}>
              {showName ? member.name : maskName(member.name, false)}
            </Text>
            <Text style={styles.memberRole}>
              {MEMBER_ROLE_LABELS[member.role]} | {member.age}岁
            </Text>
          </View>
          <CoverageChart coverage={member.coverage} showName={showName} />
          <RightsSummary rights={member.rights} />
        </View>
      ))}

      {/* 底部信息 */}
      <View style={styles.footer}>
        {showAgentInfo && agentName ? (
          <View style={styles.agentInfo}>
            <Text style={styles.agentText}>
              客户经理：{agentName}
              {agentPhone ? ` | ${agentPhone}` : ''}
            </Text>
          </View>
        ) : null}
        <Text style={styles.timestamp}>生成时间：{formatTimestamp(timestamp)}</Text>
        <Text style={styles.copyright}>家庭保障检视 · 守护每一个家</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    margin: spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  mottoSection: {
    backgroundColor: colors.primary[0],
    padding: spacing.lg,
    alignItems: 'center',
  },
  mottoIcon: {
    fontSize: 16,
    color: colors.functional.gold,
    marginBottom: spacing.xs,
  },
  mottoText: {
    color: colors.text[3],
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
    gap: spacing.sm,
  },
  titleIcon: {
    fontSize: 20,
  },
  familyName: {
    ...typography.subheading,
    color: colors.text[0],
  },
  familyType: {
    fontSize: 12,
    color: colors.text[2],
    backgroundColor: colors.background[2],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  memberSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text[0],
  },
  memberRole: {
    fontSize: 12,
    color: colors.text[2],
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  agentInfo: {
    marginBottom: spacing.sm,
  },
  agentText: {
    fontSize: 12,
    color: colors.primary[1],
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
    color: colors.text[2],
    marginBottom: spacing.xs,
  },
  copyright: {
    fontSize: 10,
    color: colors.text[2],
  },
});

export default ExportCard;

// src/screens/MemberListScreen.tsx
import React, {useMemo, useCallback, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList, Member} from '../types';
import {useFamily} from '../hooks/useFamily';
import AppHeader from '../components/common/AppHeader';
import MemberRow from '../components/member/MemberRow';
import EmptyState from '../components/common/EmptyState';
import FamilyTreeGraph from '../components/family/FamilyTreeGraph';
import FamilyOrganizationChart from '../components/family/FamilyOrganizationChart';
import FamilyCustomChart from '../components/family/FamilyCustomChart';
import {colors, typography, spacing, borderRadius} from '../theme';

// 帮助按钮组件
const HelpButton: React.FC<{onPress: () => void}> = ({onPress}) => (
  <TouchableOpacity style={styles.helpButton} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.helpIcon}>❓</Text>
  </TouchableOpacity>
);

type Props = NativeStackScreenProps<RootStackParamList, 'MemberList'>;
type ViewMode = 'list' | 'graph' | 'orgChart' | 'custom';

const MemberListScreen: React.FC<Props> = ({route, navigation}) => {
  const {familyId} = route.params;
  const {getFamilyById} = useFamily();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const family = useMemo(() => getFamilyById(familyId), [familyId, getFamilyById]);

  const handleMemberPress = useCallback(
    (member: Member) => {
      navigation.navigate('MemberDetail', {
        familyId,
        memberId: member.id,
      });
    },
    [familyId, navigation],
  );

  const renderMember = useCallback(
    ({item}: {item: Member}) => (
      <MemberRow member={item} onPress={handleMemberPress} />
    ),
    [handleMemberPress],
  );

  if (!family) {
    return (
      <View style={styles.container}>
        <AppHeader title="家庭成员" />
        <EmptyState icon="❓" title="未找到家庭" description="该家庭可能已被删除" />
      </View>
    );
  }

  const coveredCount = family.members.reduce(
    (sum, m) => sum + m.coverage.filter(c => c.hasCoverage).length,
    0,
  );
  const totalCount = family.members.reduce(
    (sum, m) => sum + m.coverage.length,
    0,
  );

  return (
    <View style={styles.container}>
      <AppHeader 
        title={family.name}
        rightAction={<HelpButton onPress={() => navigation.navigate('Help')} />}
      />

      {/* 家庭概览 */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{family.members.length}</Text>
            <Text style={styles.summaryLabel}>位成员</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, {color: colors.functional.success}]}>
              {coveredCount}
            </Text>
            <Text style={styles.summaryLabel}>已有保障</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, {color: colors.functional.warning}]}>
              {totalCount - coveredCount}
            </Text>
            <Text style={styles.summaryLabel}>待完善</Text>
          </View>
        </View>
      </View>

      {/* 视图切换 - 四种模式 */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
          onPress={() => setViewMode('list')}
          activeOpacity={0.7}>
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            列表视图
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'graph' && styles.toggleBtnActive]}
          onPress={() => setViewMode('graph')}
          activeOpacity={0.7}>
          <Text style={[styles.toggleText, viewMode === 'graph' && styles.toggleTextActive]}>
            架构图
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'orgChart' && styles.toggleBtnActive]}
          onPress={() => setViewMode('orgChart')}
          activeOpacity={0.7}>
          <Text style={[styles.toggleText, viewMode === 'orgChart' && styles.toggleTextActive]}>
            双圈视图
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'custom' && styles.toggleBtnActive]}
          onPress={() => setViewMode('custom')}
          activeOpacity={0.7}>
          <Text style={[styles.toggleText, viewMode === 'custom' && styles.toggleTextActive]}>
            自定义视图
          </Text>
        </TouchableOpacity>
      </View>

      {/* 成员列表 / 架构图 / 双圈编辑 / 自定义 */}
      {viewMode === 'list' ? (
        <FlatList
          data={family.members}
          renderItem={renderMember}
          keyExtractor={item => item.id}
          contentContainerStyle={
            family.members.length === 0 ? styles.emptyList : styles.listContent
          }
          ListHeaderComponent={
            family.members.length > 0 ? (
              <Text style={styles.sectionTitle}>
                家庭成员（{family.members.length}人）
              </Text>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      ) : viewMode === 'graph' ? (
        <FamilyTreeGraph
          family={family}
          onMemberPress={handleMemberPress}
        />
      ) : viewMode === 'orgChart' ? (
        <FamilyOrganizationChart
          family={family}
          onMemberPress={handleMemberPress}
        />
      ) : (
        <FamilyCustomChart
          family={family}
          onMemberPress={handleMemberPress}
        />
      )}

      {/* 底部操作 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => navigation.navigate('ExportPreview', {familyId})}
          activeOpacity={0.85}>
          <Text style={styles.exportButtonText}>生成保障检视图</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.functional.infoLight || '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: {
    fontSize: 18,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  summaryCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary[1],
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text[2],
    marginTop: spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.card.border,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.primary[1],
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text[2],
  },
  toggleTextActive: {
    color: colors.text[3],
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text[1],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.background[1],
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  exportButton: {
    backgroundColor: colors.primary[1],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary[1],
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  exportButtonText: {
    ...typography.body,
    color: colors.text[3],
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MemberListScreen;

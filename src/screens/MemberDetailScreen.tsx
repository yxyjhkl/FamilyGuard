// src/screens/MemberDetailScreen.tsx
import React, {useMemo, useState, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList, Member, Coverage, Right, CoverageType, RightType} from '../types';
import {MEMBER_ROLE_LABELS, COVERAGE_LABELS, RIGHT_LABELS} from '../types';
import RoleAvatar from '../components/common/RoleAvatar';
import {useFamily} from '../hooks/useFamily';
import AppHeader from '../components/common/AppHeader';
import CoverageSection from '../components/insurance/CoverageSection';
import RightsGrid from '../components/insurance/RightsGrid';
import {colors, typography, spacing, borderRadius} from '../theme';

// 帮助按钮组件
const HelpButton: React.FC<{onPress: () => void}> = ({onPress}) => (
  <TouchableOpacity style={styles.helpButton} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.helpIcon}>❓</Text>
  </TouchableOpacity>
);

type Props = NativeStackScreenProps<RootStackParamList, 'MemberDetail'>;

const MemberDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {familyId, memberId} = route.params;
  const {getFamilyById, updateMember} = useFamily();

  const family = useMemo(() => getFamilyById(familyId), [familyId, getFamilyById]);
  const [activeTab, setActiveTab] = useState<'coverage' | 'rights'>('coverage');
  const [editingAge, setEditingAge] = useState(false);
  const [ageInput, setAgeInput] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const member = useMemo(
    () => family?.members.find(m => m.id === memberId) ?? null,
    [family, memberId],
  );

  const [localMember, setLocalMember] = useState<Member | null>(null);

  // 同步本地state
  React.useEffect(() => {
    if (member) {
      setLocalMember({...member});
    }
  }, [member]);

  // 切换成员
  const switchToMember = useCallback(
    (newMemberId: string) => {
      // 先保存当前成员的修改
      if (localMember) {
        updateMember(familyId, localMember);
      }
      // 跳转到新成员
      navigation.replace('MemberDetail', {familyId, memberId: newMemberId});
    },
    [localMember, familyId, updateMember, navigation],
  );

  // 保存变更
  const saveChanges = useCallback(() => {
    if (localMember) {
      updateMember(familyId, localMember);
    }
  }, [localMember, familyId, updateMember]);

  // 编辑年龄
  const startEditingAge = useCallback(() => {
    if (localMember) {
      setAgeInput(String(localMember.age));
      setEditingAge(true);
    }
  }, [localMember]);

  const saveAge = useCallback(() => {
    const newAge = parseInt(ageInput, 10);
    if (!isNaN(newAge) && newAge >= 0 && newAge <= 120) {
      // 直接使用 newAge 值，避免闭包陷阱
      const updatedMember = {...localMember, age: newAge};
      setLocalMember(updatedMember);
      updateMember(familyId, updatedMember);
    }
    setEditingAge(false);
  }, [ageInput, localMember, familyId, updateMember]);

  // 编辑名字
  const startEditingName = useCallback(() => {
    if (localMember) {
      setNameInput(localMember.name);
      setEditingName(true);
    }
  }, [localMember]);

  const saveName = useCallback(() => {
    const trimmedName = nameInput.trim();
    if (trimmedName) {
      // 直接使用新名称，避免闭包陷阱
      const updatedMember = {...localMember, name: trimmedName};
      setLocalMember(updatedMember);
      updateMember(familyId, updatedMember);
    }
    setEditingName(false);
  }, [nameInput, localMember, familyId, updateMember]);

  const toggleCoverage = useCallback((index: number) => {
    setLocalMember(prev => {
      if (!prev) return prev;
      const newCoverage = [...prev.coverage];
      const item = {...newCoverage[index]};
      item.hasCoverage = !item.hasCoverage;
      if (!item.hasCoverage) {
        item.coverageAmount = 0;
        item.gapAmount = item.gapAmount ?? 0;
      } else {
        item.gapAmount = 0;
      }
      newCoverage[index] = item;
      return {...prev, coverage: newCoverage};
    });
  }, []);

  const updateCoverageField = useCallback(
    (index: number, field: 'coverageAmount' | 'gapAmount' | 'policyDetails' | 'recommendedAmount', value: string | number) => {
      setLocalMember(prev => {
        if (!prev) return prev;
        const newCoverage = [...prev.coverage];
        const item = {...newCoverage[index]};
        const numericValue = typeof value === 'string' ? Number(value) || 0 : value;
        
        if (field === 'recommendedAmount') {
          // 更新建议保额时，同时更新缺口
          (item as any)[field] = numericValue;
          item.gapAmount = numericValue - (item.coverageAmount ?? 0);
        } else if (field === 'coverageAmount') {
          (item as any)[field] = numericValue;
          item.gapAmount = (item.recommendedAmount ?? 0) - numericValue;
        } else {
          (item as any)[field] = typeof value === 'string' && field === 'policyDetails' ? value : numericValue;
        }
        
        newCoverage[index] = item;
        return {...prev, coverage: newCoverage};
      });
    },
    [],
  );

  const toggleRight = useCallback((index: number) => {
    setLocalMember(prev => {
      if (!prev) return prev;
      const newRights = [...prev.rights];
      const item = {...newRights[index]};
      item.hasRight = !item.hasRight;
      if (!item.hasRight) {
        item.validityDate = '';
        item.notes = '';
      }
      newRights[index] = item;
      return {...prev, rights: newRights};
    });
  }, []);

  const updateRightField = useCallback(
    (index: number, field: 'validityDate' | 'notes', value: string) => {
      setLocalMember(prev => {
        if (!prev) return prev;
        const newRights = [...prev.rights];
        (newRights[index] as any)[field] = value;
        return {...prev, rights: newRights};
      });
    },
    [],
  );

  if (!member || !localMember || !family) {
    return (
      <View style={styles.container}>
        <AppHeader title="成员详情" />
        <View style={styles.error}>
          <Text style={styles.errorText}>未找到成员信息</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title={member.name}
        rightAction={
          <View style={styles.headerRight}>
            <HelpButton onPress={() => navigation.navigate('Help')} />
            <TouchableOpacity onPress={saveChanges} activeOpacity={0.7}>
              <Text style={styles.saveBtn}>保存</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* 成员切换器 */}
      <View style={styles.memberSwitcher}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberSwitcherContent}>
          {family.members.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.memberChip,
                m.id === memberId && styles.memberChipActive,
              ]}
              onPress={() => switchToMember(m.id)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.memberChipText,
                  m.id === memberId && styles.memberChipTextActive,
                ]}>
                {m.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 成员信息 */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <RoleAvatar role={member.role} size={60} />
        </View>
        <View style={styles.profileInfo}>
          {editingName ? (
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              onBlur={saveName}
              onSubmitEditing={saveName}
              maxLength={10}
            />
          ) : (
            <TouchableOpacity onPress={startEditingName} activeOpacity={0.7}>
              <Text style={styles.profileName}>
                {member.name}
                <Text style={styles.editHint}> (点击修改)</Text>
              </Text>
            </TouchableOpacity>
          )}
          {editingAge ? (
            <View style={styles.ageEditRow}>
              <Text style={styles.profileRole}>{MEMBER_ROLE_LABELS[member.role]} · </Text>
              <TextInput
                style={styles.ageInput}
                value={ageInput}
                onChangeText={setAgeInput}
                keyboardType="number-pad"
                autoFocus
                onBlur={saveAge}
                onSubmitEditing={saveAge}
                maxLength={3}
              />
              <Text style={styles.profileRole}>岁</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={startEditingAge} activeOpacity={0.7}>
              <Text style={styles.profileRole}>
                {MEMBER_ROLE_LABELS[member.role]} · {member.age}岁
                <Text style={styles.editHint}> (点击修改)</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab 切换 */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'coverage' && styles.tabActive]}
          onPress={() => setActiveTab('coverage')}>
          <Text style={[styles.tabText, activeTab === 'coverage' && styles.tabTextActive]}>
            保障概况
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rights' && styles.tabActive]}
          onPress={() => setActiveTab('rights')}>
          <Text style={[styles.tabText, activeTab === 'rights' && styles.tabTextActive]}>
            权益概况
          </Text>
        </TouchableOpacity>
      </View>

      {/* 内容 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'coverage' ? (
          <CoverageSection
            coverage={localMember.coverage}
            onToggle={toggleCoverage}
            onUpdate={updateCoverageField}
          />
        ) : (
          <RightsGrid
            rights={localMember.rights}
            onToggle={toggleRight}
            onUpdate={updateRightField}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
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
  saveBtn: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[1],
  },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.text[2],
  },
  memberSwitcher: {
    backgroundColor: colors.background[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  memberSwitcherContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  memberChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background[2],
    marginRight: spacing.sm,
  },
  memberChipActive: {
    backgroundColor: colors.primary[1],
  },
  memberChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text[2],
  },
  memberChipTextActive: {
    color: colors.text[3],
    fontWeight: '600',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary[2] + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  profileAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary[1],
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.subheading,
    color: colors.text[0],
  },
  nameInput: {
    ...typography.subheading,
    color: colors.primary[1],
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[1],
    paddingVertical: 0,
  },
  profileRole: {
    fontSize: 13,
    color: colors.text[2],
    marginTop: spacing.xs,
  },
  ageEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ageInput: {
    fontSize: 13,
    color: colors.primary[1],
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[1],
    paddingHorizontal: spacing.xs,
    paddingVertical: 0,
    minWidth: 40,
    textAlign: 'center',
  },
  editHint: {
    fontSize: 11,
    color: colors.text[3],
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.background[2],
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.background[1],
    elevation: 1,
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    color: colors.text[2],
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary[1],
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});

export default MemberDetailScreen;

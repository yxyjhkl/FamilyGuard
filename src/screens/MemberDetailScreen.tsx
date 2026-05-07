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
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');

  const member = useMemo(
    () => family?.members.find(m => m.id === memberId) ?? null,
    [family, memberId],
  );

  const [localMember, setLocalMember] = useState<Member | null>(null);

  // 同步本地state（深拷贝避免污染原始数据）
  React.useEffect(() => {
    if (member) {
      setLocalMember({
        ...member,
        coverage: member.coverage.map(c => ({...c})),
        rights: member.rights.map(r => ({...r})),
      });
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
    if (!isNaN(newAge) && newAge >= 0 && newAge <= 120 && localMember) {
      // 直接使用 newAge 值，避免闭包陷阱
      const updatedMember: Member = {...localMember, age: newAge};
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
    if (trimmedName && localMember) {
      // 直接使用新名称，避免闭包陷阱
      const updatedMember: Member = {...localMember, name: trimmedName};
      setLocalMember(updatedMember);
      updateMember(familyId, updatedMember);
    }
    setEditingName(false);
  }, [nameInput, localMember, familyId, updateMember]);

  // 编辑年收入
  const startEditingIncome = useCallback(() => {
    if (localMember) {
      setIncomeInput(localMember.annualIncome ? String(localMember.annualIncome) : '');
      setEditingIncome(true);
    }
  }, [localMember]);

  const saveIncome = useCallback(() => {
    const newIncome = parseFloat(incomeInput);
    if (!isNaN(newIncome) && newIncome >= 0 && localMember) {
      const updatedMember: Member = {...localMember, annualIncome: newIncome};
      setLocalMember(updatedMember);
      updateMember(familyId, updatedMember);
    } else if (incomeInput === '' && localMember) {
      // 允许清空收入
      const updatedMember: Member = {...localMember, annualIncome: undefined};
      setLocalMember(updatedMember);
      updateMember(familyId, updatedMember);
    }
    setEditingIncome(false);
  }, [incomeInput, localMember, familyId, updateMember]);

  const toggleCoverage = useCallback((id: string) => {
    setLocalMember(prev => {
      if (!prev) return prev;
      const newCoverage = prev.coverage.map(c => ({...c}));
      const idx = newCoverage.findIndex(c => c.id === id);
      if (idx === -1) return prev;
      const item = newCoverage[idx];
      item.hasCoverage = !item.hasCoverage;
      if (!item.hasCoverage) {
        item.coverageAmount = 0;
        item.premium = undefined;
        item.gapAmount = item.gapAmount ?? 0;
      } else {
        item.gapAmount = 0;
      }
      newCoverage[idx] = item;
      return {...prev, coverage: newCoverage};
    });
  }, []);

  const updateCoverageField = useCallback(
    (id: string, field: 'coverageAmount' | 'gapAmount' | 'policyDetails' | 'recommendedAmount' | 'premium', value: string | number) => {
      setLocalMember(prev => {
        if (!prev) return prev;
        const newCoverage = prev.coverage.map(c => ({...c}));
        const idx = newCoverage.findIndex(c => c.id === id);
        if (idx === -1) return prev;
        const item = newCoverage[idx];
        const numericValue = typeof value === 'string' ? Number(value) || 0 : value;

        // 类型安全地设置字段
        switch (field) {
          case 'recommendedAmount':
            item.recommendedAmount = numericValue;
            item.gapAmount = Math.max(0, numericValue - (item.coverageAmount ?? 0));
            break;
          case 'coverageAmount':
            item.coverageAmount = numericValue;
            item.gapAmount = Math.max(0, (item.recommendedAmount ?? 0) - numericValue);
            break;
          case 'gapAmount':
            item.gapAmount = numericValue;
            break;
          case 'premium':
            // 保留原始字符串（支持小数点输入过程）
            if (value === '' || value === '.') {
              item.premium = undefined;
            } else {
              item.premium = numericValue;
            }
            break;
          case 'policyDetails':
            item.policyDetails = typeof value === 'string' ? value : String(value);
            break;
        }

        newCoverage[idx] = item;
        return {...prev, coverage: newCoverage};
      });
    },
    [],
  );

  // 切换保障项的已理赔状态（长按触发）
  const toggleClaimed = useCallback((id: string) => {
    setLocalMember(prev => {
      if (!prev) return prev;
      const currentClaimed = prev.claimedItems || [];
      if (currentClaimed.includes(id)) {
        // 取消理赔
        return {...prev, claimedItems: currentClaimed.filter(c => c !== id)};
      } else {
        // 标记为已理赔
        return {...prev, claimedItems: [...currentClaimed, id]};
      }
    });
  }, []);

  const toggleRight = useCallback((id: string) => {
    setLocalMember(prev => {
      if (!prev) return prev;
      const newRights = prev.rights.map(r => ({...r}));
      const idx = newRights.findIndex(r => r.id === id);
      if (idx === -1) return prev;
      const item = newRights[idx];
      item.hasRight = !item.hasRight;
      if (!item.hasRight) {
        item.validityDate = '';
        item.notes = '';
      }
      newRights[idx] = item;
      return {...prev, rights: newRights};
    });
  }, []);

  const updateRightField = useCallback(
    (id: string, field: 'validityDate' | 'notes', value: string) => {
      setLocalMember(prev => {
        if (!prev) return prev;
        const newRights = prev.rights.map(r => ({...r}));
        const idx = newRights.findIndex(r => r.id === id);
        if (idx === -1) return prev;
        const item = newRights[idx];
        // 类型安全地设置字段
        if (field === 'validityDate') {
          item.validityDate = value;
        } else {
          item.notes = value;
        }
        newRights[idx] = item;
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
        {/* 年收入编辑区域 */}
        <View style={styles.incomeCard}>
          <View style={styles.incomeRow}>
            <Text style={styles.incomeLabel}>💰 年收入</Text>
            {editingIncome ? (
              <View style={styles.incomeEditRow}>
                <TextInput
                  style={styles.incomeInput}
                  value={incomeInput}
                  onChangeText={setIncomeInput}
                  keyboardType="decimal-pad"
                  autoFocus
                  placeholder="请输入"
                  placeholderTextColor={colors.text[1]}
                  onBlur={saveIncome}
                  onSubmitEditing={saveIncome}
                  maxLength={10}
                />
                <Text style={styles.incomeUnit}>万/年</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={startEditingIncome} activeOpacity={0.7}>
                <Text style={styles.incomeValue}>
                  {member.annualIncome ? `${member.annualIncome} 万/年` : '点击设置'}
                  <Text style={styles.editHint}> (点击修改)</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.incomeHint}>用于保障检视评分（影响重疾险等建议额度）</Text>
        </View>

        {activeTab === 'coverage' ? (
          <CoverageSection
            coverage={localMember.coverage}
            onToggle={toggleCoverage}
            onUpdate={updateCoverageField}
            claimedItems={localMember.claimedItems}
            onClaimToggle={toggleClaimed}
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
    color: colors.text[2],
  },
  incomeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.functional.warningLight || '#FFF8E1',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.functional.warning + '40' || '#FFE082',
  },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  incomeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text[0],
  },
  incomeValue: {
    fontSize: 15,
    color: colors.functional.warning || '#F57C00',
    fontWeight: '600',
  },
  incomeEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeInput: {
    fontSize: 15,
    color: colors.primary[1],
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[1],
    paddingHorizontal: spacing.xs,
    paddingVertical: 0,
    minWidth: 60,
    textAlign: 'right',
  },
  incomeUnit: {
    fontSize: 13,
    color: colors.text[2],
    marginLeft: spacing.xs,
  },
  incomeHint: {
    fontSize: 11,
    color: colors.text[3],
    marginTop: spacing.xs,
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

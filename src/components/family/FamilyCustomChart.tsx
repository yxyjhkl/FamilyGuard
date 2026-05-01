// src/components/family/FamilyCustomChart.tsx
// 自定义视图 - 直接显示所有成员的头像和保障权益供业务人员点击
import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {colors, spacing, borderRadius} from '../../theme';
import type {Family, Member} from '../../types';
import {MEMBER_ROLE_LABELS} from '../../types';
import RoleAvatar from '../common/RoleAvatar';
import {insuranceRights} from '../../data/insuranceRights';
import {insuranceCoverages} from '../../data/insuranceCoverages';
import {useFamily} from '../../hooks/useFamily';

// 状态枚举
type MemberStatus = 'none' | 'owned' | 'claimed';

// 工具函数 - 计算角度位置
const getPositionOnCircle = (
  index: number,
  total: number,
  radius: number,
  startAngle: number = 0
): {x: number; y: number; angle: number} => {
  if (total === 0) return {x: 0, y: 0, angle: 0};
  const angle = startAngle + (2 * Math.PI * index) / total;
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
    angle: angle * (180 / Math.PI) - 90,
  };
};

// 圆圈节点组件
interface CircleNodeProps {
  label: string;
  status: MemberStatus;
  color: string;
  size?: number;
  onPress?: () => void;
}

const CircleNode: React.FC<CircleNodeProps> = ({
  label,
  status,
  color,
  size = 22,
  onPress,
}) => {
  const getBackgroundColor = () => {
    switch (status) {
      case 'owned':
        return color;
      case 'claimed':
        return colors.functional.danger;
      case 'none':
      default:
        return '#E5E7EB';
    }
  };

  const getTextColor = () => {
    if (status === 'owned' || status === 'claimed') {
      return '#FFFFFF';
    }
    return '#9CA3AF';
  };

  return (
    <TouchableOpacity
      style={[
        styles.circleNode,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getBackgroundColor(),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}>
      <Text
        style={[
          styles.circleNodeText,
          {color: getTextColor()},
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// 单个成员保障展示卡片
interface MemberCoverageCardProps {
  member: Member;
  onStatusChange: (type: string, status: MemberStatus) => void;
}

const MemberCoverageCard: React.FC<MemberCoverageCardProps> = ({
  member,
  onStatusChange,
}) => {
  const getMemberAvatarColor = () => {
    const role = MEMBER_ROLE_LABELS[member.role];
    if (role === '父亲' || role === '丈夫') return colors.primary[1];
  if (role === '母亲' || role === '妻子') return '#E91E63';
  if (['爷爷', '奶奶', '外公', '外婆'].includes(role)) return '#FF9800';
  return colors.functional.info;
};

  // 渲染内圈保障（完整18项，分两圈排列）
  const renderInnerCircle = () => {
    const allCoverages = insuranceCoverages; // 显示全部18项保障
    const circleSize = 160;
    const innerRadius = 55;
    const outerRadius = 75;
    const nodeSize = 22;
    const innerCount = 9; // 内圈9项
    const outerCount = 9; // 外圈9项

    return (
      <View style={[styles.innerCircleContainer, {width: circleSize, height: circleSize}]}>
        {/* 内圈 - 前9项 */}
        {allCoverages.slice(0, innerCount).map((coverage, index) => {
          const pos = getPositionOnCircle(index, innerCount, innerRadius, -Math.PI / 2);
          const coverageItem = member.coverage.find(c => c.type === coverage.type);
          const status: MemberStatus = coverageItem?.hasCoverage ? 'owned' : 'none';

          return (
            <View
              key={coverage.type}
              style={[
                styles.nodeWrapper,
                {
                  left: circleSize / 2 + pos.x - nodeSize / 2,
                  top: circleSize / 2 + pos.y - nodeSize / 2,
                },
              ]}>
              <CircleNode
                label={coverage.shortLabel}
                status={status}
                color={coverage.color}
                size={nodeSize}
                onPress={() => {
                  if (status === 'none') {
                    onStatusChange(coverage.type, 'owned');
                  }
                }}
              />
            </View>
          );
        })}
        {/* 外圈 - 后9项 */}
        {allCoverages.slice(innerCount).map((coverage, index) => {
          const pos = getPositionOnCircle(index, outerCount, outerRadius, -Math.PI / 2 + Math.PI / outerCount);
          const coverageItem = member.coverage.find(c => c.type === coverage.type);
          const status: MemberStatus = coverageItem?.hasCoverage ? 'owned' : 'none';

          return (
            <View
              key={coverage.type}
              style={[
                styles.nodeWrapper,
                {
                  left: circleSize / 2 + pos.x - nodeSize / 2,
                  top: circleSize / 2 + pos.y - nodeSize / 2,
                },
              ]}>
              <CircleNode
                label={coverage.shortLabel}
                status={status}
                color={coverage.color}
                size={nodeSize}
                onPress={() => {
                  if (status === 'none') {
                    onStatusChange(coverage.type, 'owned');
                  }
                }}
              />
            </View>
          );
        })}
        {/* 中心头像 */}
        <View
          style={[
            styles.innerCenterAvatar,
            {backgroundColor: getMemberAvatarColor()},
          ]}>
          <RoleAvatar role={member.role} size={28} />
        </View>
      </View>
    );
  };

  // 渲染外圈权益（完整8项，分两排）
  const renderOuterRights = () => {
    const allRights = insuranceRights; // 显示全部8项权益
    const nodeSize = 24;

    return (
      <View style={styles.outerRightsContainer}>
        <Text style={styles.outerRightsLabel}>权益（8项）</Text>
        <View style={styles.outerRightsGrid}>
          {/* 第一排 - 前4项 */}
          <View style={styles.outerRightsRow}>
            {allRights.slice(0, 4).map(right => {
              const rightItem = member.rights?.find(r => r.type === right.type);
              const status: MemberStatus = rightItem?.hasRight ? 'owned' : 'none';

              return (
                <CircleNode
                  key={right.type}
                  label={right.shortLabel}
                  status={status}
                  color={right.color}
                  size={nodeSize}
                  onPress={() => {
                    if (status === 'none') {
                      onStatusChange(right.type, 'owned');
                    }
                  }}
                />
              );
            })}
          </View>
          {/* 第二排 - 后4项 */}
          <View style={styles.outerRightsRow}>
            {allRights.slice(4).map(right => {
              const rightItem = member.rights?.find(r => r.type === right.type);
              const status: MemberStatus = rightItem?.hasRight ? 'owned' : 'none';

              return (
                <CircleNode
                  key={right.type}
                  label={right.shortLabel}
                  status={status}
                  color={right.color}
                  size={nodeSize}
                  onPress={() => {
                    if (status === 'none') {
                      onStatusChange(right.type, 'owned');
                    }
                  }}
                />
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.memberCoverageCard}>
      {/* 成员信息 */}
      <View style={styles.memberHeader}>
        <View style={[styles.memberAvatar, {backgroundColor: getMemberAvatarColor()}]}>
          <RoleAvatar role={member.role} size={32} />
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRole}>{MEMBER_ROLE_LABELS[member.role]}</Text>
        </View>
      </View>

      {/* 内圈保障 */}
      <View style={styles.coverageSection}>
        <Text style={styles.sectionLabel}>保障（18项）</Text>
        <View style={styles.coverageCircleWrapper}>
          {renderInnerCircle()}
        </View>
      </View>

      {/* 外圈权益 */}
      {renderOuterRights()}

      {/* 点击提示 */}
      <Text style={styles.tapHint}>点击灰色圆圈添加保障</Text>
    </View>
  );
};

// 添加成员组件
interface MemberAdderProps {
  family: Family;
  onAddMember: (member: Member) => void;
}

const MemberAdder: React.FC<MemberAdderProps> = ({family, onAddMember}) => {
  const [showAdder, setShowAdder] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Member['role']>('other');

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      Alert.alert('提示', '请输入成员姓名');
      return;
    }

    const newMember: Member = {
      id: Date.now().toString(),
      familyId: family.id,
      role: selectedRole,
      name: newMemberName.trim(),
      age: 30,
      coverage: [],
      rights: [],
    };

    onAddMember(newMember);
    setNewMemberName('');
    setShowAdder(false);
  };

  const roles: {value: Member['role']; label: string}[] = [
    {value: 'father', label: '父亲'},
    {value: 'mother', label: '母亲'},
    {value: 'grandfather', label: '爷爷'},
    {value: 'grandmother', label: '奶奶'},
    {value: 'husband', label: '丈夫'},
    {value: 'wife', label: '妻子'},
    {value: 'son', label: '儿子'},
    {value: 'daughter', label: '女儿'},
    {value: 'other', label: '其他'},
  ];

  return (
    <View style={styles.addMemberCard}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAdder(!showAdder)}
        activeOpacity={0.7}>
        <Text style={styles.addButtonIcon}>+</Text>
        <Text style={styles.addButtonText}>添加成员</Text>
      </TouchableOpacity>

      {showAdder && (
        <View style={styles.adderForm}>
          <TextInput
            style={styles.adderInput}
            value={newMemberName}
            onChangeText={setNewMemberName}
            placeholder="输入成员姓名"
          />
          <View style={styles.roleSelector}>
            {roles.map(role => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleChip,
                  selectedRole === role.value && styles.roleChipActive,
                ]}
                onPress={() => setSelectedRole(role.value)}>
                <Text
                  style={[
                    styles.roleChipText,
                    selectedRole === role.value && styles.roleChipTextActive,
                  ]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.confirmAddButton}
            onPress={handleAddMember}
            activeOpacity={0.8}>
            <Text style={styles.confirmAddButtonText}>确认添加</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// 主组件
interface FamilyCustomChartProps {
  family: Family;
  onMemberPress?: (member: Member) => void;
}

const FamilyCustomChart: React.FC<FamilyCustomChartProps> = ({
  family,
}) => {
  const {updateMember, addMember} = useFamily();

  const handleStatusChange = useCallback(
    (memberId: string, type: string, status: MemberStatus) => {
      const member = family.members.find(m => m.id === memberId);
      if (!member) return;

      // 更新 coverage 或 rights 数组
      const isCoverageType = insuranceCoverages.some(c => c.type === type);
      
      if (isCoverageType) {
        const updatedCoverage = member.coverage.map(c => {
          if (c.type === type) {
            return {
              ...c,
              hasCoverage: status !== 'none',
            };
          }
          return c;
        });
        updateMember(family.id, {...member, coverage: updatedCoverage});
      } else {
        const updatedRights = member.rights?.map(r => {
          if (r.type === type) {
            return {
              ...r,
              hasRight: status !== 'none',
            };
          }
          return r;
        }) ?? [];
        updateMember(family.id, {...member, rights: updatedRights});
      }
    },
    [family, updateMember]
  );

  const handleAddMember = useCallback(
    (member: Member) => {
      addMember(family.id, member);
    },
    [family.id, addMember]
  );

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{family.name}</Text>
        <Text style={styles.headerSubtitle}>点击灰色圆圈快速添加保障</Text>
      </View>

      {/* 成员卡片列表 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {family.members.map(member => (
          <MemberCoverageCard
            key={member.id}
            member={member}
            onStatusChange={(type, status) =>
              handleStatusChange(member.id, type, status)
            }
          />
        ))}

        {/* 添加成员 */}
        <MemberAdder family={family} onAddMember={handleAddMember} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52, 199, 89, 0.2)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.functional.success,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text[2],
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 100,
  },

  // 成员保障卡片
  memberCoverageCard: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    alignSelf: 'stretch',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text[0],
  },
  memberRole: {
    fontSize: 12,
    color: colors.text[2],
    marginTop: 2,
  },

  // 保障部分
  coverageSection: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text[2],
    marginBottom: spacing.xs,
  },
  coverageCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCenterAvatar: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background[1],
  },
  nodeWrapper: {
    position: 'absolute',
  },
  circleNode: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  circleNodeText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },

  // 外圈权益
  outerRightsContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  outerRightsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text[2],
    marginBottom: spacing.xs,
  },
  outerRightsGrid: {
    gap: spacing.xs,
  },
  outerRightsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  // 点击提示
  tapHint: {
    fontSize: 10,
    color: colors.text[2],
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // 添加成员卡片
  addMemberCard: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary[1],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  addButtonIcon: {
    fontSize: 24,
    color: colors.primary[1],
    fontWeight: '300',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[1],
    marginLeft: spacing.xs,
  },
  adderForm: {
    marginTop: spacing.md,
  },
  adderInput: {
    borderWidth: 1,
    borderColor: colors.card.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  roleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background[2],
  },
  roleChipActive: {
    backgroundColor: colors.primary[1],
  },
  roleChipText: {
    fontSize: 11,
    color: colors.text[1],
  },
  roleChipTextActive: {
    color: colors.text[3],
  },
  confirmAddButton: {
    backgroundColor: colors.primary[1],
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  confirmAddButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text[3],
  },
});

export default FamilyCustomChart;

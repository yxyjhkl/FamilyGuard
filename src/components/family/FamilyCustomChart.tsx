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
import {useFamily} from '../../hooks/useFamily';
import {useSettings} from '../../store/settingsStore';
import {DEFAULT_COVERAGES} from '../../data/defaultCoverages';
import {DEFAULT_RIGHTS} from '../../data/defaultRights';

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
  onLongPress?: () => void;
}

const CircleNode: React.FC<CircleNodeProps> = ({
  label,
  status,
  color,
  size = 22,
  onPress,
  onLongPress,
}) => {
  // 检查颜色是否为红色系（避免与已理赔状态混淆）
  const isRedColor = (c: string) => {
    if (c === '#E74C3C' || c === '#FF3B30' || c === '#C0392B') return true;
    return false;
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'owned':
        return color;
      case 'claimed':
        // 如果保障项目本身就是红色，已理赔用深棕色区分
        return isRedColor(color) ? '#5D4037' : colors.functional.danger;
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
      onLongPress={onLongPress}
      activeOpacity={0.7}
      disabled={!onPress && !onLongPress}>
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
  coverages: typeof DEFAULT_COVERAGES;
  rights: typeof DEFAULT_RIGHTS;
  onStatusChange: (type: string, status: MemberStatus) => void;
}

const MemberCoverageCard: React.FC<MemberCoverageCardProps> = ({
  member,
  coverages,
  rights,
  onStatusChange,
}) => {
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [statusPickerTarget, setStatusPickerTarget] = useState<{
    type: string;
    category: 'right' | 'coverage';
    currentStatus: MemberStatus;
  } | null>(null);

  // 判断是否为男性角色
  const isMale = ['father', 'husband', 'son', 'grandfather', 'other'].includes(member.role);
  
  // 过滤后的保障列表：男性不显示孕妇保障
  const visibleCoverages = isMale 
    ? coverages.filter(c => c.id !== 'maternity')
    : coverages;

  const getMemberAvatarColor = () => {
    const role = MEMBER_ROLE_LABELS[member.role];
    if (role === '父亲' || role === '丈夫') return colors.primary[1];
    if (role === '母亲' || role === '妻子') return '#E91E63';
    if (['爷爷', '奶奶', '外公', '外婆'].includes(role)) return '#FF9800';
    return colors.functional.info;
  };

  // 处理节点长按 - 弹出状态选择菜单
  const handleNodeLongPress = useCallback(
    (id: string, category: 'right' | 'coverage', currentStatus: MemberStatus) => {
      if (currentStatus === 'none') {
        // 未有状态：直接标记为已有
        onStatusChange(id, 'owned');
      } else {
        // 已有或理赔状态：弹出状态选择弹窗
        setStatusPickerTarget({type: id, category, currentStatus});
        setShowStatusPicker(true);
      }
    },
    [onStatusChange]
  );

  // 状态选择弹窗确认
  const handleStatusPickerConfirm = useCallback(
    (newStatus: MemberStatus) => {
      if (statusPickerTarget) {
        onStatusChange(statusPickerTarget.type, newStatus);
      }
      setShowStatusPicker(false);
      setStatusPickerTarget(null);
    },
    [statusPickerTarget, onStatusChange]
  );

  // 渲染内圈保障（分两圈排列）
  const renderInnerCircle = () => {
    const circleSize = 160;
    const innerRadius = 55;
    const outerRadius = 75;
    const nodeSize = 22;
    const innerCount = Math.ceil(visibleCoverages.length / 2);  // 内圈
    const outerCount = Math.floor(visibleCoverages.length / 2); // 外圈

    return (
      <View style={[styles.innerCircleContainer, {width: circleSize, height: circleSize}]}>
        {/* 内圈 - 前 half 项 */}
        {visibleCoverages.slice(0, innerCount).map((coverage, index) => {
          const pos = getPositionOnCircle(index, innerCount, innerRadius, -Math.PI / 2);
          const coverageItem = member.coverage.find(c => c.id === coverage.id);
          const status: MemberStatus = coverageItem?.hasCoverage ? 'owned' : 'none';

          return (
            <View
              key={coverage.id}
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
                    onStatusChange(coverage.id, 'owned');
                  }
                }}
                onLongPress={() => handleNodeLongPress(coverage.id, 'coverage', status)}
              />
            </View>
          );
        })}
        {/* 外圈 - 后半部分 */}
        {visibleCoverages.slice(innerCount).map((coverage, index) => {
          const pos = getPositionOnCircle(index, outerCount, outerRadius, -Math.PI / 2 + Math.PI / Math.max(outerCount, 1));
          const coverageItem = member.coverage.find(c => c.id === coverage.id);
          const status: MemberStatus = coverageItem?.hasCoverage ? 'owned' : 'none';

          return (
            <View
              key={coverage.id}
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
                    onStatusChange(coverage.id, 'owned');
                  }
                }}
                onLongPress={() => handleNodeLongPress(coverage.id, 'coverage', status)}
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
          <RoleAvatar role={member.role} size={56} />
        </View>
      </View>
    );
  };

  // 渲染外圈权益（分两排）
  const renderOuterRights = () => {
    const nodeSize = 24;
    const halfRights = Math.ceil(rights.length / 2);

    return (
      <View style={styles.outerRightsContainer}>
        <Text style={styles.outerRightsLabel}>权益（{rights.length}项）</Text>
        <View style={styles.outerRightsGrid}>
          {/* 第一排 */}
          <View style={styles.outerRightsRow}>
            {rights.slice(0, halfRights).map(right => {
              const rightItem = member.rights?.find(r => r.id === right.id);
              const status: MemberStatus = rightItem?.hasRight ? 'owned' : 'none';

              return (
                <CircleNode
                  key={right.id}
                  label={right.shortLabel}
                  status={status}
                  color={right.color}
                  size={nodeSize}
                  onPress={() => {
                    if (status === 'none') {
                      onStatusChange(right.id, 'owned');
                    }
                  }}
                  onLongPress={() => handleNodeLongPress(right.id, 'right', status)}
                />
              );
            })}
          </View>
          {/* 第二排 */}
          <View style={styles.outerRightsRow}>
            {rights.slice(halfRights).map(right => {
              const rightItem = member.rights?.find(r => r.id === right.id);
              const status: MemberStatus = rightItem?.hasRight ? 'owned' : 'none';

              return (
                <CircleNode
                  key={right.id}
                  label={right.shortLabel}
                  status={status}
                  color={right.color}
                  size={nodeSize}
                  onPress={() => {
                    if (status === 'none') {
                      onStatusChange(right.id, 'owned');
                    }
                  }}
                  onLongPress={() => handleNodeLongPress(right.id, 'right', status)}
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
        <Text style={styles.sectionLabel}>保障（{visibleCoverages.length}项）</Text>
        <View style={styles.coverageCircleWrapper}>
          {renderInnerCircle()}
        </View>
      </View>

      {/* 外圈权益 */}
      {renderOuterRights()}

      {/* 点击提示 */}
      <View style={styles.hintContainer}>
        <Text style={styles.tapHint}>💡 点击灰色圆圈添加保障</Text>
        <Text style={styles.tapHint}>📌 有理赔过请长按彩色圈圈</Text>
      </View>

      {/* 状态选择弹窗 */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.statusPickerModal}>
            <Text style={styles.statusPickerTitle}>选择状态</Text>
            <TouchableOpacity
              style={[
                styles.statusPickerOption,
                statusPickerTarget?.currentStatus === 'owned' && styles.statusPickerOptionSelected,
              ]}
              onPress={() => handleStatusPickerConfirm('owned')}>
              <View style={[styles.statusDot, {backgroundColor: colors.functional.success}]} />
              <Text style={styles.statusPickerOptionText}>已有保障</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusPickerOption,
                statusPickerTarget?.currentStatus === 'claimed' && styles.statusPickerOptionSelected,
              ]}
              onPress={() => handleStatusPickerConfirm('claimed')}>
              <View style={[styles.statusDot, {backgroundColor: colors.functional.danger}]} />
              <Text style={styles.statusPickerOptionText}>已理赔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusPickerOption,
                statusPickerTarget?.currentStatus === 'none' && styles.statusPickerOptionSelected,
              ]}
              onPress={() => handleStatusPickerConfirm('none')}>
              <View style={[styles.statusDot, {backgroundColor: '#E5E7EB'}]} />
              <Text style={styles.statusPickerOptionText}>清除</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statusPickerCancel}
              onPress={() => setShowStatusPicker(false)}>
              <Text style={styles.statusPickerCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  
  // 从设置中获取动态保障和权益配置
  const {customCoverages, customRights} = useSettings();
  const coverages = Array.isArray(customCoverages) && customCoverages.length > 0 ? customCoverages : DEFAULT_COVERAGES;
  const rights = Array.isArray(customRights) && customRights.length > 0 ? customRights : DEFAULT_RIGHTS;

  // 判断是否为男性角色
  const isMaleRole = (role: Member['role']) => {
    return ['father', 'husband', 'son', 'grandfather', 'other'].includes(role);
  };

  const handleStatusChange = useCallback(
    (memberId: string, type: string, status: MemberStatus) => {
      const member = family.members.find(m => m.id === memberId);
      if (!member) return;

      // 孕妇保障限制：男性不能添加孕妇保障
      if (type === 'maternity' && status !== 'none' && isMaleRole(member.role)) {
        Alert.alert('无法添加', `${MEMBER_ROLE_LABELS[member.role]}${member.name} 不能添加孕妇保障`);
        return;
      }

      // 更新 coverage 或 rights 数组
      const isCoverageType = coverages.some(c => c.id === type);
      
      if (isCoverageType) {
        const existingCoverage = member.coverage.find(c => c.id === type);
        let updatedCoverage: typeof member.coverage;
        
        if (existingCoverage) {
          // 如果保障项已存在，更新状态
          updatedCoverage = member.coverage.map(c =>
            c.id === type ? { ...c, hasCoverage: status !== 'none' } : c
          );
        } else if (status !== 'none') {
          // 如果保障项不存在且状态不是"无"，先添加再设置状态
          updatedCoverage = [
            ...member.coverage,
            { id: type, hasCoverage: true }
          ];
        } else {
          updatedCoverage = member.coverage;
        }
        updateMember(family.id, {...member, coverage: updatedCoverage});
      } else {
        const existingRight = member.rights?.find(r => r.id === type);
        let updatedRights: typeof member.rights;
        
        if (existingRight) {
          // 如果权益项已存在，更新状态
          updatedRights = member.rights?.map(r =>
            r.id === type ? { ...r, hasRight: status !== 'none' } : r
          ) ?? [];
        } else if (status !== 'none') {
          // 如果权益项不存在且状态不是"无"，先添加再设置状态
          updatedRights = [
            ...(member.rights ?? []),
            { id: type, hasRight: true }
          ];
        } else {
          updatedRights = member.rights ?? [];
        }
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
        <Text style={styles.headerSubtitle}>💡 点击灰色圆圈添加保障 | 长按圆圈修改状态</Text>
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
            coverages={coverages}
            rights={rights}
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
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
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
  hintContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  tapHint: {
    fontSize: 11,
    color: colors.text[2],
    fontStyle: 'italic',
  },

  // 弹窗通用样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPickerModal: {
    width: 280,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  statusPickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text[0],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statusPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  statusPickerOptionSelected: {
    backgroundColor: colors.primary[0] + '15',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  statusPickerOptionText: {
    fontSize: 15,
    color: colors.text[0],
  },
  statusPickerCancel: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  statusPickerCancelText: {
    fontSize: 15,
    color: colors.text[2],
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

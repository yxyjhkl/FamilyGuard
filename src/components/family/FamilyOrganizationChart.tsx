// src/components/family/FamilyOrganizationChart.tsx
// 双圈视图 - 直接编辑成员保障权益
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
  Dimensions,
} from 'react-native';
import {colors, spacing, borderRadius} from '../../theme';
import type {Family, Member} from '../../types';
import {MEMBER_ROLE_LABELS} from '../../types';
import RoleAvatar from '../common/RoleAvatar';
import {insuranceRights} from '../../data/insuranceRights';
import {INSURANCE_COVERAGES} from '../../constants/insurance';
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
  showAmount?: number;
  showDate?: string;
}

const CircleNode: React.FC<CircleNodeProps> = ({
  label,
  status,
  color,
  size = 28,
  onPress,
  showAmount,
  showDate,
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
          status === 'none' && styles.circleNodeTextGray,
        ]}
        numberOfLines={1}>
        {label}
      </Text>
      {showAmount !== undefined && showAmount > 0 && (
        <Text style={styles.nodeDetail}>{showAmount}万</Text>
      )}
      {showDate && <Text style={styles.nodeDetail}>{showDate.slice(5)}</Text>}
    </TouchableOpacity>
  );
};

// 成员单圈编辑器组件
interface MemberCircleEditorProps {
  member: Member;
  onStatusChange: (type: string, status: MemberStatus) => void;
  onDetailSave: (type: string, detail: {amount?: number; validityDate?: string}) => void;
}

const MemberCircleEditor: React.FC<MemberCircleEditorProps> = ({
  member,
  onStatusChange,
  onDetailSave,
}) => {
  const [selectedNode, setSelectedNode] = useState<{
    type: string;
    category: 'right' | 'coverage';
    currentStatus: MemberStatus;
  } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<'amount' | 'date'>('amount');

  const getMemberAvatarColor = () => {
    const role = MEMBER_ROLE_LABELS[member.role];
    if (role === '父亲' || role === '丈夫') return colors.primary[1];
    if (role === '母亲' || role === '妻子') return '#E91E63';
    if (['爷爷', '奶奶', '外公', '外婆'].includes(role)) return '#FF9800';
    return colors.functional.info;
  };

  // 处理节点点击
  const handleNodePress = useCallback(
    (type: string, category: 'right' | 'coverage', currentStatus: MemberStatus) => {
      if (currentStatus === 'none') {
        onStatusChange(type, 'owned');
      } else if (currentStatus === 'owned') {
        setSelectedNode({type, category, currentStatus});
        const existing = member.coverageDetails?.[type];
        if (category === 'coverage') {
          setInputMode('amount');
          setInputValue(existing?.amount?.toString() || '');
        } else {
          setInputMode('date');
          setInputValue(existing?.validityDate || '');
        }
      } else if (currentStatus === 'claimed') {
        Alert.alert('提示', '该保障已理赔过，是否仍要修改？', [
          {text: '取消', style: 'cancel'},
          {
            text: '修改',
            onPress: () => {
              setSelectedNode({type, category, currentStatus});
              setInputMode(category === 'coverage' ? 'amount' : 'date');
            },
          },
        ]);
      }
    },
    [member, onStatusChange]
  );

  const handleConfirmInput = useCallback(() => {
    if (selectedNode) {
      if (inputMode === 'amount') {
        const amount = parseFloat(inputValue) || 0;
        onDetailSave(selectedNode.type, {amount});
      } else {
        onDetailSave(selectedNode.type, {validityDate: inputValue});
      }
      setSelectedNode(null);
      setInputValue('');
    }
  }, [selectedNode, inputValue, inputMode, onDetailSave]);

  const handleCancelInput = useCallback(() => {
    setSelectedNode(null);
    setInputValue('');
  }, []);

  // 渲染单圈（保障）- 19项排列成圈
  const renderCoverageCircle = () => {
    const circleSize = 280;
    const radius = 125;
    const nodeSize = 34;
    const total = INSURANCE_COVERAGES.length;
    const startAngle = -Math.PI / 2;

    return (
      <View
        style={[
          styles.coverageCircleContainer,
          {width: circleSize, height: circleSize},
        ]}>
        {INSURANCE_COVERAGES.map((coverage, index) => {
          const pos = getPositionOnCircle(index, total, radius, startAngle);
          // 从 coverage 数组获取状态
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
                onPress={() => handleNodePress(coverage.type, 'coverage', status)}
                showAmount={coverageItem?.coverageAmount}
              />
            </View>
          );
        })}
        {/* 中心头像 */}
        <View
          style={[
            styles.centerCircleAvatar,
            {backgroundColor: getMemberAvatarColor()},
          ]}>
          <RoleAvatar role={member.role} size={80} />
        </View>
      </View>
    );
  };

  // 渲染权益横排（8项两行排列）
  const renderRightsRow = () => {
    const nodeSize = 30;
    const rightsPerRow = 4;

    return (
      <View style={styles.rightsRowContainer}>
        <Text style={styles.rightsRowLabel}>保险权益</Text>
        <View style={styles.rightsRowGrid}>
          <View style={styles.rightsRowItems}>
            {insuranceRights.slice(0, rightsPerRow).map(right => {
              // 从 rights 数组获取状态
              const rightItem = member.rights?.find(r => r.type === right.type);
              const status: MemberStatus = rightItem?.hasRight ? 'owned' : 'none';

              return (
                <View key={right.type} style={styles.rightsRowItem}>
                  <CircleNode
                    label={right.shortLabel}
                    status={status}
                    color={right.color}
                    size={nodeSize}
                    onPress={() => handleNodePress(right.type, 'right', status)}
                    showDate={rightItem?.validityDate}
                  />
                  <Text style={styles.rightsRowItemLabel}>{right.fullLabel}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.rightsRowItems}>
            {insuranceRights.slice(rightsPerRow).map(right => {
              // 从 rights 数组获取状态
              const rightItem = member.rights?.find(r => r.type === right.type);
              const status: MemberStatus = rightItem?.hasRight ? 'owned' : 'none';

              return (
                <View key={right.type} style={styles.rightsRowItem}>
                  <CircleNode
                    label={right.shortLabel}
                    status={status}
                    color={right.color}
                    size={nodeSize}
                    onPress={() => handleNodePress(right.type, 'right', status)}
                    showDate={rightItem?.validityDate}
                  />
                  <Text style={styles.rightsRowItemLabel}>{right.fullLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.memberCircleEditor}>
      {/* 成员头像和姓名 */}
      <View style={styles.memberInfo}>
        <View style={[styles.avatar, {backgroundColor: getMemberAvatarColor()}]}>
          <RoleAvatar role={member.role} size={80} />
        </View>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberRole}>{MEMBER_ROLE_LABELS[member.role]}</Text>
      </View>

      {/* 单圈保障 */}
      <ScrollView
        style={styles.zoomableContainer}
        contentContainerStyle={styles.zoomableContent}
        maximumZoomScale={2}
        minimumZoomScale={0.5}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bouncesZoom>
        {renderCoverageCircle()}
      </ScrollView>

      {/* 权益横排 */}
      {renderRightsRow()}

      {/* 输入弹窗 */}
      <Modal
        visible={selectedNode !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelInput}>
        <View style={styles.modalOverlay}>
          <View style={styles.inputModal}>
            <Text style={styles.modalTitle}>
              {inputMode === 'amount' ? '输入保额（万）' : '输入有效期'}
            </Text>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={inputMode === 'amount' ? '请输入保额' : '格式：YYYY-MM-DD'}
              keyboardType={inputMode === 'amount' ? 'numeric' : 'default'}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={handleCancelInput}>
                <Text style={styles.modalBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleConfirmInput}>
                <Text style={[styles.modalBtnText, styles.modalBtnTextConfirm]}>
                  确认
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// 主组件
interface FamilyOrganizationChartProps {
  family: Family;
  onMemberPress?: (member: Member) => void;
}

const FamilyOrganizationChart: React.FC<FamilyOrganizationChartProps> = ({
  family,
  onMemberPress,
}) => {
  const {updateMember} = useFamily();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return family.members.find(m => m.id === selectedMemberId) || null;
  }, [selectedMemberId, family.members]);

  // 按层级分组
  const membersByLevel = useMemo(() => {
    const levels: {[key: number]: Member[]} = {0: [], 1: [], 2: []};

    const isSinglePerson = family.members.length === 1;
    const hasGrandparents = family.members.some(m => {
      const role = MEMBER_ROLE_LABELS[m.role];
      return ['爷爷', '奶奶', '外公', '外婆'].includes(role);
    });
    const hasChildren = family.members.some(m => {
      const role = MEMBER_ROLE_LABELS[m.role];
      return ['儿子', '女儿'].includes(role);
    });

    family.members.forEach(member => {
      const role = MEMBER_ROLE_LABELS[member.role];
      let level = 1;

      if (['爷爷', '奶奶', '外公', '外婆'].includes(role)) {
        level = 0;
      } else if (['父亲', '母亲', '丈夫', '妻子'].includes(role)) {
        if (isSinglePerson || (!hasGrandparents && !hasChildren)) {
          level = 1;
        } else {
          level = 1;
        }
      } else if (['儿子', '女儿'].includes(role)) {
        level = 2;
      }

      levels[level].push(member);
    });

    return levels;
  }, [family.members]);

  const handleStatusChange = useCallback(
    (memberId: string, type: string, status: MemberStatus) => {
      const member = family.members.find(m => m.id === memberId);
      if (!member) return;

      // 更新 coverage 或 rights 数组
      const isCoverageType = INSURANCE_COVERAGES.some(c => c.type === type);
      
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

  const handleDetailSave = useCallback(
    (memberId: string, type: string, detail: {amount?: number; validityDate?: string}) => {
      const member = family.members.find(m => m.id === memberId);
      if (!member) return;

      // 更新 coverage 或 rights 数组
      const isCoverageType = INSURANCE_COVERAGES.some(c => c.type === type);
      
      if (isCoverageType) {
        const updatedCoverage = member.coverage.map(c => {
          if (c.type === type) {
            return {
              ...c,
              coverageAmount: detail.amount ?? c.coverageAmount,
              gapAmount: c.recommendedAmount ? (c.recommendedAmount - (detail.amount ?? 0)) : 0,
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
              validityDate: detail.validityDate ?? r.validityDate,
            };
          }
          return r;
        }) ?? [];
        updateMember(family.id, {...member, rights: updatedRights});
      }
    },
    [family, updateMember]
  );

  // 渲染成员选择卡片
  const renderMemberSelector = () => {
    const levelLabels = ['祖辈', '本人', '子辈'];
    const levelColors = ['#FF9800', colors.primary[1], colors.functional.success];

    return (
      <View style={styles.memberSelectorContainer}>
        <Text style={styles.selectorTitle}>选择成员</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {[0, 1, 2].map(level => {
            const members = membersByLevel[level];
            if (members.length === 0) return null;

            return (
              <View key={level} style={styles.levelSection}>
                <Text style={[styles.levelLabel, {color: levelColors[level]}]}>
                  {levelLabels[level]}
                </Text>
                <View style={styles.memberCardsRow}>
                  {members.map(member => (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberSelectCard,
                        selectedMemberId === member.id && styles.memberSelectCardActive,
                        {borderColor: levelColors[level]},
                      ]}
                      onPress={() => {
                        setSelectedMemberId(member.id);
                        onMemberPress?.(member);
                      }}
                      activeOpacity={0.7}>
                      <View
                        style={[
                          styles.memberSelectAvatar,
                          {backgroundColor: levelColors[level]},
                        ]}>
                        <RoleAvatar role={member.role} size={36} />
                      </View>
                      <Text style={styles.memberSelectName} numberOfLines={1}>
                        {member.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 左侧：成员选择 */}
      <View style={styles.leftPanel}>{renderMemberSelector()}</View>

      {/* 右侧：选中成员编辑 */}
      <View style={styles.rightPanel}>
        {selectedMember ? (
          <MemberCircleEditor
            member={selectedMember}
            onStatusChange={(type, status) =>
              handleStatusChange(selectedMember.id, type, status)
            }
            onDetailSave={(type, detail) =>
              handleDetailSave(selectedMember.id, type, detail)
            }
          />
        ) : (
          <View style={styles.noSelection}>
            <Text style={styles.noSelectionIcon}>👈</Text>
            <Text style={styles.noSelectionText}>
              请从左侧选择{'\n'}要编辑的家庭成员
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background[0],
  },
  leftPanel: {
    width: SCREEN_WIDTH * 0.38,
    backgroundColor: colors.background[1],
    borderRightWidth: 1,
    borderRightColor: colors.card.border,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: colors.background[0],
  },

  // 成员选择器
  memberSelectorContainer: {
    flex: 1,
    padding: spacing.sm,
  },
  selectorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text[1],
    marginBottom: spacing.sm,
  },
  levelSection: {
    marginBottom: spacing.md,
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  memberCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  memberSelectCard: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  memberSelectCardActive: {
    backgroundColor: colors.primary[0] || 'rgba(59, 130, 246, 0.1)',
  },
  memberSelectAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberSelectName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text[0],
    marginTop: spacing.xs,
  },

  // 无选中状态
  noSelection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  noSelectionIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  noSelectionText: {
    fontSize: 13,
    color: colors.text[2],
    textAlign: 'center',
    lineHeight: 22,
  },

  // 成员编辑器
  memberCircleEditor: {
    alignItems: 'center',
    flex: 1,
    paddingTop: spacing.md,
  },
  memberInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text[0],
    marginTop: spacing.xs,
  },
  memberRole: {
    fontSize: 12,
    color: colors.text[2],
    marginTop: 2,
  },
  zoomableContainer: {
    width: '100%',
    minHeight: 300,
    maxHeight: 340,
  },
  zoomableContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverageCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircleAvatar: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background[0],
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
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  circleNodeTextGray: {
    fontSize: 10,
  },
  nodeDetail: {
    position: 'absolute',
    bottom: -12,
    fontSize: 8,
    color: colors.text[2],
  },

  // 权益横排
  rightsRowContainer: {
    marginTop: spacing.xs,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  rightsRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text[1],
    marginBottom: spacing.sm,
  },
  rightsRowGrid: {
    width: '100%',
    gap: spacing.sm,
  },
  rightsRowItems: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  rightsRowItem: {
    alignItems: 'center',
  },
  rightsRowItemLabel: {
    fontSize: 9,
    color: colors.text[2],
    marginTop: 2,
    textAlign: 'center',
  },

  // 弹窗
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputModal: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text[0],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.card.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: colors.background[2],
  },
  modalBtnConfirm: {
    backgroundColor: colors.primary[1],
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text[1],
  },
  modalBtnTextConfirm: {
    color: colors.text[3],
  },
});

export default FamilyOrganizationChart;

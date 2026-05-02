// src/components/export/ExportOrgChartCard.tsx
// 导出用 - 美观的家族双圈组织架构图
import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import {colors, spacing} from '../../theme';
import type {Family, Member} from '../../types';
import {MEMBER_ROLE_LABELS} from '../../types';
import RoleAvatar from '../common/RoleAvatar';
import {insuranceRights} from '../../data/insuranceRights';
import {INSURANCE_COVERAGES} from '../../constants/insurance';
import {formatTimestamp} from '../../utils/formatUtils';
import {maskName} from '../../utils/privacyUtils';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// 状态颜色
const STATUS_COLORS = {
  none: '#E8E8E8',
  owned: '#34C759',
  claimed: '#E74C3C',
};

interface ExportOrgChartCardProps {
  family: Family;
  motto: string;
  timestamp: string;
  showName: boolean;
  showAgentInfo: boolean;
  agentName: string;
  agentPhone: string;
  onMemberPress?: (member: Member) => void;
}

// 计算角度位置
const getPositionOnCircle = (
  index: number,
  total: number,
  radius: number,
  startAngle: number = -Math.PI / 2
): {x: number; y: number} => {
  if (total === 0) return {x: 0, y: 0};
  const angle = startAngle + (2 * Math.PI * index) / total;
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
};

// 成员头像颜色
const getMemberAvatarColor = (role: Member['role']) => {
  const roleLabel = MEMBER_ROLE_LABELS[role];
  if (roleLabel === '父亲' || roleLabel === '丈夫') return colors.primary[1];
  if (roleLabel === '母亲' || roleLabel === '妻子') return '#E91E63';
  if (['爷爷', '奶奶', '外公', '外婆'].includes(roleLabel)) return '#FF9800';
  if (roleLabel === '儿子') return '#3498DB';
  if (roleLabel === '女儿') return '#9B59B6';
  return colors.functional.info;
};

// 成员单圈组件(保障单圈+权益横排)
interface MemberCircleProps {
  member: Member;
  showName: boolean;
  size?: number;
  onPress?: (member: Member) => void;
}

const MemberCircle: React.FC<MemberCircleProps> = ({member, showName, size = 100, onPress}) => {
  const circleRadius = size * 0.42;
  const nodeSize = size * 0.14;

  const memberColor = getMemberAvatarColor(member.role);
  const displayName = showName ? member.name : maskName(member.name, false);

  // 渲染单圈保障
  const renderCoverageCircle = () => {
    const total = INSURANCE_COVERAGES.length;
    return (
      <View style={[styles.circleLayer, {width: size, height: size}]}>
        {/* 外圈装饰环 */}
        <View style={[styles.outerRing, {width: size, height: size, borderColor: memberColor}]} />
        {INSURANCE_COVERAGES.map((coverage, index) => {
          const pos = getPositionOnCircle(index, total, circleRadius);
          // 从 coverage 数组获取状态
          const coverageItem = member.coverage.find(c => c.type === coverage.type);
          const status = coverageItem?.hasCoverage ? 'owned' : 'none';

          return (
            <View
              key={coverage.type}
              style={[
                styles.node,
                {
                  left: size / 2 + pos.x - nodeSize / 2,
                  top: size / 2 + pos.y - nodeSize / 2,
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: nodeSize / 2,
                  backgroundColor: status === 'owned' ? coverage.color : STATUS_COLORS[status],
                  borderColor: status === 'none' ? '#D0D0D0' : coverage.color,
                  borderWidth: status === 'none' ? 1 : 0,
                },
              ]}>
              <Text
                style={[
                  styles.nodeTextSmall,
                  {color: status === 'owned' ? '#fff' : '#888'},
                ]}>
                {coverage.shortLabel}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // 渲染权益横排
  const renderRightsRow = () => {
    return (
      <View style={styles.rightsRow}>
        {insuranceRights.map(right => {
          // 从 rights 数组获取状态
          const rightItem = member.rights?.find(r => r.type === right.type);
          const status = rightItem?.hasRight ? 'owned' : 'none';

          return (
            <View
              key={right.type}
              style={[
                styles.rightDot,
                {
                  backgroundColor: status === 'owned' ? right.color : STATUS_COLORS[status],
                  borderColor: status === 'none' ? '#D0D0D0' : right.color,
                  borderWidth: status === 'none' ? 1 : 0,
                },
              ]}>
              <Text style={[styles.rightDotText, {color: status === 'owned' ? '#fff' : '#888'}]}>
                {right.shortLabel}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.memberCircle, {width: size, height: size}]}
      onPress={() => onPress?.(member)}
      activeOpacity={0.8}>
      {/* 单圈保障 */}
      {renderCoverageCircle()}
      {/* 中心头像 */}
      <View style={[styles.centerAvatar, {backgroundColor: memberColor}]}>
        <RoleAvatar role={member.role} size={30} />
      </View>
      {/* 权益横排 */}
      {renderRightsRow()}
      {/* 姓名 */}
      <Text style={styles.memberName} numberOfLines={1}>
        {displayName}
      </Text>
    </TouchableOpacity>
  );
};

// 连接线组件
interface ConnectionLineProps {
  fromIndex: number;
  toIndex: number;
  totalMembers: number;
  cardWidth: number;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  fromIndex,
  toIndex,
  totalMembers,
  cardWidth,
}) => {
  const startX = (fromIndex + 0.5) * (cardWidth / totalMembers);
  const endX = (toIndex + 0.5) * (cardWidth / totalMembers);
  const midY = 20;

  return (
    <View
      style={[
        styles.connectionLine,
        {
          left: Math.min(startX, endX),
          width: Math.abs(endX - startX) + 10,
          top: midY,
        },
      ]}
    />
  );
};

const ExportOrgChartCard: React.FC<ExportOrgChartCardProps> = ({
  family,
  motto,
  timestamp,
  showName,
  showAgentInfo,
  agentName,
  agentPhone,
  onMemberPress,
}) => {
  // 按层级分组
  const membersByLevel = useMemo(() => {
    const levels: {[key: number]: Member[]} = {0: [], 1: [], 2: []};

    // 判断是否是单人家庭
    const isSinglePerson = family.members.length === 1;
    // 判断是否有祖辈
    const hasGrandparents = family.members.some(m => {
      const role = MEMBER_ROLE_LABELS[m.role];
      return ['爷爷', '奶奶', '外公', '外婆'].includes(role);
    });
    // 判断是否有子女
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
        // 单人家庭或没有祖辈和子女时，父母/夫妻归为"本人"
        if (isSinglePerson || (!hasGrandparents && !hasChildren)) {
          level = 1;
        } else {
          level = 1; // 有其他家庭成员时，父母/夫妻归为"父辈"
        }
      } else if (['儿子', '女儿'].includes(role)) {
        level = 2;
      }

      levels[level].push(member);
    });

    return levels;
  }, [family.members]);

  // 统计
  const stats = useMemo(() => {
    let ownedCoverage = 0;
    let totalCoverage = INSURANCE_COVERAGES.length * family.members.length;
    let ownedRights = 0;
    let totalRights = insuranceRights.length * family.members.length;

    family.members.forEach(member => {
      // 从 member.coverage 数组统计已有保障
      member.coverage.forEach(c => {
        if (c.hasCoverage) ownedCoverage++;
      });
      // 从 member.rights 数组统计已有权益
      member.rights?.forEach(r => {
        if (r.hasRight) ownedRights++;
      });
    });

    return {
      coverageRate: totalCoverage > 0 ? Math.round((ownedCoverage / totalCoverage) * 100) : 0,
      rightsRate: totalRights > 0 ? Math.round((ownedRights / totalRights) * 100) : 0,
    };
  }, [family]);

  const levelLabels = ['祖辈', '本人', '子辈'];
  const levelColors = ['#FF9800', colors.primary[1], '#27AE60'];

  return (
    <View style={styles.card}>
      {/* 顶部区域 - 金句与标题 */}
      <View style={styles.headerSection}>
        <View style={styles.gradientHeader}>
          <Text style={styles.mottoIcon}>✦</Text>
          <Text style={styles.mottoText}>{motto}</Text>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.familyIcon}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.familyName}>
            {showName ? family.name : '**家庭'}
          </Text>
          <Text style={styles.familyType}>{family.structureLabel}</Text>
        </View>

        {/* 整体统计 */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{family.members.length}</Text>
            <Text style={styles.statLabel}>位家庭成员</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: '#3498DB'}]}>
              {stats.rightsRate}%
            </Text>
            <Text style={styles.statLabel}>权益覆盖率</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: '#27AE60'}]}>
              {stats.coverageRate}%
            </Text>
            <Text style={styles.statLabel}>保障完善度</Text>
          </View>
        </View>
      </View>

      {/* 家族成员展示 */}
      <View style={styles.membersSection}>
        {[0, 1, 2].map(level => {
          const members = membersByLevel[level];
          if (members.length === 0) return null;

          return (
            <View key={level} style={styles.levelRow}>
              <View style={[styles.levelBadge, {backgroundColor: levelColors[level]}]}>
                <Text style={styles.levelBadgeText}>{levelLabels[level]}</Text>
              </View>
              <View style={styles.levelMembers}>
                {members.map(member => (
                  <MemberCircle
                    key={member.id}
                    member={member}
                    showName={showName}
                    size={90}
                    onPress={onMemberPress}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* 图例区域 - 移至检视图下方 */}
      <View style={styles.legendSection}>
        <View style={styles.legendHeader}>
          <Text style={styles.legendTitle}>图例说明</Text>
        </View>
        
        {/* 状态说明 */}
        <View style={styles.legendStatusRow}>
          <View style={styles.legendStatusItem}>
            <View style={[styles.legendDot, {backgroundColor: STATUS_COLORS.owned}]} />
            <Text style={styles.legendStatusText}>已有</Text>
          </View>
          <View style={styles.legendStatusItem}>
            <View style={[styles.legendDot, {backgroundColor: STATUS_COLORS.none}]} />
            <Text style={styles.legendStatusText}>未有</Text>
          </View>
          <View style={styles.legendStatusItem}>
            <View style={[styles.legendDot, {backgroundColor: STATUS_COLORS.claimed}]} />
            <Text style={styles.legendStatusText}>理赔</Text>
          </View>
        </View>
        
        {/* 保障19项 - 按分类排列 */}
        <View style={styles.legendCategory}>
          <Text style={styles.legendCategoryTitle}>保障(19项)</Text>
          <View style={styles.legendGrid}>
            {/* 寿险/养老 */}
            <View style={styles.legendGridRow}>
              {INSURANCE_COVERAGES.slice(0, 2).map(c => (
                <View key={c.type} style={styles.legendGridItem}>
                  <View style={[styles.legendDot, {backgroundColor: c.color}]}>
                    <Text style={styles.legendDotText}>{c.shortLabel}</Text>
                  </View>
                  <Text style={styles.legendLabel}>{c.fullLabel}</Text>
                </View>
              ))}
            </View>
            {/* 重疾类 */}
            <View style={styles.legendGridRow}>
              {INSURANCE_COVERAGES.slice(2, 7).map(c => (
                <View key={c.type} style={styles.legendGridItem}>
                  <View style={[styles.legendDot, {backgroundColor: c.color}]}>
                    <Text style={styles.legendDotText}>{c.shortLabel}</Text>
                  </View>
                  <Text style={styles.legendLabel}>{c.fullLabel}</Text>
                </View>
              ))}
            </View>
            {/* 意外/医疗 */}
            <View style={styles.legendGridRow}>
              {INSURANCE_COVERAGES.slice(7, 13).map(c => (
                <View key={c.type} style={styles.legendGridItem}>
                  <View style={[styles.legendDot, {backgroundColor: c.color}]}>
                    <Text style={styles.legendDotText}>{c.shortLabel}</Text>
                  </View>
                  <Text style={styles.legendLabel}>{c.fullLabel}</Text>
                </View>
              ))}
            </View>
            {/* 其他 */}
            <View style={styles.legendGridRow}>
              {INSURANCE_COVERAGES.slice(13, 18).map(c => (
                <View key={c.type} style={styles.legendGridItem}>
                  <View style={[styles.legendDot, {backgroundColor: c.color}]}>
                    <Text style={styles.legendDotText}>{c.shortLabel}</Text>
                  </View>
                  <Text style={styles.legendLabel}>{c.fullLabel}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        
        {/* 权益8项 */}
        <View style={styles.legendCategory}>
          <Text style={styles.legendCategoryTitle}>权益(8项)</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendGridRow}>
              {insuranceRights.map(r => (
                <View key={r.type} style={styles.legendGridItem}>
                  <View style={[styles.legendDot, {backgroundColor: r.color}]}>
                    <Text style={styles.legendDotText}>{r.shortLabel}</Text>
                  </View>
                  <Text style={styles.legendLabel}>{r.fullLabel}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* 底部信息 */}
      <View style={styles.footer}>
        {showAgentInfo && agentName ? (
          <View style={styles.agentInfo}>
            <Text style={styles.agentText}>
              专属顾问：{agentName}
              {agentPhone ? ` · ${agentPhone}` : ''}
            </Text>
          </View>
        ) : null}
        <Text style={styles.timestamp}>{formatTimestamp(timestamp)}</Text>
        <Text style={styles.copyright}>✦ 家庭保障检视 · 用心守护每一个家 ✦</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  headerSection: {
    backgroundColor: colors.primary[0],
  },
  gradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.primary[0],
  },
  mottoIcon: {
    fontSize: 14,
    color: colors.functional.gold,
    marginRight: 8,
  },
  mottoText: {
    color: colors.text[3],
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  familyIcon: {
    fontSize: 24,
  },
  familyName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text[0],
  },
  familyType: {
    fontSize: 12,
    color: colors.text[2],
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary[1],
  },
  statLabel: {
    fontSize: 11,
    color: colors.text[2],
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.card.border,
    marginHorizontal: 8,
  },

  // 图例
  legendSection: {
    padding: 12,
    backgroundColor: colors.background[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  legendHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text[1],
  },
  legendStatusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  legendStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendStatusText: {
    fontSize: 10,
    color: colors.text[1],
  },
  legendCategory: {
    marginBottom: 8,
  },
  legendCategoryTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text[1],
    marginBottom: 6,
  },
  legendGrid: {
    gap: 4,
  },
  legendGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    width: '23%',
    marginBottom: 2,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendDotText: {
    fontSize: 6,
    fontWeight: '700',
    color: '#fff',
  },
  legendLabel: {
    fontSize: 7,
    color: colors.text[2],
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendStatusItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },

  // 成员
  membersSection: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    minHeight: 300,
  },
  levelRow: {
    marginBottom: 16,
  },
  levelBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  levelMembers: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },

  // 成员双圈
  memberCircle: {
    alignItems: 'center',
  },
  circleLayer: {
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 100,
    borderWidth: 2,
    opacity: 0.3,
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    borderWidth: 1,
  },
  nodeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  nodeTextSmall: {
    fontSize: 7,
    fontWeight: '700',
    color: '#fff',
  },
  centerAvatar: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 36,
    height: 36,
    marginLeft: -18,
    marginTop: -18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  centerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  memberName: {
    position: 'absolute',
    bottom: -18,
    fontSize: 10,
    fontWeight: '600',
    color: colors.text[0],
    textAlign: 'center',
    width: 70,
  },
  rightsRow: {
    position: 'absolute',
    bottom: -2,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  rightDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightDotText: {
    fontSize: 5,
    fontWeight: '700',
    color: '#fff',
  },
  connectionLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.card.border,
  },

  // 底部
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.primary[0],
  },
  agentInfo: {
    marginBottom: 8,
  },
  agentText: {
    fontSize: 12,
    color: colors.primary[1],
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 10,
    color: colors.text[2],
    marginBottom: 4,
  },
  copyright: {
    fontSize: 10,
    color: colors.text[2],
    fontWeight: '500',
  },
});

export default ExportOrgChartCard;

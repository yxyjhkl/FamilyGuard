// src/components/export/ExportOrgChartCard.tsx
// 导出用 - 美观的家族双圈组织架构图
import React, {useMemo, useState, memo} from 'react';
import {View, Text, StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import {colors, spacing} from '../../theme';
import type {Family, Member} from '../../types';
import {MEMBER_ROLE_LABELS} from '../../types';
import RoleAvatar from '../common/RoleAvatar';
import {formatTimestamp} from '../../utils/formatUtils';
import {maskName} from '../../utils/privacyUtils';
import {useSettings} from '../../store/settingsStore';
import {DEFAULT_COVERAGES} from '../../data/defaultCoverages';
import {DEFAULT_RIGHTS} from '../../data/defaultRights';
import type {CoverageConfig, RightConfig} from '../../types';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// 小屏阈值：屏幕宽度 < 360 时启用紧凑模式
const SMALL_SCREEN_THRESHOLD = 360;
// 紧凑模式外环节点数量（限制为15项，避免节点重叠）
const COMPACT_COVERAGE_COUNT = 15;

// 状态颜色
const STATUS_COLORS = {
  none: '#E8E8E8',
  owned: '#34C759',
  claimed: '#E74C3C',
};

// ============================================
// 性能优化：Memoized 节点组件
// ============================================

interface RightsNodeProps {
  right: RightConfig;
  index: number;
  total: number;
  innerRadius: number;
  nodeSize: number;
  containerSize: number;
  hasRight: boolean;
}

const RightsNode: React.FC<RightsNodeProps> = memo(({
  right,
  index,
  total,
  innerRadius,
  nodeSize,
  containerSize,
  hasRight,
}) => {
  const pos = getPositionOnCircle(index, total, innerRadius);
  const isOwned = hasRight;

  // 未拥有的节点不渲染阴影，减少 GPU 负担
  const nodeStyle = [
    styles.node,
    {
      left: containerSize / 2 + pos.x - nodeSize / 2,
      top: containerSize / 2 + pos.y - nodeSize / 2,
      width: nodeSize,
      height: nodeSize,
      borderRadius: nodeSize / 2,
      backgroundColor: isOwned ? right.color : STATUS_COLORS.none,
      borderColor: isOwned ? right.color : '#D0D0D0',
      borderWidth: isOwned ? 0 : 1,
      zIndex: 2,
      // 未拥有时移除阴影
      ...(isOwned ? {} : styles.nodeNoShadow),
    },
  ];

  // 小屏模式下确保字体最小可读
  const fontSize = Math.max(nodeSize * 0.5, 8);

  return (
    <View key={right.id} style={nodeStyle}>
      <Text style={[styles.rightDotText, {color: isOwned ? '#fff' : '#888', fontSize}]}>
        {right.shortLabel}
      </Text>
    </View>
  );
});

interface CoverageNodeProps {
  coverage: CoverageConfig;
  index: number;
  total: number;
  outerRadius: number;
  nodeSize: number;
  containerSize: number;
  hasCoverage: boolean;
}

const CoverageNode: React.FC<CoverageNodeProps> = memo(({
  coverage,
  index,
  total,
  outerRadius,
  nodeSize,
  containerSize,
  hasCoverage,
}) => {
  const pos = getPositionOnCircle(index, total, outerRadius);
  const isOwned = hasCoverage;

  // 未拥有的节点不渲染阴影
  const nodeStyle = [
    styles.node,
    {
      left: containerSize / 2 + pos.x - nodeSize / 2,
      top: containerSize / 2 + pos.y - nodeSize / 2,
      width: nodeSize,
      height: nodeSize,
      borderRadius: nodeSize / 2,
      backgroundColor: isOwned ? coverage.color : STATUS_COLORS.none,
      borderColor: isOwned ? coverage.color : '#D0D0D0',
      borderWidth: isOwned ? 0 : 1,
      zIndex: 1,
      // 未拥有时移除阴影
      ...(isOwned ? {} : styles.nodeNoShadow),
    },
  ];

  // 小屏模式下确保字体最小可读
  const fontSize = Math.max(nodeSize * 0.45, 7);

  return (
    <View key={coverage.id} style={nodeStyle}>
      <Text style={[styles.nodeTextSmall, {color: isOwned ? '#fff' : '#888', fontSize}]}>
        {coverage.shortLabel}
      </Text>
    </View>
  );
});

// ============================================
// 主组件
// ============================================

interface ExportOrgChartCardProps {
  family: Family;
  motto: string;
  timestamp: string;
  showName: boolean;
  showAgentInfo: boolean;
  agentName: string;
  agentPhone: string;
  onMemberPress?: (member: Member) => void;
  aiSummary?: string;
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
  mode?: 'double' | 'single';
  compactMode?: boolean;
  onPress?: (member: Member) => void;
  coverages: CoverageConfig[];
  rights: RightConfig[];
}

const MemberCircle: React.FC<MemberCircleProps> = memo(({
  member,
  showName,
  size = 100,
  mode = 'double',
  compactMode = false,
  onPress,
  coverages,
  rights
}) => {
  const circleRadius = size * 0.42;
  // 小屏模式下稍微增大节点比例，确保可读性
  const nodeSizeScale = compactMode ? 0.16 : 0.14;
  const nodeSize = size * nodeSizeScale;
  // 小屏模式下增大权益节点比例
  const rightsNodeSize = size * (compactMode ? 0.14 : 0.12);
  const outerRadius = circleRadius * 0.92;
  const innerRadius = circleRadius * 0.55;
  const avatarSize = size * 0.233;

  const memberColor = useMemo(() => getMemberAvatarColor(member.role), [member.role]);
  const displayName = showName ? member.name : maskName(member.name, false);
  
  // 判断是否为男性（男性不显示孕妇保障）
  const isMale = ['father', 'husband', 'son', 'grandfather', 'other'].includes(member.role);

  // Memoize rights lookup map
  const rightsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    member.rights?.forEach(r => map.set(r.id, r.hasRight));
    return map;
  }, [member.rights]);

  // Memoize coverage lookup map
  const coverageMap = useMemo(() => {
    const map = new Map<string, boolean>();
    member.coverage?.forEach(c => map.set(c.id, c.hasCoverage));
    return map;
  }, [member.coverage]);

  // Memoize dynamic coverages lookup
  const coverageConfigMap = useMemo(() => {
    const map = new Map<string, CoverageConfig>();
    coverages.forEach(c => map.set(c.id, c));
    return map;
  }, [coverages]);

  // Memoize dynamic rights lookup
  const rightConfigMap = useMemo(() => {
    const map = new Map<string, RightConfig>();
    rights.forEach(r => map.set(r.id, r));
    return map;
  }, [rights]);

  // 根据性别过滤保障项：男性不显示孕妇保障
  const filteredCoverages = isMale 
    ? coverages.filter(c => c.id !== 'maternity')
    : coverages;
  
  // 紧凑模式下使用前15项保障，避免节点重叠
  const displayCoverages = compactMode
    ? filteredCoverages.slice(0, Math.min(COMPACT_COVERAGE_COUNT, filteredCoverages.length))
    : filteredCoverages;
  const coverageTotal = compactMode ? Math.min(COMPACT_COVERAGE_COUNT, filteredCoverages.length) : filteredCoverages.length;

  return (
    <TouchableOpacity
      style={[styles.memberCircle, {width: size, height: mode === 'single' ? size : size}]}
      onPress={() => onPress?.(member)}
      activeOpacity={0.8}>
      <View style={[styles.circleLayer, {width: size, height: size}]}>
        {/* 外圈装饰环 */}
        <View style={[styles.outerRing, {width: size, height: size, borderColor: memberColor}]} />

        {/* 内环：权益 - 使用 Memoized 组件 */}
        {rights.map((right, index) => (
          <RightsNode
            key={right.id}
            right={right}
            index={index}
            total={rights.length}
            innerRadius={innerRadius}
            nodeSize={rightsNodeSize}
            containerSize={size}
            hasRight={rightsMap.get(right.id) ?? false}
          />
        ))}

        {/* 外环：保障（紧凑模式下限制为15项） - 使用 Memoized 组件 */}
        {displayCoverages.map((coverage, index) => (
          <CoverageNode
            key={coverage.id}
            coverage={coverageConfigMap.get(coverage.id) ?? coverage}
            index={index}
            total={coverageTotal}
            outerRadius={outerRadius}
            nodeSize={nodeSize}
            containerSize={size}
            hasCoverage={coverageMap.get(coverage.id) ?? false}
          />
        ))}

        {/* 中心大头像 */}
        <View style={[styles.centerAvatarLarge, {backgroundColor: memberColor, width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, marginTop: -avatarSize / 2, marginLeft: -avatarSize / 2}]}>
          <RoleAvatar role={member.role} size={avatarSize * 0.7} />
        </View>
      </View>

      {/* 姓名 */}
      <Text style={[styles.memberName, mode === 'single' && styles.memberNameLarge]} numberOfLines={1}>
        {displayName}
      </Text>
    </TouchableOpacity>
  );
});

// 连接线组件 - 使用 memo 优化
const ConnectionLine: React.FC<{
  fromIndex: number;
  toIndex: number;
  totalMembers: number;
  cardWidth: number;
}> = memo(({ fromIndex, toIndex, totalMembers, cardWidth }) => {
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
});

const ExportOrgChartCard: React.FC<ExportOrgChartCardProps> = ({
  family,
  motto,
  timestamp,
  showName,
  showAgentInfo,
  agentName,
  agentPhone,
  onMemberPress,
  aiSummary,
}) => {
  // 从设置中获取动态保障和权益配置
  const {customCoverages, customRights} = useSettings();
  
  // 动态保障和权益列表（防御性检查，防止存储数据损坏）
  // 空数组时回退到默认值兜底
  const coverages = Array.isArray(customCoverages) && customCoverages.length > 0 ? customCoverages : DEFAULT_COVERAGES;
  const rights = Array.isArray(customRights) && customRights.length > 0 ? customRights : DEFAULT_RIGHTS;
  // 防御性检查，防止 family.members 为 undefined
  const members = Array.isArray(family.members) ? family.members : [];
  // 按层级分组
  const membersByLevel = useMemo(() => {
    const levels: {[key: number]: Member[]} = {0: [], 1: [], 2: []};

    // 判断是否是单人家庭
    const isSinglePerson = members.length === 1;
    // 判断是否有祖辈
    const hasGrandparents = members.some(m => {
      const role = MEMBER_ROLE_LABELS[m.role];
      return ['爷爷', '奶奶', '外公', '外婆'].includes(role);
    });
    // 判断是否有子女
    const hasChildren = members.some(m => {
      const role = MEMBER_ROLE_LABELS[m.role];
      return ['儿子', '女儿'].includes(role);
    });

    members.forEach(member => {
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
  }, [members]);

  // 统计
  const stats = useMemo(() => {
    let ownedCoverage = 0;
    let totalCoverage = 0;
    let ownedRights = 0;
    let totalRights = rights.length * members.length;
    
    // 男性角色列表（不计入孕妇保障）
    const maleRoles = ['father', 'husband', 'son', 'grandfather', 'other'];

    members.forEach(member => {
      // 根据性别计算有效保障项数量（男性不含孕妇保障）
      const isMale = maleRoles.includes(member.role);
      const effectiveCoverageCount = isMale ? coverages.length - 1 : coverages.length;
      totalCoverage += effectiveCoverageCount;
      
      // 从 member.coverage 数组统计已有保障（剔除男性的孕妇保障）
      member.coverage?.forEach(c => {
        if (c.hasCoverage) {
          // 男性不计入孕妇保障
          if (!(isMale && c.id === 'maternity')) {
            ownedCoverage++;
          }
        }
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
  }, [members, coverages, rights]);

  // 布局类型状态：'single' 竖排单列 | 'double' 双排
  const [layoutType, setLayoutType] = useState<'single' | 'double'>('double');

  // 小屏自适应：检测是否需要紧凑模式
  const compactMode = SCREEN_WIDTH < SMALL_SCREEN_THRESHOLD;

  const levelLabels = ['祖辈', '本人', '子辈'];
  const levelColors = ['#FF9800', colors.primary[1], '#27AE60'];

  // 获取所有成员（扁平化）
  const allMembers = useMemo(() => {
    return [...membersByLevel[0], ...membersByLevel[1], ...membersByLevel[2]];
  }, [membersByLevel]);

  // 渲染成员圆圈（根据布局类型决定大小和模式）
  const renderMemberCircle = (member: Member, size: number, mode: 'single' | 'double' = 'double') => (
    <MemberCircle
      key={member.id}
      member={member}
      showName={showName}
      size={size}
      mode={mode}
      compactMode={compactMode}
      onPress={onMemberPress}
      coverages={coverages}
      rights={rights}
    />
  );

  // 双排布局：两个一行，最后单个居中（双环结构）
  const renderDoubleLayout = () => {
    // 计算每个成员卡片的尺寸（利用屏幕宽度，减去边距和间距）
    const cardSize = (SCREEN_WIDTH - 60) / 2; // 每行两个，中间间距20，左右边距共40

    const rows = [];
    for (let i = 0; i < allMembers.length; i += 2) {
      if (i + 1 < allMembers.length) {
        rows.push(
          <View key={`row-${i}`} style={styles.doubleRow}>
            {renderMemberCircle(allMembers[i], cardSize, 'single')}
            {renderMemberCircle(allMembers[i + 1], cardSize, 'single')}
          </View>
        );
      } else {
        rows.push(
          <View key={`row-${i}`} style={styles.singleCenterRow}>
            {renderMemberCircle(allMembers[i], cardSize, 'single')}
          </View>
        );
      }
    }
    return rows;
  };

  // 竖排单列布局：双环结构（内环权益+外环保障+大头像）
  const renderSingleLayout = () => {
    return allMembers.map(member => (
      <View key={`single-${member.id}`} style={styles.singleMemberContainer}>
        {renderMemberCircle(member, SCREEN_WIDTH - 80, 'single')}
      </View>
    ));
  };

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
            <Text style={styles.statValue}>{members.length}</Text>
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
        {/* 布局切换按钮 */}
        <View style={styles.layoutToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, layoutType === 'double' && styles.toggleBtnActive]}
            onPress={() => setLayoutType('double')}>
            <Text style={[styles.toggleBtnText, layoutType === 'double' && styles.toggleBtnTextActive]}>
              双排
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, layoutType === 'single' && styles.toggleBtnActive]}
            onPress={() => setLayoutType('single')}>
            <Text style={[styles.toggleBtnText, layoutType === 'single' && styles.toggleBtnTextActive]}>
              竖排
            </Text>
          </TouchableOpacity>
        </View>

        {/* 根据布局类型渲染 */}
        {layoutType === 'double' ? renderDoubleLayout() : renderSingleLayout()}
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

        {/* 紧凑模式提示 */}
        {compactMode && (
          <View style={styles.compactModeHint}>
            <Text style={styles.compactModeText}>小屏模式 · 显示{Math.min(15, coverages.length)}项核心保障</Text>
          </View>
        )}

        {/* 保障项 - 紧凑模式下限制为15项 */}
        <View style={styles.legendCategory}>
          <Text style={styles.legendCategoryTitle}>
            保障({compactMode ? Math.min(15, coverages.length) + '项' : coverages.length + '项'})
          </Text>
          <View style={styles.legendGrid}>
            {/* 使用category分组，避免硬编码索引 */}
            {['life', 'critical', 'accident', 'medical', 'education', 'special', 'other'].map(category => {
              // 紧凑模式下只取前15项
              const allItems = coverages.filter(c => c.category === category);
              const items = compactMode
                ? allItems.slice(0, Math.ceil(Math.min(15, coverages.length) / 6)) // 均匀分布
                : allItems;
              if (items.length === 0) return null;

              return (
                <View key={category} style={styles.legendGridRow}>
                  {items.map(c => (
                    <View key={c.id} style={styles.legendGridItem}>
                      <View style={[styles.legendDot, {backgroundColor: c.color}]}>
                        <Text style={styles.legendDotText}>{c.shortLabel}</Text>
                      </View>
                      <Text style={styles.legendLabel}>{c.label}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </View>

        {/* 权益项 */}
        <View style={styles.legendCategory}>
          <Text style={styles.legendCategoryTitle}>权益({rights.length}项)</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendGridRow}>
              {rights.map(r => (
                <View key={r.id} style={styles.legendGridItem}>
                  <View style={[styles.legendDot, {backgroundColor: r.color}]}>
                    <Text style={styles.legendDotText}>{r.shortLabel}</Text>
                  </View>
                  <Text style={styles.legendLabel}>{r.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* AI智能总结 */}
      {aiSummary ? (
        <View style={styles.aiSummarySection}>
          <View style={styles.aiSummaryHeader}>
            <Text style={styles.aiSummaryIcon}>🤖</Text>
            <Text style={styles.aiSummaryLabel}>AI智能总结</Text>
          </View>
          <Text style={styles.aiSummaryText}>{aiSummary}</Text>
        </View>
      ) : null}

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
  compactModeHint: {
    backgroundColor: colors.functional.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 8,
  },
  compactModeText: {
    fontSize: 9,
    color: colors.functional.warning,
    fontWeight: '500',
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
    gap: 2,
    width: '23%',
    marginBottom: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendDotText: {
    fontSize: 5,
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

  // 布局切换
  layoutToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#E8E8E8',
    borderRadius: 20,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary[1],
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text[2],
  },
  toggleBtnTextActive: {
    color: '#fff',
  },

  // 双排布局
  doubleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  singleCenterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },

  // 竖排单列布局
  singleMemberContainer: {
    alignItems: 'center',
    marginBottom: 16,
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
  // 未拥有的节点：无阴影，减少渲染开销
  nodeNoShadow: {
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: {width: 0, height: 0},
    shadowColor: 'transparent',
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
  // 竖排模式的大头像（居中）
  centerAvatarLarge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.4,
    shadowRadius: 6,
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
  // 竖排模式的大姓名
  memberNameLarge: {
    bottom: -25,
    fontSize: 14,
    fontWeight: '700',
    width: 100,
  },
  rightsRow: {
    position: 'absolute',
    bottom: 10,
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

  // AI总结
  aiSummarySection: {
    padding: 16,
    backgroundColor: colors.primary[2] + '20',
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiSummaryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  aiSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[1],
  },
  aiSummaryText: {
    fontSize: 11,
    color: colors.text[1],
    lineHeight: 18,
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

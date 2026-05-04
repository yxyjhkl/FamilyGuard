// src/components/family/FamilyTreeGraph.tsx
// 家族组织架构图 - 专业家族谱系风格
import React, {useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {Family, Member} from '../../types';
import {MEMBER_ROLE_LABELS} from '../../types';
import RoleAvatar from '../common/RoleAvatar';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// 成员角色层级
const ROLE_LEVELS = {
  祖辈: 0,
  父辈: 1,
  子辈: 2,
};

// 层级颜色配置
const LEVEL_COLORS = {
  祖辈: {
    bg: '#FFF3E0',
    border: '#FF9800',
    text: '#E65100',
  },
  父辈: {
    bg: '#E3F2FD',
    border: '#2196F3',
    text: '#1565C0',
  },
  子辈: {
    bg: '#E8F5E9',
    border: '#4CAF50',
    text: '#2E7D32',
  },
};

interface MemberCardProps {
  member: Member;
  level: keyof typeof LEVEL_COLORS;
  onPress?: (member: Member) => void;
  isHighlight?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({member, level, onPress, isHighlight}) => {
  const levelConfig = LEVEL_COLORS[level];

  // 计算保障覆盖率
  const coverageCount = useMemo(() => {
    const owned = member.coverage.filter(c => c.hasCoverage).length;
    return {owned, total: member.coverage.length};
  }, [member.coverage]);

  // 计算权益覆盖率
  const rightsCount = useMemo(() => {
    const owned = member.rights?.filter(r => r.hasRight).length ?? 0;
    return {owned, total: member.rights?.length ?? 8};
  }, [member.rights]);

  return (
    <TouchableOpacity
      style={[
        styles.memberCard,
        {
          backgroundColor: levelConfig.bg,
          borderColor: levelConfig.border,
        },
        isHighlight && styles.memberCardHighlight,
      ]}
      onPress={() => onPress?.(member)}
      activeOpacity={0.8}>
      {/* 头像区域 */}
      <View style={[styles.avatarContainer, {backgroundColor: levelConfig.border}]}>
        <RoleAvatar role={member.role} size={36} />
      </View>

      {/* 姓名 */}
      <Text style={[styles.memberName, {color: levelConfig.text}]} numberOfLines={1}>
        {member.name}
      </Text>

      {/* 角色标签 */}
      <View style={[styles.roleTag, {backgroundColor: levelConfig.border + '20'}]}>
        <Text style={[styles.roleTagText, {color: levelConfig.text}]}>
          {MEMBER_ROLE_LABELS[member.role]}
        </Text>
      </View>

      {/* 保障进度 */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <View style={[styles.progressBar, {backgroundColor: '#E0E0E0'}]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: levelConfig.border,
                  width: `${(coverageCount.owned / coverageCount.total) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{coverageCount.owned}</Text>
        </View>
        <Text style={styles.progressLabel}>保障配置</Text>
      </View>
    </TouchableOpacity>
  );
};

interface ConnectionLineProps {
  hasConnection: boolean;
  lineType?: 'vertical' | 'horizontal' | 'bracket';
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({hasConnection, lineType = 'vertical'}) => {
  if (!hasConnection) return null;

  return (
    <View style={styles.connectionContainer}>
      {lineType === 'vertical' && (
        <View style={styles.verticalLine} />
      )}
      {lineType === 'bracket' && (
        <View style={styles.bracketContainer}>
          <View style={styles.verticalLine} />
          <View style={styles.horizontalLine} />
        </View>
      )}
    </View>
  );
};

interface LevelSectionProps {
  level: keyof typeof LEVEL_COLORS;
  members: Member[];
  onMemberPress?: (member: Member) => void;
  showConnection?: boolean;
  connectionType?: 'vertical' | 'bracket';
}

const LevelSection: React.FC<LevelSectionProps> = ({
  level,
  members,
  onMemberPress,
  showConnection = false,
  connectionType = 'vertical',
}) => {
  if (members.length === 0) return null;

  const levelConfig = LEVEL_COLORS[level];

  return (
    <View style={styles.levelSection}>
      {/* 层级标题 */}
      <View style={styles.levelHeader}>
        <View style={[styles.levelBadge, {backgroundColor: levelConfig.border}]}>
          <Text style={styles.levelBadgeText}>{level}</Text>
        </View>
        {members.length > 1 && (
          <View style={[styles.countBadge, {backgroundColor: levelConfig.border + '20'}]}>
            <Text style={[styles.countBadgeText, {color: levelConfig.text}]}>
              {members.length}人
            </Text>
          </View>
        )}
      </View>

      {/* 连接线 */}
      {showConnection && (
        <ConnectionLine hasConnection={true} lineType={connectionType} />
      )}

      {/* 成员卡片 */}
      <View style={[styles.levelContent, members.length === 1 && styles.levelContentSingle]}>
        {members.map((member, index) => (
          <View key={member.id} style={styles.cardWrapper}>
            {index > 0 && members.length > 2 && (
              <View style={styles.cardConnector}>
                <View style={[styles.connectorLine, {backgroundColor: levelConfig.border + '40'}]} />
              </View>
            )}
            <MemberCard member={member} level={level} onPress={onMemberPress} />
          </View>
        ))}
      </View>
    </View>
  );
};

interface FamilyTreeGraphProps {
  family: Family;
  onMemberPress?: (member: Member) => void;
}

const FamilyTreeGraph: React.FC<FamilyTreeGraphProps> = ({family, onMemberPress}) => {
  // 按层级分组成员
  const membersByLevel = useMemo(() => {
    const levels: {[key in keyof typeof ROLE_LEVELS]: Member[]} = {
      祖辈: [],
      父辈: [],
      子辈: [],
    };

    family.members.forEach(member => {
      const role = MEMBER_ROLE_LABELS[member.role];

      if (['爷爷', '奶奶', '外公', '外婆'].includes(role)) {
        levels.祖辈.push(member);
      } else if (['父亲', '母亲', '丈夫', '妻子'].includes(role)) {
        levels.父辈.push(member);
      } else if (['儿子', '女儿'].includes(role)) {
        levels.子辈.push(member);
      } else {
        levels.父辈.push(member);
      }
    });

    return levels;
  }, [family.members]);

  // 判断层级是否有成员
  const hasUpper = membersByLevel.祖辈.length > 0;
  const hasMiddle = membersByLevel.父辈.length > 0;
  const hasLower = membersByLevel.子辈.length > 0;

  // 计算整体统计
  const totalStats = useMemo(() => {
    let ownedCoverage = 0;
    let ownedRights = 0;
    let totalCoverage = 0;
    const rightsCount = 8; // 权益项数量
    
    // 男性角色列表（不计入孕妇保障）
    const maleRoles = ['father', 'husband', 'son', 'grandfather', 'other'];

    family.members.forEach(member => {
      const isMale = maleRoles.includes(member.role);
      // 根据性别计算有效保障项数量（男性不含孕妇保障）
      const effectiveCoverageCount = isMale ? 18 : 19;
      totalCoverage += effectiveCoverageCount;
      
      // 统计已有保障（剔除男性的孕妇保障）
      ownedCoverage += member.coverage.filter(c => {
        if (!c.hasCoverage) return false;
        // 男性不计入孕妇保障
        return !(isMale && c.id === 'maternity');
      }).length;
      
      ownedRights += member.rights?.filter(r => r.hasRight).length ?? 0;
    });

    return {
      coverageRate: totalCoverage > 0 ? Math.round((ownedCoverage / totalCoverage) * 100) : 0,
      rightsRate: family.members.length * rightsCount > 0 
        ? Math.round((ownedRights / (family.members.length * rightsCount)) * 100) 
        : 0,
    };
  }, [family]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* 家族标题卡片 */}
      <View style={styles.familyHeader}>
        <View style={styles.familyTitleRow}>
          <Text style={styles.familyIcon}>👨‍👩‍👧‍👦</Text>
          <View style={styles.familyTitleText}>
            <Text style={styles.familyName}>{family.name}</Text>
            <Text style={styles.familyStructure}>{family.structureLabel}</Text>
          </View>
        </View>

        {/* 统计概览 */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{family.members.length}</Text>
            <Text style={styles.statLabel}>家庭成员</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.functional.success}]}>
              {totalStats.coverageRate}%
            </Text>
            <Text style={styles.statLabel}>保障完善度</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.primary[1]}]}>
              {totalStats.rightsRate}%
            </Text>
            <Text style={styles.statLabel}>权益覆盖率</Text>
          </View>
        </View>
      </View>

      {/* 家族树状结构 */}
      <View style={styles.treeContainer}>
        {/* 第一层：祖辈 */}
        <LevelSection
          level="祖辈"
          members={membersByLevel.祖辈}
          onMemberPress={onMemberPress}
          showConnection={hasUpper && hasMiddle}
          connectionType="bracket"
        />

        {/* 连接线：祖辈 -> 父辈 */}
        {hasUpper && hasMiddle && (
          <View style={styles.levelConnector}>
            <View style={styles.connectorVertical} />
            <View style={styles.connectorBranch} />
          </View>
        )}

        {/* 第二层：父辈 */}
        <LevelSection
          level="父辈"
          members={membersByLevel.父辈}
          onMemberPress={onMemberPress}
          showConnection={(hasUpper && hasMiddle) || (hasMiddle && hasLower)}
          connectionType="vertical"
        />

        {/* 连接线：父辈 -> 子辈 */}
        {hasMiddle && hasLower && (
          <View style={styles.levelConnector}>
            <View style={styles.connectorVertical} />
            <View style={styles.connectorBranch} />
          </View>
        )}

        {/* 第三层：子辈 */}
        <LevelSection
          level="子辈"
          members={membersByLevel.子辈}
          onMemberPress={onMemberPress}
          showConnection={hasMiddle && hasLower}
          connectionType="bracket"
        />
      </View>

      {/* 图例说明 */}
      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>图例说明</Text>
        <View style={styles.legendGrid}>
          {Object.entries(LEVEL_COLORS).map(([level, config]) => (
            <View key={level} style={styles.legendItem}>
              <View style={[styles.legendBadge, {backgroundColor: config.border}]}>
                <Text style={styles.legendBadgeText}>{level}</Text>
              </View>
              <Text style={styles.legendDesc}>
                {level === '祖辈' && '爷爷奶奶、外公外婆'}
                {level === '父辈' && '父亲、母亲、丈夫、妻子'}
                {level === '子辈' && '儿子、女儿'}
              </Text>
            </View>
          ))}
        </View>

        {/* 进度条说明 */}
        <View style={styles.legendProgress}>
          <View style={styles.legendProgressItem}>
            <View style={styles.legendProgressBar}>
              <View style={[styles.legendProgressFill, {backgroundColor: '#4CAF50'}]} />
            </View>
            <Text style={styles.legendProgressText}>进度条表示保障配置完善程度</Text>
          </View>
        </View>
      </View>

      {/* 操作提示 */}
      <View style={styles.hintCard}>
        <Text style={styles.hintIcon}>💡</Text>
        <Text style={styles.hintText}>点击成员卡片查看详情或切换到「双圈编辑」模式进行配置</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 120,
  },

  // 家族标题卡片
  familyHeader: {
    backgroundColor: colors.primary[0],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    elevation: 4,
    shadowColor: colors.primary[0],
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  familyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  familyIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  familyTitleText: {
    flex: 1,
  },
  familyName: {
    ...typography.heading,
    color: colors.text[0],
  },
  familyStructure: {
    ...typography.caption,
    color: colors.text[2],
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.heading,
    color: colors.primary[1],
  },
  statLabel: {
    ...typography.caption,
    color: colors.text[2],
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.card.border,
    marginVertical: spacing.xs,
  },

  // 树状结构容器
  treeContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  // 层级区域
  levelSection: {
    alignItems: 'center',
    width: '100%',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  levelBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  levelBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text[3],
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // 连接线
  connectionContainer: {
    alignItems: 'center',
  },
  verticalLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.card.border,
  },
  bracketContainer: {
    alignItems: 'center',
  },
  horizontalLine: {
    height: 2,
    width: 40,
    backgroundColor: colors.card.border,
  },
  levelConnector: {
    alignItems: 'center',
  },
  connectorVertical: {
    width: 2,
    height: 20,
    backgroundColor: colors.card.border,
  },
  connectorBranch: {
    height: 0,
    borderTopWidth: 2,
    borderTopColor: colors.card.border,
    width: '50%',
  },

  // 层级内容
  levelContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  levelContentSingle: {
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  cardConnector: {
    position: 'absolute',
    top: '50%',
    width: 20,
    alignItems: 'center',
  },
  connectorLine: {
    width: 20,
    height: 2,
  },

  // 成员卡片
  memberCard: {
    width: 100,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  memberCardHighlight: {
    borderWidth: 3,
    elevation: 4,
    transform: [{scale: 1.05}],
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  memberName: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  roleTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
    marginTop: spacing.xs,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '600',
  },
  progressSection: {
    width: '100%',
    marginTop: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text[1],
    width: 16,
    textAlign: 'right',
  },
  progressLabel: {
    fontSize: 8,
    color: colors.text[2],
    marginTop: 2,
    textAlign: 'center',
  },

  // 图例卡片
  legendCard: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  legendTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text[0],
    marginBottom: spacing.md,
  },
  legendGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  legendBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text[3],
  },
  legendDesc: {
    ...typography.caption,
    color: colors.text[2],
  },
  legendProgress: {
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
    paddingTop: spacing.md,
  },
  legendProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendProgressBar: {
    width: 40,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  legendProgressFill: {
    height: '100%',
    width: '60%',
    borderRadius: 3,
  },
  legendProgressText: {
    ...typography.caption,
    color: colors.text[2],
    flex: 1,
  },

  // 提示卡片
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[0] + '60',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  hintIcon: {
    fontSize: 18,
  },
  hintText: {
    ...typography.caption,
    color: colors.text[1],
    flex: 1,
    lineHeight: 18,
  },
});

export default FamilyTreeGraph;

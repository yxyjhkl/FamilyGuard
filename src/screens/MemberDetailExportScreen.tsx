// src/screens/MemberDetailExportScreen.tsx
// 成员保障权益详情导出页面 - 支持三指下滑截图
import React, {useMemo, useCallback, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import {MEMBER_ROLE_LABELS} from '../types';
import {useFamily} from '../hooks/useFamily';
import {useExport} from '../hooks/useExport';
import {exportService} from '../services/exportService';
import RoleAvatar from '../components/common/RoleAvatar';
import {insuranceRights} from '../data/insuranceRights';
import {INSURANCE_COVERAGES} from '../constants/insurance';
import {colors, spacing, borderRadius} from '../theme';
import {maskName} from '../utils/privacyUtils';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'MemberDetailExport'>;

// 状态颜色
const STATUS_COLORS = {
  none: '#E8E8E8',
  owned: '#34C759',
  claimed: '#E74C3C',
};

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
const getMemberAvatarColor = (role: string) => {
  const roleLabel = MEMBER_ROLE_LABELS[role as keyof typeof MEMBER_ROLE_LABELS];
  if (roleLabel === '父亲' || roleLabel === '丈夫') return colors.primary[1];
  if (roleLabel === '母亲' || roleLabel === '妻子') return '#E91E63';
  if (['爷爷', '奶奶', '外公', '外婆'].includes(roleLabel || '')) return '#FF9800';
  if (roleLabel === '儿子') return '#3498DB';
  if (roleLabel === '女儿') return '#9B59B6';
  return colors.functional.info;
};

// 圆圈节点组件
interface CircleNodeProps {
  label: string;
  status: 'none' | 'owned' | 'claimed';
  color: string;
  size?: number;
}

const CircleNode: React.FC<CircleNodeProps> = ({label, status, color, size = 36}) => {
  const backgroundColor = status === 'none' ? STATUS_COLORS.none : color;
  const borderColor = status === 'none' ? '#D0D0D0' : color;

  return (
    <View
      style={[
        styles.circleNode,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor,
          borderWidth: status === 'none' ? 1 : 0,
        },
      ]}>
      <Text
        style={[
          styles.circleNodeText,
          {color: status === 'owned' ? '#fff' : '#888'},
        ]}>
        {label}
      </Text>
    </View>
  );
};

const MemberDetailExportScreen: React.FC<Props> = ({route, navigation}) => {
  const {familyId, memberId} = route.params;
  const {getFamilyById} = useFamily();
  const {startExport, finishExport} = useExport();
  const viewShotRef = useRef<ViewShot>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hideName, setHideName] = useState(false); // 隐私模式

  const family = useMemo(() => getFamilyById(familyId), [familyId, getFamilyById]);
  const member = useMemo(() => {
    if (!family) return null;
    return family.members.find(m => m.id === memberId) || null;
  }, [family, memberId]);

  // 从 member.coverage 数组获取保障状态（与 ExportOrgChartCard 保持一致）
  const memberCoverageMap = useMemo(() => {
    if (!member) return {};
    const map: {[key: string]: {hasCoverage: boolean; coverageAmount?: number}} = {};
    member.coverage.forEach(c => {
      map[c.type] = {hasCoverage: c.hasCoverage, coverageAmount: c.coverageAmount};
    });
    return map;
  }, [member]);

  // 从 member.rights 数组获取权益状态
  const memberRightsMap = useMemo(() => {
    if (!member) return {};
    const map: {[key: string]: {hasRight: boolean; validityDate?: string}} = {};
    member.rights.forEach(r => {
      map[r.type] = {hasRight: r.hasRight, validityDate: r.validityDate};
    });
    return map;
  }, [member]);

  // 三指下滑截图提示
  const [showHint, setShowHint] = useState(true);

  // 统计
  const stats = useMemo(() => {
    if (!member) return {owned: 0, total: 0};
    let owned = 0;
    const total = INSURANCE_COVERAGES.length + insuranceRights.length;
    // 从 coverage 数组统计已有保障
    member.coverage.forEach(c => {
      if (c.hasCoverage) owned++;
    });
    return {owned, total};
  }, [member]);

  // 返回
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 保存到相册
  const handleSaveToAlbum = useCallback(async () => {
    if (!viewShotRef.current) {
      Alert.alert('提示', '请稍后重试');
      return;
    }

    if (isExporting) return;
    setIsExporting(true);
    startExport();

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const uri = await viewShotRef.current.capture?.();
      if (!uri) {
        Alert.alert('错误', '截图失败，请重试');
        finishExport('', false);
        return;
      }

      const success = await exportService.saveToAlbum(uri);
      if (success) {
        Alert.alert('成功', '已保存到相册');
      }
      finishExport(uri, success);
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('错误', '保存失败，请重试');
      finishExport('', false);
    } finally {
      setIsExporting(false);
    }
  }, [startExport, finishExport, isExporting]);

  // 分享
  const handleShare = useCallback(async () => {
    if (!viewShotRef.current) {
      Alert.alert('提示', '请稍后重试');
      return;
    }

    if (isExporting) return;
    setIsExporting(true);
    startExport();

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const uri = await viewShotRef.current.capture?.();
      if (!uri) {
        Alert.alert('错误', '截图失败，请重试');
        finishExport('', false);
        return;
      }

      await exportService.shareToWeChat(uri);
      finishExport(uri, true);
    } catch (error) {
      console.error('分享失败:', error);
      Alert.alert('错误', '分享失败，请重试');
      finishExport('', false);
    } finally {
      setIsExporting(false);
    }
  }, [startExport, finishExport, isExporting]);

  if (!family || !member) {
    return (
      <View style={styles.container}>
        <View style={styles.error}>
          <Text style={styles.errorText}>未找到成员数据</Text>
        </View>
      </View>
    );
  }

  const memberColor = getMemberAvatarColor(member.role);
  const circleSize = 280;
  const radius = 120;
  const nodeSize = 36;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>个人保障详情</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.actionBtn, hideName && styles.actionBtnActive]}
            onPress={() => setHideName(!hideName)}
            activeOpacity={0.7}>
            <Text style={[styles.actionText, hideName && styles.actionTextActive]}>🔒</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
            <Text style={styles.actionText}>分享</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 三指下滑提示 */}
      {showHint && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>👇 三指下滑可快速截图</Text>
          <TouchableOpacity onPress={() => setShowHint(false)}>
            <Text style={styles.hintClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <ViewShot
        ref={viewShotRef}
        style={styles.viewShot}
        options={{format: 'jpg', quality: 0.9 }}>
        <View style={styles.card}>
          {/* 顶部标题 */}
          <View style={styles.headerSection}>
            <View style={[styles.avatarCircle, {backgroundColor: memberColor}]}>
              <RoleAvatar role={member.role} size={56} />
            </View>
            <Text style={styles.memberName}>{maskName(member.name, !hideName)}</Text>
            <Text style={styles.memberRole}>{MEMBER_ROLE_LABELS[member.role]}</Text>
            
            {/* 统计 */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.owned}</Text>
                <Text style={styles.statLabel}>已有保障</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, {color: '#E74C3C'}]}>{stats.total - stats.owned}</Text>
                <Text style={styles.statLabel}>待完善</Text>
              </View>
            </View>
          </View>

          {/* 保障圈 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>保障配置（19项）</Text>
            <View style={[styles.coverageCircle, {width: circleSize, height: circleSize}]}>
              {INSURANCE_COVERAGES.map((coverage, index) => {
                const pos = getPositionOnCircle(index, INSURANCE_COVERAGES.length, radius);
                // 从 memberCoverageMap 获取状态（与 ExportOrgChartCard 一致）
                const coverageInfo = memberCoverageMap[coverage.type];
                const status = coverageInfo?.hasCoverage ? 'owned' : 'none';

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
                    />
                    {coverageInfo?.coverageAmount ? (
                      <Text style={styles.amountText}>
                        {coverageInfo.coverageAmount}万
                      </Text>
                    ) : null}
                  </View>
                );
              })}
              {/* 中心头像 */}
              <View style={[styles.centerAvatar, {backgroundColor: memberColor}]}>
                <RoleAvatar role={member.role} size={40} />
              </View>
            </View>
          </View>

          {/* 权益 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>权益服务（8项）</Text>
            <View style={styles.rightsGrid}>
              {insuranceRights.map(right => {
                // 从 memberRightsMap 获取状态
                const rightsInfo = memberRightsMap[right.type];
                const status = rightsInfo?.hasRight ? 'owned' : 'none';

                return (
                  <View key={right.type} style={styles.rightItem}>
                    <View
                      style={[
                        styles.rightDot,
                        {
                          backgroundColor: status === 'none' ? STATUS_COLORS.none : right.color,
                          borderColor: status === 'none' ? '#D0D0D0' : right.color,
                          borderWidth: status === 'none' ? 1 : 0,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.rightDotText,
                          {color: status === 'owned' ? '#fff' : '#888'},
                        ]}>
                        {right.shortLabel}
                      </Text>
                    </View>
                    <Text style={styles.rightLabel}>{right.fullLabel}</Text>
                    {rightsInfo?.validityDate ? (
                      <Text style={styles.rightDate}>
                        有效期: {rightsInfo.validityDate}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          {/* 图例 */}
          <View style={styles.legendSection}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: STATUS_COLORS.owned}]} />
                <Text style={styles.legendText}>已有</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: STATUS_COLORS.none}]} />
                <Text style={styles.legendText}>未有</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: STATUS_COLORS.claimed}]} />
                <Text style={styles.legendText}>理赔</Text>
              </View>
            </View>
          </View>

          {/* 底部 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              ✦ {family.name} · 家庭保障检视 ✦
            </Text>
          </View>
        </View>
      </ViewShot>

      {/* 底部按钮 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveToAlbum} activeOpacity={0.7}>
          {isExporting ? (
            <ActivityIndicator size="small" color={colors.primary[1]} />
          ) : (
            <>
              <Text style={styles.saveIcon}>💾</Text>
              <Text style={styles.saveText}>保存到相册</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 20,
    color: colors.primary[1],
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text[0],
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  actionText: {
    fontSize: 14,
    color: colors.primary[1],
    fontWeight: '500',
  },
  actionBtnActive: {
    backgroundColor: colors.primary[1] + '20',
  },
  actionTextActive: {
    color: colors.primary[1],
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.functional.gold + '20',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  hintText: {
    fontSize: 12,
    color: colors.functional.gold,
  },
  hintClose: {
    fontSize: 12,
    color: colors.text[2],
  },
  viewShot: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: spacing.md,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary[0],
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  memberName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text[0],
    marginTop: spacing.sm,
  },
  memberRole: {
    fontSize: 12,
    color: colors.text[2],
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[1],
  },
  statLabel: {
    fontSize: 10,
    color: colors.text[2],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.card.border,
    marginHorizontal: spacing.md,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text[1],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  coverageCircle: {
    position: 'relative',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  circleNode: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleNodeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  amountText: {
    position: 'absolute',
    bottom: -10,
    fontSize: 8,
    color: colors.text[2],
  },
  centerAvatar: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  rightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  rightItem: {
    alignItems: 'center',
    width: '22%',
    marginBottom: spacing.sm,
  },
  rightDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightDotText: {
    fontSize: 9,
    fontWeight: '700',
  },
  rightLabel: {
    fontSize: 9,
    color: colors.text[2],
    marginTop: 4,
    textAlign: 'center',
  },
  rightDate: {
    fontSize: 7,
    color: colors.functional.info,
    marginTop: 2,
  },
  legendSection: {
    padding: spacing.sm,
    backgroundColor: colors.background[0],
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 10,
    color: colors.text[2],
  },
  footer: {
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primary[0],
  },
  footerText: {
    fontSize: 10,
    color: colors.text[2],
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.background[1],
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[1],
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  saveIcon: {
    fontSize: 16,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text[3],
  },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.text[2],
  },
});

export default MemberDetailExportScreen;

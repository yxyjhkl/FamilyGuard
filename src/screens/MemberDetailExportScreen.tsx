// src/screens/MemberDetailExportScreen.tsx
// 成员保障权益详情导出页面 - 支持三指下滑截图
import React, {useMemo, useCallback, useRef, useState, useEffect, memo} from 'react';
import {logger} from '../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  PanResponder,
  Animated,
} from 'react-native';
import Svg, {Circle as SvgCircle, Path} from 'react-native-svg';
import logoImage from '../assets/images/logo.jpg';
import ViewShot from 'react-native-view-shot';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList, MemberStatus} from '../types';
import {MEMBER_ROLE_LABELS} from '../types';
import {useFamily} from '../hooks/useFamily';
import {useExport} from '../hooks/useExport';
import {exportService} from '../services/exportService';
import RoleAvatar from '../components/common/RoleAvatar';
import {colors, spacing, borderRadius} from '../theme';
import {maskName} from '../utils/privacyUtils';
import {useSettings} from '../store/settingsStore';
import {DEFAULT_COVERAGES} from '../data/defaultCoverages';
import {QUICK_COVERAGES} from '../data/quickCoverages';
import {DEFAULT_RIGHTS} from '../data/defaultRights';

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

// 颜色淡化工具：将 hex 颜色与白色混合，返回同色系浅色
const lightenColor = (hex: string, factor: number = 0.65): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
};

// 饼图百分比保障节点组件（SVG扇形填充）
interface PieCircleNodeProps {
  label: string;
  status: 'none' | 'owned' | 'claimed';
  color: string;
  size?: number;
  fillRatio?: number; // 0~1，已有保额/推荐保额
  onLongPress?: () => void; // 长按回调（已有保障时触发）
}

const PieCircleNode: React.FC<PieCircleNodeProps> = memo(({
  label,
  status,
  color,
  size = 44,
  fillRatio = 0,
  onLongPress,
}) => {
  const svgSize = size;
  const center = svgSize / 2;
  const r = center - 2; // 留2px边距

  // 计算扇形Path（从顶部12点方向顺时针填充）
  const getPiePath = (ratio: number): string => {
    if (ratio <= 0) return '';
    if (ratio >= 1) {
      // 满圆
      return [
        `M ${center} ${center - r}`,
        `A ${r} ${r} 0 1 1 ${center} ${center + r}`,
        `A ${r} ${r} 0 1 1 ${center} ${center - r}`,
        'Z',
      ].join(' ');
    }
    // 从顶部顺时针：起点(center, center-r)，按ratio计算终点
    const angle = ratio * 2 * Math.PI - Math.PI / 2;
    const endX = center + r * Math.cos(angle);
    const endY = center + r * Math.sin(angle);
    const largeArc = ratio > 0.5 ? 1 : 0;
    return [
      `M ${center} ${center - r}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`,
      `L ${center} ${center}`,
      'Z',
    ].join(' ');
  };

  const fillColor = status === 'claimed' ? '#E74C3C' : (status === 'owned' ? color : STATUS_COLORS.none);
  const strokeColor = status === 'none' ? '#D0D0D0' : fillColor;
  const textColor = status === 'owned' || status === 'claimed' ? '#fff' : '#888';
  // 可交互：有保障（owned或claimed）时允许长按
  const interactive = status === 'owned' || status === 'claimed';

  return (
    <TouchableOpacity
      style={[styles.pieNodeWrapper, {width: size, height: size}]}
      onLongPress={interactive ? onLongPress : undefined}
      activeOpacity={interactive ? 0.7 : 1}
      disabled={!interactive}
    >
      <Svg width={svgSize} height={svgSize}>
        {/* 底色圆：none灰色 / owned浅色填满整圆 / claimed白色 */}
        <SvgCircle
          cx={center}
          cy={center}
          r={r}
          fill={status === 'none' ? STATUS_COLORS.none : (status === 'owned' ? lightenColor(color) : '#FFF')}
          stroke={strokeColor}
          strokeWidth={status === 'none' ? 1 : 0}
        />
        {/* 扇形填充（owned状态） */}
        {status === 'owned' && fillRatio > 0 && (
          <Path d={getPiePath(fillRatio)} fill={color} />
        )}
        {/* claimed状态全红 */}
        {status === 'claimed' && (
          <SvgCircle cx={center} cy={center} r={r} fill="#E74C3C" />
        )}
      </Svg>
      {/* 标签文字覆盖在SVG上方 */}
      <Text style={[styles.pieNodeText, {color: textColor, fontSize: Math.max(size * 0.27, 10)}]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const MemberDetailExportScreen: React.FC<Props> = ({route, navigation}) => {
  const {familyId, memberId, mode} = route.params;
  const {getFamilyById, updateMember} = useFamily();
  const {startExport, finishExport} = useExport();
  const viewShotRef = useRef<ViewShot>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hideName, setHideName] = useState(false); // 隐私模式

  // 本地理赔状态（初始值从 store 的 member 读取，支持用户长按切换并写回 store）
  const [localClaimedItems, setLocalClaimedItems] = useState<string[]>([]);

  // 彩蛋：浮动祝福语
  interface FloatingWord {
    id: string;
    text: string;
    color: string;
    x: number;
    y: number;
    animOpacity: Animated.Value;
    animTranslateY: Animated.Value;
  }
  const [floatingWords, setFloatingWords] = useState<FloatingWord[]>([]);

  // 彩蛋祝福语池 & 闪光颜色池
  const EASTER_PHRASES = useRef([
    '平安喜乐', '万事如意', '同心致远', '守望相伴', '富贵安康', '福泽绵长', '招财纳福',
  ]).current;
  const EASTER_COLORS = useRef([
    '#FFD700', '#FF6B9D', '#00E5FF', '#FF8C42', '#C084FC', '#FF3366', '#00FF88', '#FFAA00',
  ]).current;

  // 从设置中获取动态保障和权益配置
  const {state: {customCoverages, customRights}} = useSettings();
  // 根据模式选择对应的保障配置：快速版强制用 QUICK_COVERAGES，精细版用自定义或默认
  const baseCoverages = mode === 'quick' ? QUICK_COVERAGES : (Array.isArray(customCoverages) && customCoverages.length > 0 ? customCoverages : DEFAULT_COVERAGES);
  const rights = Array.isArray(customRights) && customRights.length > 0 ? customRights : DEFAULT_RIGHTS;

  // 子女角色专属保障项ID（成人不显示教育金、学平险）
  const childSpecificIds = ['education', 'schoolAccident'];

  const family = useMemo(() => getFamilyById(familyId), [familyId, getFamilyById]);
  const member = useMemo(() => {
    if (!family) return null;
    return family.members.find(m => m.id === memberId) || null;
  }, [family, memberId]);

  // 是否子女角色（仅子女显示教育金、学平险）
  const isChild = member ? ['son', 'daughter'].includes(member.role) : false;
  const displayCoverages = isChild ? baseCoverages : baseCoverages.filter(c => !childSpecificIds.includes(c.id));

  // 从 member.coverage 数组获取保障状态（与 ExportOrgChartCard 保持一致）
  const memberCoverageMap = useMemo(() => {
    if (!member) return {};
    const map: {[key: string]: {hasCoverage: boolean; coverageAmount?: number}} = {};
    member.coverage.forEach(c => {
      map[c.id] = {hasCoverage: c.hasCoverage, coverageAmount: c.coverageAmount};
    });
    return map;
  }, [member]);

  // 从 member.rights 数组获取权益状态
  const memberRightsMap = useMemo(() => {
    if (!member) return {};
    const map: {[key: string]: {hasRight: boolean; validityDate?: string}} = {};
    member.rights.forEach(r => {
      map[r.id] = {hasRight: r.hasRight, validityDate: r.validityDate};
    });
    return map;
  }, [member]);

  // 已理赔项集合（优先使用本地状态，允许用户长按切换）
  const claimedItemsSet = useMemo(() => {
    return new Set(localClaimedItems);
  }, [localClaimedItems]);

  // member 变化时同步 claimedItems 到本地（来自 store 持久化数据）
  useEffect(() => {
    if (member?.claimedItems) {
      setLocalClaimedItems(member.claimedItems);
    } else {
      setLocalClaimedItems([]);
    }
  }, [member]);

  // 长按切换理赔状态（同时持久化到 store）
  const toggleClaimed = useCallback((id: string, currentStatus: 'none' | 'owned' | 'claimed', label: string) => {
    if (currentStatus === 'none') return; // 未有保障不能标记理赔
    const isClaimed = localClaimedItems.includes(id);
    if (isClaimed) {
      // 已是理赔 → 弹窗确认取消
      Alert.alert('取消理赔', `确定要取消"${label}"的理赔标记吗？`, [
        {text: '取消', style: 'cancel'},
        {
          text: '确认',
          style: 'destructive',
          onPress: () => {
            const newClaimed = localClaimedItems.filter(i => i !== id);
            setLocalClaimedItems(newClaimed);
            if (member) {
              updateMember(familyId, {...member, claimedItems: newClaimed});
            }
          },
        },
      ]);
    } else {
      // 已有 → 标记为理赔
      Alert.alert('标记理赔', `将"${label}"标记为已理赔？`, [
        {text: '取消', style: 'cancel'},
        {
          text: '确认',
          style: 'destructive',
          onPress: () => {
            const newClaimed = [...localClaimedItems, id];
            setLocalClaimedItems(newClaimed);
            if (member) {
              updateMember(familyId, {...member, claimedItems: newClaimed});
            }
          },
        },
      ]);
    }
  }, [localClaimedItems, familyId, member, updateMember]);

  // 统计
  const stats = useMemo(() => {
    if (!member) return {owned: 0, total: 0};
    let owned = 0;
    const total = displayCoverages.length + rights.length;
    // 从 coverage 数组统计已有保障
    member.coverage.forEach(c => {
      if (c.hasCoverage) {
        // 成人不计入教育金、学平险
        if (!isChild && childSpecificIds.includes(c.id)) return;
        owned++;
      }
    });
    return {owned, total};
  }, [member, displayCoverages, rights, isChild]);

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
      logger.error('MemberDetailExport', '保存失败', error);
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
      logger.error('MemberDetailExport', '分享失败', error);
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
  const radius = 115;
  const nodeSize = 44;

  // ========== 旋转彩蛋：弧线手势让节点行星般转动 ==========
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const lastAngle = useRef(0);
  const lastTime = useRef(0);
  const velocityRef = useRef(0);
  // 连续旋转追踪（2秒窗口内累计3圈触发祝福语）
  const spinCountRef = useRef(0);
  const lastSpinTimeRef = useRef(0);
  const totalGestureRotationRef = useRef(0);

  // 旋转角度转deg，供 Animated.View transform 使用
  const rotateDeg = rotationAnim.interpolate({
    inputRange: [-Math.PI * 4, Math.PI * 4],
    outputRange: ['-720deg', '720deg'],
    extrapolate: 'extend',
  });

  // 触发祝福语飘浮动画
  const triggerEasterEgg = useCallback(() => {
    const wordCount = 4;
    const shuffled = [...EASTER_PHRASES].sort(() => Math.random() - 0.5);
    const selectedPhrases = shuffled.slice(0, wordCount);

    const newWords: FloatingWord[] = selectedPhrases.map((text, i) => ({
      id: `fw_${Date.now()}_${i}`,
      text,
      color: EASTER_COLORS[Math.floor(Math.random() * EASTER_COLORS.length)],
      x: (Math.random() - 0.5) * 220,
      y: (Math.random() - 0.5) * 80 - 30,
      animOpacity: new Animated.Value(0),
      animTranslateY: new Animated.Value(0),
    }));

    setFloatingWords(newWords);

    const animations = newWords.map(word =>
      Animated.sequence([
        // 淡入
        Animated.timing(word.animOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // 保持 + 上飘 + 淡出
        Animated.parallel([
          Animated.timing(word.animOpacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(word.animTranslateY, {
            toValue: -100,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    Animated.parallel(animations).start(() => {
      setFloatingWords([]);
    });
  }, [EASTER_PHRASES, EASTER_COLORS]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
      onPanResponderGrant: (evt) => {
        const cx = circleSize / 2;
        const cy = circleSize / 2;
        lastAngle.current = Math.atan2(
          evt.nativeEvent.locationY - cy,
          evt.nativeEvent.locationX - cx,
        );
        lastTime.current = Date.now();
        velocityRef.current = 0;
        totalGestureRotationRef.current = 0;
        rotationAnim.stopAnimation();
      },
      onPanResponderMove: (evt) => {
        const cx = circleSize / 2;
        const cy = circleSize / 2;
        const angle = Math.atan2(
          evt.nativeEvent.locationY - cy,
          evt.nativeEvent.locationX - cx,
        );
        let delta = angle - lastAngle.current;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        totalGestureRotationRef.current += Math.abs(delta);
        lastAngle.current = angle;

        const now = Date.now();
        const timeDelta = now - lastTime.current;
        if (timeDelta > 0) velocityRef.current = delta * 1000 / timeDelta;
        lastTime.current = now;

        const cur = (rotationAnim as any)._value;
        rotationAnim.setValue(cur + delta);
      },
      onPanResponderRelease: () => {
        // 连续旋转次数追踪（2秒窗口内累计3圈触发祝福语）
        if (totalGestureRotationRef.current >= Math.PI * 2) {
          const now = Date.now();
          if (now - lastSpinTimeRef.current < 2000) {
            spinCountRef.current += 1;
          } else {
            spinCountRef.current = 1;
          }
          lastSpinTimeRef.current = now;
          if (spinCountRef.current >= 3) {
            spinCountRef.current = 0;
            triggerEasterEgg();
          }
        }

        const vel = Math.abs(velocityRef.current) > 0.05 ? velocityRef.current : 0;
        if (vel !== 0) {
          Animated.decay(rotationAnim, {
            velocity: vel * 1.3,
            deceleration: 0.92,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;
  // ========== 旋转彩蛋结束 ==========

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

      <ViewShot
        ref={viewShotRef}
        style={styles.viewShot}
        options={{format: 'jpg', quality: 0.9 }}>
        <View style={styles.card}>
          {/* 顶部标题 */}
          <ImageBackground source={logoImage} style={styles.headerSection} resizeMode="cover">
            <View style={[styles.avatarCircle, {backgroundColor: memberColor}]}>
              <RoleAvatar role={member.role} size={40} />
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
          </ImageBackground>

          {/* 保障圈 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>保障配置（{displayCoverages.length}项）</Text>
            <View
              style={[styles.coverageCircle, {width: circleSize, height: circleSize}]}
              {...panResponder.panHandlers}>
              {/* 旋转容器：圆环 + 节点一起旋转 */}
              <Animated.View
                style={[
                  styles.rotateLayer,
                  {
                    width: circleSize,
                    height: circleSize,
                    transform: [{rotate: rotateDeg}],
                  },
                ]}>
                {/* 虚线圆环串联8个节点 */}
                <View
                  style={[
                    styles.ringLine,
                    {
                      width: radius * 2,
                      height: radius * 2,
                      borderRadius: radius,
                      top: (circleSize - radius * 2) / 2,
                      left: (circleSize - radius * 2) / 2,
                    },
                  ]}
                />
                {displayCoverages.map((coverage, index) => {
                  const pos = getPositionOnCircle(index, displayCoverages.length, radius);
                  const coverageInfo = memberCoverageMap[coverage.id];
                  const status: MemberStatus = claimedItemsSet.has(coverage.id)
                    ? 'claimed'
                    : (coverageInfo?.hasCoverage ? 'owned' : 'none');
                  const fillRatio = status === 'owned'
                    ? Math.min(1, (coverageInfo?.coverageAmount ?? 0) / (coverage.recommendedAmount || 1))
                    : 0;

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
                      <PieCircleNode
                        label={coverage.shortLabel}
                        status={status}
                        color={coverage.color}
                        size={nodeSize}
                        fillRatio={fillRatio}
                        onLongPress={() => toggleClaimed(coverage.id, status, coverage.label || coverage.shortLabel)}
                      />
                      {coverageInfo?.coverageAmount ? (
                        <Text style={styles.amountText}>
                          {coverageInfo.coverageAmount}万
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </Animated.View>

              {/* 中心头像 — 不旋转，始终静止 */}
              <View style={[styles.centerAvatar, {backgroundColor: memberColor}]}>
                <RoleAvatar role={member.role} size={72} />
              </View>

              {/* 彩蛋：漂浮祝福语 */}
              {floatingWords.map(word => (
                <Animated.Text
                  key={word.id}
                  style={[
                    styles.floatingWord,
                    {
                      color: word.color,
                      left: circleSize / 2 + word.x,
                      top: circleSize / 2 + word.y,
                      opacity: word.animOpacity,
                      transform: [{translateY: word.animTranslateY}],
                      textShadowColor: word.color,
                      textShadowOffset: {width: 0, height: 0},
                      textShadowRadius: 10,
                    },
                  ]}>
                  {word.text}
                </Animated.Text>
              ))}
            </View>
          </View>

          {/* 权益 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>权益服务（{rights.length}项）</Text>
            <View style={styles.rightsGrid}>
              {rights.map(right => {
                // 从 memberRightsMap 获取状态
                const rightsInfo = memberRightsMap[right.id];
                const status: MemberStatus = claimedItemsSet.has(right.id)
                  ? 'claimed'
                  : (rightsInfo?.hasRight ? 'owned' : 'none');

                return (
                  <View key={right.id} style={styles.rightItem}>
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
                    <Text style={styles.rightLabel}>{right.label}</Text>
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
    minHeight: 600, // 确保8项权益都能显示
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[0],
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text[0],
    marginTop: spacing.xs,
  },
  memberRole: {
    fontSize: 11,
    color: colors.text[2],
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
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
    padding: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text[1],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  coverageCircle: {
    position: 'relative',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 旋转层：包裹圆环+节点，应用旋转transform
  rotateLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // 虚线圆环：串联所有节点中心
  ringLine: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
    zIndex: 0,
  },
  nodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2,
  },
  // 饼图节点外层
  pieNodeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    overflow: 'hidden',
  },
  // 饼图节点标签（绝对定位覆盖在SVG上方）
  pieNodeText: {
    position: 'absolute',
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
    width: 88,
    height: 88,
    borderRadius: 44,
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
  // 彩蛋：漂浮祝福语
  floatingWord: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    zIndex: 100,
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
    fontSize: 11,
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

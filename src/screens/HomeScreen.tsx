// src/screens/HomeScreen.tsx
import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList, Family, AnalysisMode} from '../types';
import {useFamily} from '../hooks/useFamily';
import FamilyCard from '../components/family/FamilyCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {colors, typography, spacing, borderRadius} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {families, reloadFamilies, deleteFamily} = useFamily();
  const [showHistory, setShowHistory] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Family | null>(null);

  const handleModeSelect = useCallback(
    (mode: AnalysisMode) => {
      navigation.navigate('FamilySelect', {mode});
    },
    [navigation],
  );

  const handleFamilyPress = useCallback(
    (family: Family) => {
      setShowHistory(false);
      navigation.navigate('MemberList', {familyId: family.id});
    },
    [navigation],
  );

  const handleDelete = useCallback(async () => {
    if (deleteTarget) {
      await deleteFamily(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteFamily]);

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appTitle}>家庭保障检视</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => navigation.navigate('Help')}
              activeOpacity={0.7}>
              <Text style={styles.helpIcon}>❓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* 房子图标 + 欢迎语 */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>🏠</Text>
          <Text style={styles.heroTitle}>查重复 · 查结构 · 查缺口</Text>
          <Text style={styles.heroSubtitle}>
            三查保单，让你的保障买对不买贵
          </Text>
        </View>

        {/* 模式选择区域 */}
        <View style={styles.modeSection}>
          <Text style={styles.modeSectionTitle}>选择分析模式</Text>
          <Text style={styles.modeSectionSubtitle}>
            快速版简化流程，精细版个性化分析
          </Text>

          {/* 快速版卡片 */}
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => handleModeSelect('quick')}
            activeOpacity={0.9}>
            <View style={styles.cardHeader}>
              <View style={[styles.modeBadge, styles.quickBadge]}>
                <Text style={styles.modeBadgeText}>快速版</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardIcon}>⚡</Text>
              <View style={styles.cardTextArea}>
                <Text style={styles.quickCardTitle}>快速保障检视</Text>
                <Text style={styles.cardDesc}>
                  简化录入流程，一键生成标准化保障检视图
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* 精细版卡片 */}
          <TouchableOpacity
            style={styles.proCard}
            onPress={() => handleModeSelect('professional')}
            activeOpacity={0.9}>
            <View style={styles.cardHeader}>
              <View style={[styles.modeBadge, styles.proBadge]}>
                <Text style={styles.modeBadgeText}>精细版</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardIcon}>🎯</Text>
              <View style={styles.cardTextArea}>
                <Text style={styles.proCardTitle}>精细深度分析</Text>
                <Text style={styles.cardDesc}>
                  AI个性化分析，多维度深度评分与智能推荐
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 分隔线 */}
        <View style={styles.divider} />

        {/* 三查营销文案 */}
        <View style={styles.checkSection}>
          {/* 查重复 */}
          <View style={styles.checkBlock}>
            <View style={styles.checkHeader}>
              <Text style={styles.checkBullet}>🔍</Text>
              <Text style={styles.checkTitle}>
                查重复，看保单<Text style={styles.checkHighlight}>"买多没"</Text>
              </Text>
            </View>
            <Text style={styles.checkDesc}>
              识别保单"冗余"，分析险种分布及保单重叠情况
            </Text>
          </View>

          {/* 查结构 */}
          <View style={styles.checkBlock}>
            <View style={styles.checkHeader}>
              <Text style={styles.checkBullet}>🏗️</Text>
              <Text style={styles.checkTitle}>
                查结构，看配置<Text style={styles.checkHighlight}>"买准没"</Text>
              </Text>
            </View>
            <Text style={styles.checkDesc}>
              识别结构"科学"，分析保障期限与人生阶段匹配
            </Text>
          </View>

          {/* 查缺口 */}
          <View style={styles.checkBlock}>
            <View style={styles.checkHeader}>
              <Text style={styles.checkBullet}>🎯</Text>
              <Text style={styles.checkTitle}>
                查缺口，看保障<Text style={styles.checkHighlight}>"够不够"</Text>
              </Text>
            </View>
            <Text style={styles.checkDesc}>
              识别额度"到位"，分析保障缺口及关键风险覆盖
            </Text>
          </View>
        </View>

        {/* 底部口诀 */}
        <View style={styles.mottoSection}>
          <Text style={styles.mottoLine}>
            配对人  配到位  不多配  不少配
          </Text>
          <Text style={styles.mottoLine}>
            及时配  聪明配  不漏交  不漏领
          </Text>
        </View>
      </ScrollView>

      {/* 底部检视记录按钮 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistory(true)}
          activeOpacity={0.85}>
          <Text style={styles.historyButtonIcon}>📋</Text>
          <Text style={styles.historyButtonText}>检视记录</Text>
          {families.length > 0 && (
            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>{families.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 检视记录弹窗 */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              检视记录{families.length > 0 ? `（${families.length}）` : ''}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHistory(false)}
              activeOpacity={0.7}>
              <Text style={styles.modalCloseText}>关闭</Text>
            </TouchableOpacity>
          </View>

          {families.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Text style={styles.modalEmptyIcon}>🏠</Text>
              <Text style={styles.modalEmptyTitle}>暂无检视记录</Text>
              <Text style={styles.modalEmptyDesc}>
                创建家庭并完成保障检视后，记录将在这里显示
              </Text>
            </View>
          ) : (
            <FlatList
              data={families}
              renderItem={({item}) => (
                <FamilyCard
                  family={item}
                  onPress={handleFamilyPress}
                  onLongPress={setDeleteTarget}
                />
              )}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>

      {/* 删除确认 */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="删除家庭"
        message={`确定要删除"${deleteTarget?.name}"及其所有保障数据吗？此操作不可恢复。`}
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  header: {
    paddingTop: spacing.xxxl + spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background[1],
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    elevation: 4,
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
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
  appTitle: {
    ...typography.heading,
    color: colors.text[0],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Hero 区域
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  heroIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text[0],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.text[2],
    textAlign: 'center',
  },
  // 模式选择区域
  modeSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  modeSectionTitle: {
    ...typography.subheading,
    color: colors.text[0],
    marginBottom: spacing.xs,
  },
  modeSectionSubtitle: {
    ...typography.caption,
    color: colors.text[2],
    marginBottom: spacing.xl,
  },
  quickCard: {
    backgroundColor: '#EBF5FB',
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#85C1E9',
    elevation: 3,
    shadowColor: '#2E86C1',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  quickBadge: {
    backgroundColor: '#2E86C1',
  },
  quickCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A5276',
    marginBottom: spacing.xs,
  },
  proCard: {
    backgroundColor: '#F5EEF8',
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#C39BD3',
    elevation: 3,
    shadowColor: '#7D3C98',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  proBadge: {
    backgroundColor: '#7D3C98',
  },
  proCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#512E5F',
    marginBottom: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  modeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  cardIcon: {
    fontSize: 36,
    marginRight: spacing.md,
    marginTop: 2,
  },
  cardTextArea: {
    flex: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.text[1],
    lineHeight: 19,
  },
  // 分隔线
  divider: {
    height: 1,
    backgroundColor: colors.card.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  // 三查文案
  checkSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  checkBlock: {
    gap: spacing.sm,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkBullet: {
    fontSize: 20,
  },
  checkTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text[0],
    flexShrink: 1,
  },
  checkHighlight: {
    color: colors.functional.danger,
  },
  checkDesc: {
    fontSize: 13,
    color: colors.text[1],
    lineHeight: 20,
    marginLeft: 32,
  },
  // 底部口诀
  mottoSection: {
    marginTop: spacing.xxl,
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  mottoLine: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[1],
    letterSpacing: 2,
  },
  // 底部按钮
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.background[1],
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[1],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    elevation: 3,
    shadowColor: colors.primary[1],
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    gap: spacing.sm,
  },
  historyButtonIcon: {
    fontSize: 18,
  },
  historyButtonText: {
    ...typography.body,
    color: colors.text[3],
    fontWeight: '600',
    fontSize: 16,
  },
  historyBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text[3],
  },
  // 弹窗
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xxxl + spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  modalTitle: {
    ...typography.subheading,
    color: colors.text[0],
  },
  modalCloseButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background[2],
    borderRadius: borderRadius.md,
  },
  modalCloseText: {
    fontSize: 14,
    color: colors.text[1],
    fontWeight: '500',
  },
  modalEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  modalEmptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  modalEmptyTitle: {
    ...typography.subheading,
    color: colors.text[0],
    marginBottom: spacing.sm,
  },
  modalEmptyDesc: {
    ...typography.body,
    color: colors.text[2],
    textAlign: 'center',
    lineHeight: 22,
  },
  modalListContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
});

export default HomeScreen;

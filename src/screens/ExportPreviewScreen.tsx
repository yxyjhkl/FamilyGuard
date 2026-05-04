// src/screens/ExportPreviewScreen.tsx
// 导出预览页面 - 支持截图、保存相册和分享
import React, {useMemo, useCallback, useRef, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import ViewShot from 'react-native-view-shot';
import {logger} from '../utils/logger';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList, ExportSettings, Member} from '../types';
import {useFamily} from '../hooks/useFamily';
import {useExport} from '../hooks/useExport';
import {exportService} from '../services/exportService';
import AppHeader from '../components/common/AppHeader';
import ExportCard from '../components/export/ExportCard';
import ExportOrgChartCard from '../components/export/ExportOrgChartCard';
import ExportConfigPanel from '../components/export/ExportConfigPanel';
import {colors, typography, spacing, borderRadius} from '../theme';
import {getMotto} from '../data/mottoList';

// 帮助按钮组件
const HelpButton: React.FC<{onPress: () => void}> = ({onPress}) => (
  <TouchableOpacity style={styles.helpButton} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.helpIcon}>❓</Text>
  </TouchableOpacity>
);

type Props = NativeStackScreenProps<RootStackParamList, 'ExportPreview'>;
type ExportStyle = 'list' | 'orgChart';

const ExportPreviewScreen: React.FC<Props> = ({route, navigation}) => {
  const {familyId} = route.params;
  const {getFamilyById, updateExportSettings} = useFamily();
  const {startExport, finishExport} = useExport();
  const viewShotRef = useRef<ViewShot>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStyle, setExportStyle] = useState<ExportStyle>('orgChart');

  const family = useMemo(() => getFamilyById(familyId), [familyId, getFamilyById]);

  const exportData = useMemo(() => {
    if (!family) return null;
    return {family, motto: family.exportSettings.selectedMotto || getMotto()};
  }, [family]);

  const handleSettingsUpdate = useCallback(
    (settings: Partial<ExportSettings>) => {
      updateExportSettings(familyId, settings);
    },
    [familyId, updateExportSettings],
  );

  // 返回上一页
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 成员点击 - 跳转到个人详情导出页
  const handleMemberPress = useCallback(
    (member: Member) => {
      navigation.navigate('MemberDetailExport', {
        familyId,
        memberId: member.id,
      });
    },
    [navigation, familyId]
  );

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
      // 延迟一下确保渲染完成
      await new Promise(resolve => setTimeout(resolve, 200));

      const uri = await viewShotRef.current.capture?.();
      if (!uri) {
        Alert.alert('错误', '截图失败，请重试');
        finishExport('', false);
        return;
      }

      const success = await exportService.saveToAlbum(uri);
      if (success) {
        Alert.alert('成功', '检视图已保存到相册');
      }
      finishExport(uri, success);
    } catch (error) {
      logger.error('ExportPreview', '保存相册失败', error);
      Alert.alert('错误', '保存到相册失败，请重试');
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
      logger.error('ExportPreview', '分享失败', error);
      Alert.alert('错误', '分享失败，请重试');
      finishExport('', false);
    } finally {
      setIsExporting(false);
    }
  }, [startExport, finishExport, isExporting]);

  if (!family || !exportData) {
    return (
      <View style={styles.container}>
        <AppHeader title="导出检视图" />
        <View style={styles.error}>
          <Text style={styles.errorText}>未找到家庭数据</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 带返回按钮和保存按钮的 Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>导出检视图</Text>
        <View style={styles.headerRight}>
          <HelpButton onPress={() => navigation.navigate('Help')} />
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveToAlbum} activeOpacity={0.7} disabled={isExporting}>
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.primary[1]} />
            ) : (
              <Text style={styles.saveText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 导出样式选择 */}
        <View style={styles.styleSelector}>
          <Text style={styles.sectionLabel}>选择导出样式</Text>
          <View style={styles.styleButtons}>
            <TouchableOpacity
              style={[styles.styleBtn, exportStyle === 'orgChart' && styles.styleBtnActive]}
              onPress={() => setExportStyle('orgChart')}
              activeOpacity={0.7}>
              <Text style={[styles.styleBtnText, exportStyle === 'orgChart' && styles.styleBtnTextActive]}>
                🏠 双圈架构图
              </Text>
              <Text style={[styles.styleBtnDesc, exportStyle === 'orgChart' && styles.styleBtnDescActive]}>
                美观大方·艺术感强
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.styleBtn, exportStyle === 'list' && styles.styleBtnActive]}
              onPress={() => setExportStyle('list')}
              activeOpacity={0.7}>
              <Text style={[styles.styleBtnText, exportStyle === 'list' && styles.styleBtnTextActive]}>
                📋 详细列表式
              </Text>
              <Text style={[styles.styleBtnDesc, exportStyle === 'list' && styles.styleBtnDescActive]}>
                信息全面·便于阅读
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 导出预览 */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionLabel}>预览效果</Text>

          {/* ViewShot 包裹导出卡片 */}
          <ViewShot
            ref={viewShotRef}
            options={{
              format: 'png',
              quality: 1.0,
              result: 'tmpfile',
            }}
            style={styles.viewShot}>
            {family ? (exportStyle === 'orgChart' ? (
              <ExportOrgChartCard
                family={family}
                motto={exportData.motto}
                timestamp={new Date().toISOString()}
                showName={family.exportSettings.showName}
                showAgentInfo={family.exportSettings.showAgentInfo}
                agentName={family.exportSettings.agentName}
                agentPhone={family.exportSettings.agentPhone}
                onMemberPress={handleMemberPress}
                aiSummary={family.exportSettings.aiSummary}
              />
            ) : (
              <ExportCard
                family={family}
                motto={exportData.motto}
                timestamp={new Date().toISOString()}
                showName={family.exportSettings.showName}
                showAgentInfo={family.exportSettings.showAgentInfo}
                agentName={family.exportSettings.agentName}
                agentPhone={family.exportSettings.agentPhone}
                aiSummary={family.exportSettings.aiSummary}
              />
            )) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>家庭数据加载中...</Text>
              </View>
            )}
          </ViewShot>
        </View>

        {/* 配置面板 */}
        <ExportConfigPanel
          settings={family.exportSettings}
          onUpdate={handleSettingsUpdate}
        />
      </ScrollView>

      {/* 底部分享按钮 */}
      <View style={styles.bottomBar}>
        {/* AI智能分析按钮 */}
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => navigation.navigate('AIAnalysis', { familyId })}
          activeOpacity={0.8}>
          <Text style={styles.aiButtonIcon}>🤖</Text>
          <Text style={styles.aiButtonText}>AI分析</Text>
        </TouchableOpacity>

        {/* 分享按钮 */}
        <TouchableOpacity
          style={[styles.shareButton, isExporting && styles.buttonDisabled]}
          onPress={handleShare}
          activeOpacity={0.8}
          disabled={isExporting}>
          {isExporting ? (
            <ActivityIndicator size="small" color={colors.text[3]} />
          ) : (
            <Text style={styles.shareButtonText}>微信分享</Text>
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
    paddingTop: spacing.xxxl + spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: colors.text[0],
    fontWeight: '500',
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.text[0],
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  saveButton: {
    minWidth: 60,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[2] + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[1],
  },
  scroll: {
    flex: 1,
  },
  styleSelector: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text[1],
    marginBottom: spacing.sm,
  },
  styleButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  styleBtn: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleBtnActive: {
    borderColor: colors.primary[1],
    backgroundColor: colors.primary[2] + '20',
  },
  styleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text[1],
  },
  styleBtnTextActive: {
    color: colors.primary[1],
  },
  styleBtnDesc: {
    fontSize: 11,
    color: colors.text[2],
    marginTop: 4,
  },
  styleBtnDescActive: {
    color: colors.primary[1],
  },
  previewSection: {
    marginBottom: spacing.lg,
  },
  viewShot: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
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
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.background[1],
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
    gap: spacing.sm,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[2] + '30',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[1] + '40',
  },
  aiButtonIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  aiButtonText: {
    ...typography.body,
    color: colors.primary[1],
    fontWeight: '600',
    fontSize: 15,
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.primary[1],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary[1],
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  shareButtonText: {
    ...typography.body,
    color: colors.text[3],
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ExportPreviewScreen;

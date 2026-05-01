// src/screens/SettingsScreen.tsx
// 设置页面 - 全局建议保额、业务员信息、金句配置

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import type {CoverageType} from '../types';
import {insuranceCoverages} from '../data/insuranceCoverages';
import {DEFAULT_RECOMMENDED_AMOUNTS} from '../types';
import {mottoList} from '../data/mottoList';
import {useSettings, hasCustomAmounts, getCustomCount, isAgentInfoComplete} from '../store/settingsStore';
import AppHeader from '../components/common/AppHeader';
import {colors, typography, spacing, borderRadius} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const {
    state,
    setCustomAmount,
    setAllCustomAmounts,
    resetToDefaults,
    toggleUseGlobal,
    setAgentInfo,
    setDefaultMotto,
    toggleUseDefaultMotto,
    exportSettings,
    importSettings,
    clearAllData,
  } = useSettings();

  // 状态
  const [activeTab, setActiveTab] = useState<'coverage' | 'agent' | 'motto' | 'data'>('agent');
  const [editingType, setEditingType] = useState<CoverageType | null>(null);
  const [editValue, setEditValue] = useState('');

  // 业务员信息编辑状态
  const [agentName, setAgentName] = useState(state.agentInfo.name);
  const [agentEmployeeId, setAgentEmployeeId] = useState(state.agentInfo.employeeId);
  const [agentPhone, setAgentPhone] = useState(state.agentInfo.phone);
  const [agentDepartment, setAgentDepartment] = useState(state.agentInfo.department);

  // 获取有效建议保额
  const getEffectiveAmount = useCallback(
    (type: CoverageType): number => {
      if (state.customRecommendedAmounts[type] !== undefined) {
        return state.customRecommendedAmounts[type] as number;
      }
      return DEFAULT_RECOMMENDED_AMOUNTS[type] ?? 0;
    },
    [state.customRecommendedAmounts],
  );

  // 开始编辑保额
  const startEditing = useCallback((type: CoverageType) => {
    const current = getEffectiveAmount(type);
    setEditValue(String(current));
    setEditingType(type);
  }, [getEffectiveAmount]);

  // 保存编辑
  const saveEditing = useCallback(() => {
    if (editingType === null) return;

    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) {
      Alert.alert('输入无效', '请输入有效的数字（大于等于0）');
      return;
    }

    setCustomAmount(editingType, value);
    setEditingType(null);
    setEditValue('');
  }, [editingType, editValue, setCustomAmount]);

  // 取消编辑
  const cancelEditing = useCallback(() => {
    setEditingType(null);
    setEditValue('');
  }, []);

  // 重置为默认
  const handleReset = useCallback(() => {
    Alert.alert(
      '重置保额',
      '确定要将所有建议保额恢复为默认值吗？',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '重置',
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            Alert.alert('已重置', '所有建议保额已恢复为默认值');
          },
        },
      ],
    );
  }, [resetToDefaults]);

  // 保存业务员信息
  const handleSaveAgentInfo = useCallback(() => {
    setAgentInfo({
      name: agentName.trim(),
      employeeId: agentEmployeeId.trim(),
      phone: agentPhone.trim(),
      department: agentDepartment.trim(),
    });
    Alert.alert('保存成功', '业务员信息已保存');
  }, [agentName, agentEmployeeId, agentPhone, agentDepartment, setAgentInfo]);

  // 保存金句
  const handleSaveMotto = useCallback((motto: string) => {
    setDefaultMotto(motto);
    Alert.alert('保存成功', '默认金句已设置');
  }, [setDefaultMotto]);

  // 备份设置
  const handleBackup = useCallback(async () => {
    try {
      const data = exportSettings();
      await Share.share({
        message: data,
        title: '家庭保障检视-设置备份',
      });
    } catch (error) {
      Alert.alert('备份失败', '无法分享设置数据');
    }
  }, [exportSettings]);

  // 恢复设置
  const handleRestore = useCallback(() => {
    Alert.prompt(
      '恢复设置',
      '请粘贴之前备份的设置数据：',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '恢复',
          onPress: (text) => {
            if (text) {
              const success = importSettings(text);
              if (success) {
                Alert.alert('恢复成功', '设置已恢复');
              } else {
                Alert.alert('恢复失败', '数据格式无效');
              }
            }
          },
        },
      ],
      'plain-text',
    );
  }, [importSettings]);

  // 清除所有数据
  const handleClearData = useCallback(() => {
    Alert.alert(
      '清除所有数据',
      '确定要清除所有数据吗？这将删除所有家庭、成员和设置信息，此操作不可恢复！',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('已清除', '所有数据已清除');
            // 重置表单
            setAgentName('');
            setAgentEmployeeId('');
            setAgentPhone('');
            setAgentDepartment('');
          },
        },
      ],
    );
  }, [clearAllData]);

  // 统计信息
  const isCustom = hasCustomAmounts(state.customRecommendedAmounts);
  const customCount = getCustomCount(state.customRecommendedAmounts);
  const agentComplete = isAgentInfoComplete(state.agentInfo);

  // 按分类分组
  const groupedCoverages = insuranceCoverages.reduce(
    (acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, typeof insuranceCoverages>,
  );

  const categoryNames: Record<string, string> = {
    life: '寿险/身价',
    critical: '重疾类',
    accident: '意外类',
    medical: '医疗类',
    education: '教育类',
    special: '其他类',
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="设置"
        rightAction={
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.closeBtn}>完成</Text>
          </TouchableOpacity>
        }
      />

      {/* Tab 切换 */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {[
            {key: 'agent', label: '业务员', icon: '👤'},
            {key: 'coverage', label: '建议保额', icon: '💰'},
            {key: 'motto', label: '默认金句', icon: '✦'},
            {key: 'data', label: '数据管理', icon: '📦'},
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key as any)}
              activeOpacity={0.7}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ========== 业务员信息 ========== */}
        {activeTab === 'agent' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>业务员信息</Text>
              {agentComplete && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>已完善</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionDesc}>
              设置后将自动填充到导出检视图中，方便客户联系
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>姓名 *</Text>
              <TextInput
                style={styles.input}
                value={agentName}
                onChangeText={setAgentName}
                placeholder="请输入姓名"
                placeholderTextColor={colors.text[2]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>工号</Text>
              <TextInput
                style={styles.input}
                value={agentEmployeeId}
                onChangeText={setAgentEmployeeId}
                placeholder="请输入工号"
                placeholderTextColor={colors.text[2]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>联系电话 *</Text>
              <TextInput
                style={styles.input}
                value={agentPhone}
                onChangeText={setAgentPhone}
                placeholder="请输入手机号"
                placeholderTextColor={colors.text[2]}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>所属部门</Text>
              <TextInput
                style={styles.input}
                value={agentDepartment}
                onChangeText={setAgentDepartment}
                placeholder="请输入所属部门"
                placeholderTextColor={colors.text[2]}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveAgentInfo}
              activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>保存业务员信息</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========== 建议保额配置 ========== */}
        {activeTab === 'coverage' && (
          <>
            {/* 全局开关 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>全局建议保额</Text>
                <TouchableOpacity
                  style={[styles.switchContainer, state.useGlobalCustom && styles.switchActive]}
                  onPress={() => toggleUseGlobal(!state.useGlobalCustom)}
                  activeOpacity={0.7}>
                  <View style={[styles.switchThumb, state.useGlobalCustom && styles.switchThumbActive]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionDesc}>
                {state.useGlobalCustom ? '已启用全局自定义建议保额' : '已禁用，使用系统默认建议保额'}
              </Text>
            </View>

            {/* 统计和重置 */}
            {isCustom && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{customCount}</Text>
                  <Text style={styles.statLabel}>项已自定义</Text>
                </View>
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                  <Text style={styles.resetBtnText}>重置全部</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 保额列表 */}
            {Object.entries(groupedCoverages).map(([category, items]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{categoryNames[category] || category}</Text>
                <View style={styles.coverageList}>
                  {items.map(item => {
                    const effectiveAmount = getEffectiveAmount(item.type);
                    const defaultAmount = DEFAULT_RECOMMENDED_AMOUNTS[item.type] ?? 0;
                    const isCustomized = state.customRecommendedAmounts[item.type] !== undefined;
                    const isEditing = editingType === item.type;

                    return (
                      <View key={item.type} style={styles.coverageItem}>
                        <View style={styles.coverageInfo}>
                          <View style={[styles.iconBadge, {backgroundColor: item.color + '20'}]}>
                            <Text style={[styles.iconText, {color: item.color}]}>
                              {item.shortLabel}
                            </Text>
                          </View>
                          <View style={styles.coverageDetail}>
                            <Text style={styles.coverageName}>{item.fullLabel}</Text>
                            <Text style={styles.coverageDefault}>
                              默认: {defaultAmount}{item.unit}
                            </Text>
                          </View>
                        </View>

                        {isEditing ? (
                          <View style={styles.editRow}>
                            <TextInput
                              style={styles.editInput}
                              value={editValue}
                              onChangeText={setEditValue}
                              keyboardType="numeric"
                              autoFocus
                              selectTextOnFocus
                            />
                            <Text style={styles.unitText}>{item.unit}</Text>
                            <TouchableOpacity
                              style={styles.saveBtn}
                              onPress={saveEditing}
                              activeOpacity={0.7}>
                              <Text style={styles.saveBtnText}>保存</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.cancelBtn}
                              onPress={cancelEditing}
                              activeOpacity={0.7}>
                              <Text style={styles.cancelBtnText}>取消</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[styles.amountDisplay, isCustomized && styles.amountCustomized]}
                            onPress={() => startEditing(item.type)}
                            activeOpacity={0.7}>
                            <Text style={[styles.amountText, isCustomized && styles.amountTextCustomized]}>
                              {effectiveAmount}
                            </Text>
                            <Text style={styles.amountUnit}>{item.unit}</Text>
                            {isCustomized && (
                              <View style={styles.editIcon}>
                                <Text style={styles.editIconText}>✏️</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}

        {/* ========== 默认金句 ========== */}
        {activeTab === 'motto' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>默认保险金句</Text>
              <TouchableOpacity
                style={[styles.switchContainer, state.useDefaultMotto && styles.switchActive]}
                onPress={() => toggleUseDefaultMotto(!state.useDefaultMotto)}
                activeOpacity={0.7}>
                <View style={[styles.switchThumb, state.useDefaultMotto && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionDesc}>
              {state.useDefaultMotto
                ? '导出时使用默认金句'
                : '导出时随机选择金句'}
            </Text>

            {state.useDefaultMotto && state.defaultMotto && (
              <View style={styles.selectedMottoBox}>
                <Text style={styles.selectedMottoLabel}>当前选择：</Text>
                <Text style={styles.selectedMottoText}>{state.defaultMotto}</Text>
              </View>
            )}

            <Text style={styles.mottoListTitle}>选择金句</Text>
            <View style={styles.mottoList}>
              {mottoList.map((motto, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.mottoItem,
                    state.defaultMotto === motto && styles.mottoItemActive,
                  ]}
                  onPress={() => handleSaveMotto(motto)}
                  activeOpacity={0.7}>
                  <Text style={styles.mottoItemText}>{motto}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ========== 数据管理 ========== */}
        {activeTab === 'data' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>数据管理</Text>

            <View style={styles.dataActionList}>
              <TouchableOpacity
                style={styles.dataActionItem}
                onPress={handleBackup}
                activeOpacity={0.7}>
                <View style={styles.dataActionIcon}>
                  <Text style={styles.dataActionEmoji}>📤</Text>
                </View>
                <View style={styles.dataActionContent}>
                  <Text style={styles.dataActionTitle}>备份设置</Text>
                  <Text style={styles.dataActionDesc}>导出设置数据用于恢复或迁移</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dataActionItem}
                onPress={handleRestore}
                activeOpacity={0.7}>
                <View style={styles.dataActionIcon}>
                  <Text style={styles.dataActionEmoji}>📥</Text>
                </View>
                <View style={styles.dataActionContent}>
                  <Text style={styles.dataActionTitle}>恢复设置</Text>
                  <Text style={styles.dataActionDesc}>从备份数据恢复设置</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dataActionItem, styles.dangerAction]}
                onPress={handleClearData}
                activeOpacity={0.7}>
                <View style={[styles.dataActionIcon, styles.dangerIconBg]}>
                  <Text style={styles.dataActionEmoji}>🗑️</Text>
                </View>
                <View style={styles.dataActionContent}>
                  <Text style={[styles.dataActionTitle, styles.dangerText]}>清除所有数据</Text>
                  <Text style={styles.dataActionDesc}>删除所有家庭、成员和设置信息</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>关于</Text>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>应用名称</Text>
                <Text style={styles.aboutValue}>家庭保障检视</Text>
              </View>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>版本</Text>
                <Text style={styles.aboutValue}>1.0.0</Text>
              </View>
            </View>
          </View>
        )}

        {/* 底部提示 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 设置会自动保存，部分功能需要刷新页面后生效
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  closeBtn: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[1],
  },
  tabContainer: {
    backgroundColor: colors.background[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  tabScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background[2],
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary[1],
  },
  tabIcon: {
    fontSize: 14,
  },
  tabText: {
    fontSize: 13,
    color: colors.text[2],
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text[3],
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text[0],
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.text[2],
    marginTop: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.functional.success + '20',
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    color: colors.functional.success,
    fontWeight: '600',
  },
  formGroup: {
    marginTop: spacing.lg,
  },
  label: {
    fontSize: 13,
    color: colors.text[1],
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text[0],
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  saveButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary[1],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    color: colors.text[3],
    fontWeight: '600',
  },
  switchContainer: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background[2],
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: colors.primary[1],
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text[3],
  },
  switchThumbActive: {
    backgroundColor: colors.background[1],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary[2] + '15',
    borderRadius: borderRadius.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[1],
  },
  statLabel: {
    fontSize: 13,
    color: colors.text[2],
  },
  resetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.functional.error + '15',
    borderRadius: borderRadius.sm,
  },
  resetBtnText: {
    fontSize: 13,
    color: colors.functional.error,
    fontWeight: '500',
  },
  categorySection: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  categoryTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text[0],
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  coverageList: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  coverageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  coverageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  coverageDetail: {
    flex: 1,
  },
  coverageName: {
    ...typography.body,
    color: colors.text[0],
    fontWeight: '500',
  },
  coverageDefault: {
    fontSize: 12,
    color: colors.text[2],
    marginTop: 2,
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background[2],
    borderRadius: borderRadius.sm,
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  amountCustomized: {
    backgroundColor: colors.primary[2] + '25',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text[0],
  },
  amountTextCustomized: {
    color: colors.primary[1],
  },
  amountUnit: {
    fontSize: 12,
    color: colors.text[2],
    marginLeft: 2,
  },
  editIcon: {
    marginLeft: spacing.xs,
  },
  editIconText: {
    fontSize: 12,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editInput: {
    width: 70,
    height: 36,
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[1],
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.primary[1],
  },
  unitText: {
    fontSize: 12,
    color: colors.text[2],
  },
  saveBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[1],
    borderRadius: borderRadius.sm,
  },
  saveBtnText: {
    fontSize: 12,
    color: colors.text[3],
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background[2],
    borderRadius: borderRadius.sm,
  },
  cancelBtnText: {
    fontSize: 12,
    color: colors.text[2],
  },
  selectedMottoBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primary[2] + '15',
    borderRadius: borderRadius.md,
  },
  selectedMottoLabel: {
    fontSize: 12,
    color: colors.text[2],
    marginBottom: spacing.xs,
  },
  selectedMottoText: {
    fontSize: 14,
    color: colors.primary[1],
    fontWeight: '500',
    lineHeight: 20,
  },
  mottoListTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text[0],
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  mottoList: {
    gap: spacing.sm,
  },
  mottoItem: {
    padding: spacing.md,
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  mottoItemActive: {
    borderColor: colors.primary[1],
    backgroundColor: colors.primary[2] + '15',
  },
  mottoItemText: {
    fontSize: 13,
    color: colors.text[0],
    lineHeight: 20,
  },
  dataActionList: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  dataActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  dangerAction: {
    backgroundColor: colors.functional.error + '08',
  },
  dataActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIconBg: {
    backgroundColor: colors.functional.error + '15',
  },
  dataActionEmoji: {
    fontSize: 20,
  },
  dataActionContent: {
    flex: 1,
  },
  dataActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text[0],
  },
  dangerText: {
    color: colors.functional.error,
  },
  dataActionDesc: {
    fontSize: 12,
    color: colors.text[2],
    marginTop: 2,
  },
  aboutSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  aboutTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text[1],
    marginBottom: spacing.md,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  aboutLabel: {
    fontSize: 13,
    color: colors.text[2],
  },
  aboutValue: {
    fontSize: 13,
    color: colors.text[0],
    fontWeight: '500',
  },
  footer: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: colors.functional.infoLight || '#E3F2FD',
    borderRadius: borderRadius.lg,
  },
  footerText: {
    fontSize: 13,
    color: colors.text[1],
    lineHeight: 20,
  },
});

export default SettingsScreen;

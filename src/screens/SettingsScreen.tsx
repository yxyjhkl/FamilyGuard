// src/screens/SettingsScreen.tsx
// 设置页面 - 全局建议保额、保障配置、权益配置、客户经理信息、金句配置

import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Image,
  Linking,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import type {CoverageType} from '../types';
import {INSURANCE_COVERAGES} from '../constants/insurance';
import {mottoList} from '../data/mottoList';
import {useSettings, hasCustomAmounts, getCustomCount, isAgentInfoComplete, getDefaultAmount} from '../store/settingsStore';
import {aiService, AI_PROVIDERS, type AIProvider} from '../services/aiService';
import {storageService} from '../store/storageService';
import AppHeader from '../components/common/AppHeader';
import {colors, typography, spacing, borderRadius} from '../theme';
import CoverageConfigEditor from '../components/settings/CoverageConfigEditor';
import RightConfigEditor from '../components/settings/RightConfigEditor';

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
    setDonationConfig,
  } = useSettings();

  // 状态
  const [activeTab, setActiveTab] = useState<'agent' | 'coverage' | 'rights' | 'amount' | 'motto' | 'ai' | 'register' | 'data'>('agent');
  const [editingType, setEditingType] = useState<CoverageType | null>(null);
  const [editValue, setEditValue] = useState('');

  // AI配置状态
  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
    const config = aiService.getUserConfig();
    return config?.provider ?? 'deepseek';
  });
  const [aiApiKey, setAiApiKey] = useState(() => {
    const config = aiService.getUserConfig();
    return config?.apiKey ?? '';
  });
  const [aiEndpoint, setAiEndpoint] = useState(() => {
    const config = aiService.getUserConfig();
    return config?.endpoint ?? '';
  });
  const [aiModel, setAiModel] = useState(() => {
    const config = aiService.getUserConfig();
    return config?.model ?? '';
  });
  const [isAiConfigured, setIsAiConfigured] = useState(aiService.isConfigured());
  const [showProviderList, setShowProviderList] = useState(false);
  const [showModelList, setShowModelList] = useState(false);

  // 获取当前提供商支持的模型列表
  const currentProviderModels = aiService.getProviderConfig(aiProvider)?.models || [];

  // 选择模型
  const handleSelectModel = useCallback((modelId: string) => {
    setAiModel(modelId);
    setShowModelList(false);
  }, []);
  
  // 恢复设置弹窗状态
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');

  // 客户经理信息编辑状态
  const [agentName, setAgentName] = useState(state.agentInfo.name);
  const [agentEmployeeId, setAgentEmployeeId] = useState(state.agentInfo.employeeId);
  const [agentPhone, setAgentPhone] = useState(state.agentInfo.phone);
  const [agentDepartment, setAgentDepartment] = useState(state.agentInfo.department);

  // 获取有效建议保额（与 settingsStore.getRecommendedAmount 保持一致）
  const getEffectiveAmount = useCallback(
    (type: CoverageType): number => {
      if (state.useGlobalCustom && state.customRecommendedAmounts[type] !== undefined) {
        return state.customRecommendedAmounts[type] as number;
      }
      return getDefaultAmount(type);
    },
    [state.useGlobalCustom, state.customRecommendedAmounts],
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

  // 保存客户经理信息
  const handleSaveAgentInfo = useCallback(() => {
    setAgentInfo({
      name: agentName.trim(),
      employeeId: agentEmployeeId.trim(),
      phone: agentPhone.trim(),
      department: agentDepartment.trim(),
    });
    Alert.alert('保存成功', '客户经理信息已保存');
  }, [agentName, agentEmployeeId, agentPhone, agentDepartment, setAgentInfo]);

  // 保存金句
  const handleSaveMotto = useCallback((motto: string) => {
    setDefaultMotto(motto);
    Alert.alert('保存成功', '默认金句已设置');
  }, [setDefaultMotto]);

  // 打开App扫一扫
  const handleOpenQrScanner = useCallback(async (appType: 'wechat' | 'alipay') => {
    // App的URL Scheme
    const schemes = {
      wechat: {
        scheme: 'weixin://scanQRCode',
        name: '微信',
        appStoreUrl: 'https://apps.apple.com/cn/app/wechat/id414478124',
      },
      alipay: {
        scheme: 'alipays://platformapi/startapp?appId=20000056',
        name: '支付宝',
        appStoreUrl: 'https://apps.apple.com/cn/app/zhifubao/id333206289',
      },
    };

    const app = schemes[appType];

    try {
      const canOpen = await Linking.canOpenURL(app.scheme);
      
      if (canOpen) {
        await Linking.openURL(app.scheme);
      } else {
        // App未安装，提示安装
        Alert.alert(
          `${app.name}未安装`,
          `请先安装${app.name}后再使用扫码功能`,
          [
            {text: '取消', style: 'cancel'},
            {
              text: '去下载',
              onPress: () => Linking.openURL(app.appStoreUrl),
            },
          ],
        );
      }
    } catch (error) {
      console.error('打开扫码失败:', error);
      Alert.alert('操作失败', `无法打开${app.name}扫一扫`);
    }
  }, []);

  // 保存AI配置
  const handleSaveAI = useCallback(() => {
    if (!aiApiKey.trim()) {
      Alert.alert('配置不完整', '请输入 API Key');
      return;
    }
    
    const providerConfig = aiService.getProviderConfig(aiProvider);
    aiService.setConfig({
      provider: aiProvider,
      apiKey: aiApiKey.trim(),
      endpoint: aiEndpoint.trim() || providerConfig?.defaultEndpoint || '',
      model: aiModel.trim() || providerConfig?.defaultModel || '',
      temperature: 0.7,
      maxTokens: 2000,
    });
    
    setIsAiConfigured(aiService.isConfigured());
    Alert.alert('保存成功', 'AI 配置已保存，现在可以使用 AI 增强分析功能');
  }, [aiProvider, aiApiKey, aiEndpoint, aiModel]);

  // 清除AI配置
  const handleClearAI = useCallback(() => {
    Alert.alert(
      '确认清除',
      '确定要清除 AI 配置吗？清除后将只能使用本地分析功能。',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '清除',
          style: 'destructive',
          onPress: () => {
            aiService.clearConfig();
            setAiApiKey('');
            setAiEndpoint('');
            setAiModel('');
            setIsAiConfigured(false);
            Alert.alert('已清除', 'AI 配置已清除');
          },
        },
      ]
    );
  }, []);

  // 选择AI服务商
  const handleSelectProvider = useCallback((provider: AIProvider) => {
    setAiProvider(provider);
    const config = aiService.getProviderConfig(provider);
    if (config) {
      setAiEndpoint(config.defaultEndpoint);
      setAiModel(config.defaultModel);
    }
    setShowProviderList(false);
  }, []);

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

  // 恢复设置 - Android兼容版本
  const handleRestore = useCallback(() => {
    setRestoreInput('');
    setRestoreModalVisible(true);
  }, []);

  // 执行恢复操作
  const handleRestoreConfirm = useCallback(() => {
    if (restoreInput.trim()) {
      const success = importSettings(restoreInput.trim());
      setRestoreModalVisible(false);
      if (success) {
        Alert.alert('恢复成功', '设置已恢复');
      } else {
        Alert.alert('恢复失败', '数据格式无效');
      }
    }
  }, [restoreInput, importSettings]);

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

  // 清理废弃的短期赠险记录
  const handleCleanupDeprecatedCoverages = useCallback(() => {
    Alert.alert(
      '清理废弃数据',
      '将删除所有家庭成员中的"短期赠险"记录。此操作不可恢复。',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '清理',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.cleanupDeprecatedCoverages();
              Alert.alert('清理完成', '已删除所有废弃的短期赠险记录');
            } catch (error) {
              Alert.alert('清理失败', '清理数据时出现错误，请重试');
            }
          },
        },
      ],
    );
  }, []);

  // 统计信息
  const isCustom = hasCustomAmounts(state.customRecommendedAmounts);
  const customCount = getCustomCount(state.customRecommendedAmounts);
  const agentComplete = isAgentInfoComplete(state.agentInfo);

  // 按分类分组
  const groupedCoverages = INSURANCE_COVERAGES.reduce(
    (acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, typeof INSURANCE_COVERAGES>,
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

      {/* Tab 切换 - 双排布局提高可见性 */}
      <View style={styles.tabContainer}>
        {/* 第一排：常用功能 */}
        <View style={styles.tabRow}>
          {([
            {key: 'agent' as const, label: '客户经理', icon: '👤'},
            {key: 'coverage' as const, label: '保障项目', icon: '🛡️'},
            {key: 'rights' as const, label: '权益项目', icon: '✨'},
            {key: 'amount' as const, label: '建议保额', icon: '💰'},
          ]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, styles.tabHalf, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* 第二排：其他功能 */}
        <View style={styles.tabRow}>
          {([
            {key: 'motto' as const, label: '默认金句', icon: '✦'},
            {key: 'ai' as const, label: 'AI配置', icon: '🤖'},
            {key: 'register' as const, label: '打赏作者', icon: '❤️'},
            {key: 'data' as const, label: '数据管理', icon: '📦'},
          ]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, styles.tabQuarter, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ========== 客户经理信息 ========== */}
        {activeTab === 'agent' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>客户经理信息</Text>
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
              <Text style={styles.saveButtonText}>保存客户经理信息</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========== 保障项目配置 ========== */}
        {activeTab === 'coverage' && (
          <CoverageConfigEditor />
        )}

        {/* ========== 权益项目配置 ========== */}
        {activeTab === 'rights' && (
          <RightConfigEditor />
        )}

        {/* ========== 建议保额配置 ========== */}
        {activeTab === 'amount' && (
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
                    const defaultAmount = getDefaultAmount(item.type);
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
                onPress={handleCleanupDeprecatedCoverages}
                activeOpacity={0.7}>
                <View style={[styles.dataActionIcon, {backgroundColor: '#FFF3E0'}]}>
                  <Text style={styles.dataActionEmoji}>🧹</Text>
                </View>
                <View style={styles.dataActionContent}>
                  <Text style={[styles.dataActionTitle, {color: '#E65100'}]}>清理废弃数据</Text>
                  <Text style={styles.dataActionDesc}>删除历史遗留的"短期赠险"记录</Text>
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
                <Text style={styles.aboutValue}>V2.3.2</Text>
              </View>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>作者</Text>
                <Text style={styles.aboutValue}>泽麟保服技术中心</Text>
              </View>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>版权所有</Text>
                <Text style={styles.aboutValue}>© 2026-2030 泽麟保服技术中心</Text>
              </View>
            </View>
          </View>
        )}

        {/* ========== AI配置 ========== */}
        {activeTab === 'ai' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🤖 AI 配置</Text>
              {isAiConfigured ? (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>已配置</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.statusBadgeWarning]}>
                  <Text style={[styles.statusText, styles.statusTextWarning]}>未配置</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionDesc}>
              配置 AI API Key 后，可使用 AI 增强分析功能，获得更精准的个性化保障建议
            </Text>

            {/* 服务商选择 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>AI 服务商</Text>
              <TouchableOpacity
                style={styles.providerSelector}
                onPress={() => setShowProviderList(!showProviderList)}
                activeOpacity={0.7}>
                <Text style={styles.providerSelectorText}>
                  {AI_PROVIDERS.find(p => p.id === aiProvider)?.logo}{' '}
                  {AI_PROVIDERS.find(p => p.id === aiProvider)?.name}
                </Text>
                <Text style={styles.providerSelectorArrow}>▼</Text>
              </TouchableOpacity>

              {showProviderList && (
                <View style={styles.providerList}>
                  {AI_PROVIDERS.map(provider => (
                    <TouchableOpacity
                      key={provider.id}
                      style={[styles.providerItem, aiProvider === provider.id && styles.providerItemActive]}
                      onPress={() => handleSelectProvider(provider.id)}
                      activeOpacity={0.7}>
                      <Text style={styles.providerItemLogo}>{provider.logo}</Text>
                      <View style={styles.providerItemContent}>
                        <Text style={[styles.providerItemName, aiProvider === provider.id && styles.providerItemNameActive]}>
                          {provider.name}
                        </Text>
                        <Text style={styles.providerItemModel}>{provider.defaultModel}</Text>
                      </View>
                      {aiProvider === provider.id && (
                        <Text style={styles.providerItemCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* API Key */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>API Key *</Text>
              <TextInput
                style={styles.input}
                value={aiApiKey}
                onChangeText={setAiApiKey}
                placeholder="请输入 API Key"
                placeholderTextColor={colors.text[2]}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Endpoint */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>API Endpoint</Text>
              <TextInput
                style={styles.input}
                value={aiEndpoint}
                onChangeText={setAiEndpoint}
                placeholder={AI_PROVIDERS.find(p => p.id === aiProvider)?.defaultEndpoint || 'https://api.example.com/v1/chat/completions'}
                placeholderTextColor={colors.text[2]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>通常无需修改，使用默认值即可</Text>
            </View>

            {/* Model */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>模型选择</Text>
              {currentProviderModels.length > 0 ? (
                <TouchableOpacity
                  style={styles.providerSelector}
                  onPress={() => setShowModelList(!showModelList)}
                  activeOpacity={0.7}>
                  <Text style={styles.providerSelectorText}>
                    {currentProviderModels.find(m => m.id === aiModel)?.name || aiModel || '请选择模型'}
                  </Text>
                  <Text style={styles.providerSelectorArrow}>▼</Text>
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={styles.input}
                  value={aiModel}
                  onChangeText={setAiModel}
                  placeholder="请输入模型名称"
                  placeholderTextColor={colors.text[2]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}

              {showModelList && currentProviderModels.length > 0 && (
                <View style={styles.providerList}>
                  {currentProviderModels.map(model => (
                    <TouchableOpacity
                      key={model.id}
                      style={[styles.providerItem, aiModel === model.id && styles.providerItemActive]}
                      onPress={() => handleSelectModel(model.id)}
                      activeOpacity={0.7}>
                      <View style={styles.providerItemContent}>
                        <Text style={[styles.providerItemName, aiModel === model.id && styles.providerItemNameActive]}>
                          {model.name}
                        </Text>
                        {model.description && (
                          <Text style={styles.providerItemModel}>{model.description}</Text>
                        )}
                      </View>
                      {aiModel === model.id && (
                        <Text style={styles.providerItemCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 保存按钮 */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveAI}
              activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>保存 AI 配置</Text>
            </TouchableOpacity>

            {/* 清除按钮 */}
            {isAiConfigured && (
              <TouchableOpacity
                style={[styles.saveButton, styles.clearButton]}
                onPress={handleClearAI}
                activeOpacity={0.8}>
                <Text style={styles.clearButtonText}>清除 AI 配置</Text>
              </TouchableOpacity>
            )}

            {/* 提示信息 */}
            <View style={styles.aiTips}>
              <Text style={styles.aiTipsTitle}>💡 使用说明</Text>
              <Text style={styles.aiTipsText}>
                1. 选择 AI 服务商（推荐 DeepSeek 或月之暗面）{'\n'}
                2. 前往服务商官网获取 API Key{'\n'}
                3. 将 API Key 粘贴到上方输入框{'\n'}
                4. 点击保存即可使用 AI 分析功能
              </Text>
            </View>
          </View>
        )}

        {/* ========== 打赏作者 ========== */}
        {activeTab === 'register' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>☕ 打赏作者</Text>
            </View>
            
            <View style={styles.coffeeCard}>
              <View style={styles.coffeeLine}>
                <Text style={styles.coffeeText}>如果你觉得本应用程序还不错</Text>
                <Text style={styles.coffeeEmoji}>📱</Text>
              </View>
              <View style={styles.coffeeLine}>
                <Text style={styles.coffeeText}>或者它帮助你顺利签单</Text>
                <Text style={styles.coffeeEmoji}>📈</Text>
              </View>
              <View style={styles.coffeeLine}>
                <Text style={styles.coffeeText}>或者你学到了好的话术</Text>
                <Text style={styles.coffeeEmoji}>💡</Text>
              </View>
              <View style={styles.coffeeLine}>
                <Text style={styles.coffeeText}>那您请我喝一杯咖啡怎么样？</Text>
                <Text style={styles.coffeeEmoji}>☕</Text>
              </View>
              <View style={[styles.coffeeLine, styles.coffeeLineSpacer]}>
                <Text style={styles.coffeeText}>您的支持是我持续优化的动力</Text>
                <Text style={styles.coffeeEmoji}>🙏</Text>
              </View>
              <View style={styles.coffeeLine}>
                <Text style={styles.coffeeText}>祝您万事胜意！</Text>
                <Text style={styles.coffeeEmoji}>✨</Text>
              </View>
            </View>

            {/* 微信收款码 */}
            <View style={styles.donationItem}>
              <Text style={styles.donationTitle}>💖 微信赞赏</Text>
              <TouchableOpacity
                onPress={() => handleOpenQrScanner('wechat')}
                activeOpacity={0.8}>
                <Image
                  source={require('../../android/app/src/main/assets/weichatpay.jpg')}
                  style={styles.donationQrCode}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={styles.donationHint}>点击直接打开微信扫一扫</Text>
            </View>

            {/* 支付宝收款码 */}
            <View style={styles.donationItem}>
              <Text style={styles.donationTitle}>🧧 支付宝收款</Text>
              <TouchableOpacity
                onPress={() => handleOpenQrScanner('alipay')}
                activeOpacity={0.8}>
                <Image
                  source={require('../../android/app/src/main/assets/alipay.jpg')}
                  style={styles.donationQrCode}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={styles.donationHint}>点击直接打开支付宝扫一扫</Text>
            </View>

            <View style={styles.coffeeThanks}>
              <Text style={styles.coffeeThanksEmoji}>🙏</Text>
              <Text style={styles.coffeeThanksText}>感谢您的支持与鼓励</Text>
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

      {/* 恢复设置弹窗 - Android兼容版本 */}
      <Modal
        visible={restoreModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRestoreModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.restoreModalOverlay}>
          <View style={styles.restoreModalContent}>
            <Text style={styles.restoreModalTitle}>恢复设置</Text>
            <Text style={styles.restoreModalDesc}>
              请粘贴之前备份的设置数据：
            </Text>
            <TextInput
              style={styles.restoreModalInput}
              value={restoreInput}
              onChangeText={setRestoreInput}
              placeholder="粘贴备份数据..."
              placeholderTextColor={colors.text[2]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.restoreModalButtons}>
              <TouchableOpacity
                style={styles.restoreModalCancelBtn}
                onPress={() => setRestoreModalVisible(false)}>
                <Text style={styles.restoreModalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.restoreModalConfirmBtn}
                onPress={handleRestoreConfirm}>
                <Text style={styles.restoreModalConfirmText}>恢复</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  tabHalf: {
    flex: 1,
    justifyContent: 'center',
  },
  tabThird: {
    flex: 1,
    justifyContent: 'center',
  },
  tabQuarter: {
    flex: 1,
    justifyContent: 'center',
  },
  coffeeCard: {
    backgroundColor: colors.primary[0],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  coffeeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  coffeeLineSpacer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  coffeeText: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  coffeeEmoji: {
    fontSize: 16,
    marginLeft: spacing.xs,
  },
  coffeeMethods: {
    backgroundColor: colors.background[2],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  coffeeMethodsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text[0],
    marginBottom: spacing.md,
  },
  coffeeMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  coffeeMethodIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  coffeeMethodContent: {
    flex: 1,
  },
  coffeeMethodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text[0],
  },
  coffeeMethodDesc: {
    fontSize: 12,
    color: colors.text[2],
    marginTop: 2,
  },
  coffeeThanks: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  coffeeThanksEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  coffeeThanksText: {
    fontSize: 14,
    color: colors.text[2],
  },
  // 收款码相关样式
  editModeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editModeBtnText: {
    fontSize: 14,
    color: colors.primary[1],
    fontWeight: '500',
  },
  donationItem: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background[2],
    borderRadius: borderRadius.md,
  },
  donationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text[0],
    marginBottom: spacing.md,
  },
  donationQrCode: {
    width: 180,
    height: 180,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF',
  },
  donationHint: {
    fontSize: 12,
    color: colors.text[2],
    marginTop: spacing.sm,
  },
  donationEmpty: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  donationEmptyText: {
    fontSize: 14,
    color: colors.text[2],
  },
  copyBtn: {
    backgroundColor: colors.primary[1],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginVertical: spacing.sm,
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // 编辑模式样式
  donationEditContainer: {
    marginTop: spacing.md,
  },
  donationEditTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text[0],
    marginBottom: spacing.xs,
  },
  donationEditDesc: {
    fontSize: 13,
    color: colors.text[2],
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  donationEditItem: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background[2],
    borderRadius: borderRadius.md,
  },
  donationEditItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  donationEditItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text[0],
  },
  donationInput: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text[0],
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  donationEditHint: {
    fontSize: 12,
    color: colors.primary[1],
    marginTop: spacing.sm,
  },
  saveDonationBtn: {
    backgroundColor: colors.primary[1],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveDonationBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
  // 恢复设置弹窗样式
  restoreModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  restoreModalContent: {
    width: '100%',
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  restoreModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text[0],
    marginBottom: spacing.md,
  },
  restoreModalDesc: {
    fontSize: 14,
    color: colors.text[1],
    marginBottom: spacing.md,
  },
  restoreModalInput: {
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text[0],
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.card.border,
    marginBottom: spacing.md,
  },
  restoreModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  restoreModalCancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background[2],
  },
  restoreModalCancelText: {
    fontSize: 15,
    color: colors.text[1],
    fontWeight: '500',
  },
  restoreModalConfirmBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[1],
  },
  restoreModalConfirmText: {
    fontSize: 15,
    color: colors.text[3],
    fontWeight: '600',
  },
  // AI配置样式
  statusBadgeWarning: {
    backgroundColor: colors.functional.warning + '20',
  },
  statusTextWarning: {
    color: colors.functional.warning,
  },
  providerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  providerSelectorText: {
    fontSize: 15,
    color: colors.text[0],
    fontWeight: '500',
  },
  providerSelectorArrow: {
    fontSize: 12,
    color: colors.text[2],
  },
  providerList: {
    marginTop: spacing.sm,
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.card.border,
    overflow: 'hidden',
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  providerItemActive: {
    backgroundColor: colors.primary[2] + '15',
  },
  providerItemLogo: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  providerItemContent: {
    flex: 1,
  },
  providerItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text[0],
  },
  providerItemNameActive: {
    color: colors.primary[1],
  },
  providerItemModel: {
    fontSize: 11,
    color: colors.text[2],
    marginTop: 2,
  },
  providerItemCheck: {
    fontSize: 16,
    color: colors.primary[1],
    fontWeight: '700',
  },
  inputHint: {
    fontSize: 11,
    color: colors.text[2],
    marginTop: spacing.xs,
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.functional.error,
    marginTop: spacing.md,
  },
  clearButtonText: {
    fontSize: 15,
    color: colors.functional.error,
    fontWeight: '600',
  },
  aiTips: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.functional.infoLight || '#E3F2FD',
    borderRadius: borderRadius.md,
  },
  aiTipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text[0],
    marginBottom: spacing.sm,
  },
  aiTipsText: {
    fontSize: 12,
    color: colors.text[1],
    lineHeight: 20,
  },
});

export default SettingsScreen;

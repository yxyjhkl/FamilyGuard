// src/components/export/ExportConfigPanel.tsx
import React from 'react';
import {View, Text, StyleSheet, Switch, TextInput, ScrollView} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {ExportSettings} from '../../types';
import {mottoList} from '../../data/mottoList';

interface ExportConfigPanelProps {
  settings: ExportSettings;
  onUpdate: (settings: Partial<ExportSettings>) => void;
}

const ExportConfigPanel: React.FC<ExportConfigPanelProps> = ({settings, onUpdate}) => {
  return (
    <ScrollView style={styles.panel}>
      <Text style={styles.panelTitle}>导出配置</Text>

      {/* 金句选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择金句</Text>
        <View style={styles.mottoContainer}>
          {mottoList.slice(0, 5).map((motto, index) => (
            <Text
              key={index}
              style={[
                styles.mottoItem,
                settings.selectedMotto === motto && styles.mottoItemActive,
              ]}
              numberOfLines={2}
              onPress={() => onUpdate({selectedMotto: motto})}>
              {motto}
            </Text>
          ))}
        </View>
        {settings.selectedMotto && (
          <View style={styles.selectedMotto}>
            <Text style={styles.selectedMottoText}>已选：{settings.selectedMotto}</Text>
          </View>
        )}
      </View>

      {/* 隐私开关 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>隐私设置</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>显示客户姓名</Text>
          <Switch
            value={settings.showName}
            onValueChange={v => onUpdate({showName: v})}
            trackColor={{false: colors.card.border, true: colors.functional.success + '60'}}
            thumbColor={settings.showName ? colors.functional.success : colors.text[2]}
          />
        </View>
      </View>

      {/* 业务员信息 */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>显示业务员信息</Text>
          <Switch
            value={settings.showAgentInfo}
            onValueChange={v => onUpdate({showAgentInfo: v})}
            trackColor={{false: colors.card.border, true: colors.primary[2] + '60'}}
            thumbColor={settings.showAgentInfo ? colors.primary[1] : colors.text[2]}
          />
        </View>
        {settings.showAgentInfo && (
          <View style={styles.agentFields}>
            <TextInput
              style={styles.agentInput}
              value={settings.agentName}
              onChangeText={v => onUpdate({agentName: v})}
              placeholder="业务员姓名"
              placeholderTextColor={colors.text[2]}
            />
            <TextInput
              style={styles.agentInput}
              value={settings.agentPhone}
              onChangeText={v => onUpdate({agentPhone: v})}
              placeholder="联系电话"
              keyboardType="phone-pad"
              placeholderTextColor={colors.text[2]}
            />
          </View>
        )}
      </View>

      {/* 自定义备注 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>自定义备注</Text>
        <TextInput
          style={styles.notesInput}
          value={settings.customNotes}
          onChangeText={v => onUpdate({customNotes: v})}
          placeholder="添加备注信息..."
          placeholderTextColor={colors.text[2]}
          multiline
        />
      </View>

      {/* AI总结预留 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI智能总结</Text>
        <View style={styles.aiPlaceholder}>
          <Text style={styles.aiPlaceholderIcon}>🤖</Text>
          <Text style={styles.aiPlaceholderText}>
            AI智能总结即将上线，配置API Key后可自动生成专业的保障检视报告总结。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  panelTitle: {
    ...typography.subheading,
    color: colors.text[0],
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text[1],
    marginBottom: spacing.sm,
  },
  mottoContainer: {
    gap: spacing.sm,
  },
  mottoItem: {
    backgroundColor: colors.background[0],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: 13,
    color: colors.text[1],
    lineHeight: 20,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  mottoItemActive: {
    borderColor: colors.primary[1],
    backgroundColor: colors.primary[2] + '15',
    color: colors.primary[1],
    fontWeight: '500',
  },
  selectedMotto: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background[2],
    borderRadius: borderRadius.sm,
  },
  selectedMottoText: {
    fontSize: 12,
    color: colors.primary[1],
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    fontSize: 14,
    color: colors.text[0],
  },
  agentFields: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  agentInput: {
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text[0],
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  notesInput: {
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text[0],
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  aiPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background[2],
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  aiPlaceholderIcon: {
    fontSize: 24,
  },
  aiPlaceholderText: {
    flex: 1,
    fontSize: 12,
    color: colors.text[2],
    lineHeight: 18,
  },
});

export default ExportConfigPanel;

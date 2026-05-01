// src/screens/FamilySelectScreen.tsx
import React, {useState} from 'react';
import {View, Text, StyleSheet, Alert, TextInput, TouchableOpacity} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import type {FamilyTemplate} from '../types';
import {useFamily} from '../hooks/useFamily';
import AppHeader from '../components/common/AppHeader';
import FamilyStructureGrid from '../components/family/FamilyStructureGrid';
import {colors, typography, spacing, borderRadius} from '../theme';

// 帮助按钮组件
const HelpButton: React.FC<{onPress: () => void}> = ({onPress}) => (
  <TouchableOpacity style={styles.helpButton} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.helpIcon}>❓</Text>
  </TouchableOpacity>
);

type Props = NativeStackScreenProps<RootStackParamList, 'FamilySelect'>;

const FamilySelectScreen: React.FC<Props> = ({navigation}) => {
  const {createFamilyFromTemplate} = useFamily();
  const [showNameInput, setShowNameInput] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FamilyTemplate | null>(null);
  const [familyName, setFamilyName] = useState('');

  const handleSelectTemplate = async (template: FamilyTemplate) => {
    setSelectedTemplate(template);
    setFamilyName(`${template.label}保障检视`);
    setShowNameInput(true);
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    const name = familyName.trim() || `${selectedTemplate.label}保障检视`;
    try {
      const familyId = await createFamilyFromTemplate(
        name,
        selectedTemplate.id,
        selectedTemplate.label,
        selectedTemplate.members,
      );
      navigation.replace('MemberList', {familyId});
    } catch (error) {
      Alert.alert('创建失败', '无法创建家庭，请重试');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title="选择家庭结构"
        rightAction={<HelpButton onPress={() => navigation.navigate('Help')} />}
      />

      <FamilyStructureGrid onSelect={handleSelectTemplate} />

      {/* 名称输入弹层 */}
      {showNameInput && selectedTemplate && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBackdrop}
            onPress={() => setShowNameInput(false)}
            activeOpacity={1}
          />
          <View style={styles.nameDialog}>
            <Text style={styles.dialogTitle}>
              创建{selectedTemplate.label}
            </Text>
            <Text style={styles.dialogDesc}>
              已选择「{selectedTemplate.label}」模板，包含 {selectedTemplate.members.length} 位成员
            </Text>
            <TextInput
              style={styles.nameInput}
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="输入家庭名称（如：张先生一家）"
              placeholderTextColor={colors.text[2]}
              autoFocus
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowNameInput(false)}
                activeOpacity={0.7}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCreate}
                activeOpacity={0.8}>
                <Text style={styles.confirmText}>创建并编辑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  nameDialog: {
    backgroundColor: colors.background[1],
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl + spacing.lg,
  },
  dialogTitle: {
    ...typography.subheading,
    color: colors.text[0],
    marginBottom: spacing.sm,
  },
  dialogDesc: {
    fontSize: 13,
    color: colors.text[2],
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  nameInput: {
    backgroundColor: colors.background[0],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text[0],
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background[2],
    alignItems: 'center',
  },
  cancelText: {
    ...typography.body,
    color: colors.text[1],
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[1],
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary[1],
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  confirmText: {
    ...typography.body,
    color: colors.text[3],
    fontWeight: '600',
  },
});

export default FamilySelectScreen;

// src/components/common/ConfirmDialog.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                destructive && styles.destructiveButton,
              ]}
              onPress={onConfirm}
              activeOpacity={0.7}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  dialog: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    width: '85%',
    maxWidth: 320,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    ...typography.subheading,
    color: colors.text[0],
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.text[1],
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
  },
  cancelButton: {
    backgroundColor: colors.background[2],
  },
  confirmButton: {
    backgroundColor: colors.primary[1],
  },
  destructiveButton: {
    backgroundColor: colors.functional.danger,
  },
  cancelText: {
    ...typography.body,
    color: colors.text[1],
    fontWeight: '500',
  },
  confirmText: {
    ...typography.body,
    color: colors.text[3],
    fontWeight: '600',
  },
});

export default ConfirmDialog;

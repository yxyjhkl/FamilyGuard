// src/components/common/StatusBadge.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, typography, borderRadius, spacing} from '../../theme';

interface StatusBadgeProps {
  status: 'sufficient' | 'partial' | 'missing';
  text?: string;
}

const STATUS_CONFIG = {
  sufficient: {
    bgColor: '#E8F8E8',
    textColor: '#1E7E34',
    dotColor: colors.functional.success,
    label: '充足',
  },
  partial: {
    bgColor: '#FFF3E0',
    textColor: '#B86500',
    dotColor: colors.functional.warning,
    label: '部分覆盖',
  },
  missing: {
    bgColor: '#FFEBEE',
    textColor: '#C62828',
    dotColor: colors.functional.danger,
    label: '缺失',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({status, text}) => {
  // 确保 status 是有效的值
  const validStatus = (status === 'sufficient' || status === 'partial' || status === 'missing') 
    ? status 
    : 'missing';
  const config = STATUS_CONFIG[validStatus];

  return (
    <View style={[styles.badge, {backgroundColor: config.bgColor}]}>
      <View style={[styles.dot, {backgroundColor: config.dotColor}]} />
      <Text style={[styles.label, {color: config.textColor}]}>{text || config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default StatusBadge;

// src/components/common/ProgressRing.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, typography} from '../../theme';

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showPercent?: boolean;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  color = colors.functional.success,
  label,
  showPercent = true,
}) => {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const halfSize = size / 2;
  const radius = halfSize - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const filledLength = circumference * clampedProgress;
  const emptyLength = circumference - filledLength;

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      {/* 背景圆环 */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: halfSize,
            borderWidth: strokeWidth,
            borderColor: colors.card.border,
          },
        ]}
      />
      {/* 进度圆环 */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: halfSize,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: color,
            borderRightColor: clampedProgress > 0.75 ? color : 'transparent',
            borderBottomColor: clampedProgress > 0.5 ? color : 'transparent',
            borderLeftColor: clampedProgress > 0.25 ? color : 'transparent',
            transform: [{rotate: '-45deg'}],
          },
        ]}
      />
      {/* 中心文字 */}
      <View style={styles.center}>
        {showPercent && (
          <Text style={[styles.percent, {color}]}>
            {Math.round(clampedProgress * 100)}%
          </Text>
        )}
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    color: colors.text[2],
    marginTop: 2,
  },
});

export default ProgressRing;

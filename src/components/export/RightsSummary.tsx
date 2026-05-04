// src/components/export/RightsSummary.tsx
import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import type {MemberRight} from '../../types';
import {useSettings} from '../../store/settingsStore';

interface RightsSummaryProps {
  rights: MemberRight[];
}

const RightsSummary: React.FC<RightsSummaryProps> = ({rights}) => {
  const {getRightConfig} = useSettings();
  const activeRights = rights.filter(r => r.hasRight);

  if (activeRights.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>保险权益：暂无</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>保险权益：</Text>
      <View style={styles.tags}>
        {activeRights.map(right => {
          const config = getRightConfig(right.id);
          const label = config?.label || right.id;
          return (
            <View key={right.id} style={styles.tag}>
              <Text style={styles.tagText}>
                {label}
                {right.validityDate ? `(至${right.validityDate})` : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.card.border + '60',
  },
  sectionLabel: {
    fontSize: 10,
    color: colors.text[2],
    marginBottom: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: '#E8F8E8',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: 9,
    color: '#1E7E34',
    fontWeight: '500',
  },
});

export default RightsSummary;

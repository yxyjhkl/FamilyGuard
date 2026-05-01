// src/components/family/FamilyStructureGrid.tsx
import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import {familyTemplates} from '../../data/familyTemplates';
import type {FamilyTemplate} from '../../types';
import {MEMBER_ROLE_LABELS} from '../../types';
import RoleAvatar from '../common/RoleAvatar';

interface FamilyStructureGridProps {
  onSelect: (template: FamilyTemplate) => void;
}

const FamilyStructureGrid: React.FC<FamilyStructureGridProps> = ({onSelect}) => {
  const [tab, setTab] = useState<'all' | 'common' | 'special'>('all');

  const filtered =
    tab === 'all'
      ? familyTemplates
      : familyTemplates.filter(t => t.category === tab);

  const tabs = [
    {key: 'all' as const, label: '全部'},
    {key: 'common' as const, label: '常见家庭'},
    {key: 'special' as const, label: '多元家庭'},
  ];

  return (
    <View style={styles.container}>
      {/* 分类 Tab */}
      <View style={styles.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.7}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 模板网格 */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.grid}>
          {filtered.map(template => (
            <TouchableOpacity
              key={template.id}
              style={styles.card}
              onPress={() => onSelect(template)}
              activeOpacity={0.8}>
              {/* 人物图标组合 */}
              <View style={styles.iconRow}>
                {template.members.map((m, i) => (
                  <View
                    key={i}
                    style={[
                      styles.memberIcon,
                      {backgroundColor: MEMBER_ROLE_LABELS[m.role] === '丈夫' || MEMBER_ROLE_LABELS[m.role] === '父亲'
                        ? colors.primary[2]
                        : MEMBER_ROLE_LABELS[m.role] === '妻子' || MEMBER_ROLE_LABELS[m.role] === '母亲'
                        ? colors.functional.purple
                        : MEMBER_ROLE_LABELS[m.role] === '爷爷' || MEMBER_ROLE_LABELS[m.role] === '奶奶'
                        ? '#FF9800'
                        : colors.functional.info}]}>
                    <RoleAvatar role={m.role} size={28} />
                  </View>
                ))}
              </View>

              <Text style={styles.name}>{template.label}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {template.description}
              </Text>
              <Text style={styles.memberList}>
                {template.members.map(m => MEMBER_ROLE_LABELS[m.role]).join(' + ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background[2],
  },
  tabActive: {
    backgroundColor: colors.primary[1],
  },
  tabText: {
    fontSize: 13,
    color: colors.text[1],
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text[3],
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  card: {
    width: '46%',
    marginHorizontal: '2%',
    marginBottom: spacing.md,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  memberIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberIconText: {
    fontSize: 12,
    color: colors.text[3],
    fontWeight: '700',
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text[0],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 11,
    color: colors.text[2],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  memberList: {
    fontSize: 10,
    color: colors.text[2],
    textAlign: 'center',
  },
});

export default FamilyStructureGrid;

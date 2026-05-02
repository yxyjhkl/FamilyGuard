// src/screens/HomeScreen.tsx
import React, {useCallback, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList, Family} from '../types';
import {useFamily} from '../hooks/useFamily';
import FamilyCard from '../components/family/FamilyCard';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {colors, typography, spacing, borderRadius} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {families, loading, reloadFamilies, deleteFamily} = useFamily();
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Family | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reloadFamilies();
    setRefreshing(false);
  }, [reloadFamilies]);

  const handleFamilyPress = useCallback(
    (family: Family) => {
      navigation.navigate('MemberList', {familyId: family.id});
    },
    [navigation],
  );

  const handleDelete = useCallback(async () => {
    if (deleteTarget) {
      await deleteFamily(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteFamily]);

  const renderItem = useCallback(
    ({item}: {item: Family}) => (
      <FamilyCard
        family={item}
        onPress={handleFamilyPress}
        onLongPress={setDeleteTarget}
      />
    ),
    [handleFamilyPress],
  );

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appTitle}>家庭保障检视</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => navigation.navigate('Help')}
              activeOpacity={0.7}>
              <Text style={styles.helpIcon}>❓</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.appSubtitle}>
          已创建 {families.length} 个家庭
        </Text>
      </View>

      {/* 家庭列表 */}
      <FlatList
        data={families}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={
          families.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="🏠"
              title="创建第一个家庭"
              description="选择家庭结构，快速录入保障信息，生成专业的保障检视图分享给客户"
              actionLabel="新建家庭"
              onAction={() => navigation.navigate('FamilySelect')}
            />
          ) : null
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#666"
          />
        }
      />

      {/* 新建按钮 FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('FamilySelect')}
        activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* 删除确认 */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="删除家庭"
        message={`确定要删除"${deleteTarget?.name}"及其所有保障数据吗？此操作不可恢复。`}
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  header: {
    paddingTop: spacing.xxxl + spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background[1],
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    elevation: 4,
    shadowColor: colors.card.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
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
  appTitle: {
    ...typography.heading,
    color: colors.text[0],
  },
  appSubtitle: {
    ...typography.caption,
    color: colors.text[2],
    marginTop: spacing.xs,
  },
  listContent: {
    paddingVertical: spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xxxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[1],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary[1],
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.text[3],
    fontWeight: '300',
    marginTop: -2,
  },
});

export default HomeScreen;

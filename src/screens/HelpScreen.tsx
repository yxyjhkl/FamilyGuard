// src/screens/HelpScreen.tsx - 帮助中心屏幕
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import {helpContent, type HelpItem, type HelpCategory} from '../data/helpContent';
import AppHeader from '../components/common/AppHeader';
import {colors, typography, spacing, borderRadius} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;

const HelpScreen: React.FC<Props> = ({navigation}) => {
  const [searchText, setSearchText] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // 过滤帮助内容
  const filteredContent = useCallback(() => {
    if (!searchText.trim()) {
      return helpContent;
    }
    const keyword = searchText.toLowerCase();
    return helpContent
      .map(category => ({
        ...category,
        items: category.items.filter(
          item =>
            item.title.toLowerCase().includes(keyword) ||
            item.content.toLowerCase().includes(keyword),
        ),
      }))
      .filter(category => category.items.length > 0);
  }, [searchText]);

  const handleItemPress = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const renderCategory = (category: HelpCategory) => (
    <View key={category.id} style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <Text style={styles.categoryTitle}>{category.title}</Text>
      </View>
      {category.items.map(item => renderHelpItem(item))}
    </View>
  );

  const renderHelpItem = (item: HelpItem) => {
    const isExpanded = expandedItem === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.helpItem}
        onPress={() => handleItemPress(item.id)}
        activeOpacity={0.7}>
        <View style={styles.helpItemHeader}>
          <Text style={styles.helpItemIcon}>{item.icon}</Text>
          <Text style={styles.helpItemTitle}>{item.title}</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
        {isExpanded && (
          <View style={styles.helpItemContent}>
            <Text style={styles.contentText}>{item.content}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="帮助中心"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearch(!showSearch)}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        }
      />

      {/* 搜索栏 */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索帮助内容..."
            placeholderTextColor={colors.text[3]}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 搜索提示 */}
        {searchText.length === 0 && (
          <View style={styles.searchTip}>
            <Text style={styles.searchTipText}>
              💡 点击右上角🔍可搜索帮助内容
            </Text>
          </View>
        )}

        {/* 搜索结果提示 */}
        {searchText.length > 0 && (
          <View style={styles.searchResultTip}>
            <Text style={styles.searchResultText}>
              找到 {filteredContent().reduce((sum, c) => sum + c.items.length, 0)} 个相关结果
            </Text>
          </View>
        )}

        {/* 帮助内容列表 */}
        {filteredContent().map(renderCategory)}

        {/* 底部提示 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>如有更多问题，请联系您的保险代理人</Text>
        </View>
      </ScrollView>

      {/* 快捷入口 */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {
            setSearchText('');
            setExpandedItem('create_family');
          }}>
          <Text style={styles.quickActionIcon}>🏠</Text>
          <Text style={styles.quickActionText}>创建家庭</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {
            setSearchText('');
            setExpandedItem('add_member');
          }}>
          <Text style={styles.quickActionIcon}>👥</Text>
          <Text style={styles.quickActionText}>添加成员</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {
            setSearchText('');
            setExpandedItem('export_report');
          }}>
          <Text style={styles.quickActionIcon}>📄</Text>
          <Text style={styles.quickActionText}>导出报告</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background[0],
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    ...typography.body,
    color: colors.text[0],
  },
  clearButton: {
    padding: spacing.sm,
    color: colors.text[2],
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
  },
  searchTip: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.functional.infoLight || '#E3F2FD',
    borderRadius: borderRadius.lg,
  },
  searchTipText: {
    ...typography.caption,
    color: colors.primary[1],
    textAlign: 'center',
  },
  searchResultTip: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  searchResultText: {
    ...typography.caption,
    color: colors.text[2],
  },
  categorySection: {
    marginTop: spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  categoryTitle: {
    ...typography.subheading,
    color: colors.text[0],
  },
  helpItem: {
    backgroundColor: colors.background[1],
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  helpItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  helpItemIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  helpItemTitle: {
    ...typography.body,
    color: colors.text[0],
    flex: 1,
  },
  expandIcon: {
    fontSize: 12,
    color: colors.text[2],
  },
  helpItemContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  contentText: {
    ...typography.body,
    color: colors.text[1],
    lineHeight: 24,
  },
  footer: {
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.text[2],
  },
  quickActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background[1],
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  quickAction: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  quickActionText: {
    ...typography.caption,
    color: colors.text[1],
  },
});

export default HelpScreen;

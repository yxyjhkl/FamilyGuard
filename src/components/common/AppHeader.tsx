// src/components/common/AppHeader.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {colors, typography, spacing, borderRadius} from '../../theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({title, subtitle, showBack = true, rightAction, onBack}) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.titleArea}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.rightSection}>{rightAction}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  leftSection: {
    width: 44,
    alignItems: 'flex-start',
  },
  rightSection: {
    width: 44,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.primary[1],
    fontWeight: '600',
  },
  titleArea: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...typography.subheading,
    color: colors.text[0],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[1],
    marginTop: 2,
  },
});

export default AppHeader;

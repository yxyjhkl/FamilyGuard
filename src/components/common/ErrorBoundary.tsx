// src/components/common/ErrorBoundary.tsx
// React 错误边界组件 — 捕获子组件渲染错误，防止整页崩溃

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, typography, spacing, borderRadius} from '../../theme';
import {logger} from '../../utils/logger';

const MODULE = 'ErrorBoundary';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** 自定义错误提示 */
  fallbackMessage?: string;
  /** 错误恢复回调 */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error(MODULE, '组件渲染崩溃', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = (): void => {
    this.setState({hasError: false, error: null});
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>
            {this.props.fallbackMessage || '页面出现异常'}
          </Text>
          <Text style={styles.message}>
            {this.state.error?.message || '未知错误'}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleReset}
            activeOpacity={0.7}>
            <Text style={styles.buttonText}>重新加载</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background[0],
    padding: spacing.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subheading,
    color: colors.text[0],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.text[2],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[1],
    borderRadius: borderRadius.md,
  },
  buttonText: {
    ...typography.body,
    color: colors.text[3],
    fontWeight: '600',
  },
});

export default ErrorBoundary;

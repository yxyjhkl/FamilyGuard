// src/theme/index.ts

import {MD3LightTheme, configureFonts} from 'react-native-paper';
import type {MD3Theme} from 'react-native-paper';
import {colors} from './colors';
import {typography} from './typography';

const fontConfig = {
  fontFamily: typography.fontFamily,
};

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary[1],
    primaryContainer: colors.primary[2],
    secondary: colors.functional.gold,
    background: colors.background[0],
    surface: colors.background[1],
    surfaceVariant: colors.background[2],
    error: colors.functional.danger,
    onPrimary: colors.text[3],
    onBackground: colors.text[0],
    onSurface: colors.text[0],
    outline: colors.card.border,
  },
  fonts: configureFonts({config: fontConfig}),
};

export {colors} from './colors';
export {typography} from './typography';
export {spacing, borderRadius, iconSize} from './spacing';

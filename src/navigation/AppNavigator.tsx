// src/navigation/AppNavigator.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import HomeScreen from '../screens/HomeScreen';
import FamilySelectScreen from '../screens/FamilySelectScreen';
import MemberListScreen from '../screens/MemberListScreen';
import MemberDetailScreen from '../screens/MemberDetailScreen';
import ExportPreviewScreen from '../screens/ExportPreviewScreen';
import MemberDetailExportScreen from '../screens/MemberDetailExportScreen';
import AIAnalysisScreen from '../screens/AIAnalysisScreen';
import HelpScreen from '../screens/HelpScreen';
import SettingsScreen from '../screens/SettingsScreen';
import {colors} from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.background[0]},
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="FamilySelect" component={FamilySelectScreen} />
      <Stack.Screen name="MemberList" component={MemberListScreen} />
      <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
      <Stack.Screen name="ExportPreview" component={ExportPreviewScreen} />
      <Stack.Screen name="MemberDetailExport" component={MemberDetailExportScreen} />
      <Stack.Screen name="AIAnalysis" component={AIAnalysisScreen} />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;

import React, {useEffect} from 'react';
import {View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {PaperProvider} from 'react-native-paper';
import {FamilyProvider} from './src/store/familyStore';
import {SettingsProvider} from './src/store/settingsStore';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import {theme} from './src/theme';
import {aiService} from './src/services/aiService';

const App: React.FC = () => {
  // 应用启动时加载AI配置
  useEffect(() => {
    aiService.loadConfig();
  }, []);

  return (
    <View style={{flex: 1}}>
      <ErrorBoundary fallbackMessage="应用遇到意外错误，请重新加载">
        <PaperProvider theme={theme}>
          <FamilyProvider>
            <SettingsProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </SettingsProvider>
          </FamilyProvider>
        </PaperProvider>
      </ErrorBoundary>
    </View>
  );
};

export default App;

import React from 'react';
import {View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {PaperProvider} from 'react-native-paper';
import {FamilyProvider} from './src/store/familyStore';
import {SettingsProvider} from './src/store/settingsStore';
import AppNavigator from './src/navigation/AppNavigator';
import {theme} from './src/theme';

const App: React.FC = () => {
  return (
    <View style={{flex: 1}}>
      <PaperProvider theme={theme}>
        <FamilyProvider>
          <SettingsProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </SettingsProvider>
        </FamilyProvider>
      </PaperProvider>
    </View>
  );
};

export default App;

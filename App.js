import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import * as Device from 'expo-device';
import { LogBox } from 'react-native';

function App() {
  useEffect(() => {
    // Ignore Expo Go notifications warnings
    if (!Device.isDevice) {
      LogBox.ignoreLogs([
        "Warning: TypeError: Cannot read property 'Type' of undefined",
        "`expo-notifications` functionality is not fully supported in Expo Go",
      ]);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ProgressionProvider } from './src/context/ProgressionContext';
import { StreakProvider } from './src/context/StreakContext';
import { RootNavigator } from './src/navigation/RootNavigator';


export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StreakProvider>
          <ProgressionProvider>
            <RootNavigator />
            <StatusBar style="dark" />
          </ProgressionProvider>
        </StreakProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

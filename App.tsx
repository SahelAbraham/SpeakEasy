import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { StreakProvider } from './src/context/StreakContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StreakProvider>
          <RootNavigator />
          <StatusBar style="dark" />
        </StreakProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

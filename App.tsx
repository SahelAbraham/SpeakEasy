import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { ProgressionProvider } from './src/context/ProgressionContext';
import { StreakProvider } from './src/context/StreakContext';
import { TrackThemeProvider } from './src/context/TrackThemeContext';

import { RootNavigator } from './src/navigation/RootNavigator';
import { SessionProvider } from './src/context/SessionContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SessionProvider>
          <TrackThemeProvider>
            <StreakProvider>
              <ProgressionProvider>
                <RootNavigator />
                <StatusBar style="dark" />
              </ProgressionProvider>
            </StreakProvider>
          </TrackThemeProvider>
        </SessionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
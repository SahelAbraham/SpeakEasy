import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useTrackTheme } from '../context/TrackThemeContext';

import { InitSurvey } from '../screens/InitSurvey';

import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { theme } = useTrackTheme();

  if (isLoading) {
    return (
      <View
        style={[
          styles.loading,
          {
            backgroundColor: theme.soft,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.primary}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          <Stack.Screen
            name="Auth"
            component={AuthStack}
          />
        ) : !user.completedSurvey ? (
          <Stack.Screen
            name="Survey"
            component={InitSurvey}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={MainTabs}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { DashboardHeaderTitle } from '../components/DashboardHeaderTitle';

import { useTrackTheme } from '../context/TrackThemeContext';

import { DashboardScreen } from '../screens/DashboardScreen';
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen';
import { LearningPathScreen } from '../screens/LearningPathScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgressionScreen } from '../screens/ProgressionScreen';

import { colors } from '../theme/colors';

import {
  HomeStackParamList,
  MainTabParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack =
  createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  const { theme } = useTrackTheme();

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.soft,
        },
        headerTintColor: theme.primaryDark,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <HomeStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: () => <DashboardHeaderTitle />,
        }}
      />

      <HomeStack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
      />
    </HomeStack.Navigator>
  );
}

export function MainTabs() {
  const { theme } = useTrackTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: colors.textMuted,

        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          title: 'Practice',

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="LearningPath"
        component={LearningPathScreen}
        options={{
          title: 'Learning Path',
          headerShown: true,

          headerStyle: {
            backgroundColor: theme.soft,
          },

          headerTitleStyle: {
            color: theme.primaryDark,
            fontWeight: '700',
          },

          headerTintColor: theme.primaryDark,

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="map-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Progression"
        component={ProgressionScreen}
        options={{
          title: 'Progression',
          headerShown: true,

          headerStyle: {
            backgroundColor: theme.soft,
          },

          headerTitleStyle: {
            color: theme.primaryDark,
            fontWeight: '700',
          },

          headerTintColor: theme.primaryDark,

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="trending-up-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'User',
          headerShown: true,

          headerStyle: {
            backgroundColor: theme.soft,
          },

          headerTitleStyle: {
            color: theme.primaryDark,
            fontWeight: '700',
          },

          headerTintColor: theme.primaryDark,

          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { DashboardHeaderTitle } from '../components/DashboardHeaderTitle';
import { colors } from '../theme/colors';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgressionScreen } from '../screens/ProgressionScreen';
import { HomeStackParamList, MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.accentLight },
        headerTintColor: colors.primaryDark,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <HomeStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerTitle: () => <DashboardHeaderTitle /> }}
      />
      <HomeStack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </HomeStack.Navigator>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
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
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Progression"
        component={ProgressionScreen}
        options={{
          title: 'Progression',
          headerShown: true,
          headerStyle: { backgroundColor: colors.accentLight },
          headerTitleStyle: { color: colors.primaryDark, fontWeight: '700' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'User',
          headerShown: true,
          headerStyle: { backgroundColor: colors.accentLight },
          headerTitleStyle: { color: colors.primaryDark, fontWeight: '700' },
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { LearningAreaProgress } from '../components/LearningAreaProgress';
import { TaskSection } from '../components/TaskSection';
import { DAILY_TASKS, AREA_TASKS } from '../constants/tasks';
import { LEARNING_AREAS } from '../constants/learningAreas';
import { MainStackParamList, MainTabParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Dashboard'>,
  NativeStackScreenProps<MainStackParamList>
>;

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.heroSubtitle}>Your speech therapy journey</Text>
      </LinearGradient>

      <View style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Learning Progress</Text>
        <LearningAreaProgress progress={user.progress} />
      </View>

      <View style={styles.tasksContainer}>
        <TaskSection
          title="Daily Tasks"
          subtitle="Start your day with these exercises"
          accentColor={colors.secondary}
          tasks={DAILY_TASKS}
          onTaskPress={(task) => navigation.navigate('TaskDetail', { taskId: task.id })}
        />

        {LEARNING_AREAS.map((area) => (
          <TaskSection
            key={area.id}
            title={`${area.label} Tasks`}
            subtitle={area.description}
            accentColor={area.color}
            tasks={AREA_TASKS[area.id]}
            onTaskPress={(task) => navigation.navigate('TaskDetail', { taskId: task.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  hero: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  username: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginTop: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  progressCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  tasksContainer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
});

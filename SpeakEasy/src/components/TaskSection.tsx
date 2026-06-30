import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Task } from '../types';
import { TaskCard } from './TaskCard';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';

interface TaskSectionProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  tasks: Task[];
  onTaskPress: (task: Task) => void;
}

export function TaskSection({
  title,
  subtitle,
  accentColor = colors.primary,
  tasks,
  onTaskPress,
}: TaskSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.list}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onPress={() => onTaskPress(task)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  accent: {
    width: 4,
    height: 32,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {},
});

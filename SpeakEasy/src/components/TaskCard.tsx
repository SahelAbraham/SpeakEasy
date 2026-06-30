import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Task } from '../types';
import { getAreaConfig } from '../constants/learningAreas';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

export function TaskCard({ task, onPress }: TaskCardProps) {
  const areaConfig = task.area ? getAreaConfig(task.area) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: areaConfig
                ? `${areaConfig.color}18`
                : `${colors.primary}18`,
            },
          ]}
        >
          <Ionicons
            name={
              task.isDaily
                ? 'sunny'
                : (areaConfig?.icon as keyof typeof Ionicons.glyphMap) ?? 'mic'
            }
            size={20}
            color={areaConfig?.color ?? colors.primary}
          />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{task.title}</Text>
          {task.isDaily ? (
            <Text style={styles.subtitle}>Daily task</Text>
          ) : areaConfig ? (
            <Text style={[styles.subtitle, { color: areaConfig.color }]}>
              {areaConfig.label}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

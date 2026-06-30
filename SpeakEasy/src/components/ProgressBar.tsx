import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';

interface ProgressBarProps {
  label: string;
  value: number;
  color: string;
  icon?: string;
  compact?: boolean;
}

export function ProgressBar({
  label,
  value,
  color,
  compact = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={styles.header}>
        <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
        <Text style={[styles.percent, compact && styles.percentCompact, { color }]}>
          {clamped}%
        </Text>
      </View>
      <View style={[styles.track, compact && styles.trackCompact]}>
        <View
          style={[
            styles.fill,
            { width: `${clamped}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  compact: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  labelCompact: {
    fontSize: 13,
  },
  percent: {
    fontSize: 13,
    fontWeight: '700',
  },
  percentCompact: {
    fontSize: 12,
  },
  track: {
    height: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  trackCompact: {
    height: 8,
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});

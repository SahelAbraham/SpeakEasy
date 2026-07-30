import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { percentColor, useProgression } from '../context/ProgressionContext';
import { cardAccents, colors } from '../theme/colors';
import { CompletedExerciseSet } from '../types/progression';

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function SetCard({ set, index }: { set: CompletedExerciseSet; index: number }) {
  const barColor = percentColor(set.percentCorrect);
  const accent = cardAccents[index % cardAccents.length];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.setBadge, { backgroundColor: accent.bg }]}>
          <Text style={[styles.setBadgeText, { color: accent.text }]}>Set {index + 1}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(set.completedAt)}</Text>
      </View>

      <View style={styles.scoreRow}>
        <Text style={[styles.percentText, { color: barColor }]}>{set.percentCorrect}%</Text>
        <Text style={styles.scoreLabel}>correct</Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${set.percentCorrect}%`, backgroundColor: barColor }]}
        />
      </View>

      <Text style={styles.exerciseCount}>
        {set.exerciseCount} exercises completed
      </Text>
    </View>
  );
}

export function ProgressionScreen() {
  const { recentSets, isLoading } = useProgression();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your progression</Text>
        <Text style={styles.subtitle}>
          Review your recent exercise sets and see where to improve.
        </Text>
      </View>

      {recentSets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No completed sets yet</Text>
          <Text style={styles.emptyText}>
            Finish a flight of exercises to see your scores here.
          </Text>
        </View>
      ) : (
        recentSets.map((set, index) => (
          <SetCard key={set.id} set={set} index={index} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 8,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  setBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  percentText: {
    fontSize: 36,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 16,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.yellowMuted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  exerciseCount: {
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  percentColor,
  useProgression,
} from '../context/ProgressionContext';

import { useTrackTheme } from '../context/TrackThemeContext';

import { CompletedExerciseSet } from '../types/progression';

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function SetCard({
  set,
  index,
}: {
  set: CompletedExerciseSet;
  index: number;
}) {
  const { theme } = useTrackTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.setBadge,
            {
              backgroundColor: theme.performanceLight,
            },
          ]}
        >
          <Text
            style={[
              styles.setBadgeText,
              {
                color: theme.performance,
              },
            ]}
          >
            Set {index + 1}
          </Text>
        </View>

        <Text
          style={[
            styles.dateText,
            {
              color: theme.textMuted,
            },
          ]}
        >
          {formatDate(set.completedAt)}
        </Text>
      </View>

      <View style={styles.scoreRow}>
        <Text
          style={[
            styles.percentText,
            {
              color: theme.performance,
            },
          ]}
        >
          {set.percentCorrect}%
        </Text>

        <Text
          style={[
            styles.scoreLabel,
            {
              color: theme.textMuted,
            },
          ]}
        >
          correct
        </Text>
      </View>

      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: theme.performanceTrack,
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${set.percentCorrect}%`,
              backgroundColor: theme.performance,
            },
          ]}
        />
      </View>

      <Text
        style={[
          styles.exerciseCount,
          {
            color: theme.textMuted,
          },
        ]}
      >
        {set.exerciseCount} exercises completed
      </Text>
    </View>
  );
}

export function ProgressionScreen() {
  const { recentSets, isLoading } =
    useProgression();

  const { theme } = useTrackTheme();

  if (isLoading) {
    return (
      <View
        style={[
          styles.loading,
          {
            backgroundColor: theme.background,
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
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
            },
          ]}
        >
          Your progression
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: theme.textMuted,
            },
          ]}
        >
          Review your recent exercise sets and see
          where to improve.
        </Text>
      </View>

      {recentSets.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor:
                theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.emptyTitle,
              {
                color: theme.text,
              },
            ]}
          >
            No completed sets yet
          </Text>

          <Text
            style={[
              styles.emptyText,
              {
                color: theme.textMuted,
              },
            ]}
          >
            Finish a flight of exercises to see your
            scores here.
          </Text>
        </View>
      ) : (
        recentSets.map((set, index) => (
          <SetCard
            key={set.id}
            set={set}
            index={index}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },

  loading: {
    flex: 1,
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
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
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
  },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  exerciseCount: {
    fontSize: 13,
  },

  emptyCard: {
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },

  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  CompletedSession,
  SubtrackDelta,
  deltaColor,
  useProgression,
} from '../context/ProgressionContext';

import { useTrackTheme } from '../context/TrackThemeContext';

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatDelta(delta: number): string {
  const points = Math.round(delta * 100);
  if (points > 0) return `+${points}`;
  if (points < 0) return `${points}`;
  return '—';
}

function deltaIcon(delta: number): 'trending-up' | 'trending-down' | 'remove' {
  if (delta > 0.02) return 'trending-up';
  if (delta < -0.02) return 'trending-down';
  return 'remove';
}

function SubtrackRow({ subtrack }: { subtrack: SubtrackDelta }) {
  const { theme } = useTrackTheme();
  const color = deltaColor(subtrack.delta);

  return (
    <View style={styles.subtrackRow}>
      <Text style={[styles.subtrackLabel, { color: theme.text }]}>
        {subtrack.label}
      </Text>

      <View style={styles.subtrackDeltaGroup}>
        <Ionicons name={deltaIcon(subtrack.delta)} size={16} color={color} />
        <Text style={[styles.subtrackDeltaText, { color }]}>
          {formatDelta(subtrack.delta)}
        </Text>
      </View>
    </View>
  );
}

function SessionCard({ session }: { session: CompletedSession }) {
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
            { backgroundColor: theme.performanceLight },
          ]}
        >
          <Text style={[styles.setBadgeText, { color: theme.performance }]}>
            {session.label.replace('_', ' ')}
          </Text>
        </View>

        <Text style={[styles.dateText, { color: theme.textMuted }]}>
          {formatDate(session.completedAt)}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {session.subtrackDeltas.map((subtrack) => (
        <SubtrackRow key={subtrack.trackId} subtrack={subtrack} />
      ))}
    </View>
  );
}

export function ProgressionScreen() {
  const { recentSessions, isLoading } = useProgression();
  const { theme } = useTrackTheme();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Your progression
        </Text>

        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          See how each subtrack changed over your last few completed
          sessions. Your current session isn't shown until you start
          a new one.
        </Text>
      </View>

      {recentSessions.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No completed sessions yet
          </Text>

          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Finish a session and start a new one to see your progress here.
          </Text>
        </View>
      ) : (
        recentSessions.map((session) => (
          <SessionCard key={session.id} session={session} />
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
    gap: 4,
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
    textTransform: 'capitalize',
  },

  dateText: {
    fontSize: 13,
  },

  divider: {
    height: 1,
    marginVertical: 10,
  },

  subtrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },

  subtrackLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  subtrackDeltaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  subtrackDeltaText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
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
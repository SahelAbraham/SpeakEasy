import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStreak } from '../context/StreakContext';
import { PLACEHOLDER_EXERCISES } from '../data/placeholderExercises';
import { HomeStackParamList } from '../navigation/types';
import { cardAccents, colors } from '../theme/colors';
import { Exercise } from '../types/exercise';

type Navigation = NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>;

export function DashboardScreen() {
  const navigation = useNavigation<Navigation>();
  const { streak, recordDailyVisit } = useStreak();

  useEffect(() => {
    void recordDailyVisit();
  }, [recordDailyVisit]);

  const openExercise = useCallback(
    (exercise: Exercise) => {
      navigation.navigate('ExerciseDetail', {
        exerciseId: exercise.id,
        title: exercise.title,
        body: exercise.body,
      });
    },
    [navigation],
  );

  return (
    <View style={styles.container}>
      <View style={styles.streakCard}>
        <Text style={styles.streakLabel}>Daily streak</Text>
        <Text style={styles.streakValue}>{streak} day{streak === 1 ? '' : 's'}</Text>
        <Text style={styles.streakHint}>Practice every day to grow your streak!</Text>
      </View>

      <Text style={styles.sectionTitle}>Today&apos;s exercises</Text>

      <FlatList
        data={PLACEHOLDER_EXERCISES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const accent = cardAccents[index % cardAccents.length];
          return (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => openExercise(item)}
          >
            <View style={[styles.cardBadge, { backgroundColor: accent.bg }]}>
              <Text style={[styles.cardBadgeText, { color: accent.text }]}>{index + 1}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardPreview} numberOfLines={2}>
                {item.body}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  streakCard: {
    backgroundColor: colors.yellow,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.yellowMuted,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.streak,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakValue: {
    marginTop: 4,
    fontSize: 32,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  streakHint: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardPressed: {
    backgroundColor: colors.sageLight,
  },
  cardBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeText: {
    fontWeight: '700',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cardPreview: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  chevron: {
    fontSize: 24,
    color: colors.sage,
    marginTop: -2,
  },
});

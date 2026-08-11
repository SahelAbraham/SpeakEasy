import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useStreak } from '../context/StreakContext';
import { useTrackTheme } from '../context/TrackThemeContext';
import { useExercise } from '../context/ExerciseContext';

import { HomeStackParamList } from '../navigation/types';

type Navigation = NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>;

export function DashboardScreen() {
  const navigation = useNavigation<Navigation>();

  const { streak, recordDailyVisit } = useStreak();

  const { theme } = useTrackTheme();
  const { currentExercise, isLoadingExercise } = useExercise();

  useEffect(() => {
    void recordDailyVisit();
  }, [recordDailyVisit]);

  const openExercise = useCallback(() => {
    navigation.navigate('ExerciseDetail');
  }, [navigation]);

  if (isLoadingExercise || !currentExercise) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: theme.background,
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
          {isLoadingExercise ? 'Loading your next question…' : "You're all caught up!"}
        </Text>

        <Text
          style={[
            styles.emptyText,
            {
              color: theme.textMuted,
            },
          ]}
        >
          {isLoadingExercise
            ? 'Just a moment.'
            : 'Check back later for your next exercise.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Streak */}

      <View
        style={[
          styles.streakCard,
          {
            backgroundColor: theme.surfaceAlt,
            borderColor: theme.border,
          },
        ]}
      >
        <View>
          <Text
            style={[
              styles.streakLabel,
              {
                color: theme.primary,
              },
            ]}
          >
            Daily streak
          </Text>

          <Text
            style={[
              styles.streakValue,
              {
                color: theme.primaryDark,
              },
            ]}
          >
            {streak} day{streak === 1 ? '' : 's'}
          </Text>

          <Text
            style={[
              styles.streakHint,
              {
                color: theme.textMuted,
              },
            ]}
          >
            Practice every day to grow your streak!
          </Text>
        </View>

        <View
          style={[
            styles.streakIcon,
            {
              backgroundColor: theme.iconBackgroundStrong,
            },
          ]}
        >
          <Text style={styles.streakIconText}>🔥</Text>
        </View>
      </View>

      {/* Next Exercise */}

      <Text
        style={[
          styles.sectionLabel,
          {
            color: theme.textMuted,
          },
        ]}
      >
        UP NEXT
      </Text>

      <View
        style={[
          styles.nextCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <View style={styles.nextHeader}>
          <View style={styles.nextHeaderText}>
            <Text
              style={[
                styles.nextLabel,
                {
                  color: theme.text,
                },
              ]}
            >
              Your next question
            </Text>

            <Text
              style={[
                styles.nextSubtext,
                {
                  color: theme.textMuted,
                },
              ]}
            >
              Complete one question at a time
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.border,
            },
          ]}
        />

        <Text
          style={[
            styles.questionTitle,
            {
              color: theme.text,
            },
          ]}
        >
          {currentExercise.title}
        </Text>

        <Text
          style={[
            styles.questionPreview,
            {
              color: theme.textMuted,
            },
          ]}
        >
          {currentExercise.instructions}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            {
              backgroundColor: pressed
                ? theme.buttonPressed
                : theme.buttonBackground,
            },
          ]}
          onPress={openExercise}
        >
          <Text
            style={[
              styles.startButtonText,
              {
                color: theme.buttonText,
              },
            ]}
          >
            Start question
          </Text>

          <Text
            style={[
              styles.startButtonArrow,
              {
                color: theme.buttonText,
              },
            ]}
          >
            →
          </Text>
        </Pressable>
      </View>

      {/* Progress */}

      <View
        style={[
          styles.progressCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <View style={styles.progressHeader}>
          <View>
            <Text
              style={[
                styles.progressTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Your progress
            </Text>

            <Text
              style={[
                styles.progressSubtitle,
                {
                  color: theme.textMuted,
                },
              ]}
            >
              Keep building your skills
            </Text>
          </View>

          <Text
            style={[
              styles.progressCount,
              {
                color: theme.primary,
              },
            ]}
          >
            Ready
          </Text>
        </View>

        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: theme.progressTrack,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.progressFill,
              },
            ]}
          />
        </View>

        <Text
          style={[
            styles.progressHint,
            {
              color: theme.textMuted,
            },
          ]}
        >
          Answer a question to update your progress.
        </Text>
      </View>

      {/* Recent activity */}

      <Text
        style={[
          styles.sectionLabel,
          {
            color: theme.textMuted,
          },
        ]}
      >
        YOUR PRACTICE
      </Text>

      <View
        style={[
          styles.practiceCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <View
          style={[
            styles.practiceIcon,
            {
              backgroundColor: theme.iconBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.practiceIconText,
              {
                color: theme.primary,
              },
            ]}
          >
            ✓
          </Text>
        </View>

        <View style={styles.practiceContent}>
          <Text
            style={[
              styles.practiceTitle,
              {
                color: theme.text,
              },
            ]}
          >
            One question at a time
          </Text>

          <Text
            style={[
              styles.practiceText,
              {
                color: theme.textMuted,
              },
            ]}
          >
            Your performance is evaluated after each
            question and used to personalize what
            comes next.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },

  streakCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  streakLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  streakValue: {
    marginTop: 3,
    fontSize: 32,
    fontWeight: '800',
  },

  streakHint: {
    marginTop: 4,
    fontSize: 13,
  },

  streakIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },

  streakIconText: {
    fontSize: 27,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },

  nextCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },

  nextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  nextHeaderText: {
    flex: 1,
  },

  nextLabel: {
    fontSize: 17,
    fontWeight: '800',
  },

  nextSubtext: {
    marginTop: 2,
    fontSize: 13,
  },

  divider: {
    height: 1,
    marginVertical: 18,
  },

  questionTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
  },

  questionPreview: {
    marginTop: 9,
    fontSize: 15,
    lineHeight: 22,
  },

  startButton: {
    marginTop: 20,
    borderRadius: 13,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 3,
  },

  startButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },

  startButtonArrow: {
    fontSize: 21,
    marginLeft: 9,
    fontWeight: '600',
  },

  progressCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  progressSubtitle: {
    marginTop: 3,
    fontSize: 13,
  },

  progressCount: {
    fontSize: 13,
    fontWeight: '700',
  },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },

  progressFill: {
    width: '12%',
    height: '100%',
    borderRadius: 4,
  },

  progressHint: {
    marginTop: 9,
    fontSize: 12,
  },

  practiceCard: {
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  practiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  practiceIconText: {
    fontSize: 20,
    fontWeight: '800',
  },

  practiceContent: {
    flex: 1,
  },

  practiceTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  practiceText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
  },
});
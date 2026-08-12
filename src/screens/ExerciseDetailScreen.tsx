import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MicButton } from '../components/MicButton';
import { RecordingPlayback } from '../components/RecordingPlayback';
import { useTrackTheme } from '../context/TrackThemeContext';
import { useExercise, Exercise } from '../context/ExerciseContext';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import api from '../services/auth/api';
import { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'ExerciseDetail'>;

export function ExerciseDetailScreen({ navigation }: Props) {
  const { theme } = useTrackTheme();
  const { currentExercise, isLoadingExercise, setCurrentExercise } = useExercise();
  const { user } = useAuth();
  const { sessionId } = useSession();

  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [pendingNextExercise, setPendingNextExercise] = useState<Exercise | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    if (currentExercise) {
      navigation.setOptions({ title: currentExercise.title });
    }
  }, [currentExercise, navigation]);

  const handleRecordingComplete = useCallback((uri: string) => {
    setRecordingUri(uri);
    setSubmittedScore(null);
    setFeedbackMessage(null);
    setPendingNextExercise(null);
  }, []);

  const submitRecording = useCallback(async () => {
    if (!recordingUri || !user?.user_Id || !sessionId || !currentExercise) {
      console.warn('Missing data — cannot submit recording.', {
        hasRecording: !!recordingUri,
        hasUserId: !!user?.user_Id,
        hasSessionId: !!sessionId,
        hasExercise: !!currentExercise,
      });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('user_id', user.user_Id);
      formData.append('session_id', sessionId);
      formData.append('exercise_id', currentExercise.id);

      formData.append('audio', {
        uri: recordingUri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as any);

      const response = await api.post('/exercise/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Submission response:', response.data);

      if (response.data.status === 'success') {
        setSubmittedScore(response.data.score);
        setFeedbackMessage(response.data.feedback ?? null);

        if (response.data.next_exercise) {
          setPendingNextExercise(response.data.next_exercise);
        } else {
          setPendingNextExercise(null);
        }
      } else {
        console.error('Submission failed:', response.data.message);
      }
    } catch (err) {
      console.error('Failed to submit recording:', err);
    } finally {
      setSubmitting(false);
    }
  }, [recordingUri, user?.user_Id, sessionId, currentExercise]);

  const goToNextExercise = useCallback(() => {
    if (pendingNextExercise) {
      setCurrentExercise(pendingNextExercise);
      setRecordingUri(null);
      setSubmittedScore(null);
      setFeedbackMessage(null);
      setPendingNextExercise(null);
    } else {
      setSessionComplete(true);
    }
  }, [pendingNextExercise, setCurrentExercise]);

  if (isLoadingExercise || (!currentExercise && !sessionComplete)) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (sessionComplete) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <View
          style={[
            styles.completeBadge,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.completeCheck, { color: theme.primary }]}>✓</Text>
        </View>
        <Text style={[styles.completeTitle, { color: theme.primaryDark }]}>
          Session complete
        </Text>
        <Text style={[styles.completeBody, { color: theme.text }]}>
          Nice work today — every rep counts.
        </Text>
      </View>
    );
  }

  const hasResult = submittedScore !== null;
  const scoreClamped = Math.max(0, Math.min(100, submittedScore ?? 0));

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      {/* Eyebrow: subcategory context */}
      <View style={styles.eyebrowRow}>
        <View
          style={[
            styles.chip,
            { borderColor: theme.primary },
          ]}
        >
          <Text style={[styles.chipText, { color: theme.primary }]}>
            {currentExercise!.subcategory}
          </Text>
        </View>
        <Text style={[styles.trackLabel, { color: theme.text }]}>
          {currentExercise!.track}
        </Text>
      </View>

      {/* Title + instructions */}
      <View style={styles.headerBlock}>
        <Text style={[styles.title, { color: theme.primaryDark }]}>
          {currentExercise!.title}
        </Text>

        <View
          style={[
            styles.instructionsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderLeftColor: theme.primary,
            },
          ]}
        >
          <Text style={[styles.instructionsText, { color: theme.text }]}>
            {currentExercise!.instructions}
          </Text>
        </View>
      </View>

      {!hasResult ? (
        <View style={styles.stageSection}>
          <View
            style={[
              styles.stage,
              {
                borderColor: recordingUri ? theme.primary : theme.border,
                backgroundColor: theme.surface,
              },
            ]}
          >
            <MicButton onRecordingComplete={handleRecordingComplete} />
          </View>

          <Text style={[styles.stageHint, { color: theme.text }]}>
            {recordingUri ? 'Listen back, then submit' : 'Tap the mic to answer'}
          </Text>

          {recordingUri ? (
            <View style={styles.playbackWrap}>
              <RecordingPlayback uri={recordingUri} />

              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.buttonBackground },
                  submitting && styles.buttonDisabled,
                ]}
                onPress={submitRecording}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.buttonText} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                    Submit answer
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.resultSection}>
          <View style={styles.scoreBlock}>
            <Text style={[styles.scoreLabel, { color: theme.text }]}>SCORE</Text>
            <Text style={[styles.scoreValue, { color: theme.primaryDark }]}>
              {Math.round(scoreClamped)}
            </Text>

            <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: theme.primary, width: `${scoreClamped}%` },
                ]}
              />
            </View>
          </View>

          {feedbackMessage ? (
            <View
              style={[
                styles.feedbackCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderLeftColor: theme.primary,
                },
              ]}
            >
              <Text style={[styles.feedbackText, { color: theme.text }]}>
                {feedbackMessage}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.primaryButton, { backgroundColor: theme.buttonBackground }]}
            onPress={goToNextExercise}
          >
            <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
              {pendingNextExercise ? 'Next question' : 'Finish session'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },

  container: {
    flexGrow: 1,
    padding: 24,
    gap: 28,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },

  chipText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  trackLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  headerBlock: {
    gap: 14,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -0.3,
  },

  instructionsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderLeftWidth: 4,
  },

  instructionsText: {
    fontSize: 17,
    lineHeight: 26,
  },

  stageSection: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },

  stage: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stageHint: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.6,
  },

  playbackWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },

  resultSection: {
    gap: 20,
    alignItems: 'center',
  },

  scoreBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },

  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    opacity: 0.5,
  },

  scoreValue: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1,
  },

  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 8,
  },

  progressFill: {
    height: '100%',
    borderRadius: 5,
  },

  feedbackCard: {
    width: '100%',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderLeftWidth: 4,
  },

  feedbackText: {
    fontSize: 15,
    lineHeight: 22,
  },

  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  completeBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  completeCheck: {
    fontSize: 32,
    fontWeight: '800',
  },

  completeTitle: {
    fontSize: 22,
    fontWeight: '800',
  },

  completeBody: {
    fontSize: 15,
    opacity: 0.7,
    textAlign: 'center',
  },
});
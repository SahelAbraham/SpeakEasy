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
        <Text style={[styles.bodyLabel, { color: theme.primary }]}>
          Great work!
        </Text>
        <Text style={[styles.bodyText, { color: theme.text }]}>
          You've completed this practice session.
        </Text>
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
      <View
        style={[
          styles.bodyCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderLeftColor: theme.primary,
          },
        ]}
      >
        <Text
          style={[
            styles.bodyLabel,
            {
              color: theme.primary,
            },
          ]}
        >
          {currentExercise!.title}
        </Text>

        <Text
          style={[
            styles.bodyText,
            {
              color: theme.text,
            },
          ]}
        >
          {currentExercise!.instructions}
        </Text>
      </View>

      <View style={styles.micSection}>
        {submittedScore === null ? (
          <>
            <MicButton
              onRecordingComplete={handleRecordingComplete}
            />

            {recordingUri ? (
              <RecordingPlayback uri={recordingUri} />
            ) : null}

            {recordingUri ? (
              <Pressable
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.buttonBackground },
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={submitRecording}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.buttonText} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: theme.buttonText }]}>
                    Submit answer
                  </Text>
                )}
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            <Text style={[styles.scoreText, { color: theme.primaryDark }]}>
              Score: {submittedScore}
            </Text>

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
              style={[styles.submitButton, { backgroundColor: theme.buttonBackground }]}
              onPress={goToNextExercise}
            >
              <Text style={[styles.submitButtonText, { color: theme.buttonText }]}>
                {pendingNextExercise ? 'Next question' : 'Finish session'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },

  container: {
    flexGrow: 1,
    padding: 20,
    gap: 32,
    justifyContent: 'space-between',
  },

  bodyCard: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    gap: 8,
    borderLeftWidth: 4,
  },

  bodyLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  bodyText: {
    fontSize: 16,
    lineHeight: 24,
  },

  micSection: {
    alignItems: 'center',
    paddingBottom: 24,
    gap: 16,
    width: '100%',
  },

  submitButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  scoreText: {
    fontSize: 18,
    fontWeight: '800',
  },

  feedbackCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    width: '100%',
  },

  feedbackText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
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
import { useExercise } from '../context/ExerciseContext';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import api from '../services/auth/api';
import { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'ExerciseDetail'>;

export function ExerciseDetailScreen({ navigation }: Props) {
  const { theme } = useTrackTheme();
  const { currentExercise, isLoadingExercise } = useExercise();
  const { user } = useAuth();
  const { sessionId } = useSession();

  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);

  useEffect(() => {
    if (currentExercise) {
      navigation.setOptions({ title: currentExercise.title });
    }
  }, [currentExercise, navigation]);

  const handleRecordingComplete = useCallback((uri: string) => {
    setRecordingUri(uri);
    setSubmittedScore(null); // clear any previous result on a new recording
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
      } else {
        console.error('Submission failed:', response.data.message);
      }
    } catch (err) {
      console.error('Failed to submit recording:', err);
    } finally {
      setSubmitting(false);
    }
  }, [recordingUri, user?.user_Id, sessionId, currentExercise]);

  if (isLoadingExercise || !currentExercise) {
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
          {currentExercise.title}
        </Text>

        <Text
          style={[
            styles.bodyText,
            {
              color: theme.text,
            },
          ]}
        >
          {currentExercise.instructions}
        </Text>
      </View>

      <View style={styles.micSection}>
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

        {submittedScore !== null ? (
          <Text style={[styles.scoreText, { color: theme.primaryDark }]}>
            Score: {submittedScore}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
});
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MicButton } from '../components/MicButton';
import { RecordingPlayback } from '../components/RecordingPlayback';
import { useTrackTheme } from '../context/TrackThemeContext';
import { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<
  HomeStackParamList,
  'ExerciseDetail'
>;

export function ExerciseDetailScreen({
  route,
}: Props) {
  const { body } = route.params;

  const { theme } = useTrackTheme();

  const [recordingUri, setRecordingUri] =
    useState<string | null>(null);

  const handleRecordingComplete = useCallback(
    (uri: string) => {
      setRecordingUri(uri);
    },
    [],
  );

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
          Instructions
        </Text>

        <Text
          style={[
            styles.bodyText,
            {
              color: theme.text,
            },
          ]}
        >
          {body}
        </Text>
      </View>

      <View style={styles.micSection}>
        <MicButton
          onRecordingComplete={handleRecordingComplete}
        />

        {recordingUri ? (
          <RecordingPlayback uri={recordingUri} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});
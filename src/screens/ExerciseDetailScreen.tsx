import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MicButton } from '../components/MicButton';
import { RecordingPlayback } from '../components/RecordingPlayback';
import { HomeStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<HomeStackParamList, 'ExerciseDetail'>;

export function ExerciseDetailScreen({ route }: Props) {
  const { body } = route.params;
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  const handleRecordingComplete = useCallback((uri: string) => {
    setRecordingUri(uri);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.bodyCard}>
        <Text style={styles.bodyLabel}>Instructions</Text>
        <Text style={styles.bodyText}>{body}</Text>
      </View>

      <View style={styles.micSection}>
        <MicButton onRecordingComplete={handleRecordingComplete} />
        {recordingUri ? <RecordingPlayback uri={recordingUri} /> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 20,
    gap: 32,
    justifyContent: 'space-between',
  },
  bodyCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.sage,
  },
  bodyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  micSection: {
    alignItems: 'center',
    paddingBottom: 24,
    gap: 16,
    width: '100%',
  },
});

import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getTaskById } from '../constants/tasks';
import { getAreaConfig } from '../constants/learningAreas';
import { RecordButton } from '../components/RecordButton';
import { MainStackParamList } from '../navigation/types';
import * as recordingService from '../services/recordingService';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<MainStackParamList, 'TaskDetail'>;

export function TaskDetailScreen({ route }: Props) {
  const task = getTaskById(route.params.taskId);
  const [isRecording, setIsRecording] = useState(false);
  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);

  const areaConfig = task?.area ? getAreaConfig(task.area) : null;

  const handleRecordPress = useCallback(async () => {
    try {
      if (isRecording) {
        const result = await recordingService.stopRecording();
        setIsRecording(false);
        if (result) {
          setLastRecordingUri(result.uri);
          // Future: upload/store recording via backend API
        }
      } else {
        await recordingService.startRecording();
        setIsRecording(true);
        setLastRecordingUri(null);
      }
    } catch (e) {
      setIsRecording(false);
      Alert.alert(
        'Recording Error',
        e instanceof Error ? e.message : 'Could not access microphone.',
      );
    }
  }, [isRecording]);

  if (!task) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Task not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {areaConfig ? (
        <View style={[styles.badge, { backgroundColor: `${areaConfig.color}18` }]}>
          <Text style={[styles.badgeText, { color: areaConfig.color }]}>
            {areaConfig.label}
          </Text>
        </View>
      ) : task.isDaily ? (
        <View style={[styles.badge, { backgroundColor: `${colors.secondary}18` }]}>
          <Text style={[styles.badgeText, { color: colors.secondary }]}>Daily Task</Text>
        </View>
      ) : null}

      <Text style={styles.title}>(PLACEHOLDER for now)</Text>
      <Text style={styles.description}>{task.description}</Text>

      <View style={styles.recordSection}>
        <Text style={styles.recordLabel}>Practice Recording</Text>
        <Text style={styles.recordHint}>
          Record your speech for this exercise. Your recording can be saved and analyzed
          in a future update.
        </Text>
        <RecordButton isRecording={isRecording} onPress={handleRecordPress} />
        {lastRecordingUri && !isRecording ? (
          <Text style={styles.recordedNote}>
            Recording captured locally (ready for future upload)
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  recordSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  recordLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  recordHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  recordedNote: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
});

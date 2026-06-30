import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LearningProgress } from '../types';
import { LEARNING_AREAS } from '../constants/learningAreas';
import { ProgressBar } from './ProgressBar';
import { spacing } from '../theme/spacing';

interface LearningAreaProgressProps {
  progress: LearningProgress;
  compact?: boolean;
}

export function LearningAreaProgress({
  progress,
  compact = false,
}: LearningAreaProgressProps) {
  return (
    <View style={styles.container}>
      {LEARNING_AREAS.map((area) => (
        <ProgressBar
          key={area.id}
          label={area.label}
          value={progress[area.id]}
          color={area.color}
          compact={compact}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});

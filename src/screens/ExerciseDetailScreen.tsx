import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MicButton } from '../components/MicButton';
import { HomeStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<HomeStackParamList, 'ExerciseDetail'>;

export function ExerciseDetailScreen({ route }: Props) {
  const { body } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.bodyCard}>
        <Text style={styles.bodyLabel}>Instructions</Text>
        <Text style={styles.bodyText}>{body}</Text>
      </View>

      <MicButton />
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
  },
  bodyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getAnimalForUser } from '../utils/avatar';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';

interface AnimalAvatarProps {
  seed: string;
  size?: number;
}

export function AnimalAvatar({ seed, size = 96 }: AnimalAvatarProps) {
  const animal = getAnimalForUser(seed);

  return (
    <View
      style={[
        styles.container,
        shadows.md,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>{animal.emoji}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{animal.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primaryLight,
    position: 'relative',
  },
  emoji: {
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

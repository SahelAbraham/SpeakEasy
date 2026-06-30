import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

function SoundWaveBar({ delay, isRecording }: { delay: number; isRecording: boolean }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300 + delay * 50,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 300 + delay * 50,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    anim.setValue(0.3);
  }, [isRecording, anim, delay]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          transform: [{ scaleY: anim }],
        },
      ]}
    />
  );
}

export function RecordButton({ isRecording, onPress, disabled }: RecordButtonProps) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          isRecording && styles.buttonRecording,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.waveContainer}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SoundWaveBar key={i} delay={i} isRecording={isRecording} />
          ))}
        </View>
        <Ionicons
          name={isRecording ? 'stop' : 'mic'}
          size={28}
          color={colors.white}
          style={styles.micIcon}
        />
      </Pressable>
      <Text style={styles.hint}>
        {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  button: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonRecording: {
    backgroundColor: colors.error,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.5,
  },
  waveContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.4,
  },
  bar: {
    width: 4,
    height: 24,
    backgroundColor: colors.white,
    borderRadius: 2,
    marginHorizontal: 1.5,
  },
  micIcon: {
    zIndex: 1,
  },
  hint: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

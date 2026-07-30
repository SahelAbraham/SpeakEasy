import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type RecordingPlaybackProps = {
  uri: string;
};

export function RecordingPlayback({ uri }: RecordingPlaybackProps) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const togglePlayback = useCallback(() => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.currentTime >= status.duration && status.duration > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  }, [player, status.currentTime, status.duration, status.playing]);

  return (
    <View style={styles.box}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Your recording</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.playRow, pressed && styles.playRowPressed]}
        onPress={togglePlayback}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pause recording' : 'Play recording'}
      >
        <View style={styles.playButton}>
          <Ionicons
            name={status.playing ? 'pause' : 'play'}
            size={22}
            color="#fff"
            style={status.playing ? undefined : styles.playIconOffset}
          />
        </View>
        <Text style={styles.playText}>
          {status.playing ? 'Playing…' : 'Tap to play back'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.sageLight,
    borderRadius: 10,
    padding: 12,
  },
  playRowPressed: {
    opacity: 0.85,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOffset: {
    marginLeft: 3,
  },
  playText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
});

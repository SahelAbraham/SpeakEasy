import { Ionicons } from '@expo/vector-icons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import React, { useCallback, useEffect } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

type MicButtonProps = {
  onRecordingComplete?: (uri: string) => void;
};

export function MicButton({ onRecordingComplete }: MicButtonProps) {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    void (async () => {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone access needed',
          'Allow microphone access in your device settings to record your speech practice.',
        );
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    })();
  }, []);

  const toggleRecording = useCallback(async () => {
    try {
      if (recorderState.isRecording) {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        if (uri) {
          onRecordingComplete?.(uri);
        }
      } else {
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
      }
    } catch {
      Alert.alert('Recording error', 'Could not start or stop recording. Please try again.');
    }
  }, [audioRecorder, onRecordingComplete, recorderState.isRecording]);

  const isRecording = recorderState.isRecording;

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          isRecording && styles.buttonRecording,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => void toggleRecording()}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <Ionicons name={isRecording ? 'stop' : 'mic'} size={48} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.mic,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonRecording: {
    backgroundColor: colors.micRecording,
    shadowColor: colors.micRecording,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});

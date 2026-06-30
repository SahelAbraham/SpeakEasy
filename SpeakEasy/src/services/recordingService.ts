import { Audio } from 'expo-av';
import { RecordingResult } from '../types';

let activeRecording: Audio.Recording | null = null;

export async function requestRecordingPermissions(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export async function startRecording(): Promise<void> {
  if (activeRecording) {
    await stopRecording();
  }

  const granted = await requestRecordingPermissions();
  if (!granted) {
    throw new Error('Microphone permission is required to record.');
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  activeRecording = recording;
}

export async function stopRecording(): Promise<RecordingResult | null> {
  if (!activeRecording) {
    return null;
  }

  const recording = activeRecording;
  activeRecording = null;

  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const status = await recording.getStatusAsync();
  const uri = recording.getURI();

  if (!uri) {
    return null;
  }

  const durationMillis =
    status.isDoneRecording && 'durationMillis' in status
      ? (status.durationMillis ?? 0)
      : 0;

  return {
    uri,
    durationMillis,
  };
}

export function isRecording(): boolean {
  return activeRecording !== null;
}

export async function cancelRecording(): Promise<void> {
  if (!activeRecording) {
    return;
  }

  const recording = activeRecording;
  activeRecording = null;
  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
}

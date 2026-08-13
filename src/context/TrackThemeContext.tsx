import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {useAuth} from './AuthContext';
import api from '../services/auth/api';

export type Track = 'Language' | 'Speech';

export type TrackTheme = {
  primary: string;
  primaryDark: string;
  primaryLight: string;

  background: string;
  surface: string;
  surfaceAlt: string;
  soft: string;

  border: string;
  borderStrong: string;

  text: string;
  textMuted: string;

  iconBackground: string;
  iconBackgroundStrong: string;

  cardBackground: string;
  cardBorder: string;

  buttonBackground: string;
  buttonPressed: string;
  buttonText: string;

  progressTrack: string;
  progressFill: string;

  infoBackground: string;
  infoBorder: string;
  infoIconBackground: string;

  secondary: string;
  secondaryLight: string;

  performance: string;
  performanceLight: string;
  performanceTrack: string;
};

const TRACK_THEMES: Record<Track, TrackTheme> = {
  Language: {
    primary: '#6B9E7A',
    primaryDark: '#426A50',
    primaryLight: '#E3F0E6',

    background: '#F4F8F5',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF5F0',
    soft: '#EEF5F0',

    border: '#DDE9DF',
    borderStrong: '#C8DCCA',

    text: '#29402F',
    textMuted: '#718374',

    iconBackground: '#E4F0E7',
    iconBackgroundStrong: '#D3E6D8',

    cardBackground: '#FFFFFF',
    cardBorder: '#DDE9DF',

    buttonBackground: '#5F9270',
    buttonPressed: '#4F7D5E',
    buttonText: '#FFFFFF',

    progressTrack: '#E0EAE2',
    progressFill: '#6B9E7A',

    infoBackground: '#EDF5EF',
    infoBorder: '#D4E5D7',
    infoIconBackground: '#DCEBDF',

    secondary: '#9AAF83',
    secondaryLight: '#F0F4EA',

    performance: '#4D83B8',
    performanceLight: '#E2EEF8',
    performanceTrack: '#DCE8F2',
  },

  Speech: {
    primary: '#4D83B8',
    primaryDark: '#2E5F8F',
    primaryLight: '#E2EEF8',

    background: '#F2F7FC',
    surface: '#FFFFFF',
    surfaceAlt: '#EAF2F9',
    soft: '#EAF2F9',

    border: '#D8E5F0',
    borderStrong: '#C2D7E8',

    text: '#263B50',
    textMuted: '#708397',

    iconBackground: '#E0EDF7',
    iconBackgroundStrong: '#CEE1F0',

    cardBackground: '#FFFFFF',
    cardBorder: '#D8E5F0',

    buttonBackground: '#4D83B8',
    buttonPressed: '#3D6F9E',
    buttonText: '#FFFFFF',

    progressTrack: '#DCE8F2',
    progressFill: '#4D83B8',

    infoBackground: '#EAF3FA',
    infoBorder: '#D2E3F1',
    infoIconBackground: '#D9EAF7',

    secondary: '#6E9BC2',
    secondaryLight: '#EEF5FA',

    performance: '#5F9270',
    performanceLight: '#E3F0E6',
    performanceTrack: '#E0EAE2',
  },
};

type TrackThemeContextValue = {
  selectedTrack: Track;
  setSelectedTrack: (track: Track) => void;
  theme: TrackTheme;
};

const TrackThemeContext =
  createContext<TrackThemeContextValue | undefined>(
    undefined,
  );

type TrackThemeProviderProps = {
  children: ReactNode;
};

export function TrackThemeProvider({
  children,
}: TrackThemeProviderProps) {
  const { user, updateUser } = useAuth();

  const [selectedTrack, setSelectedTrackState] =
    useState<Track>('Language');

  // Keep local theme state synced with the user's saved track —
  // covers both initial app load and right after survey completion
  useEffect(() => {
    if (user?.surveyData?.track) {
      setSelectedTrackState(user.surveyData.track);
    }
  }, [user?.surveyData?.track]);

  const setSelectedTrack = async (track: Track) => {
  if (!user?.user_Id) {
    console.warn('No user_Id found — skipping backend track switch.');
    return;
  }

  if (track === selectedTrack) {
    return;
  }

  try {
    const response = await api.post('/track/switch', {
      user_id: user.user_Id,
      track,
    });

    if (response.data.status === 'error') {
      throw new Error(response.data.message);
    }

    // Only flip local state once the backend switch is confirmed — this
    // guarantees ExerciseContext's refetch (which depends on
    // selectedTrack) never races ahead of the actual Neo4j update.
    setSelectedTrackState(track);

    await updateUser({
      surveyData: {
        ...(user.surveyData as NonNullable<typeof user.surveyData>),
        track,
      },
    });
  } catch (err) {
    console.error('Track switch failed:', err);
  }
};

  const theme = useMemo(
    () => TRACK_THEMES[selectedTrack],
    [selectedTrack],
  );

  const value = useMemo(
    () => ({
      selectedTrack,
      setSelectedTrack,
      theme,
    }),
    [selectedTrack, theme, user],
  );

  return (
    <TrackThemeContext.Provider value={value}>
      {children}
    </TrackThemeContext.Provider>
  );
}

export function useTrackTheme() {
  const context = useContext(TrackThemeContext);

  if (!context) {
    throw new Error(
      'useTrackTheme must be used inside a TrackThemeProvider',
    );
  }

  return context;
}
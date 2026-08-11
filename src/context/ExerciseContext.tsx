import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { useTrackTheme } from './TrackThemeContext';
import api from '../services/auth/api';

export type Exercise = {
  id: string;
  title: string;
  track: 'Language' | 'Speech';
  subcategory: string;
  instructions: string;
  scoring_type: string;
  expected_answer: string[] | string | null;
};

type ExerciseContextValue = {
  currentExercise: Exercise | null;
  isLoadingExercise: boolean;
  setCurrentExercise: (exercise: Exercise | null) => void;
};

const ExerciseContext = createContext<ExerciseContextValue | undefined>(undefined);

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const { isLoading: isAuthLoading, user } = useAuth();
  const { selectedTrack } = useTrackTheme();

  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [isLoadingExercise, setIsLoadingExercise] = useState(false);

  useEffect(() => {
    if (isAuthLoading || !user?.user_Id) {
      return;
    }

    let cancelled = false;

    setIsLoadingExercise(true);

    api
      .get('/exercise/first', { params: { user_id: user.user_Id } })
      .then((response) => {
        if (cancelled) return;

        if (response.data.status === 'success') {
          setCurrentExercise(response.data.exercise);
        } else {
          console.error('Failed to fetch exercise:', response.data.message);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Exercise fetch failed:', err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingExercise(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // selectedTrack is kept as a dependency so switching tracks
    // (via /track/switch elsewhere) triggers a fresh fetch here too.
  }, [selectedTrack, isAuthLoading, user?.user_Id]);

  return (
    <ExerciseContext.Provider value={{ currentExercise, isLoadingExercise, setCurrentExercise }}>
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercise(): ExerciseContextValue {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExercise must be used within ExerciseProvider');
  }
  return context;
}
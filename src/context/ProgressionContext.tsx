import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CompletedExerciseSet } from '../types/progression';
import { colors } from '../theme/colors';

const PROGRESSION_STORAGE_KEY = '@speakeasy/progression';
const MAX_STORED_SETS = 20;
const DISPLAY_SET_COUNT = 4;

const SEED_SETS: CompletedExerciseSet[] = [
  {
    id: 'seed-1',
    completedAt: daysAgo(1),
    percentCorrect: 88,
    exerciseCount: 10,
  },
  {
    id: 'seed-2',
    completedAt: daysAgo(3),
    percentCorrect: 72,
    exerciseCount: 10,
  },
  {
    id: 'seed-3',
    completedAt: daysAgo(5),
    percentCorrect: 91,
    exerciseCount: 10,
  },
  {
    id: 'seed-4',
    completedAt: daysAgo(7),
    percentCorrect: 65,
    exerciseCount: 10,
  },
];

type ProgressionContextValue = {
  recentSets: CompletedExerciseSet[];
  isLoading: boolean;
  recordCompletedSet: (percentCorrect: number, exerciseCount?: number) => Promise<void>;
};

const ProgressionContext = createContext<ProgressionContextValue | undefined>(undefined);

function daysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString();
}

async function loadSets(): Promise<CompletedExerciseSet[]> {
  const raw = await AsyncStorage.getItem(PROGRESSION_STORAGE_KEY);
  if (!raw) {
    await AsyncStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(SEED_SETS));
    return SEED_SETS;
  }
  return JSON.parse(raw) as CompletedExerciseSet[];
}

async function saveSets(sets: CompletedExerciseSet[]): Promise<void> {
  await AsyncStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(sets));
}

export function ProgressionProvider({ children }: { children: React.ReactNode }) {
  const [sets, setSets] = useState<CompletedExerciseSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSets()
      .then(setSets)
      .finally(() => setIsLoading(false));
  }, []);

  const recordCompletedSet = useCallback(async (percentCorrect: number, exerciseCount = 10) => {
    const entry: CompletedExerciseSet = {
      id: `set-${Date.now()}`,
      completedAt: new Date().toISOString(),
      percentCorrect: Math.round(Math.min(100, Math.max(0, percentCorrect))),
      exerciseCount,
    };

    const current = await loadSets();
    const next = [entry, ...current].slice(0, MAX_STORED_SETS);
    await saveSets(next);
    setSets(next);
  }, []);

  const recentSets = useMemo(() => sets.slice(0, DISPLAY_SET_COUNT), [sets]);

  const value = useMemo(
    () => ({ recentSets, isLoading, recordCompletedSet }),
    [recentSets, isLoading, recordCompletedSet],
  );

  return <ProgressionContext.Provider value={value}>{children}</ProgressionContext.Provider>;
}

export function useProgression(): ProgressionContextValue {
  const context = useContext(ProgressionContext);
  if (!context) {
    throw new Error('useProgression must be used within ProgressionProvider');
  }
  return context;
}

export function percentColor(percent: number): string {
  if (percent >= 80) return colors.progressHigh;
  if (percent >= 60) return colors.progressMid;
  return colors.progressLow;
}

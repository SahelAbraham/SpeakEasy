import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

function streakStorageKey(userId: string): string {
  return `@speakeasy/streak/${userId}`;
}

type StreakState = {
  count: number;
  lastActiveDate: string | null;
};

type StreakContextValue = {
  streak: number;
  isLoading: boolean;
  recordDailyVisit: () => Promise<void>;
};

const StreakContext = createContext<StreakContextValue | undefined>(undefined);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

async function loadStreak(userId: string): Promise<StreakState> {
  const raw = await AsyncStorage.getItem(streakStorageKey(userId));
  if (!raw) {
    return { count: 0, lastActiveDate: null };
  }
  return JSON.parse(raw) as StreakState;
}

async function saveStreak(userId: string, state: StreakState): Promise<void> {
  await AsyncStorage.setItem(streakStorageKey(userId), JSON.stringify(state));
}

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.user_Id;

  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const recordDailyVisit = useCallback(async () => {
    if (!userId) return;

    const today = todayKey();
    const state = await loadStreak(userId);

    if (state.lastActiveDate === today) {
      setStreak(state.count);
      return;
    }

    let nextCount = 1;
    if (state.lastActiveDate === yesterdayKey()) {
      nextCount = state.count + 1;
    }

    const nextState = { count: nextCount, lastActiveDate: today };
    await saveStreak(userId, nextState);
    setStreak(nextCount);
  }, [userId]);

  // Reload (or reset) streak whenever the logged-in user changes, so a
  // freshly created account never inherits the previous user's state.
  useEffect(() => {
    if (!userId) {
      setStreak(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadStreak(userId)
      .then((state) => setStreak(state.count))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const value = useMemo(
    () => ({ streak, isLoading, recordDailyVisit }),
    [streak, isLoading, recordDailyVisit],
  );

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
}

export function useStreak(): StreakContextValue {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreak must be used within StreakProvider');
  }
  return context;
}
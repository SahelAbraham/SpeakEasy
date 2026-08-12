import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/auth/api';

export type SubtrackDelta = {
  trackId: string;
  label: string;
  delta: number; // change in subtrack score (0-1 scale) over that session
};

export type CompletedSession = {
  id: string;
  sessionNumber: number;
  label: string;
  startedAt: string;
  completedAt: string;
  subtrackDeltas: SubtrackDelta[];
};

const TRACK_ID_LABELS: Record<string, string> = {
  Language_Expressive: 'Expressive Language',
  Language_Receptive: 'Receptive Language',
  Speech_Motor: 'Motor Speech',
  Speech_Fluency: 'Fluency',
  Speech_Disorders: 'Voice Disorders',
};

type ProgressionContextValue = {
  recentSessions: CompletedSession[];
  isLoading: boolean;
  refresh: () => void;
};

const ProgressionContext = createContext<ProgressionContextValue | undefined>(undefined);

export function ProgressionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [recentSessions, setRecentSessions] = useState<CompletedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgression = useCallback(() => {
    if (!user?.user_Id) return;

    setIsLoading(true);
    api
      .get('/progression', { params: { user_id: user.user_Id } })
      .then((response) => {
        if (response.data.status !== 'success') {
          console.error('Failed to fetch progression:', response.data.message);
          return;
        }

        const sessions: CompletedSession[] = response.data.sessions.map((s: any) => ({
          id: s.session_id,
          sessionNumber: s.session_number,
          label: s.label,
          startedAt: s.started_at,
          completedAt: s.completed_at,
          subtrackDeltas: Object.entries(s.subtrack_deltas).map(([trackId, delta]) => ({
            trackId,
            label: TRACK_ID_LABELS[trackId] ?? trackId,
            delta: delta as number,
          })),
        }));

        setRecentSessions(sessions);
      })
      .catch((err) => console.error('Progression fetch failed:', err))
      .finally(() => setIsLoading(false));
  }, [user?.user_Id]);

  useEffect(() => {
    fetchProgression();
  }, [fetchProgression]);

  const value = useMemo(
    () => ({ recentSessions, isLoading, refresh: fetchProgression }),
    [recentSessions, isLoading, fetchProgression],
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

export function deltaColor(delta: number): string {
  if (delta > 0.02) return '#4CAF50';
  if (delta < -0.02) return '#E5484D';
  return '#9AA0A6';
}
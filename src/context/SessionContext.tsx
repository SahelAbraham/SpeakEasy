import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import api from '../services/auth/api';

type SessionContextValue = {
  sessionId: string | null;
  sessionLabel: string | null;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (isLoading || !user?.user_Id || hasStarted.current) {
      return;
    }

    hasStarted.current = true; // ensures this fires once per app launch

    api
      .post('/session/start', { user_id: user.user_Id })
      .then((response) => {
        if (response.data.status === 'success') {
          setSessionId(response.data.session_id);
          setSessionLabel(response.data.label);
        } else {
          console.error('Session start failed:', response.data.message);
        }
      })
      .catch((err) => {
        console.error('Session start request failed:', err);
      });
  }, [isLoading, user?.user_Id]);

  return (
    <SessionContext.Provider value={{ sessionId, sessionLabel }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
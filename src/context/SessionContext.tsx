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

  // Tracks which user_Id we've already started a session for.
  // Using the user id itself (instead of a plain boolean) means a new
  // session correctly gets created every time a *different* user logs in
  // during the same app process — a plain `useRef(false)` would only ever
  // fire once for the entire app lifetime, which was the bug: after the
  // first user of the session, no new sessions were ever created again
  // until the app was force-quit.
  const startedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !user?.user_Id) {
      return;
    }

    if (startedForUserId.current === user.user_Id) {
      // Already started (or in-flight) a session for this exact user — skip.
      return;
    }

    startedForUserId.current = user.user_Id;

    console.log('[SpeakEasy] Starting new session for user', user.user_Id);

    api
      .post('/session/start', { user_id: user.user_Id })
      .then((response) => {
        if (response.data.status === 'success') {
          console.log(
            '[SpeakEasy] Session started:',
            response.data.session_id,
            response.data.label,
          );
          setSessionId(response.data.session_id);
          setSessionLabel(response.data.label);
        } else {
          console.error('[SpeakEasy] Session start failed:', response.data.message);
          // Allow a retry on the next render/effect run instead of getting
          // permanently stuck for this user.
          startedForUserId.current = null;
        }
      })
      .catch((err) => {
        console.error('[SpeakEasy] Session start request failed:', err);
        startedForUserId.current = null;
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
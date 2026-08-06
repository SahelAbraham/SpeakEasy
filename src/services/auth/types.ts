export type AuthUser = {
  id: string;
  username: string;
  email: string;
  completedSurvey: boolean;

  surveyData?: {
    name: string,
    age: number,
    occupation: string,
    therapyHistory: 'current' | 'past' | 'none',
    goals: string,
    baselineAudioUri: string;
  };
};

export type SignInParams = {
  username: string;
  password: string;
};

export type SignUpParams = {
  username: string;
  email: string;
  password: string;
};

/** Swap this implementation for a real backend auth provider later. */
export interface AuthService {
  signIn(params: SignInParams): Promise<AuthUser>;
  signUp(params: SignUpParams): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  updateUser(updates: Partial<AuthUser>): Promise<AuthUser>;
}

export type AuthUser = {
  user_Id?: string;
  username: string;
  email: string;
  password: string;
  completedSurvey: boolean;

  surveyData?: {
    name: string;
    age: number;
    occupation: string;
    therapyHistory: 'none' | 'current' | 'past';
    track: 'Language' | 'Speech';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, AuthUser, SignInParams, SignUpParams } from './types';

const USER_STORAGE_KEY = '@speakeasy/auth_user';

function createUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Prototype auth: accepts any non-empty credentials and persists the session locally. */
export const mockAuthService: AuthService = {
  async signIn({ username, password }: SignInParams): Promise<AuthUser> {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password.trim()) {
      throw new Error('Username and password are required.');
    }

    const existing = await this.getCurrentUser();
    const user: AuthUser = existing ?? {
      id: createUserId(),
      username: trimmedUsername,
      email: `${trimmedUsername.toLowerCase().replace(/\s+/g, '.')}@speakeasy.local`,
    };

    if (existing) {
      user.username = trimmedUsername;
    }

    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  async signUp({ username, email, password }: SignUpParams): Promise<AuthUser> {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if (!trimmedUsername || !trimmedEmail || !password.trim()) {
      throw new Error('All fields are required.');
    }

    const user: AuthUser = {
      id: createUserId(),
      username: trimmedUsername,
      email: trimmedEmail,
    };

    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AuthUser;
  },
};

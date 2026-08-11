import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthService,
  AuthUser,
  SignInParams,
  SignUpParams,
} from './types';

const USER_STORAGE_KEY = '@speakeasy/auth_user';

/**
 * Development-only authentication service.
 *
 * IMPORTANT:
 * Passwords are intentionally stored in plaintext for this prototype.
 * This must be replaced with secure authentication and password hashing
 * before deployment.
 */
export const mockAuthService: AuthService = {
  async signIn({
    username,
    password,
  }: SignInParams): Promise<AuthUser> {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      throw new Error('Username and password are required.');
    }

    const existing = await this.getCurrentUser();

    const user: AuthUser = existing ?? {
      username: trimmedUsername,
      email: `${trimmedUsername
        .toLowerCase()
        .replace(/\s+/g, '.')}@speakeasy.local`,
      password: trimmedPassword,
      completedSurvey: false,
    };

    if (existing) {
      user.username = trimmedUsername;
      user.password = trimmedPassword;
    }

    if (user.completedSurvey === undefined) {
      user.completedSurvey = false;
    }

    await AsyncStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(user),
    );

    return user;
  },

  async signUp({
    username,
    email,
    password,
  }: SignUpParams): Promise<AuthUser> {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedEmail || !trimmedPassword) {
      throw new Error('All fields are required.');
    }

    const user: AuthUser = {
      username: trimmedUsername,
      email: trimmedEmail,
      password: trimmedPassword,
      completedSurvey: false,
    };

    await AsyncStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(user),
    );

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

  async updateUser(
    updates: Partial<AuthUser>,
  ): Promise<AuthUser> {
    const currentUser = await this.getCurrentUser();

    if (!currentUser) {
      throw new Error('No user logged in.');
    }

    const updatedUser: AuthUser = {
      ...currentUser,
      ...updates,
    };

    await AsyncStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(updatedUser),
    );

    return updatedUser;
  },
};
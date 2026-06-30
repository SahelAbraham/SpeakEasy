import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthSession, LearningProgress, User } from '../types';

const USERS_KEY = '@speakeasy_users';
const SESSION_KEY = '@speakeasy_session';

const defaultProgress = (): LearningProgress => ({
  fluency: 0,
  articulation: 0,
  confidence: 0,
  maintenance: 0,
});

const generateId = () =>
  `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const generateToken = () =>
  `token_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;

async function getUsers(): Promise<User[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function registerUser(
  email: string,
  username: string,
  password: string,
): Promise<{ user: User; session: AuthSession }> {
  const users = await getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }
  if (users.some((u) => u.username.toLowerCase() === normalizedUsername)) {
    throw new Error('This username is already taken.');
  }

  const user: User = {
    id: generateId(),
    email: email.trim(),
    username: username.trim(),
    password,
    avatarSeed: username.trim(),
    progress: defaultProgress(),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);

  const session: AuthSession = { userId: user.id, token: generateToken() };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return { user, session };
}

export async function loginUser(
  emailOrUsername: string,
  password: string,
): Promise<{ user: User; session: AuthSession }> {
  const users = await getUsers();
  const query = emailOrUsername.trim().toLowerCase();

  const user = users.find(
    (u) =>
      u.email.toLowerCase() === query ||
      u.username.toLowerCase() === query,
  );

  if (!user || user.password !== password) {
    throw new Error('Invalid email/username or password.');
  }

  const session: AuthSession = { userId: user.id, token: generateToken() };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return { user, session };
}

export async function getSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function getUserById(userId: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.id === userId) ?? null;
}

export async function updateUser(
  userId: string,
  updates: Partial<Pick<User, 'email' | 'username' | 'password' | 'progress'>>,
): Promise<User> {
  const users = await getUsers();
  const index = users.findIndex((u) => u.id === userId);

  if (index === -1) {
    throw new Error('User not found.');
  }

  const current = users[index];

  if (updates.email) {
    const normalized = updates.email.trim().toLowerCase();
    if (
      users.some(
        (u) => u.id !== userId && u.email.toLowerCase() === normalized,
      )
    ) {
      throw new Error('An account with this email already exists.');
    }
    current.email = updates.email.trim();
  }

  if (updates.username) {
    const normalized = updates.username.trim().toLowerCase();
    if (
      users.some(
        (u) => u.id !== userId && u.username.toLowerCase() === normalized,
      )
    ) {
      throw new Error('This username is already taken.');
    }
    current.username = updates.username.trim();
    current.avatarSeed = updates.username.trim();
  }

  if (updates.password) {
    current.password = updates.password;
  }

  if (updates.progress) {
    current.progress = { ...current.progress, ...updates.progress };
  }

  users[index] = current;
  await saveUsers(users);

  return current;
}

export async function logoutUser(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

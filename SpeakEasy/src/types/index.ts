export type LearningArea = 'fluency' | 'articulation' | 'confidence' | 'maintenance';

export interface LearningProgress {
  fluency: number;
  articulation: number;
  confidence: number;
  maintenance: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  avatarSeed: string;
  progress: LearningProgress;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  area?: LearningArea;
  isDaily?: boolean;
}

export interface AuthSession {
  userId: string;
  token: string;
}

export interface RecordingResult {
  uri: string;
  durationMillis: number;
}

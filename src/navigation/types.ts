export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  ExerciseDetail: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  LearningPath: undefined;
  Progression: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Survey: undefined;
  Main: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

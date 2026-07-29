# SpeakEasy (React Native)

Prototype mobile app for speech therapy practice. Built with [Expo](https://expo.dev) and React Navigation.

## Run locally

```bash
npm install
npm start
```

Then open the project in Expo Go (Android/iOS) or press `w` for web.

## App structure

- **Auth (prototype)** — Welcome → Sign in / Create account. Any non-empty credentials work; session is stored locally via `AsyncStorage`. Replace `src/services/auth/mockAuthService.ts` by implementing the `AuthService` interface in `src/services/auth/types.ts` and exporting it from `src/services/auth/index.ts`.
- **Practice tab** — Dashboard with daily streak and 10 placeholder exercises; tap an exercise for detail + mic button (no recording yet).
- **User tab** — Profile (avatar initials, username, email) with placeholder reset actions.

## Project layout

```
src/
  components/     # Shared UI (e.g. MicButton)
  context/        # Auth and streak state
  data/           # Placeholder exercise flight
  navigation/     # Auth stack, main tabs, root navigator
  screens/        # Auth, dashboard, exercise detail, profile
  services/auth/  # Swappable auth layer (mock today)
  theme/          # Colors
```

Backend integration (exercise flights, voice upload, real auth) is intentionally not wired yet.

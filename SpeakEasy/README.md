# SpeakEasy

AI-powered speech therapy mobile app built with **React Native** and **Expo** for iOS and Android.

## Features

- **Authentication (prototype)** — Register and sign in with email, username, and password. Data is stored locally via AsyncStorage and structured for future backend integration.
- **Dashboard** — Personalized welcome with four learning-area progress bars (Fluency, Articulation, Confidence, Maintenance), daily tasks, and area-specific task sections.
- **Task exercises** — Tap any task to open a detail screen with placeholder content and a voice recording button (soundwave animation while recording).
- **Profile** — Random animal avatar, progress overview, edit email/username/password, and logout.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo Go](https://expo.dev/go) on your phone, or Android Studio / Xcode for simulators

### Install & Run

```bash
cd SpeakEasy
npm install
npm start
```

Then press:
- `a` — open on Android emulator/device
- `i` — open on iOS simulator (macOS only)
- Scan the QR code with Expo Go on your phone

## Project Structure

```
src/
  components/     # Reusable UI (buttons, progress bars, task cards, recorder)
  constants/      # Learning areas and placeholder tasks
  context/        # Auth state management
  navigation/     # Stack and tab navigators
  screens/        # Login, Register, Dashboard, Task Detail, Profile
  services/       # Auth and recording services (backend-ready interfaces)
  theme/          # Colors, spacing, shadows
  types/          # Shared TypeScript types
  utils/          # Avatar generation
```

## Future Backend Integration

The prototype is designed for easy extension:

| Module | Current | Future |
|--------|---------|--------|
| `authService.ts` | AsyncStorage | REST/GraphQL auth API |
| `recordingService.ts` | Local URI only | Upload to cloud storage + AI analysis |
| `tasks.ts` | Static placeholders | Fetch from CMS/API |
| User progress | Always 0% | Sync from server |

## Tech Stack

- Expo SDK 56 / React Native 0.85
- React Navigation (native stack + bottom tabs)
- AsyncStorage for local auth persistence
- expo-av for microphone recording
- expo-linear-gradient for UI polish

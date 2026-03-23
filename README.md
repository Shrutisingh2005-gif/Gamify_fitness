# Gamify Fit

Gamify Fit is a comprehensive health and wellness platform that gamifies physical activity, nutrition, and sleep tracking with real-time AI feedback and social challenges.

## Features

- **Gamified Dashboard**: Track your steps, calories, sleep, and water intake with beautiful, interactive charts and progress bars.
- **Activity Logging**: Log your daily exercises and meals. The AI coach can even estimate calories from your meal descriptions.
- **AI Health Coach**: Get personalized health advice and actionable suggestions powered by Google's Gemini AI.
- **Challenges**: Join global and daily challenges to earn XP and level up your profile.
- **Community Squads**: Connect with a random squad of 10 users every day. Chat and vibe with the community.
- **Gamification**: Earn XP, level up, and climb the leaderboard. Maintain your daily streak to show your commitment.
- **Onboarding**: Personalized setup to choose your fitness goal (Bulk Up, Stay Fit, or Get Light).

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Animations**: Motion (formerly Framer Motion)
- **Icons**: Lucide React
- **Backend/Database**: Firebase (Firestore & Authentication)
- **AI**: Google Gemini API (@google/genai)
- **Charts**: Recharts

## Code Structure

```text
/
├── src/
│   ├── components/         # React components
│   │   ├── AICoach.tsx     # AI Chat and Advice component
│   │   ├── ActivityLog.tsx # Logging and AI suggestions
│   │   ├── Challenges.tsx  # Active challenges list
│   │   ├── Dashboard.tsx   # Main stats and charts
│   │   ├── Layout.tsx      # App shell with navigation
│   │   ├── NotificationCenter.tsx # User alerts
│   │   ├── Onboarding.tsx  # Initial setup flow
│   │   └── Social.tsx      # Community chat and squad
│   ├── services/           # External service integrations
│   │   └── gemini.ts       # Gemini AI service logic
│   ├── App.tsx             # Main application entry and routing
│   ├── firebase.ts         # Firebase initialization and helpers
│   ├── types.ts            # TypeScript interfaces and types
│   ├── index.css           # Global styles and Tailwind imports
│   └── main.tsx            # React DOM mounting
├── firebase-blueprint.json # Database structure definition
├── firestore.rules         # Security rules for Firestore
├── metadata.json           # App metadata and permissions
└── package.json            # Dependencies and scripts
```

## Getting Started

1.  **Environment Variables**: Ensure `GEMINI_API_KEY` is set in your environment.
2.  **Firebase Setup**: The app uses Firebase for data persistence. Ensure your `firebase-applet-config.json` is correctly configured.
3.  **Install Dependencies**: Run `npm install`.
4.  **Run Development Server**: Run `npm run dev`.

## License

MIT

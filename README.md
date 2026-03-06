<div align="center">

# 🎯 HabitFlow — Build Better Habits

### A Full-Stack Habit Tracking Progressive Web App

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.8-FFCA28?logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)

**HabitFlow** is a professional-grade, full-stack habit tracking application designed to help users build consistency, track progress, and achieve their personal goals. Built with modern web technologies and a stunning glassmorphism UI.

[Live Demo](#) · [Report Bug](https://github.com/kishanpokal/habit-tracker-web/issues) · [Request Feature](https://github.com/kishanpokal/habit-tracker-web/issues)

</div>

---

## 📸 Screenshots

| Landing Page | Dashboard | Analytics |
|:---:|:---:|:---:|
| Animated hero with floating orbs | Real-time habit grid with streaks | 10+ chart visualizations |

| Focus Timer | Badges (50) | Daily Journal |
|:---:|:---:|:---:|
| Pomodoro with SVG ring | 6 achievement categories | Mood tracking + gratitude |

---

## ✨ Features at a Glance

| Category | Features |
|---|---|
| **Habit Tracking** | Create, edit, delete, archive habits · Color coding · Category tags · Target days · Streak tracking |
| **Advanced Analytics** | 10+ Recharts visualizations · Completion heatmap · Radar charts · Trend analysis · AI-style insights · CSV & PDF export |
| **Gamification** | 50 achievement badges across 6 categories · Progress tracking · Stats dashboard |
| **Focus Timer** | Pomodoro technique · SVG ring animation · Auto-switching modes · Customizable durations · Session tracking |
| **Daily Journal** | 5-mood tracker · Daily reflection & gratitude · Journal streak · Recent entries sidebar |
| **Goals System** | Milestone-based goals · Progress bars · 6 categories · Deadline tracking · Auto-completion |
| **Habit Templates** | 28 pre-built habits · 5 categories · One-click add · Search filter |
| **User Management** | Firebase Auth (Email + Google) · Email verification · Profile page · Display name · Password change |
| **UI/UX** | Dark/Light theme toggle · Toast notifications · Daily motivational quotes · Responsive design · Glassmorphism |
| **PWA** | Installable on mobile · Manifest configured · Offline-ready architecture |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Next.js    │  │  React 19    │  │  Tailwind CSS v4     │   │
│  │   App Router │  │  Components  │  │  + Glassmorphism UI  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘   │
│         │                 │                                      │
│  ┌──────┴─────────────────┴──────────────────────────────────┐   │
│  │                    Application Layer                       │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────────────┐  │   │
│  │  │ AuthCtx │ │ useHabits│ │ Toast  │ │ ThemeProvider  │  │   │
│  │  │ Provider│ │ Hook     │ │ System │ │ (next-themes)  │  │   │
│  │  └────┬────┘ └────┬─────┘ └────────┘ └────────────────┘  │   │
│  └───────┼───────────┼───────────────────────────────────────┘   │
│          │           │                                           │
└──────────┼───────────┼───────────────────────────────────────────┘
           │           │
    ┌──────┴───────────┴───────────────────────────────────────┐
    │                    FIREBASE (Backend)                      │
    │                                                           │
    │  ┌─────────────────┐    ┌──────────────────────────────┐  │
    │  │  Firebase Auth   │    │   Cloud Firestore (NoSQL)    │  │
    │  │                  │    │                              │  │
    │  │ • Email/Password │    │  users/{uid}/                │  │
    │  │ • Google OAuth   │    │    ├── habits/{habitId}      │  │
    │  │ • Email Verify   │    │    ├── habitLogs/{logId}     │  │
    │  │ • Password Reset │    │    ├── journal/{entryId}     │  │
    │  └─────────────────┘    │    └── goals/{goalId}        │  │
    │                          └──────────────────────────────┘  │
    └───────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
habit-tracker-web/
├── public/
│   └── manifest.json              # PWA manifest
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── page.tsx               # Splash screen with animations
│   │   ├── landing/page.tsx       # Public marketing landing page
│   │   ├── login/page.tsx         # Split-screen login (Email + Google)
│   │   ├── register/page.tsx      # Registration with password strength
│   │   ├── dashboard/page.tsx     # Main habit tracking dashboard
│   │   ├── analytics/page.tsx     # Advanced analytics (10+ charts)
│   │   ├── badges/page.tsx        # 50 achievement badges
│   │   ├── focus/page.tsx         # Pomodoro focus timer
│   │   ├── journal/page.tsx       # Daily journal with mood tracking
│   │   ├── goals/page.tsx         # Goal management with milestones
│   │   ├── profile/page.tsx       # User profile management
│   │   ├── settings/page.tsx      # App settings & preferences
│   │   ├── habits/page.tsx        # Habit list management
│   │   ├── layout.tsx             # Root layout with providers
│   │   └── globals.css            # Global styles & CSS variables
│   ├── components/
│   │   ├── TopNav.tsx             # Responsive navigation bar
│   │   ├── AddHabitModal.tsx      # Create new habit modal
│   │   ├── EditHabitModal.tsx     # Edit existing habit modal
│   │   ├── HabitList.tsx          # Habit list with categories
│   │   ├── HabitTemplateModal.tsx # 28 pre-built habit templates
│   │   ├── Toast.tsx              # Global toast notification system
│   │   └── ThemeProvider.tsx      # Dark/Light theme provider
│   ├── context/
│   │   └── AuthContext.tsx        # Firebase authentication context
│   ├── hooks/
│   │   └── useHabits.ts           # Custom hook for habit data
│   └── lib/
│       └── firebase.ts            # Firebase configuration
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 🔄 Application Flow

```
                    ┌──────────────┐
                    │  User visits  │
                    │   website     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Splash Screen │
                    │  (Animated)   │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │   Is User Logged In?    │
              └────────┬────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
     ┌──────▼──────┐       ┌─────▼──────┐
     │  Landing    │       │  Dashboard  │
     │  Page       │       │  (Main Hub) │
     └──────┬──────┘       └─────┬──────┘
            │                     │
     ┌──────▼──────┐       ┌─────▼──────────────────────────────┐
     │ Login /     │       │  ┌──────────┐  ┌───────────────┐   │
     │ Register    │       │  │ Analytics│  │ Focus Timer   │   │
     └─────────────┘       │  └──────────┘  └───────────────┘   │
                           │  ┌──────────┐  ┌───────────────┐   │
                           │  │  Badges  │  │   Journal     │   │
                           │  └──────────┘  └───────────────┘   │
                           │  ┌──────────┐  ┌───────────────┐   │
                           │  │  Goals   │  │   Profile     │   │
                           │  └──────────┘  └───────────────┘   │
                           │  ┌──────────┐  ┌───────────────┐   │
                           │  │ Habits   │  │   Settings    │   │
                           │  └──────────┘  └───────────────┘   │
                           └────────────────────────────────────┘
```

---

## 🗄️ Database Schema (Firestore)

```
Cloud Firestore
│
└── users (collection)
    └── {userId} (document)
        │
        ├── habits (subcollection)
        │   └── {habitId}
        │       ├── name: string
        │       ├── color: string
        │       ├── category: string        # "Health", "Fitness", etc.
        │       ├── targetDays: number       # Days per week target
        │       ├── reminderTime: string     # HH:MM format
        │       ├── notes: string
        │       ├── isArchived: boolean
        │       └── createdAt: timestamp
        │
        ├── habitLogs (subcollection)
        │   └── {habitId_date}
        │       ├── habitId: string
        │       ├── date: string            # "YYYY-MM-DD"
        │       ├── completed: boolean
        │       └── createdAt: timestamp
        │
        ├── journal (subcollection)
        │   └── {date}                      # "YYYY-MM-DD"
        │       ├── date: string
        │       ├── mood: string            # "amazing"|"good"|"okay"|"low"|"rough"
        │       ├── content: string         # Daily reflection
        │       ├── gratitude: string       # Gratitude entry
        │       ├── tags: string[]
        │       └── createdAt: timestamp
        │
        └── goals (subcollection)
            └── {goalId}
                ├── title: string
                ├── description: string
                ├── targetDate: string
                ├── category: string        # "health"|"career"|"learning"|...
                ├── milestones: array
                │   └── { text: string, done: boolean }
                ├── completed: boolean
                └── createdAt: timestamp
```

---

## 🛡️ Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /habits/{habitId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /habitLogs/{logId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /journal/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /goals/{goalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

> **Security Model:** Each user can only read/write their own data. All subcollections are protected under the `users/{userId}` path, ensuring complete data isolation between users.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Firebase** account with a project created
- **Git** for version control

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/kishanpokal/habit-tracker-web.git
cd habit-tracker-web

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Run Locally

```bash
# Development server
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server-side rendering, routing, optimization |
| **UI Library** | React 19 | Component-based UI with hooks |
| **Language** | TypeScript 5 | Type safety and developer experience |
| **Styling** | Tailwind CSS v4 | Utility-first CSS with dark mode support |
| **Auth** | Firebase Authentication | Email/password + Google OAuth + email verification |
| **Database** | Cloud Firestore | Real-time NoSQL database with offline support |
| **Charts** | Recharts | 10+ chart types (Area, Bar, Pie, Radar, Line) |
| **PDF Export** | jsPDF | Client-side PDF report generation |
| **Theming** | next-themes | System/manual dark and light mode |
| **Icons** | Lucide React | 1000+ beautiful SVG icons |
| **PWA** | Web Manifest | Installable progressive web app |

---

## 📊 Feature Deep Dive

### 1. Dashboard
The main hub with a **weekly/monthly/yearly/all-time** habit grid. Features include:
- Real-time habit completion toggles
- Color-coded habit cards with streak counters
- Daily motivational quotes
- Week/month navigation
- Templates button for quick habit creation
- Grid and list layout modes

### 2. Advanced Analytics
A comprehensive **3-tab analytics interface**:
- **Overview**: 6 stat cards, consistency score ring chart, trend area charts
- **Habits**: Per-habit breakdown with completion rates, radar charts
- **Patterns**: Weekly rhythm bars, monthly comparison, habit heatmap
- **Export**: CSV download and PDF report generation

### 3. Gamification (50 Badges)
Badges across 6 categories with **real-time Firestore calculations**:
- 🔥 **Streaks** (10): From 3-day to 365-day streaks
- ✅ **Completions** (10): From 1 to 2,000 check-ins
- 📦 **Collection** (8): Tracking multiple habits simultaneously
- ⭐ **Perfection** (8): Consecutive perfect days
- ⏰ **Activity** (8): Days active, weekend warrior, early bird
- ✨ **Special** (6): Category diversity, explorer, early adopter

### 4. Focus Timer (Pomodoro)
A **SVG ring-animated** timer implementing the Pomodoro Technique:
- 25 min focus → 5 min short break → repeat
- Every 4 sessions → 15 min long break
- Customizable durations, session tracking, audio notifications

### 5. Daily Journal
**Mood-aware** daily reflection system:
- 5-level mood tracker (Amazing → Rough)
- Daily reflection and gratitude sections
- Journal streak tracking
- Recent entries sidebar with date navigation

### 6. Goals System
**Milestone-based** goal management:
- Create goals with multiple milestones
- 6 categories (Health, Career, Learning, Fitness, Finance, Personal)
- Progress bars and deadline tracking
- Auto-completes when all milestones are done

---

## 📱 Pages Overview

| # | Page | Route | Description |
|---|---|---|---|
| 1 | Splash Screen | `/` | Animated loading screen with floating orbs |
| 2 | Landing Page | `/landing` | Marketing page with feature showcase |
| 3 | Login | `/login` | Split-screen login (Email + Google) |
| 4 | Register | `/register` | Registration with password strength meter |
| 5 | Dashboard | `/dashboard` | Main habit tracking interface |
| 6 | Analytics | `/analytics` | Advanced data visualization |
| 7 | Badges | `/badges` | 50 achievement badges |
| 8 | Focus Timer | `/focus` | Pomodoro productivity timer |
| 9 | Journal | `/journal` | Daily mood & reflection journal |
| 10 | Goals | `/goals` | Goal management with milestones |
| 11 | Habits | `/habits` | Habit list management |
| 12 | Profile | `/profile` | User profile & account settings |
| 13 | Settings | `/settings` | App preferences & theme |

---

## 🎨 Design Principles

- **Glassmorphism**: Translucent cards with backdrop blur effects
- **Dark Mode First**: Full dark/light theme support via `next-themes`
- **Micro-animations**: Hover effects, scale transitions, and smooth state changes
- **Responsive**: Mobile-first design that scales to desktop and large displays
- **Accessibility**: Semantic HTML, keyboard navigation, contrast ratios

---

## 👨‍💻 Author

**Kishan Pokal**

- GitHub: [@kishanpokal](https://github.com/kishanpokal)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**⭐ Star this repo if you found it useful!**

Built with ❤️ using Next.js, Firebase, and Tailwind CSS

</div>

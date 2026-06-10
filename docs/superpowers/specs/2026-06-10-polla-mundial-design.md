# Polla Mundial Empresarial — Design Spec

## Overview

Web app for managing a World Cup 2026 prediction pool within a small company (10-30 people). Participants predict match outcomes (1/X/2), compete on a live leaderboard, and view personal stats. Built with Next.js + Supabase, deployed on Vercel.

## Requirements

### Functional

- **Group Creation**: Admin creates a group with a unique code (e.g., `MI-EMPRESA-2026`)
- **Simple Entry**: Participants enter with name + group code — no email, no password
- **Match Predictions**: Triple opportunity (1 | X | 2) for all 52 World Cup matches
- **Live Leaderboard**: Real-time ranking with points, streaks, and match-by-match results
- **User Profiles**: Stats including total predictions, accuracy %, current streak, best streak, history by phase
- **Admin Panel**: Manage participants, set match results, configure point rules
- **Special Predictions**: Champion prediction (10 pts), Top Scorer prediction (10 pts)

### Non-Functional

- Free to use, no money handling
- Mobile-first responsive design
- No authentication complexity — name + group code only
- Real-time leaderboard updates via Supabase Realtime
- Deployable on Vercel + Supabase free tier

## Architecture

```
┌─────────────────────────────────────────────┐
│                 Vercel                       │
│  ┌───────────────────────────────────────┐  │
│  │         Next.js 15 (App Router)       │  │
│  │                                       │  │
│  │  Pages:                               │  │
│  │  - / (Landing + Group Entry)          │  │
│  │  - /dashboard (Leaderboard + Matches) │  │
│  │  - /profile/:id (User Stats)          │  │
│  │  - /admin (Admin Panel)               │  │
│  │                                       │  │
│  │  Components:                          │  │
│  │  - MatchCard, PredictionModal         │  │
│  │  - Leaderboard, UserAvatar            │  │
│  │  - StatsChart, AdminControls          │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│              Supabase                        │
│  ┌───────────────────────────────────────┐  │
│  │         PostgreSQL Database           │  │
│  │  - groups, users, matches             │  │
│  │  - predictions, scores, user_stats    │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │         Supabase Realtime             │  │
│  │  - Live leaderboard updates           │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Database Schema

### groups

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Primary key |
| code | text (UNIQUE) | Unique group code (e.g., `MI-EMPRESA-2026`) |
| name | text | Company/group name |
| created_at | timestamptz | Creation timestamp |
| admin_id | uuid (FK → users) | Admin user reference |

### users

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Primary key |
| name | text | Display name |
| avatar | text | Auto-generated avatar URL (initials) |
| group_id | uuid (FK → groups) | Group membership |
| created_at | timestamptz | Registration timestamp |

### matches

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Primary key |
| group_id | uuid (FK → groups) | Group membership |
| team_home | text | Home team name |
| team_away | text | Away team name |
| phase | text | Group, Round of 16, Quarter, Semi, Final |
| scheduled_at | timestamptz | Match date/time |
| status | text | pending, active, closed, completed |
| result_home | integer | Actual home goals (nullable) |
| result_away | integer | Actual away goals (nullable) |
| predictions_closed | boolean | Whether predictions are locked |

### predictions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Primary key |
| user_id | uuid (FK → users) | User making prediction |
| match_id | uuid (FK → matches) | Match being predicted |
| prediction | text | "1", "X", or "2" |
| created_at | timestamptz | Prediction timestamp |

### scores

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Primary key |
| user_id | uuid (FK → users) | User |
| match_id | uuid (FK → matches) | Match |
| points | integer | Points earned |
| correct | boolean | Whether prediction was correct |

### user_stats

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Primary key |
| user_id | uuid (FK → users) | User |
| total_predictions | integer | Total predictions made |
| total_correct | integer | Total correct predictions |
| accuracy | decimal | Accuracy percentage |
| current_streak | integer | Current winning streak |
| best_streak | integer | Best winning streak |
| champion_prediction | text | Champion pick (nullable) |
| top_scorer_prediction | text | Top scorer pick (nullable) |
| last_updated | timestamptz | Last stats update |

### point_rules

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Primary key |
| group_id | uuid (FK → groups) | Group |
| simple_correct | integer | Points for correct 1X2 prediction |
| exact_score | integer | Points for exact score (optional) |
| champion_pick | integer | Points for correct champion |
| top_scorer_pick | integer | Points for correct top scorer |

## API / Data Flow

### Predictions Flow

1. User selects a match → opens prediction modal
2. User picks 1, X, or 2 → prediction saved to DB
3. If prediction already exists → update existing record
4. If match is closed → reject new prediction

### Scoring Flow

1. Admin (or system) enters match result → updates `matches.result_home` and `matches.result_away`
2. System calculates scores:
   - If prediction = "1" and result_home > result_away → correct
   - If prediction = "X" and result_home = result_away → correct
   - If prediction = "2" and result_home < result_away → correct
3. Points assigned based on `point_rules`
4. `user_stats` updated → leaderboard refreshes via realtime

### Leaderboard Query

```sql
SELECT
  u.name,
  u.avatar,
  SUM(s.points) as total_points,
  COUNT(CASE WHEN s.correct THEN 1 END) as correct_predictions,
  COUNT(s.points) as total_predictions
FROM users u
LEFT JOIN scores s ON u.id = s.user_id
WHERE u.group_id = :group_id
GROUP BY u.id
ORDER BY total_points DESC
```

## Pages & Components

### Page: `/` — Landing / Group Entry

**Purpose**: Entry point. User enters name and group code.

**Components**:
- `Logo` — Company logo/branding
- `GroupEntryForm` — Input for name + group code
- `GroupNotFound` — Error state if code is invalid

**Flow**:
1. User enters name and group code
2. System checks if group exists
3. If yes → creates/updates user in session → redirects to `/dashboard`
4. If no → shows "Group not found" error

### Page: `/dashboard` — Main Dashboard

**Purpose**: View today's matches, make predictions, see leaderboard.

**Components**:
- `Leaderboard` — Top 10 ranking with avatars, points, streak
- `MatchDayHeader` — Date and phase info
- `MatchCard` — Individual match with prediction buttons (1 | X | 2)
- `PredictionModal` — Confirmation modal before saving prediction
- `MatchResult` — Shows actual result vs prediction (color-coded)

**Features**:
- Matches grouped by day and phase
- Already-played matches show result comparison
- Upcoming matches show prediction buttons
- Live leaderboard updates via Supabase Realtime

### Page: `/profile/:userId` — User Profile

**Purpose**: View personal stats and prediction history.

**Components**:
- `UserAvatar` — Large avatar with name
- `StatsGrid` — Cards with total predictions, accuracy, streaks
- `PhaseBreakdown` — Stats per phase (group, knockout)
- `PredictionHistory` — List of all predictions with results
- `ComparisonChart` — User vs group average

### Page: `/admin` — Admin Panel

**Purpose**: Manage group, participants, matches, and results.

**Components**:
- `ParticipantList` — Table of users with enable/disable controls
- `MatchManager` — List of all matches with result input fields
- `PointRulesConfig` — Form to configure point values
- `GroupStats` — Overview stats (total participants, predictions made)
- `SpecialPredictions` — View champion/top scorer picks

## Design System

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| primary | #16a34a | Green (football field) |
| primary-dark | #15803d | Darker green |
| accent | #facc15 | Yellow (card highlight) |
| success | #22c55e | Correct prediction |
| error | #ef4444 | Wrong prediction |
| neutral | #6b7280 | Pending/neutral |
| background | #f8fafc | Page background |
| surface | #ffffff | Card background |

### Typography

- Font: Inter (Google Fonts)
- Headings: 600 weight
- Body: 400 weight, 16px base

### Components (shadcn/ui)

- Button, Card, Dialog, Input, Table, Tabs, Avatar, Badge, Progress, Select

### Icons (Lucide React)

- Trophy, Target, Calendar, Users, Settings, Check, X, Clock, TrendingUp

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Backend/DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth (anonymous + name) |
| Realtime | Supabase Realtime |
| Charts | Recharts |
| Icons | Lucide React |
| Hosting | Vercel + Supabase |

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://jlfxpcjfmirhbtpxmeof.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_b_HNo8STWh1SzhY8zsYsBg_X-nPTjVX
```

## Deployment

- **Frontend**: Vercel (automatic deploy from git)
- **Backend**: Supabase (managed PostgreSQL + auth)
- **Custom domain**: Optional, configurable later

## Assumptions

- World Cup 2026 schedule is known and static (hardcoded into DB)
- Admin enters match results manually (no API integration with FIFA data)
- No payment processing — free to use
- No email verification — name + group code is sufficient
- Mobile-first design (most users will access from phone)

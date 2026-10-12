# ⚡ ZETATHON — 8-Hour Internal Hackathon Platform

> **"8 HOURS. ONE CHALLENGE. INFINITE POSSIBILITIES."**  
> An internal sprint hackathon platform engineered for **ZETA Student Club**, designed to empower students to transform ideas into working prototypes through collaboration, creativity, and technology.

---

## 🌟 Key Highlights & Architecture

- **Visual Aesthetics**: Futuristic dark-first design, high-contrast typography, glassmorphism, glowing accents, and an interactive background canvas particle network.
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React icons, Canvas Confetti.
- **Backend API**: Node.js, Express.js, TypeScript, Zod validation, JWT authentication, modular route controllers.
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) policies, foreign key constraints, indexes, plus zero-config in-memory fallback for immediate local testing out of the box.
- **Dynamic Content CMS**: Hackathon dates, countdowns, challenges, timeline milestones, and FAQs can be updated live from the Admin Console without redeploying code.
- **Central Configuration**: All event parameters are centrally configured via `hackathon.config.ts`.

---

## 📁 Project Structure

```
ZETATHON/
├── client/                     # Frontend Application (React + Vite + TypeScript)
│   ├── public/
│   │   └── favicon.svg         # Geometric Z brand favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # BackgroundFX, CountdownTimer, StatCard, SectionHeader, ProtectedRoute
│   │   │   ├── layout/         # Navbar, Footer
│   │   │   └── modals/         # ChallengeDetailModal, RegisterSuccessModal
│   │   ├── context/            # AuthContext (React Authentication & Session Provider)
│   │   ├── pages/              # HomePage, RegisterPage, LoginPage, ParticipantDashboard, AdminDashboard, 404
│   │   ├── services/           # api.ts (HTTP client layer), supabase.ts
│   │   ├── types/              # TypeScript interfaces
│   │   ├── hackathon.config.ts # Mirrored configuration
│   │   ├── index.css           # Design tokens, glassmorphism, glow utilities
│   │   ├── App.tsx             # Route definitions and layouts
│   │   └── main.tsx            # Application entrypoint
│   └── package.json
│
├── server/                     # Backend API (Express.js + TypeScript)
│   ├── src/
│   │   ├── controllers/        # auth, hackathon, teams, submissions, admin
│   │   ├── middleware/         # auth.ts (JWT verification & role enforcement)
│   │   ├── routes/             # REST API routes
│   │   ├── services/           # db.ts (Supabase client & cache layer)
│   │   ├── types/              # Backend typings
│   │   ├── hackathon.config.ts # Mirrored configuration
│   │   └── index.ts            # Express server entrypoint
│   └── package.json
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Complete schema, tables, RLS policies, indexes
│
├── scripts/
│   ├── dev.js                  # Concurrently launches client & server
│   └── test-e2e.js             # End-to-end integration test runner
│
├── hackathon.config.ts         # Central Hackathon Configuration File
├── package.json                # Root package with monorepo orchestration scripts
└── .env.example                # Documented environment variables template
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+

### 2. Install All Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or install inside `/client` and `/server` respectively using `cd client && npm install` and `cd server && npm install`)*

### 3. Start Frontend & Backend Concurrently
From the repository root:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000` (Endpoints at `http://localhost:5000/api`)
- **Frontend Web App**: `http://localhost:5173` (or `http://localhost:5174`)

---

## 🔑 Official Admin Credentials

The administrator portal is exclusively configured for:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin Lead (ZETA E-Cell DCE)** | `zeta.ecell.dce@gmail.com` | `zetadce2444666668888888` | Admin Command Center, Moderation, Scoring, CMS |

> **Note**: Fake/demo teams have been removed. The admin portal only displays actual registered teams.

---

## 🗄️ Supabase PostgreSQL Setup & Migrations

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a project.
2. In the Supabase Dashboard, navigate to the **SQL Editor**.
3. Copy and run the SQL migration script from:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
4. This creates all 10 core tables:
   - `profiles` (User details and roles: participant, admin, mentor, judge)
   - `teams` (Team registrations, unique access codes)
   - `team_members` (Squad member details, 2-4 members constraint)
   - `challenges` (Problem statements, criteria, deliverables)
   - `submissions` (GitHub URLs, live demos, pitch decks, scores)
   - `announcements` (Live broadcasts to participants)
   - `timeline_events` (8-hour schedule milestones)
   - `prizes` (Prize breakdown and perks)
   - `faqs` (Categorized FAQ accordion entries)
   - `hackathon_settings` (Dynamic settings & CMS sync)
5. Row Level Security (RLS) is automatically enabled with access control policies for participants and administrators.

### 2. Configure Environment Variables
Copy `.env.example` into `server/.env` and `client/.env`:
```env
# server/.env
PORT=5000
NODE_ENV=development
JWT_SECRET=super-secret-zetathon-jwt-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# client/.env
VITE_API_URL=/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

---

## 📡 REST API Endpoints Reference

### Public Hackathon Endpoints
- `GET /api/health` — Service health status
- `GET /api/config` — Hackathon configuration & dates
- `GET /api/stats` — Real-time registration statistics
- `GET /api/challenges` — List problem statements
- `GET /api/challenges/:id` — Detailed challenge brief
- `GET /api/timeline` — 8-hour schedule milestones
- `GET /api/prizes` — Prize tiers and perks
- `GET /api/faqs` — FAQ questions and answers
- `GET /api/announcements` — Live organizer notices

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register individual participant account
- `POST /api/auth/login` — Authenticate participant or administrator
- `GET /api/auth/me` — Retrieve active profile, team, and submission
- `POST /api/auth/forgot-password` — Password reset flow
- `POST /api/auth/logout` — Terminate session

### Team Registration & Management (`/api/teams`)
- `POST /api/teams` — Register a new hackathon team (2-4 members with duplicate validation)
- `GET /api/teams/my-team` — Retrieve team profile for authenticated user
- `GET /api/teams/:id` — Retrieve team public overview

### Project Submissions (`/api/submissions`)
- `POST /api/submissions` — Submit project title, GitHub repo, demo URL, pitch video
- `PUT /api/submissions/:id` — Update project deliverables before deadline
- `GET /api/submissions/my-submission` — View current submission

### Admin Console (`/api/admin`) *(Protected: Requires Admin Role)*
- `GET /api/admin/overview` — Dashboard summary metrics
- `GET /api/admin/teams` — Filterable & searchable team registry
- `PUT /api/admin/teams/:id/status` — Approve, waitlist, or reject teams
- `DELETE /api/admin/teams/:id` — Delete team registration
- `GET /api/admin/participants` — Complete participant roster
- `GET /api/admin/submissions` — Project submissions submitted to jury
- `PUT /api/admin/submissions/:teamId/grade` — Assign score (0-100) and jury critique
- `POST /api/admin/announcements` — Publish broadcast announcement
- `DELETE /api/admin/announcements/:id` — Delete announcement
- `PUT /api/admin/config` — Live edit hackathon dates, deadlines, and parameters
- `GET /api/admin/export?format=csv` — Export all registrations to CSV

---

## 🧪 Automated Testing

An automated end-to-end integration test runner is included:
```bash
node scripts/test-e2e.js
```
Runs 12 validation checks:
1. Health check & configuration
2. Public content retrieval
3. Team registration with squad validation
4. Participant authentication & `/auth/me`
5. Project submission deliverable storage
6. Admin authentication
7. Admin team moderation
8. Admin project evaluation & grading
9. Admin announcements creation
10. CSV data export generation

---

## 🎨 Design System & Customization

All styling tokens and branding parameters are defined in:
- `client/src/index.css`: Color variables (`--bg-dark`, `--accent-cyan`, `--accent-purple`), glowing cards, glassmorphic panels.
- `hackathon.config.ts`: Central event data (name, tagline, dates, prizes, challenges, rules, and timeline).

---

## 🚢 Production Deployment

### Frontend (Vercel / Netlify / Cloudflare Pages)
```bash
cd client
npm run build
```
Deploy the generated `client/dist/` directory.

### Backend (Render / Railway / AWS / VPS)
```bash
cd server
npm run build
npm start
```
Runs on `dist/index.js` listening on `PORT` (defaults to 5000).

---

## 🛡️ License
Crafted with pride by **ZETA Student Club**. Open for collegiate hackathons and student tech communities.

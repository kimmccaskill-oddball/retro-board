# Retro Board

A fast, shareable retrospective board. No sign-up required for participants.

**Live:** [kimmccaskill-oddball.github.io/retro-board](https://kimmccaskill-oddball.github.io/retro-board/)

## Stack

- **React + Vite** — frontend
- **Supabase** — database + realtime sync
- **GitHub Pages** — hosting

---

## Features

- Create a board and share the link — no accounts needed
- Realtime updates across all participants
- Add, vote, react to, and delete cards
- Customizable columns with color coding
- Toggle vote (one vote per user per card)
- Emoji reactions per card
- Dark mode
- Export board to PDF
- Short shareable URLs (e.g. `/#xk92mf`)

---

## Local setup (~10 minutes)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor → New query**, paste the contents of `supabase-schema.sql`, and click **Run**
4. Go to **Project Settings → API** and copy your **Project URL** and **anon public** key

### 2. Set environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to GitHub Pages

1. Push to a GitHub repo
2. Go to **Settings → Pages → Build and deployment** and set Source to **GitHub Actions** (not "Deploy from a branch" — that will serve raw source files instead of the built app)
3. Add your Supabase credentials as repository secrets (**Settings → Secrets and variables → Actions**):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Push to `main` — the deploy workflow runs automatically

---

## Tests

```bash
npm test
```

61 tests across all components using Vitest + React Testing Library.

---

## Supabase free tier notes

- Free projects **pause after 1 week of inactivity** — a daily GitHub Actions cron job (`keep-alive.yml`) prevents this
- The 500MB storage limit is effectively unlimited for normal team use
- Realtime supports up to 200 concurrent connections

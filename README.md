# Retro Board

A fast, shareable retrospective board. No sign-up required for participants.

## Stack
- **React + Vite** — frontend
- **Supabase** — database + real-time sync
- **Vercel** — hosting (free tier)

---

## Setup (takes ~10 minutes)

### 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (remember your database password)
3. Once the project is ready, go to **SQL Editor → New query**
4. Paste the contents of `supabase-schema.sql` and click **Run**
5. Go to **Project Settings → API**
6. Copy your **Project URL** and **anon public** key

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and import the repo
3. In the Vercel project settings, add your environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — done! You'll get a free `.vercel.app` URL to share

---

## How it works

- Create a board → get a shareable URL (the board ID is in the hash)
- Anyone with the link can add cards, vote, and see updates in real time
- No login required for participants

## Adding custom columns

Click **"+ Add column"** on any board. Columns are stored in Supabase so they persist across sessions.

# Our Movie Nights

A shared, live-synced movie watchlist for two. React + Vite + Tailwind, Supabase for sync, TMDB for movie data, Gemini for the "Help us decide" picker. Everything runs on free tiers.

## 1. Set up the free database (Supabase)

1. Go to https://supabase.com and sign up (free plan).
2. Click **New project**, name it, choose a database password and the region nearest you. Wait about a minute.
3. Open **SQL Editor > New query**, paste the whole of `supabase.sql`, and click **Run**. This creates the table and switches on live sync.
4. Open **Project Settings > API** and copy:
   - **Project URL** -> `VITE_SUPABASE_URL`
   - **anon public** key -> `VITE_SUPABASE_ANON_KEY`

## 2. Get the free API keys

**TMDB (movie data)**
1. Create an account at https://www.themoviedb.org/signup.
2. Go to **Settings > API**, request a developer key (choose "Personal use"; a short form).
3. Copy the **API Key (v3 auth)** -> `VITE_TMDB_API_KEY`.

**Gemini (optional, for smarter suggestions)**
1. Open https://aistudio.google.com/apikey and click **Create API key**.
2. Copy it -> `VITE_GEMINI_API_KEY`. Without it, the helper still works using a built-in filter on time and mood.

## 3. Run it locally

```bash
npm install
cp .env.example .env.local   # then paste your keys into .env.local
npm run dev
```

## 4. Deploy for free (Vercel)

1. Push this folder to a new GitHub repository.
2. Sign in at https://vercel.npmcom with GitHub, click **Add New > Project**, and import the repo.
3. Vercel detects Vite automatically. Under **Environment Variables**, add the four `VITE_...` values from `.env.example`.
4. Click **Deploy**. You get a link like `https://our-movie-nights.vercel.app`. Rename it under **Settings > Domains**.

**Netlify instead:** New site > Import from Git > build command `npm run build`, publish directory `dist`, add the same environment variables.

## 5. Use it together

Open the site, enter a room code (e.g. `sam-and-alex-2026`), then tap **Invite** to copy a link that opens the same list on her phone. Add it to your home screen from the browser share menu for an app-like feel.

## Good to know

- **Privacy:** there are no logins. The room code is the key, so choose one that's hard to guess.
- **Gemini key visibility:** keys prefixed `VITE_` end up in the browser. In Google AI Studio / Cloud Console, restrict the Gemini key to your site's URL (HTTP referrer) so it can't be reused elsewhere. The TMDB and Supabase anon keys are designed to be public.
- **Ratings** are TMDB scores out of 10 (TMDB doesn't provide IMDb ratings).
- Supabase free projects pause after a week of no activity. Open the dashboard and click Restore if that happens.

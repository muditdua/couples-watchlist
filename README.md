# Our Movie Nights

A shared, live-synced watchlist of movies and series for two. React + Vite + Tailwind, Supabase for sync, TMDB for movie data, Gemini for the "Help us decide" picker. Everything runs on free tiers.

## 1. Set up the free database (Supabase)

1. Go to https://supabase.com and sign up (free plan).
2. Click **New project**, name it, choose a database password and the region nearest you. Wait about a minute.
3. Open **SQL Editor > New query**, paste the whole of `supabase.sql`, and click **Run**. This creates the table and switches on live sync. (If you already ran an older version, run `supabase-upgrade-existing.sql` instead.)
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
2. Sign in at https://vercel.com with GitHub, click **Add New > Project**, and import the repo.
3. Vercel detects Vite automatically. Under **Environment Variables**, add the four `VITE_...` values from `.env.example`.
4. Click **Deploy**. You get a link like `https://our-movie-nights.vercel.app`. Rename it under **Settings > Domains**.

**Netlify instead:** New site > Import from Git > build command `npm run build`, publish directory `dist`, add the same environment variables.

## 5. Use it together

Open the same site link on both phones and you're looking at the same list. Add it to your home screen from the browser share menu for an app-like feel.

## Good to know

- **No login (for now):** anyone who has your site link or Supabase keys can edit the list, so don't share the link publicly.
- **Series:** episode length is shown per episode, with season count and creator.
- **Gemini key visibility:** keys prefixed `VITE_` end up in the browser. Restrict the Gemini key to your site's URL (HTTP referrer) in Google's console. The TMDB and Supabase anon keys are designed to be public.
- **"Invalid path" error:** `VITE_SUPABASE_URL` should be only `https://YOUR-PROJECT.supabase.co`. Restart `npm run dev` after editing `.env.local`.
- **Ratings** are TMDB scores out of 10 (TMDB doesn't provide IMDb ratings).
- Supabase free projects pause after a week of no activity. Click Restore in the dashboard if that happens.

## Where to watch and details pane

- Streaming logos come from TMDB's watch-provider data (powered by JustWatch). The country defaults to India; change it with `VITE_WATCH_REGION` (for example `US`, `GB`).
- Tap any card to open its details: summary, cast, where to watch, and for series a list of seasons that expand into episodes.
- Availability is cached in the browser for 24 hours to keep things fast and within TMDB's limits.

## Login: magic link and forgot password

The login page also offers "Email me a magic link" and "Forgot password?". For the links in those emails to land back on your site:

1. In Supabase open **Authentication > URL Configuration**.
2. Set **Site URL** to your live address (for example `https://our-watchlist-mn.vercel.app`).
3. Under **Redirect URLs** add your live address and `http://localhost:5173`.

Notes: sign-ups can stay switched off (the magic link never creates new accounts). Supabase's built-in email sender is limited to a few emails per hour, which is plenty for two people.

## Feature switches

`src/config.js` has `episodeTracking: true`. Set it to `false` to hide episode ticking everywhere (the data is kept).

## Upgrading an existing database

If your table was created before "Added by", "Wanted by" and episode tracking, run `supabase-upgrade-v2.sql` once in the Supabase SQL Editor.

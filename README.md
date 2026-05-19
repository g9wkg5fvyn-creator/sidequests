# Side Quests Tracker

Josh & Brendan's shared side quest ledger.

## Setup

1. **Supabase**: create project, run the SQL in SETUP.md, grab the URL + anon key.
2. **GitHub**: push this folder to a repo.
3. **Vercel**: import the repo. Add env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Open the URL on iPhone → Share → Add to Home Screen.

## Local dev (optional)

```
npm install
echo "NEXT_PUBLIC_SUPABASE_URL=your_url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key" >> .env.local
npm run dev
```

Open localhost:3000.

# Sunday Data Studio

Next.js app for turning a brief or Google Doc into a visual Sunday Data newsletter.

## Local

```bash
npm install
cp .env.example .env.local
# fill OPENAI_API_KEY, STUDIO_PASSWORD, SESSION_SECRET
npm run dev
```

Open [http://localhost:3000/studio](http://localhost:3000/studio).

## Vercel

1. Import this GitHub repo in [Vercel](https://vercel.com/new). Framework: **Next.js**. Root: repo root.
2. Add environment variables (Production + Preview):
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional, defaults in code)
   - `STUDIO_PASSWORD`
   - `SESSION_SECRET` (long random string)
3. Deploy. Studio is at `/studio`.

Research and generate routes are capped at **60s** (Hobby). On Pro, raise `maxDuration` in `vercel.json` and the route files if OpenAI calls time out.

# Sunday Data Studio

Next.js app for turning a brief or Google Doc into a visual Sunday Data newsletter.

```
app/
  page.tsx              # home
  studio/               # /studio
  login/                # password gate
  archive/              # published issues
  api/                  # generate, research, brief-read, auth
  components/           # UI (Studio, memes, charts, templates)
  templates/            # print + living newsletter layouts
  lib/                  # extract, topic, blocks, flourishes
public/                 # static memes + archive assets
```

## Local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000/studio](http://localhost:3000/studio).

Secrets stay in `.env.local` (never commit): `OPENAI_API_KEY`, `STUDIO_PASSWORD`, `SESSION_SECRET`.

## Vercel

Import [ankitbansal2101/newsletter](https://github.com/ankitbansal2101/newsletter). Add the same env vars in the Vercel project settings. Studio is at `/studio`.

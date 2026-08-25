# CLAUDE.md — Sunday Data Studio

## Quick Start
```bash
npm run dev                                    # local dev → http://localhost:3000
npm run build && npx netlify-cli deploy --prod --dir .next --skip-functions-cache  # deploy
```

## What This Is
Sunday Data Studio — editorial tool + public newsletter for the Pendle community.
- **Public**: `thesundaydata.com/` (bilingual newsletter)
- **Studio**: `thesundaydata.com/studio` (password: `sundaydata2026`)
- **Archive**: `thesundaydata.com/archive` (past issues)
- **World Cup**: `worldcup26.thesundaydata.com` (separate GitHub Pages site, untouched)

## Stack
- Next.js 16.2.6 (App Router, Turbopack)
- Netlify hosting (site name: `pendleai`)
- OpenAI GPT-5.6-terra for research generation
- Ostrich data pipeline for weekly signal intelligence

## Key Files
| File | Purpose |
|------|---------|
| `app/Studio.tsx` | Main editorial interface — fetches signals dynamically |
| `app/TopologyMap.tsx` | Interactive SVG cluster graph |
| `app/NewsletterTemplate.tsx` | Shared bilingual newsletter renderer |
| `app/api/signals/route.ts` | Reads Ostrich pipeline → returns Signal[] + topology |
| `app/api/generate/route.ts` | Sends draft to OpenAI → structured flourishes |
| `app/api/publish/route.ts` | Writes issue to `data/current-issue.json` |
| `data/weekly-latest/summaries/weighted_summary_easy_signal.json` | Source of truth for signals |
| `data/cluster_intelligence.json` | 283 cluster definitions for topology |
| `middleware.ts` | Auth gate for /studio |
| `netlify.toml` | Build + redirect config |

## Rules
- All signal data is DYNAMIC (fetched from /api/signals) — never hardcode
- Test locally before deploying
- Commit before `npx netlify-cli deploy`
- Keep the Forest Hunt puzzle login — it's intentional
- Never expose API keys in client code
- Preserve existing comments and docstrings

## Env Vars (set on Netlify + in .env.local)
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `STUDIO_PASSWORD`, `SESSION_SECRET`

## Deploy
```bash
git add -A && git commit -m "message" && git push origin main
npm run build && npx netlify-cli deploy --prod --dir .next --skip-functions-cache
```

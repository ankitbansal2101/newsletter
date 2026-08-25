# Weekly Intake: 2026-W29

Window: `2026-07-11` to `2026-07-18`

This folder is the weekly acquisition layer. It should contain source plans,
raw fetched drops, logs, and weighted summaries for the week. It is deliberately
upstream of `data/harmonized`.

## Folder Contract

- `source_roster.json`: intended sources and source authority priors.
- `fetch_ledger.json`: what was attempted, fetched, failed, or skipped.
- `raw/`: week-scoped raw exports or downloaded payloads.
- `processed/`: week-scoped normalized extracts before global harmonization.
- `summaries/`: weighted weekly summaries and coverage audits.
- `logs/`: fetch/process logs.

## Rule

The source roster is not evidence. Only fetched records become evidence.
Weighted summaries can use the roster to expose coverage gaps, but should not
pretend missing sources were read.

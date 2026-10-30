# Displaced

An interactive "plague map" of AI job displacement. Urgent and data-driven, but honest: every score is paired with what survives and where to go next.

## Run

```bash
npm install
npm run dev        # web on http://localhost:5173 + API on http://localhost:8787
npm run dev:web    # frontend only (live panels show "unavailable")
npm run test       # vitest
npm run build      # typecheck (web + server) + production build
```

On Windows PowerShell, use `npm.cmd` if script execution is blocked.

## What exists

- **Fields view**: 10 fields sized by workforce. Click a field to zoom into its roles.
- **Skills view**: technical vs. human skills, with automatability and demand direction.
- **Connected view**: Fields and Skills side by side. Selecting a job, field or skill highlights its linked items in the other panel.
- **Overview**: all roles at once. A treemap (size = workforce, colour = risk), summary stats, workers by risk band, risk by field, and a risk-vs-outlook scatter. Click any role to open it. The outlook axis uses placeholder growth figures and is labelled as a forecast.
- **War map**: AI as an invading force. Fields are territories and roles are the dots inside them. Press *Start invasion* (or drag the slider) and red arrows spread out from Technology, the beachhead, into the other fields, which flood with their risk colour as the front arrives. Where AI augments rather than replaces (Military & Defense) or risk is under 25 (Healthcare, Education, Skilled Trades), the arrow turns blue, the border is dashed and the tint is light: the front reaches the field without taking it. Arrival order is each field's workforce-weighted `velocity` score, ranked. It is a relative order, **not a calendar forecast**, and the view says so. Playback starts only when the user presses the button, and the animations respect `prefers-reduced-motion`.
- **Search**: type a job title or alias to zoom to it. It shows risk score, replacing tools, surviving skills, pivots, live signals and recent news.
- **Plague animation**: a canvas particle layer. Spore emission speed follows `velocity`. Halo density and darkness follow `risk`. Dashed cyan marks roles AI augments. It respects `prefers-reduced-motion`.
- **Skill cards**: demand direction, 5-year outlook, linked evidence, jobs that need the skill, and why human skills resist automation.
- **Military & Defense layer** (header button): why these roles are augmented rather than replaced, the honest counter-view, per-role notes, and what we could not check.
- **Human skills layer** (header button): for each of the five human skills, the argument, the strongest objection, and what would prove the argument wrong.

Deep links: `?view=split|skills|fields|overview|war&job=<id>&field=<id>&skill=<id>&sources=1&layer=military|human`.

> The dataset in `src/data/dataset.ts` is **editorial estimates**. It is not measured data. The 10-year `growth` figures are placeholders.

## Live data (`server/`)

| Feed | Used for | Limits |
| --- | --- | --- |
| BLS public API v1 (no key needed) | Industry employment and 12-month change | Industry-level only, not job titles. Does not cover active-duty military. |
| Indeed Hiring Lab postings index (CC-BY-4.0, attribution shown) | Postings by sector, indexed to Feb 2020 | Broad sectors. Also moves with rates and seasons. |
| Google News RSS, or NewsAPI when `NEWS_API_KEY` is set | Recent headlines per role | Search results, not verified claims. |

Live data is shown as separate **market signals** and is never folded silently into the risk scores. The header pill shows live / stale / unavailable status. Responses are cached on disk and in memory.

Endpoints: `/api/health`, `/api/live`, `/api/news/:jobId`.

## Evidence and honesty

- Every number is labelled **Evidence-linked**, **Editorial estimate**, **Forecast** or **Reasoned argument**.
- `src/data/sources.ts` and `sources2.ts` hold the sources. Each was opened and read, and numbers are copied from the abstract or page. Add a source only after reading it. Tests check that every reference points at a real source.
- Cards show the linked studies, which way each points, and its limits. With no linked study, the card says so.
- Counter-evidence is included on purpose (for example, a study where a chatbot's replies were rated more empathetic than physicians').
- Defense claims use public material only. We could not open the DoD directive itself, so it is cited through a secondary summary, and flagged as such.
- Header → **Sources & method** has a worked "How good is AI at Python?" example, the live feeds, and the planned sources that no number uses yet.

## Deploy

**Backend → Render** (`render.yaml`, Node 22+). Set:

- `ALLOWED_ORIGINS` = your Vercel URL (comma-separated for several)
- `BLS_API_KEY`, `NEWS_API_KEY` = optional

Railway works the same way: build `npm install --include=dev`, start `npm run start`, health check `/api/health`.

**Frontend → Vercel** (`vercel.json`). Set `VITE_API_BASE` to the Render URL (no trailing slash), then deploy.

See `.env.example` for all variables. The disk cache is ephemeral on free hosts, so the first request after a cold start re-fetches (about 15s for Indeed).

These deploy files have not been run against Vercel or Render yet.

## Roadmap

1. ~~Static prototype~~
2. ~~Search, zoom and plague animation~~
3. ~~Split / connected view~~
4. ~~Live APIs (BLS, Indeed, news)~~
5. ~~Military & Defense and Human Skills layers~~
6. Next: occupation-level BLS projections (OOH) and O*NET for all roles, live benchmark scores, and a recompute of risk from measured inputs with a published formula.

## Layout

- `src/data/dataset.ts`: fields, jobs and skills
- `src/data/sources.ts`, `sources2.ts`: sources and evidence links
- `src/data/layers.ts`: copy for the two dedicated layers
- `src/lib/derive.ts`: node derivation, connections, search (tests alongside)
- `src/lib/layout.ts`: d3-force bubble layout
- `src/lib/war.ts`: War map geometry, arrival order, route maths (tests in `war.test.ts`)
- `src/components/WarMap.tsx`: War map SVG, playback and readouts
- `src/lib/live.tsx`: live data client
- `src/components/PlagueMap.tsx`: SVG nodes (Framer Motion) plus canvas plague
- `server/`: Express API, providers and cache

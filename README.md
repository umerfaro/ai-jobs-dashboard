# ⚡ AI Jobs Dashboard

Automated AI job opportunity aggregator that searches, scores, and manages low-competition AI jobs.

**Live URL:** https://ai-jobs-dashboard-umerfaros-projects.vercel.app

## How It Works

```
You click "Scan Now"
    ↓
Server runs 6 Firecrawl searches across ATS platforms
    ↓
Each job scored by OpenRouter LLM (free models) against your resume
    ↓
Only jobs ≥ 70 score returned → stored in browser localStorage
    ↓
Dashboard shows cards with title, company, score %, match summary
    ↓
Apply → opens URL + marks Applied in localStorage
Skip → moves to Skipped tab
```

## Architecture

- **Server (Vercel):** Stateless — discovers jobs via Firecrawl, scores via OpenRouter, returns results
- **Client (Browser):** All persistence in localStorage — no external DB needed
- **Scoring:** OpenRouter free models with 4-way fallback:
  1. `minimax/minimax-m2.5:free`
  2. `google/gemma-4-26b-a4b-it:free`
  3. `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
  4. `inclusionai/ring-2.6-1t:free`
  → Falls back to keyword scoring if all models fail

## Search Queries

| Platform | Query Focus |
|----------|------------|
| Ashby | AI Agent / Agentic / LLM + n8n/Python/Node |
| Lever | AI/LLM Engineer + Remote/Ireland/Saudi/Japan |
| Greenhouse | AI/LLM/GenAI Engineer + Remote/Ireland/Japan |
| Workable | AI/LLM + Remote/Dubai/Riyadh/UAE |
| Startup DNA | Series A/B/Seed + Apply |
| Careers | Equity + Remote/US/Europe |

All queries exclude Pakistan and major aggregators (Indeed, LinkedIn).

## Setup

### Environment Variables (Vercel)

| Variable | Value |
|----------|-------|
| `FIRECRAWL_API_KEY` | Your Firecrawl key |
| `OPENROUTER_API_KEY` | Your OpenRouter key |

### Local Development

```bash
npm install
cp .env.example .env.local  # Add your keys
npm run dev
```

## Scoring

Jobs scored 0-100 by LLM comparing job posting against your resume:
1. **Tech stack alignment** — Python, LLM frameworks, n8n, FastAPI, AI tools
2. **Company stage** — Startups and early-stage get bonus
3. **Remote/work arrangement** — Remote roles preferred
4. **Transferable skills** — Flutter, mobile, backend, AWS, CI/CD
5. **Career progression** — Overall fit with experience

Only jobs ≥ **70** appear on the dashboard.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cron/jobs` | Trigger job search pipeline |
| GET | `/api/jobs?filter=new` | Get jobs (new/archive/all) |
| POST | `/api/jobs/[id]/action` | Apply or skip a job |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **Scraping:** Firecrawl API
- **LLM:** OpenRouter (free models with fallback)
- **Storage:** Client-side localStorage (no external DB)
- **Deployment:** Vercel

---

Built with ⚡ by [Ayroflow](https://ayroflow.com)

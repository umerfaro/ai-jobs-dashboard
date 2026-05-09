# ⚡ AI Jobs Dashboard

Automated AI job opportunity aggregator that searches, scores, and manages low-competition AI jobs every morning.

**Live URL:** https://ai-jobs-dashboard-umerfaros-projects.vercel.app

## Features

- 🔍 **Smart Search** — 6 Google Dorking queries across Ashby, Lever, Greenhouse, Workable + startup DNA searches
- 🧠 **LLM Scoring** — AI-powered resume matching (0-100 score) against your skills
- 📊 **Dashboard** — Clean dark UI with job cards, match summaries, and filters
- ⚡ **One-Click Actions** — Apply (opens URL) or Skip with status tracking
- 📁 **Archive** — View all Applied and Skipped jobs for historical tracking
- ⏰ **Daily Automation** — Cron runs at 9:00 AM PKT automatically

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│  Vercel     │────▶│  Firecrawl   │────▶│  OpenRouter  │────▶│  Dashboard  │
│  Cron 9AM   │     │  Search API  │     │  LLM Score   │     │  UI        │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
```

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

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FIRECRAWL_API_KEY` | ✅ | Web scraping API key |
| `OPENROUTER_API_KEY` | ⚠️ | LLM scoring (fallback to keyword mode without it) |
| `OPENROUTER_MODEL` | ❌ | Default: `qwen/qwen3-235b-a22b` |
| `KV_REST_API_URL` | ⚠️ | Vercel KV URL (for production persistence) |
| `KV_REST_API_TOKEN` | ⚠️ | Vercel KV token (for production persistence) |
| `CRON_SECRET` | ❌ | Optional cron endpoint protection |

### Deploy to Vercel

1. Fork/push this repo to GitHub
2. Connect to Vercel: `vercel`
3. Add environment variables in Vercel dashboard
4. Create a Vercel KV database for production persistence
5. Cron is configured in `vercel.json` (9:00 AM PKT = 4:00 AM UTC)

### Local Development

```bash
npm install
cp .env.example .env.local  # Add your API keys
npm run dev
```

## Scoring

Jobs are scored 0-100 based on:
1. **Tech stack alignment** — Python, LLM frameworks, n8n, FastAPI, AI tools
2. **Company stage** — Startups and early-stage companies get bonus
3. **Remote/work arrangement** — Remote roles preferred
4. **Transferable skills** — Flutter, mobile, backend, AWS, CI/CD
5. **Career progression** — Overall fit with experience

Only jobs scoring **≥ 70** appear on the dashboard.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/jobs?filter=new` | Get new/applied/skipped jobs |
| GET | `/api/cron/jobs` | Trigger job search pipeline |
| POST | `/api/jobs/[id]/action` | Apply or skip a job |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **Scraping:** Firecrawl API
- **LLM:** OpenRouter (Qwen 3 235B)
- **Storage:** Vercel KV (prod) / JSON file (dev)
- **Deployment:** Vercel
- **Automation:** Vercel Cron (daily 9 AM PKT)

---

Built with ⚡ by [Ayroflow](https://ayroflow.com)

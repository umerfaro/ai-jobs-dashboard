export interface SearchQuery {
  id: string;
  name: string;
  query: string;
  platform: string;
}

export const SEARCH_QUERIES: SearchQuery[] = [
  {
    id: "ashby",
    name: "Ashby (AI Agent / Agentic / LLM)",
    platform: "ashbyhq.com",
    query:
      'site:jobs.ashbyhq.com ("AI Agent" OR "Agentic" OR "LLM") ("n8n" OR "Python" OR "Node") ("Remote" OR "Europe" OR "US") -Pakistan',
  },
  {
    id: "lever",
    name: "Lever (AI/LLM Engineer)",
    platform: "lever.co",
    query:
      'site:lever.co ("AI Engineer" OR "LLM Engineer" OR "AI Developer") (Remote OR Ireland OR "Saudi Arabia" OR Japan OR Kuwait) -Pakistan',
  },
  {
    id: "greenhouse",
    name: "Greenhouse (AI/LLM/GenAI)",
    platform: "greenhouse.io",
    query:
      'site:boards.greenhouse.io ("AI Engineer" OR "LLM Engineer" OR "Generative AI") (Remote OR Ireland OR Japan OR Saudi) -Pakistan',
  },
  {
    id: "workable",
    name: "Workable (AI/LLM)",
    platform: "workable.com",
    query:
      'site:apply.workable.com ("AI Engineer" OR "LLM") (Remote OR "Dubai" OR "Riyadh" OR "UAE") -Pakistan',
  },
  {
    id: "startup-funding",
    name: "Startup DNA & Funding (Series A/B/Seed)",
    platform: "various",
    query:
      '("AI Engineer" OR "LLM") (Remote OR Europe OR USA) ("Series A" OR "Series B" OR "Seed") "Apply" -site:indeed.com -site:linkedin.com -Pakistan',
  },
  {
    id: "careers-equity",
    name: "Careers + Equity (Remote/US/Europe)",
    platform: "various",
    query:
      'intitle:careers ("AI Engineer" OR "LLM") "equity" (Remote OR "USA" OR "Europe") -site:linkedin.com -Pakistan',
  },
];

export const SCORE_THRESHOLD = 70;

export const FIRECRAWL_API_KEY =
  process.env.FIRECRAWL_API_KEY || "";
export const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || "";

export const OPENROUTER_MODELS = [
  "minimax/minimax-m2.5:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "inclusionai/ring-2.6-1t:free",
];

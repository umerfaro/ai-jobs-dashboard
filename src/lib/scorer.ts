import { OPENROUTER_API_KEY, OPENROUTER_MODELS, SCORE_THRESHOLD } from "./config";
import type { RawJobResult } from "./scraper";
import type { Job } from "./db";

export interface ScoreResult {
  score: number;
  matchSummary: string;
}

const SYSTEM_TEMPLATE = (resume: string) =>
  `You are a precise job matcher. Compare the job posting against the candidate's resume and return ONLY valid JSON.

Resume:
${resume}

Score based on:
1. Tech stack alignment (Python, LLM frameworks, Agentic AI, n8n, FastAPI, AI/ML tools) — most important
2. Company stage and growth potential (startups, early-stage = bonus)
3. Remote/work arrangement fit
4. Relevant experience (AI Agents, LLM apps, enterprise automation, conversational AI)
5. Overall career progression fit

Return EXACTLY this JSON with no other text, no markdown:
{"score": <number 0-100>, "matchSummary": "<2 sentences why this matches or doesn't>"}`;

async function tryModel(
  model: string,
  resume: string,
  jobTitle: string,
  jobDescription: string
): Promise<ScoreResult | null> {
  const prompt = `Job Title: ${jobTitle}\n\nDescription:\n${jobDescription.slice(0, 3000)}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://ai-jobs-dashboard.vercel.app",
      "X-Title": "AI Jobs Dashboard",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_TEMPLATE(resume) },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 200,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
        matchSummary: parsed.matchSummary || "No summary available",
      };
    } catch {
      return null;
    }
  }
  return null;
}

async function scoreWithLLM(
  resume: string,
  jobTitle: string,
  jobDescription: string
): Promise<ScoreResult> {
  for (const model of OPENROUTER_MODELS) {
    try {
      const result = await tryModel(model, resume, jobTitle, jobDescription);
      if (result) return result;
    } catch {
      continue;
    }
  }

  return keywordScore(jobTitle, jobDescription);
}

function keywordScore(
  jobTitle: string,
  jobDescription: string
): ScoreResult {
  const combined = `${jobTitle} ${jobDescription}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  const aiKeywords = [
    "ai engineer", "llm", "large language model", "machine learning",
    "generative ai", "ai agent", "agentic", "n8n", "langchain",
    "openai", "api",
  ];
  const aiMatches = aiKeywords.filter((k) => combined.includes(k));
  score += aiMatches.length * 8;
  if (aiMatches.length > 0)
    reasons.push(`AI/ML keywords: ${aiMatches.slice(0, 3).join(", ")}`);

  const backendKeywords = ["python", "fastapi", "node", "backend", "rest api"];
  const backendMatches = backendKeywords.filter((k) => combined.includes(k));
  score += backendMatches.length * 5;

  const cloudKeywords = ["aws", "firebase", "docker", "ci/cd", "github actions"];
  const cloudMatches = cloudKeywords.filter((k) => combined.includes(k));
  score += cloudMatches.length * 4;

  if (combined.includes("mobile") || combined.includes("app")) {
    score += 10;
    reasons.push("Mobile dev relevance");
  }

  if (
    combined.includes("series a") || combined.includes("series b") ||
    combined.includes("seed") || combined.includes("startup")
  ) {
    score += 10;
    reasons.push("Startup stage bonus");
  }

  if (combined.includes("remote")) score += 5;

  score = Math.min(100, score);

  return {
    score,
    matchSummary:
      reasons.length > 0
        ? reasons.join(". ") + "."
        : `Keyword match: ${score}/100.`,
  };
}

export async function scoreJobs(
  resume: string,
  rawJobs: RawJobResult[]
): Promise<Job[]> {
  const scored: Job[] = [];

  for (const job of rawJobs) {
    console.log(`📝 Scoring: ${job.title} at ${job.company}`);
    const result = await scoreWithLLM(resume, job.title, job.description);

    if (result.score >= SCORE_THRESHOLD) {
      scored.push({
        id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: job.title,
        company: job.company || extractCompanyFromUrl(job.url),
        location: job.location || "Remote",
        url: job.url,
        source: job.source,
        score: result.score,
        matchSummary: result.matchSummary,
        status: "New",
        addedAt: new Date().toISOString(),
      });
      console.log(`  ✅ Score: ${result.score} — INCLUDED`);
    } else {
      console.log(`  ❌ Score: ${result.score} — below threshold`);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return scored;
}

function extractCompanyFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes("ashbyhq")) return "Ashby Hosted";
    if (hostname.includes("lever.co")) {
      const parts = hostname.split(".");
      return parts[0] === "jobs" ? parts[1] : parts[0];
    }
    if (hostname.includes("greenhouse.io")) {
      const parts = hostname.split(".");
      return parts[0] === "boards" ? parts[1] : parts[0];
    }
    if (hostname.includes("workable.com")) {
      const parts = hostname.split(".");
      return parts[0] === "apply" ? parts[1] : parts[0];
    }
    return hostname.replace("www.", "").split(".")[0];
  } catch {
    return "Unknown Company";
  }
}

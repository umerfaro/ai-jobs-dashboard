import { RESUME_TEXT } from "../data/resume";
import { OPENROUTER_API_KEY, OPENROUTER_MODEL, SCORE_THRESHOLD } from "./config";
import type { RawJobResult } from "./scraper";
import type { Job } from "./db";

export interface ScoreResult {
  score: number;
  matchSummary: string;
}

async function scoreWithLLM(
  jobTitle: string,
  jobDescription: string
): Promise<ScoreResult> {
  if (!OPENROUTER_API_KEY) {
    // Fallback: basic keyword scoring if no LLM API key
    return basicKeywordScore(jobTitle, jobDescription);
  }

  const prompt = `You are a job matching assistant. Compare this job posting against the candidate's resume and provide a match score and summary.

RESUME:
${RESUME_TEXT}

JOB:
Title: ${jobTitle}
Description:
${jobDescription.slice(0, 3000)}

Evaluate based on:
1. Tech stack alignment (Python, LLM frameworks, n8n, FastAPI, AI/ML tools) — most important
2. Company stage and growth potential (startups, early-stage = bonus)
3. Remote/work arrangement fit
4. Transferable skills from Flutter/mobile/backend/AWS experience
5. Overall career progression fit

Respond in EXACTLY this JSON format with no other text:
{"score": <number 0-100>, "matchSummary": "<2 sentence summary of why this matches or doesn't>"}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://ai-jobs-dashboard.vercel.app",
        "X-Title": "AI Jobs Dashboard",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a precise job matcher. Always respond with valid JSON only. No markdown, no explanation.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error(`LLM scoring failed: ${response.status}`);
      return basicKeywordScore(jobTitle, jobDescription);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
        matchSummary:
          parsed.matchSummary || "No summary available",
      };
    }

    return basicKeywordScore(jobTitle, jobDescription);
  } catch (err) {
    console.error("LLM scoring error:", err);
    return basicKeywordScore(jobTitle, jobDescription);
  }
}

function basicKeywordScore(
  jobTitle: string,
  jobDescription: string
): ScoreResult {
  const combined = `${jobTitle} ${jobDescription}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  // AI/ML keywords (high weight)
  const aiKeywords = [
    "ai engineer",
    "llm",
    "large language model",
    "machine learning",
    "generative ai",
    "ai agent",
    "agentic",
    "n8n",
    "langchain",
    "openai",
    "api",
  ];
  const aiMatches = aiKeywords.filter((k) => combined.includes(k));
  score += aiMatches.length * 8;
  if (aiMatches.length > 0)
    reasons.push(`AI/ML keywords match: ${aiMatches.slice(0, 3).join(", ")}`);

  // Backend/Python keywords
  const backendKeywords = ["python", "fastapi", "node", "backend", "rest api"];
  const backendMatches = backendKeywords.filter((k) => combined.includes(k));
  score += backendMatches.length * 5;

  // Cloud keywords
  const cloudKeywords = ["aws", "firebase", "docker", "ci/cd", "github actions"];
  const cloudMatches = cloudKeywords.filter((k) => combined.includes(k));
  score += cloudMatches.length * 4;

  // Mobile/Flutter (transferable)
  if (combined.includes("mobile") || combined.includes("app")) {
    score += 10;
    reasons.push("Mobile development relevance");
  }

  // Startup bonus
  if (
    combined.includes("series a") ||
    combined.includes("series b") ||
    combined.includes("seed") ||
    combined.includes("startup")
  ) {
    score += 10;
    reasons.push("Startup stage bonus");
  }

  // Remote bonus
  if (combined.includes("remote")) {
    score += 5;
  }

  score = Math.min(100, score);

  const summary =
    reasons.length > 0
      ? reasons.join(". ") + "."
      : `Basic keyword match: ${score}/100 based on tech stack overlap.`;

  return { score, matchSummary: summary };
}

export async function scoreJobs(
  rawJobs: RawJobResult[]
): Promise<Job[]> {
  const scored: Job[] = [];

  for (const job of rawJobs) {
    console.log(`📝 Scoring: ${job.title} at ${job.company}`);
    const result = await scoreWithLLM(job.title, job.description);

    if (result.score >= SCORE_THRESHOLD) {
      scored.push({
        id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: job.title,
        company: job.company || extractCompanyFromUrl(job.url),
        location: job.location || "Remote",
        url: job.url,
        source: job.source,
        description: job.description,
        score: result.score,
        matchSummary: result.matchSummary,
        status: "New",
        addedAt: new Date().toISOString(),
      });
      console.log(`  ✅ Score: ${result.score} — INCLUDED`);
    } else {
      console.log(`  ❌ Score: ${result.score} — below threshold`);
    }

    // Delay between LLM calls
    await new Promise((resolve) => setTimeout(resolve, 2000));
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

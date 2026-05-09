import { runAllQueries } from "./scraper";
import { scoreJobs } from "./scorer";

export interface PipelineResult {
  rawFound: number;
  scored: number;
  passed: number;
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string;
    url: string;
    source: string;
    score: number;
    matchSummary: string;
    addedAt: string;
  }[];
  error?: string;
}

export async function runPipeline(): Promise<PipelineResult> {
  try {
    console.log("🚀 Starting job search pipeline...");

    // Step 1: Run Firecrawl searches
    const rawJobs = await runAllQueries();

    if (rawJobs.length === 0) {
      return {
        rawFound: 0,
        scored: 0,
        passed: 0,
        jobs: [],
        error: "No jobs found from search queries",
      };
    }

    // Step 2: Score each job
    const scoredJobs = await scoreJobs(rawJobs);

    // Return jobs — client handles persistence
    const result = {
      rawFound: rawJobs.length,
      scored: scoredJobs.length,
      passed: scoredJobs.length,
      jobs: scoredJobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        url: j.url,
        source: j.source,
        score: j.score,
        matchSummary: j.matchSummary,
        addedAt: j.addedAt,
      })),
    };

    console.log(`✅ Pipeline complete: ${result.passed} high-scoring jobs found`);
    return result;
  } catch (err) {
    console.error("Pipeline error:", err);
    return {
      rawFound: 0,
      scored: 0,
      passed: 0,
      jobs: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

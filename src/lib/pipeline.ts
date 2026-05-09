import { runAllQueries } from "./scraper";
import { scoreJobs } from "./scorer";
import { addJobs, getNewJobs, Job } from "./db";

export interface PipelineResult {
  rawFound: number;
  scored: number;
  passed: number;
  added: number;
  totalNew: number;
  jobs: Job[];
  error?: string;
}

export async function runPipeline(): Promise<PipelineResult> {
  try {
    console.log("🚀 Starting job search pipeline...");

    // Step 1: Run Firecrawl searches
    const rawJobs = await runAllQueries();

    if (rawJobs.length === 0) {
      const newJobs = await getNewJobs();
      return {
        rawFound: 0,
        scored: 0,
        passed: 0,
        added: 0,
        totalNew: newJobs.length,
        jobs: newJobs,
        error: "No jobs found from search queries",
      };
    }

    // Step 2: Score each job with LLM
    const scoredJobs = await scoreJobs(rawJobs);

    // Step 3: Add to database (deduplicates automatically)
    const added = await addJobs(scoredJobs);

    const newJobs = await getNewJobs();

    const result = {
      rawFound: rawJobs.length,
      scored: scoredJobs.length,
      passed: added.length,
      added: added.length,
      totalNew: newJobs.length,
      jobs: newJobs,
    };

    console.log(`✅ Pipeline complete: ${result.added} new high-scoring jobs added`);
    return result;
  } catch (err) {
    console.error("Pipeline error:", err);
    const newJobs = await getNewJobs();
    return {
      rawFound: 0,
      scored: 0,
      passed: 0,
      added: 0,
      totalNew: newJobs.length,
      jobs: newJobs,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

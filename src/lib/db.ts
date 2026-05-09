export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  description: string;
  score: number;
  matchSummary: string;
  status: "New" | "Applied" | "Skipped";
  addedAt: string;
  appliedAt?: string;
  skippedAt?: string;
}

// Simple in-memory store with lazy init from JSON file (for serverless)
let jobCache: Job[] | null = null;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

async function loadJobs(): Promise<Job[]> {
  if (jobCache !== null) return jobCache;

  if (isProduction() && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    // Vercel KV mode
    try {
      const { kv } = await import("@vercel/kv");
      const data = await kv.get<Job[]>("ai-jobs:all");
      jobCache = data || [];
      return jobCache;
    } catch {
      jobCache = [];
      return jobCache;
    }
  }

  // Local dev: read from file
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dataFile = path.default.join(process.cwd(), "data", "jobs.json");
    if (fs.default.existsSync(dataFile)) {
      const raw = fs.default.readFileSync(dataFile, "utf-8");
      jobCache = JSON.parse(raw) as Job[];
    } else {
      jobCache = [];
    }
  } catch {
    jobCache = [];
  }
  return jobCache;
}

async function saveJobs(jobs: Job[]) {
  jobCache = jobs;

  if (isProduction() && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set("ai-jobs:all", jobs);
    } catch {
      // Silently fail in production if KV not configured
    }
    return;
  }

  // Local dev: write to file
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dataFile = path.default.join(process.cwd(), "data", "jobs.json");
    const dir = path.default.dirname(dataFile);
    if (!fs.default.existsSync(dir)) {
      fs.default.mkdirSync(dir, { recursive: true });
    }
    fs.default.writeFileSync(dataFile, JSON.stringify(jobs, null, 2));
  } catch {
    // Silently fail
  }
}

export async function getAllJobs(): Promise<Job[]> {
  return loadJobs();
}

export async function getNewJobs(): Promise<Job[]> {
  const all = await loadJobs();
  return all.filter((j) => j.status === "New");
}

export async function getArchivedJobs(): Promise<Job[]> {
  const all = await loadJobs();
  return all.filter(
    (j) => j.status === "Applied" || j.status === "Skipped"
  );
}

export async function addJobs(newJobs: Job[]): Promise<Job[]> {
  const existing = await loadJobs();
  const existingUrls = new Set(existing.map((j) => j.url));
  const unique = newJobs.filter((j) => !existingUrls.has(j.url));
  if (unique.length === 0) return [];

  await saveJobs([...existing, ...unique]);
  return unique;
}

export async function updateJobStatus(
  jobId: string,
  status: "Applied" | "Skipped"
): Promise<Job | null> {
  const jobs = await loadJobs();
  const idx = jobs.findIndex((j) => j.id === jobId);
  if (idx === -1) return null;

  jobs[idx].status = status;
  if (status === "Applied") {
    jobs[idx].appliedAt = new Date().toISOString();
  } else {
    jobs[idx].skippedAt = new Date().toISOString();
  }

  await saveJobs(jobs);
  return jobs[idx];
}

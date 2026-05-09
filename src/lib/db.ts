export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  score: number;
  matchSummary: string;
  status: "New" | "Applied" | "Skipped";
  addedAt: string;
  appliedAt?: string;
  skippedAt?: string;
}

const STORAGE_KEY = "ai-jobs-data";

function load(): Job[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function save(jobs: Job[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function getAllJobs(): Job[] {
  return load();
}

export function getNewJobs(): Job[] {
  return load().filter((j) => j.status === "New");
}

export function getArchivedJobs(): Job[] {
  return load().filter(
    (j) => j.status === "Applied" || j.status === "Skipped"
  );
}

export function mergeNewJobs(newJobs: Job[]): Job[] {
  const existing = load();
  const existingUrls = new Set(existing.map((j) => j.url));
  const unique = newJobs.filter((j) => !existingUrls.has(j.url));
  const combined = [...existing, ...unique];
  save(combined);
  return unique;
}

export function updateJobStatus(
  jobId: string,
  status: "Applied" | "Skipped"
): Job | null {
  const jobs = load();
  const idx = jobs.findIndex((j) => j.id === jobId);
  if (idx === -1) return null;

  jobs[idx].status = status;
  if (status === "Applied") {
    jobs[idx].appliedAt = new Date().toISOString();
  } else {
    jobs[idx].skippedAt = new Date().toISOString();
  }

  save(jobs);
  return jobs[idx];
}

export function clearAllJobs() {
  localStorage.removeItem(STORAGE_KEY);
}

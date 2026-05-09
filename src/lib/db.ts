import { DEFAULT_RESUME_TEXT, RESUME_STORAGE_KEY } from "@/data/resume";

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

const JOBS_KEY = "ai-jobs-data";

function loadJobs(): Job[] {
  try {
    const data = localStorage.getItem(JOBS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs: Job[]) {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export function getAllJobs(): Job[] {
  return loadJobs();
}

export function getNewJobs(): Job[] {
  return loadJobs().filter((j) => j.status === "New");
}

export function getArchivedJobs(): Job[] {
  return loadJobs().filter(
    (j) => j.status === "Applied" || j.status === "Skipped"
  );
}

export function mergeNewJobs(newJobs: Job[]): Job[] {
  const existing = loadJobs();
  const existingUrls = new Set(existing.map((j) => j.url));
  const unique = newJobs.filter((j) => !existingUrls.has(j.url));
  const combined = [...existing, ...unique];
  saveJobs(combined);
  return unique;
}

export function updateJobStatus(
  jobId: string,
  status: "Applied" | "Skipped"
): Job | null {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === jobId);
  if (idx === -1) return null;

  jobs[idx].status = status;
  if (status === "Applied") {
    jobs[idx].appliedAt = new Date().toISOString();
  } else {
    jobs[idx].skippedAt = new Date().toISOString();
  }

  saveJobs(jobs);
  return jobs[idx];
}

export function clearAllJobs() {
  localStorage.removeItem(JOBS_KEY);
}

import fs from "fs";
import path from "path";
import type { Job } from "./db";

const DATA_FILE = path.join(process.cwd(), "data", "jobs.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readJobs(): Job[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data) as Job[];
  } catch {
    return [];
  }
}

export function writeJobs(jobs: Job[]) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));
}

export function getAllJobs(): Job[] {
  return readJobs();
}

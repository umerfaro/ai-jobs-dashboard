"use client";

import { useState, useEffect, useCallback } from "react";

interface Job {
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

type Tab = "new" | "applied" | "skipped";

const STORAGE_KEY = "ai-jobs-data";

function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs: Job[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("new");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refreshJobs = useCallback(() => {
    const all = loadJobs();
    if (tab === "new") {
      setJobs(all.filter((j) => j.status === "New").sort((a, b) => b.score - a.score));
    } else {
      setJobs(
        all
          .filter((j) => j.status === (tab === "applied" ? "Applied" : "Skipped"))
          .sort((a, b) => b.score - a.score)
      );
    }
    setInitialLoad(false);
  }, [tab]);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  useEffect(() => {
    const stored = localStorage.getItem("ai-jobs-last-run");
    if (stored) setLastRun(stored);
  }, []);

  const runPipeline = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/cron/jobs");
      const data = await res.json();

      if (data.jobs && data.jobs.length > 0) {
        const existing = loadJobs();
        const existingUrls = new Set(existing.map((j) => j.url));

        // Mark as "New" and merge
        const newJobs = data.jobs
          .filter((j: { url: string }) => !existingUrls.has(j.url))
          .map((j: Job) => ({ ...j, status: "New" as const }));

        saveJobs([...existing, ...newJobs]);
        localStorage.setItem("ai-jobs-last-run", new Date().toISOString());
        setLastRun(new Date().toISOString());
        refreshJobs();
      } else {
        // Even if no new jobs, update timestamp
        localStorage.setItem("ai-jobs-last-run", new Date().toISOString());
        setLastRun(new Date().toISOString());
      }
    } catch (err) {
      console.error("Pipeline failed:", err);
    } finally {
      setRunning(false);
    }
  };

  const handleAction = async (id: string, action: "Applied" | "Skipped") => {
    setActionLoading(id);
    const allJobs = loadJobs();
    const idx = allJobs.findIndex((j) => j.id === id);
    if (idx === -1) return;

    allJobs[idx].status = action;
    if (action === "Applied") {
      allJobs[idx].appliedAt = new Date().toISOString();
    } else {
      allJobs[idx].skippedAt = new Date().toISOString();
    }

    saveJobs(allJobs);
    setActionLoading(null);
    refreshJobs();
  };

  const newCount = loadJobs().filter((j) => j.status === "New").length;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                ⚡ AI Jobs Dashboard
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {lastRun
                  ? `Last scan: ${new Date(lastRun).toLocaleString()}`
                  : "No scans yet"}
              </p>
            </div>
            <button
              onClick={runPipeline}
              disabled={running}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {running ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scanning...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Scan Now
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg w-fit">
          {([
            { key: "new" as Tab, label: "New Jobs" },
            { key: "applied" as Tab, label: "Applied" },
            { key: "skipped" as Tab, label: "Skipped" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === key
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              {label}
              {key === "new" && newCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-indigo-500 rounded-full">
                  {newCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Job List */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {initialLoad ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-zinc-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-zinc-300 mb-2">
              {tab === "new" ? "No new jobs found" : `No ${tab} jobs yet`}
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              {tab === "new"
                ? "Hit Scan Now to discover matching opportunities"
                : "Jobs you apply to or skip will appear here"}
            </p>
            {tab === "new" && (
              <button
                onClick={runPipeline}
                disabled={running}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Start Scanning
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAction={handleAction}
                compact={tab !== "new"}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-zinc-600">
          AI Jobs Dashboard • Auto-scans daily at 9:00 AM PKT • Powered by Firecrawl + OpenRouter
        </div>
      </footer>
    </div>
  );
}

function JobCard({
  job,
  onAction,
  compact,
}: {
  job: Job;
  onAction: (id: string, action: "Applied" | "Skipped") => void;
  compact?: boolean;
}) {
  const scoreColor =
    job.score >= 90
      ? "text-emerald-400"
      : job.score >= 80
        ? "text-green-400"
        : job.score >= 70
          ? "text-yellow-400"
          : "text-red-400";

  const scoreBg =
    job.score >= 90
      ? "bg-emerald-400/10 border-emerald-400/30"
      : job.score >= 80
        ? "bg-green-400/10 border-green-400/30"
        : job.score >= 70
          ? "bg-yellow-400/10 border-yellow-400/30"
          : "bg-red-400/10 border-red-400/30";

  if (compact) {
    return (
      <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{job.title}</h3>
            <p className="text-sm text-zinc-400 mt-1">
              {job.company} • {job.location}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
              <span>Score: {job.score}/100</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${scoreBg} ${scoreColor}`}>
                {job.status}
              </span>
              <span>•</span>
              <span>{new Date(job.addedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group border border-zinc-800 rounded-xl p-6 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white truncate">
              {job.title}
            </h3>
            <span
              className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold border ${scoreBg} ${scoreColor}`}
            >
              {job.score}%
            </span>
          </div>

          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
            <span className="font-medium text-zinc-300">{job.company}</span>
            <span>•</span>
            <span>{job.location}</span>
            <span>•</span>
            <span className="text-zinc-500">{job.source}</span>
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed mb-4">
            {job.matchSummary}
          </p>

          <div className="flex items-center gap-3">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              onClick={() => onAction(job.id, "Applied")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0 0L10 14" />
              </svg>
              Apply Now
            </a>
            <button
              onClick={() => onAction(job.id, "Skipped")}
              className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-300 text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

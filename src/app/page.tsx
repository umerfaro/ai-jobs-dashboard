"use client";

import { useState, useEffect, useCallback } from "react";
import JobCard from "@/components/JobCard";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  score: number;
  matchSummary: string;
  status: string;
  addedAt: string;
  appliedAt?: string;
  skippedAt?: string;
}

type Tab = "new" | "applied" | "skipped";

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("new");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJobs = useCallback(async (filter: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs?filter=${filter}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(tab === "new" ? "new" : "archive");
  }, [tab, fetchJobs]);

  useEffect(() => {
    const stored = localStorage.getItem("lastPipelineRun");
    if (stored) setLastRun(stored);
  }, []);

  const runPipeline = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/cron/jobs");
      const data = await res.json();
      localStorage.setItem("lastPipelineRun", new Date().toISOString());
      setLastRun(new Date().toISOString());
      fetchJobs("new");
    } catch (err) {
      console.error("Pipeline failed:", err);
    } finally {
      setRunning(false);
    }
  };

  const handleAction = async (id: string, action: "Applied" | "Skipped") => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/jobs/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        fetchJobs(tab === "new" ? "new" : "archive");
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const getArchiveFilter = () => {
    if (tab === "applied") return "Applied";
    if (tab === "skipped") return "Skipped";
    return null;
  };

  const displayedJobs =
    tab === "new"
      ? jobs
      : jobs.filter((j) => j.status === getArchiveFilter());

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
          {(["new", "applied", "skipped"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              {t === "new" ? "New Jobs" : t === "applied" ? "Applied" : "Skipped"}
              {t === "new" && jobs.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-indigo-500 rounded-full">
                  {jobs.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Job List */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-zinc-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : displayedJobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-zinc-300 mb-2">
              {tab === "new" ? "No new jobs found" : `No ${tab} jobs yet`}
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              {tab === "new"
                ? "Run a scan to find matching opportunities"
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
            {displayedJobs.map((job) => (
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
          AI Jobs Dashboard • Auto-scans daily at 9:00 AM PKT • Powered by Firecrawl + LLM Scoring
        </div>
      </footer>
    </div>
  );
}

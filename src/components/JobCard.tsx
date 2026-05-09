"use client";

import { useState, useEffect } from "react";

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

export default function JobCard({
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
      <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
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

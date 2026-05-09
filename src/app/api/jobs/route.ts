import { NextRequest, NextResponse } from "next/server";
import { getAllJobs, getNewJobs, getArchivedJobs } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "new";

  let jobs;
  switch (filter) {
    case "new":
      jobs = await getNewJobs();
      break;
    case "archive":
      jobs = await getArchivedJobs();
      break;
    case "all":
      jobs = await getAllJobs();
      break;
    default:
      jobs = await getNewJobs();
  }

  jobs.sort((a, b) => b.score - a.score);
  return NextResponse.json({ jobs });
}

import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";

// GET triggers with default resume
export async function GET() {
  const result = await runPipeline();
  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}

// POST accepts resume text in body for scoring against latest version
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const resumeText = body.resume as string | undefined;
  const result = await runPipeline(resumeText);
  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}

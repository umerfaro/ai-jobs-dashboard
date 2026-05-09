import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";

export async function GET() {
  const result = await runPipeline();
  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}

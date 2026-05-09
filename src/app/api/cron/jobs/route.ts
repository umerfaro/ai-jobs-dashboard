import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";

export async function GET() {
  const CRON_SECRET = process.env.CRON_SECRET;

  if (CRON_SECRET) {
    const auth =
      process.env.NODE_ENV === "production"
        ? "Bearer " + CRON_SECRET
        : undefined;
    if (auth) {
      const headerAuth = process.env.AUTHORIZATION;
      if (headerAuth !== auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  const result = await runPipeline();

  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}

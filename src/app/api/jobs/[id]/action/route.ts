import { NextRequest, NextResponse } from "next/server";
import { updateJobStatus } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, action } = body;

  if (!id || !["Applied", "Skipped"].includes(action)) {
    return NextResponse.json(
      { error: "Missing or invalid id/action" },
      { status: 400 }
    );
  }

  const updated = await updateJobStatus(id, action as "Applied" | "Skipped");

  if (!updated) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, job: updated });
}

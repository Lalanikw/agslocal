import { NextRequest, NextResponse } from "next/server";
import { OrchestratorAgent } from "@/lib/agents/orchestrator";
import { getServerSession } from "next-auth";

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession();
  
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { submissionId } = await request.json();

  if (!submissionId) {
    return NextResponse.json(
      { error: "Submission ID required" },
      { status: 400 }
    );
  }

  try {
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.processSubmission(submissionId);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Evaluation error:", err);
    return NextResponse.json(
      { error: "Evaluation failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { OrchestratorAgent } from "@/lib/agents/orchestrator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { submissionId, reason } = await request.json();

  if (!submissionId || !reason) {
    return NextResponse.json(
      { error: "Submission ID and reason required" },
      { status: 400 }
    );
  }

  try {
    console.log("🟠 Teacher declining grade for:", submissionId);
    console.log("Reason:", reason);
    
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.declineAndRegrade(
      submissionId,
      session.user.id,
      reason
    );
    
    console.log("✅ Re-grading completed");

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Decline grade error:", error);
    return NextResponse.json(
      { error: "Failed to decline grade" },
      { status: 500 }
    );
  }
}
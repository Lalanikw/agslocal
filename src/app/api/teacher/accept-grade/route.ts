import { NextRequest, NextResponse } from "next/server";
import { OrchestratorAgent } from "@/lib/agents/orchestrator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { submissionId, notes } = await request.json();

  if (!submissionId) {
    return NextResponse.json(
      { error: "Submission ID required" },
      { status: 400 }
    );
  }

  try {
    console.log("🟢 Teacher accepting grade for:", submissionId);
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.acceptGrade(
      submissionId,
      session.user.id,
      notes
    );
    console.log("✅ Grade accepted successfully");

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Accept grade error:", error);
    return NextResponse.json(
      { error: "Failed to accept grade" },
      { status: 500 }
    );
  }
}
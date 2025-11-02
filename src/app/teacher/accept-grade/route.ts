import { NextRequest, NextResponse } from "next/server";
import { OrchestratorAgent } from "@/lib/agents/orchestrator";
import { getServerSession } from "next-auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { submissionId, notes } = await request.json();

  try {
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.acceptGrade(
      submissionId,
      session.user.id,
      notes
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to accept grade" },
      { status: 500 }
    );
  }
}
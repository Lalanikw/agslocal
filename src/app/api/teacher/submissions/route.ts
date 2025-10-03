import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/db/mongodb";
import Submission from "@/models/Submission";
import Question from "@/models/Question";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const questions = await Question.find({ teacherId: session.user.id });
    const questionIds = questions.map(q => q._id);

    const submissions = await Submission.find({
      questionId: { $in: questionIds },
      status: "teacher_review",
    })
      .populate("questionId", "title")
      .sort({ submittedAt: -1 });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Submissions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
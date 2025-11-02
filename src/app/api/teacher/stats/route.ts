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

    const pendingReviews = await Submission.countDocuments({
      questionId: { $in: questionIds },
      status: "teacher_review",
    });

    const totalSubmissions = await Submission.countDocuments({
      questionId: { $in: questionIds },
    });

    return NextResponse.json({
      pendingReviews,
      totalSubmissions,
      questionsCreated: questions.length,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
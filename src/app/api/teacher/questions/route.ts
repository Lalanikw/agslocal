import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/db/mongodb";
import Question from "@/models/Question";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - List all questions for the teacher
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const questions = await Question.find({ teacherId: session.user.id })
      .sort({ createdAt: -1 });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Questions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

// POST - Create new question
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, totalMarks, rubricText } = await request.json();

    await connectDB();

    const question = await Question.create({
      teacherId: session.user.id,
      title,
      description,
      rubric: {
        totalMarks,
        sections: [],
        gradingInstructions: rubricText,
      },
      settings: {
        requireTeacherReview: true,
      },
    });

    return NextResponse.json({
      questionId: question._id,
      submissionLink: `${process.env.NEXTAUTH_URL}/submit/${question._id}`,
    });
  } catch (error) {
    console.error("Question creation error:", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}
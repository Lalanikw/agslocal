import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { connectDB } from "@/lib/db/mongodb";
import Submission from "@/models/Submission";
import Question from "@/models/Question";
import { OrchestratorAgent } from "@/lib/agents/orchestrator";
import mammoth from "mammoth";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    // Dynamic import to avoid the test file error
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  } else if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }
  
  throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT files.");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const studentEmail = formData.get("studentEmail") as string;
    const studentName = formData.get("studentName") as string;
    const questionId = formData.get("questionId") as string;

    if (!file || !studentEmail || !questionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Upload to S3
    const fileName = `submissions/${questionId}/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;

    // Extract text from file
    const content = await extractTextFromFile(file);

    // Create submission
    const submission = await Submission.create({
      questionId,
      studentEmail,
      studentName,
      fileUrl,
      content,
      status: "pending",
    });

    console.log("✅ Submission created:", submission._id);
    console.log("🤖 Triggering AI grading...");

    // Trigger AI grading in background
    try {
      const orchestrator = new OrchestratorAgent();
      orchestrator.processSubmission(submission._id.toString())
        .then(() => {
          console.log("✅ Grading completed for:", submission._id);
        })
        .catch(error => {
          console.error("❌ Background grading error:", error);
        });
    } catch (error) {
      console.error("❌ Failed to start grading:", error);
    }

    return NextResponse.json({
      success: true,
      submissionId: submission._id,
      message: "Submission received and being graded",
    });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed" },
      { status: 500 }
    );
  }
}
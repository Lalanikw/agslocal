import { connectDB } from "./mongodb";
import Submission from "@/models/Submission";
import Question from "@/models/Question";
import Evaluation from "@/models/Evaluation";
import nodemailer from "nodemailer";

interface SubmissionDocument {
  _id: string;
  questionId: string;
  studentEmail: string;
  fileUrl: string;
  content?: string;
  submittedAt: Date;
  status: string;
}

interface QuestionDocument {
  _id: string;
  teacherId: string;
  title: string;
  description: string;
  rubric: Record<string, unknown>;
  createdAt: Date;
}

// Fetch submission by ID
export async function getSubmissionById(
  submissionId: string
): Promise<SubmissionDocument | null> {
  await connectDB();
  const submission = await Submission.findById(submissionId)
    .populate("questionId")
    .lean();
  return submission as SubmissionDocument | null;
}

// Fetch rubric by question ID
export async function getRubricByQuestionId(
  questionId: string
): Promise<Record<string, unknown> | null> {
  await connectDB();
  const question = (await Question.findById(questionId).lean()) as QuestionDocument | null;
  return question?.rubric || null;
}

// Save evaluation
export async function saveEvaluation(data: {
  submissionId: string;
  score: number;
  feedback: string;
}) {
  await connectDB();
  const evaluation = await Evaluation.create({
    submissionId: data.submissionId,
    score: data.score,
    feedback: data.feedback,
    evaluatedAt: new Date(),
  });
  return evaluation;
}

// Send email using nodemailer
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: body,
  });
}
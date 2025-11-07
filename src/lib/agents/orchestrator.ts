import { ChatOpenAI } from "@langchain/openai";
import { gradeSubmission } from "./grading-agent";
import { sendNotification } from "./notify-agent";
import Submission from "@/models/Submission";
import { connectDB } from "@/lib/db/mongodb";;
import User from "@/models/User";

export class OrchestratorAgent {
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.2,
    });
  }

  // Step 1: Initial AI Grading (for teacher review)
  async processSubmission(submissionId: string) {
    try {
      await connectDB();
      console.log(`[Orchestrator] Processing submission ${submissionId}`);

      // Update status to grading
      await Submission.findByIdAndUpdate(submissionId, {
        status: "grading",
      });

      // Grade using AI
      console.log("[Orchestrator] Delegating to Grading Agent...");
      const gradingResult = await gradeSubmission(submissionId);

      // Save AI evaluation (NOT final grade yet)
      await Submission.findByIdAndUpdate(submissionId, {
        status: "teacher_review",
        aiEvaluation: {
          score: gradingResult.score,
          feedback: gradingResult.feedback,
          detailedBreakdown: gradingResult.breakdown,
          gradedAt: new Date(),
          attempts: 1,
        },
      });

      // Notify teacher for review
      console.log("[Orchestrator] Notifying teacher for review...");
      await sendNotification({
        type: "teacher_review_needed",
        submissionId,
        report: gradingResult.feedback,
      });

      return {
        success: true,
        submissionId,
        status: "awaiting_teacher_review",
        aiEvaluation: gradingResult,
      };
    } catch (error) {
      console.error("[Orchestrator] Error:", error);
      throw error;
    }
  }

  // Step 2: Teacher accepts the grade
  async acceptGrade(submissionId: string, teacherId: string, notes?: string) {
  // Use Submission model directly for proper types
  const submissionDoc = await Submission.findById(submissionId);
  if (!submissionDoc) throw new Error("Submission not found");

  // Get teacher info for the email
  const teacher = await User.findById(teacherId);

  submissionDoc.finalGrade = {
    score: submissionDoc.aiEvaluation?.score || 0,
    feedback: submissionDoc.aiEvaluation?.feedback || "",
    gradedAt: new Date(),
    teacherNotes: notes,
  };
  submissionDoc.status = "accepted";
  await submissionDoc.save();

  console.log(`[Orchestrator] Grade accepted by teacher for submission: ${submissionId}`);

  // Send notification to student with teacher feedback
  await sendNotification({
    type: "grade_finalized",
    submissionId,
    report: submissionDoc.aiEvaluation?.feedback || "",
    teacherNotes: notes,
    teacherName: teacher?.name,
  });

  return { success: true, submission: submissionDoc };
}

  // Step 3: Teacher declines - trigger re-grading
  async declineAndRegrade(
    submissionId: string,
    teacherId: string,
    reasonForDecline: string
  ) {
    try {
      await connectDB();
      const submission = await Submission.findById(submissionId);

      if (!submission) {
        throw new Error("Submission not found");
      }

      // Update with teacher's feedback
      await Submission.findByIdAndUpdate(submissionId, {
        status: "regrading",
        teacherReview: {
          reviewedBy: teacherId,
          reviewedAt: new Date(),
          decision: "declined",
          teacherNotes: reasonForDecline,
        },
        "aiEvaluation.attempts": (submission.aiEvaluation?.attempts || 0) + 1,
      });

      // Re-grade with teacher's feedback context
      console.log("[Orchestrator] Re-grading with teacher feedback...");
      const newGrading = await gradeSubmission(submissionId, {
        teacherFeedback: reasonForDecline,
        previousAttempt: submission.aiEvaluation
          ? {
              score: submission.aiEvaluation.score || 0,
              feedback: submission.aiEvaluation.feedback || "",
              detailedBreakdown: submission.aiEvaluation.detailedBreakdown,
            }
          : undefined,
      });

      // Update with new AI evaluation
      await Submission.findByIdAndUpdate(submissionId, {
        status: "teacher_review",
        aiEvaluation: {
          score: newGrading.score,
          feedback: newGrading.feedback,
          detailedBreakdown: newGrading.breakdown,
          gradedAt: new Date(),
          attempts: (submission.aiEvaluation?.attempts || 0) + 1,
        },
      });

      return { success: true, status: "regraded", newEvaluation: newGrading };
    } catch (error) {
      console.error("[Orchestrator] Error regrading:", error);
      throw error;
    }
  }
}
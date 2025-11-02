import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  studentEmail: { type: String, required: true },
  studentName: { type: String, required: true }, // ADD THIS LINE
  fileUrl: { type: String, required: true },
  content: { type: String },
  submittedAt: { type: Date, default: Date.now },
  
  status: {
    type: String,
    enum: ["pending", "grading", "graded", "teacher_review", "accepted", "declined", "regrading"],
    default: "pending",
  },
  
  aiEvaluation: {
    score: { type: Number },
    feedback: { type: String },
    detailedBreakdown: { type: Object },
    gradedAt: { type: Date },
    attempts: { type: Number, default: 1 },
  },
  
  teacherReview: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    decision: { type: String, enum: ["accepted", "declined"] },
    teacherNotes: { type: String },
  },
  
  finalGrade: {
    score: { type: Number },
    feedback: { type: String },
    gradedAt: { type: Date },
  },
});

export default mongoose.models.Submission ||
  mongoose.model("Submission", SubmissionSchema);
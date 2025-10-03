import mongoose from "mongoose";

const CriterionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  marks: { type: Number, required: true },
  guidance: { type: String }, // Guidance for AI grading
});

const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  criteria: [CriterionSchema],
});

const QuestionSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Structured Rubric
  rubric: {
    totalMarks: { type: Number, required: true },
    sections: [SectionSchema],
    gradingInstructions: { type: String }, // Overall instructions for AI
  },
  
  // Submission Settings
  settings: {
    deadline: { type: Date },
    allowLateSubmissions: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1 },
    requireTeacherReview: { type: Boolean, default: true }, // Your workflow
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Question ||
  mongoose.model("Question", QuestionSchema);
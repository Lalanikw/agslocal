import mongoose from "mongoose";

const EvaluationSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Submission",
    required: true,
  },
  score: { type: Number, required: true },
  feedback: { type: String, required: true },
  evaluatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Evaluation ||
  mongoose.model("Evaluation", EvaluationSchema);
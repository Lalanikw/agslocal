import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  getSubmissionById,
  getRubricByQuestionId,
  saveEvaluation,
  sendEmail,
} from "@/lib/db/helpers";

// Tool for fetching submission from DB
export const fetchSubmissionTool = tool(
  async ({ submissionId }) => {
    const submission = await getSubmissionById(submissionId);
    return JSON.stringify(submission);
  },
  {
    name: "fetch_submission",
    description: "Fetches a student submission by ID from database",
    schema: z.object({
      submissionId: z.string().describe("The submission ID"),
    }),
  }
);

// Tool for fetching rubric
export const fetchRubricTool = tool(
  async ({ questionId }) => {
    const rubric = await getRubricByQuestionId(questionId);
    return JSON.stringify(rubric);
  },
  {
    name: "fetch_rubric",
    description: "Fetches the grading rubric for a question",
    schema: z.object({
      questionId: z.string().describe("The question ID"),
    }),
  }
);

// Tool for saving evaluation
export const saveEvaluationTool = tool(
  async ({ submissionId, score, feedback }) => {
    await saveEvaluation({ submissionId, score, feedback });
    return "Evaluation saved successfully";
  },
  {
    name: "save_evaluation",
    description: "Saves grading results to database",
    schema: z.object({
      submissionId: z.string(),
      score: z.number(),
      feedback: z.string(),
    }),
  }
);

// Tool for sending email
export const sendEmailTool = tool(
  async ({ to, subject, body }) => {
    await sendEmail(to, subject, body);
    return "Email sent successfully";
  },
  {
    name: "send_email",
    description: "Sends email notification",
    schema: z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
    }),
  }
);
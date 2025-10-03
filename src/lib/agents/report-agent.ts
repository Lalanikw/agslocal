import { ChatOpenAI } from "@langchain/openai";

interface GradingResult {
  success?: boolean;
  submissionId?: string;
  score?: number;
  feedback?: string;
  [key: string]: unknown;
}

export async function generateReport(
  submissionId: string,
  gradingResult: GradingResult
): Promise<string> {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
  });

  const prompt = `Generate a comprehensive evaluation report for submission ${submissionId}.
  
Grading Results: ${JSON.stringify(gradingResult, null, 2)}

Create a well-formatted report with:
1. Overall Assessment
2. Strengths
3. Areas for Improvement
4. Final Score
5. Recommendations`;

  const response = await model.invoke(prompt);
  return String(response.content);
}
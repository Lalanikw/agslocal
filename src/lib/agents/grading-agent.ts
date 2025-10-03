import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { fetchSubmissionTool, fetchRubricTool, saveEvaluationTool } from "./tools";

interface GradingContext {
  teacherFeedback?: string;
  previousAttempt?: {
    score: number;
    feedback: string;
    detailedBreakdown?: Record<string, unknown>;
  };
}

interface GradingResult {
  score: number;
  feedback: string;
  breakdown: Record<string, unknown>;
}

export async function createGradingAgent() {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.3,
  });

  const agent = createReactAgent({
    llm: model,
    tools: [fetchSubmissionTool, fetchRubricTool, saveEvaluationTool],
  });

  return agent;
}

// Function to invoke grading
export async function gradeSubmission(
  submissionId: string,
  context?: GradingContext
): Promise<GradingResult> {
  const agent = await createGradingAgent();

  let prompt = `Grade the submission with ID: ${submissionId}. 
        
Follow these steps:
1. Fetch the submission content
2. Fetch the rubric for this question
3. Evaluate the submission against the rubric
4. Provide a score and detailed feedback
5. DO NOT save the evaluation - just return the results

Be thorough and fair in your assessment.`;

  // Add context if this is a re-grading
  if (context?.teacherFeedback) {
    prompt += `\n\nIMPORTANT: The teacher reviewed the previous grading and provided this feedback:
"${context.teacherFeedback}"

Previous attempt:
- Score: ${context.previousAttempt?.score}
- Feedback: ${context.previousAttempt?.feedback}

Please re-grade taking the teacher's feedback into account and adjust your assessment accordingly.`;
  }

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extract the grading information from the agent's response
  const lastMessage = result.messages[result.messages.length - 1];
  const content = lastMessage.content as string;

  // Parse the response to extract structured data
  // This is a simplified version - you may need to use structured output
  const gradingResult = await parseGradingResponse(content, submissionId);

  return gradingResult;
}

// Helper function to parse AI response into structured format
async function parseGradingResponse(
  content: string,
  submissionId: string
): Promise<GradingResult> {
  // Use a separate LLM call to structure the output
  const model = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  });

  const structurePrompt = `Extract the following information from this grading response and return it as JSON:
- score (number): The total score awarded
- feedback (string): Overall feedback for the student
- breakdown (object): Detailed breakdown by rubric section

Grading Response:
${content}

Return ONLY valid JSON in this exact format:
{
  "score": <number>,
  "feedback": "<string>",
  "breakdown": {
    "section1": {"score": <number>, "comments": "<string>"},
    "section2": {"score": <number>, "comments": "<string>"}
  }
}`;

  const response = await model.invoke(structurePrompt);
  const jsonContent = response.content as string;

  try {
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: parsed.score || 0,
      feedback: parsed.feedback || "No feedback provided",
      breakdown: parsed.breakdown || {},
    };
  } catch (error) {
    console.error("Error parsing grading response:", error);
    // Return a fallback result
    return {
      score: 0,
      feedback: content,
      breakdown: {},
    };
  }
}
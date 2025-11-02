import OpenAI from "openai";
import { getSubmissionById } from "@/lib/db/helpers";
import Question from "@/models/Question";

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function gradeSubmission(
  submissionId: string,
  context?: GradingContext
): Promise<GradingResult> {
  // Fetch submission and question details
  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    throw new Error("Submission not found");
  }
  
  const question = await Question.findById(submission.questionId);
  if (!question) {
    throw new Error("Question not found");
  }
  
  const modelToUse = question?.aiModel || "gpt-4o-mini";
  console.log(`[Grading Agent] Using model: ${modelToUse} for submission ${submissionId}`);

  // Build the professor's detailed prompt
  let systemPrompt = `You are an examiner of a medical/pharmacology exam. You are grading student submissions against a detailed marking scheme.

MARKING SCHEME:
${question.rubric.gradingInstructions}

GRADING INSTRUCTIONS:
1. List down each point in the marking scheme. For each point:
   - If the student mentioned it, show the EXACT excerpt (full sentence) from the student answer
   - If NOT mentioned, explicitly state "NOT MENTIONED"
   - Evaluate the correctness AND completeness of the answer
   - Assign marks based on depth of understanding:
     * Full marks (100%): Clear explanation with mechanism/details/examples
     * Good marks (70-80%): Correct but missing some details
     * Partial marks (40-60%): Mentioned but superficial or lacks key elements
     * Minimal marks (10-30%): Vague mention without proper explanation
     * Zero marks: Not mentioned or completely incorrect
   - Be strict with partial marks - students must demonstrate understanding, not just mention terms

2. Calculate marks for each section and the total score

3. Format your response as structured HTML with:
   - Bullet points for each marking scheme point
   - Clear section headings
   - Highlighted excerpts from student answers
   - Justification for marks awarded (explain why full vs partial)
   - Section totals and final score

4. Be rigorous and accurate in assessment
5. Do NOT include preambles like "Here is the analysis" - start directly with the evaluation
6. Do NOT format as tables - use bullet points
7. Do NOT include triple backticks or html identifiers

STUDENT ANSWER:
${submission.content}

Begin the grading report now:`;

  // Add re-grading context if provided
  if (context?.teacherFeedback) {
    systemPrompt += `

IMPORTANT - TEACHER FEEDBACK ON PREVIOUS GRADING:
The teacher reviewed the previous grading and provided this feedback:
"${context.teacherFeedback}"

Previous attempt score: ${context.previousAttempt?.score}/100

Please re-grade taking the teacher's specific feedback into account. Adjust your assessment based on their guidance.`;
  }

  console.log("[Grading Agent] Sending to AI for evaluation...");
  console.time("AI Grading");
  
  const response = await openai.chat.completions.create({
    model: modelToUse,
    messages: [{ role: "user", content: systemPrompt }],
    temperature: 0.1,
    seed: 12345,
  });

  const htmlContent = response.choices[0].message.content || "";

  console.timeEnd("AI Grading");
  console.log("[Grading Agent] Received response, parsing...");
  
  // Parse the HTML response to extract score
  const gradingResult = parseHtmlGradingResponse(htmlContent);

  console.log(`[Grading Agent] Final score: ${gradingResult.score}/100`);

  return gradingResult;
}

function parseHtmlGradingResponse(htmlContent: string): GradingResult {
  // Extract total score from various possible patterns
  let score = 0;
  
  // Try multiple patterns to find the score
  const scorePatterns = [
    /total\s*score[:\s]+(\d+)\s*\/\s*100/i,
    /final\s*score[:\s]+(\d+)\s*\/\s*100/i,
    /overall\s*score[:\s]+(\d+)\s*\/\s*100/i,
    /total[:\s]+(\d+)\s*\/\s*100/i,
    /score[:\s]+(\d+)\s*\/\s*100/i,
    /total[:\s]+(\d+)\s*marks/i,
    /(\d+)\s*\/\s*100\s*marks/i,
  ];

  for (const pattern of scorePatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      score = parseInt(match[1], 10);
      console.log(`[Parser] Found score using pattern: ${pattern}`);
      break;
    }
  }

  // If no score found, try to extract any number followed by /100
  if (score === 0) {
    const fallbackMatch = htmlContent.match(/(\d+)\s*\/\s*100/);
    if (fallbackMatch) {
      score = parseInt(fallbackMatch[1], 10);
      console.log(`[Parser] Found score using fallback pattern`);
    }
  }

  // Validate score
  if (score < 0 || score > 100) {
    console.warn(`[Parser] Invalid score detected: ${score}. Setting to 0.`);
    score = 0;
  }

  // Extract section breakdowns
  const sections: Record<string, { score: number; comments: string }> = {};
  
  const sectionMatches = htmlContent.matchAll(
    /<h[23]>(.*?)<\/h[23]>[\s\S]*?(\d+)\s*\/\s*(\d+)/gi
  );
  
  let sectionCount = 0;
  for (const match of sectionMatches) {
    const sectionName = match[1].replace(/<[^>]*>/g, '').trim();
    const sectionScore = parseInt(match[2], 10);
    const maxScore = parseInt(match[3], 10);
    
    sections[sectionName] = {
      score: sectionScore,
      comments: `${sectionScore}/${maxScore} marks`
    };
    sectionCount++;
  }

  console.log(`[Parser] Extracted ${sectionCount} section breakdowns`);

  return {
    score: score || 0,
    feedback: htmlContent,
    breakdown: sections,
  };
}
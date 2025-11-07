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

  // Build the professor's detailed prompt with STRICT HTML formatting
  let systemPrompt = `You are an examiner of a medical/pharmacology exam. You are grading student submissions against a detailed marking scheme.

MARKING SCHEME:
${question.rubric.gradingInstructions}

GRADING INSTRUCTIONS:
1. List down each point in the marking scheme. For each point:
   - If the student mentioned it, show the EXACT excerpt (full sentence) from the student answer
   - If NOT mentioned, explicitly state "NOT MENTIONED"
   - Evaluate the correctness AND completeness of the answer
   - Assign marks based on depth of understanding:
     * Full marks (100%): Clear explanation with mechanism/details
     * Good marks (70-80%): Correct but missing some details
     * Partial marks (40-60%): Mentioned but superficial or lacks key elements
     * Minimal marks (10-30%): Vague mention without proper explanation
     * Zero marks: Not mentioned or completely incorrect
   - Be strict with partial marks - students must demonstrate understanding, not just mention terms

2. Calculate marks for each section and the total score

3. After calculating the section score and the total score, double check the scores. If the score is not correct, correct it.

4. MANDATORY HTML FORMAT - You MUST use this EXACT structure:

<ul>
  <li><strong>1. Section Name (XX marks)</strong>
    <ul>
      <li><strong>a) Subsection name (XX marks)</strong>
        <ul>
          <li><strong>Point description (X marks)</strong>
            <ul>
              <li><em>Excerpt: "exact words from student answer"</em></li>
              <li>Evaluation: Your evaluation here. <strong>Marks awarded: X/X</strong></li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </li>
</ul>

4. CRITICAL FORMATTING RULES:
   - Start your response with <ul>
   - Use <ul> and <li> for ALL lists (4 levels of nesting)
   - Use <strong> for section names, marks, and totals
   - Use <em> ONLY for student excerpts (always prefix with "Excerpt: ")
   - Use <p> for evaluation text
   - Always show "Marks awarded: X/X" in <strong> tags
   - End with section totals and final score in <p><strong> tags
   - NO plain text outside HTML tags
   - NO markdown formatting
   - NO triple backticks
   - NO preambles

STUDENT ANSWER:
${submission.content}

Begin the grading report now with <ul>:`;

  if (context?.teacherFeedback) {
    systemPrompt += `

IMPORTANT - TEACHER FEEDBACK ON PREVIOUS GRADING:
"${context.teacherFeedback}"

Previous attempt score: ${context.previousAttempt?.score}/100

Re-grade taking the teacher's feedback into account. Still use the EXACT HTML format above.`;
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
  
  const gradingResult = parseHtmlGradingResponse(htmlContent);

  console.log(`[Grading Agent] Final score: ${gradingResult.score}/100`);

  return gradingResult;
}

function parseHtmlGradingResponse(htmlContent: string): GradingResult {
  // Extract all section totals with multiple patterns
  const sectionTotals: number[] = [];
  
  // Try different patterns to catch section totals
  const patterns = [
    /section\s+total[:\s]*<\/strong>\s*(\d+)\s*\/\s*\d+/gi,
    /section\s+total[:\s]+(\d+)\s*\/\s*\d+/gi,
    /<strong>section\s+total[:\s]*(\d+)\s*\/\s*\d+<\/strong>/gi,
  ];

  for (const pattern of patterns) {
    const matches = htmlContent.matchAll(pattern);
    for (const match of matches) {
      const score = parseInt(match[1], 10);
      if (!isNaN(score) && !sectionTotals.includes(score)) {
        sectionTotals.push(score);
      }
    }
  }

  console.log(`[Parser] Section scores found:`, sectionTotals);

  // Calculate the CORRECT total
  const calculatedTotal = sectionTotals.reduce((sum, score) => sum + score, 0);
  console.log(`[Parser] Calculated total from ${sectionTotals.length} sections: ${calculatedTotal}`);

  // Extract AI's claimed score
  let aiClaimedScore = 0;
  const scorePatterns = [
    /total\s+score[:\s]*<\/strong>\s*(\d+)\s*\/\s*100/i,
    /total\s+score[:\s]+(\d+)\s*\/\s*100/i,
    /final\s+score[:\s]+(\d+)\s*\/\s*100/i,
    /(\d+)\s*\/\s*100/i,
  ];

  for (const pattern of scorePatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      aiClaimedScore = parseInt(match[1], 10);
      console.log(`[Parser] AI claimed score: ${aiClaimedScore}`);
      break;
    }
  }

  // Use calculated total if we found sections
  let finalScore = sectionTotals.length >= 3 ? calculatedTotal : aiClaimedScore;

  // Fix AI arithmetic errors
  if (sectionTotals.length >= 3 && Math.abs(aiClaimedScore - calculatedTotal) > 0) {
    console.warn(`[Parser] ⚠️ AI arithmetic error! AI: ${aiClaimedScore}/100, Correct: ${calculatedTotal}/100`);
    console.log(`[Parser] ✅ Using correct total: ${calculatedTotal}/100`);
    
    // Replace incorrect total
    htmlContent = htmlContent.replace(
      /(<strong>Total\s+Score:[:\s]*<\/strong>\s*)\d+(\s*\/\s*100)/gi,
      `$1${calculatedTotal}$2`
    );
    htmlContent = htmlContent.replace(
      /(Total\s+Score:[:\s]+)\d+(\s*\/\s*100)/gi,
      `$1${calculatedTotal}$2`
    );
  }

  // Validate
  if (finalScore < 0 || finalScore > 100) {
    console.warn(`[Parser] Invalid score: ${finalScore}. Capping.`);
    finalScore = Math.max(0, Math.min(100, finalScore));
  }

  // Build section breakdown
  const sections: Record<string, { score: number; comments: string }> = {};
  sectionTotals.forEach((score, index) => {
    sections[`Section ${index + 1}`] = {
      score,
      comments: `Section ${index + 1} marks`
    };
  });

  console.log(`[Parser] ✅ Final validated score: ${finalScore}/100`);

  return {
    score: finalScore,
    feedback: htmlContent,
    breakdown: sections,
  };
}
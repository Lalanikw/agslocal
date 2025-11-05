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

3. After calculating the total score, re check and make sure the total is correct. If not, correct it.

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

<p><strong>Section Total: XX/XX</strong></p>
<p><strong>Total Score: XX/100</strong></p>

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
  
  // Ensure consistent HTML format
  const formattedContent = ensureHtmlFormat(htmlContent);
  const gradingResult = parseHtmlGradingResponse(formattedContent);

  console.log(`[Grading Agent] Final score: ${gradingResult.score}/100`);

  return gradingResult;
}

// Ensure the content is in proper HTML format
function ensureHtmlFormat(content: string): string {
  // Remove any markdown code blocks
  content = content.replace(/```html\n?/g, '').replace(/```\n?/g, '');
  
  // If doesn't start with HTML tag, it's plain text - convert it
  if (!content.trim().startsWith('<')) {
    console.warn('[Grading Agent] Response is plain text, converting to HTML');
    return `<div style="white-space: pre-wrap;">${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>`;
  }
  
  // Ensure it has proper ul/li structure
  if (!content.includes('<ul>') || !content.includes('<li>')) {
    console.warn('[Grading Agent] Response lacks list structure, wrapping');
    return `<div>${content}</div>`;
  }
  
  return content;
}

function parseHtmlGradingResponse(htmlContent: string): GradingResult {
  let score = 0;
  
  const scorePatterns = [
    /total\s*score[:\s]*<\/strong>\s*(\d+)\s*\/\s*100/i,
    /total\s*score[:\s]+(\d+)\s*\/\s*100/i,
    /final\s*score[:\s]+(\d+)\s*\/\s*100/i,
    /overall\s*score[:\s]+(\d+)\s*\/\s*100/i,
    /score[:\s]+(\d+)\s*\/\s*100/i,
    /(\d+)\s*\/\s*100/i,
  ];

  for (const pattern of scorePatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      score = parseInt(match[1], 10);
      console.log(`[Parser] Found score: ${score}/100`);
      break;
    }
  }

  if (score < 0 || score > 100) {
    console.warn(`[Parser] Invalid score: ${score}. Setting to 0.`);
    score = 0;
  }

  // Extract section breakdowns
  const sections: Record<string, { score: number; comments: string }> = {};
  const sectionMatches = htmlContent.matchAll(
    /section\s+total[:\s]*<\/strong>\s*(\d+)\s*\/\s*(\d+)/gi
  );
  
  let sectionCount = 0;
  for (const match of sectionMatches) {
    const sectionScore = parseInt(match[1], 10);
    const maxScore = parseInt(match[2], 10);
    
    sections[`Section ${sectionCount + 1}`] = {
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
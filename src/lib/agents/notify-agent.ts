import { sendEmail } from "@/lib/db/helpers";
import { getSubmissionById } from "@/lib/db/helpers";
import User from "@/models/User";
import Question from "@/models/Question";

interface NotificationData {
  type: string;
  submissionId: string;
  report: string | unknown;
}

interface SubmissionWithDetails {
  _id: string;
  questionId: string;
  studentName: string;
  studentEmail: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
  };
  finalGrade?: {
    score: number;
    feedback: string;
  };
}

export async function sendNotification(data: NotificationData) {
  const submission = await getSubmissionById(data.submissionId);

  if (!submission) {
    throw new Error("Submission not found");
  }

  const reportContent = typeof data.report === 'string' 
    ? data.report 
    : JSON.stringify(data.report, null, 2);

  // Cast submission with proper interface
  const submissionData = submission as unknown as SubmissionWithDetails;

  if (data.type === "teacher_review_needed") {
    // Send to TEACHER for review
    const question = await Question.findById(submission.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const teacher = await User.findById(question.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a407c; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; }
          .info { margin: 10px 0; }
          .button { display: inline-block; bg-[#1a407c]/80; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Submission Ready for Review</h2>
          </div>
          <div class="content">
            <div class="info"><strong>Student:</strong> ${submissionData.studentName} (${submissionData.studentEmail})</div>
            <div class="info"><strong>Question:</strong> ${question.title}</div>
            <div class="info"><strong>AI Score:</strong> ${submissionData.aiEvaluation?.score || 'N/A'}/100</div>
            <hr>
            <p>Please review this submission in your teacher dashboard:</p>
            </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      teacher.email,
      "New Submission Ready for Review - AGS",
      emailBody
    );

    console.log(`[Notify Agent] Review notification sent to teacher: ${teacher.email}`);

   } else if (data.type === "grade_finalized") {
    // Send to STUDENT with final grade - SIMPLE FORMAT
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 800px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Small score banner -->
          <div style="background-color: #1a407c; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: 600;">
            Final Score: ${submissionData.finalGrade?.score || 'N/A'}/100
          </div>
          
          <!-- Content -->
          <div style="padding: 40px;">
            
            <h3 style="color: #1a407c; font-size: 18px; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 2px solid #1a407c;">
              Detailed Feedback
            </h3>
            
            <div style="line-height: 2.2; color: #333;">
              ${formatFeedback(reportContent)}
            </div>
            
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center; color: #666;">
              <p style="margin: 10px 0; font-size: 14px;">View your complete results in your student dashboard</p>
              <p style="color: #999; font-size: 12px; margin-top: 15px;">Submission ID: ${data.submissionId}</p>
            </div>
            
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      submissionData.studentEmail,
      "Your Submission Has Been Graded - AGS",
      emailBody
    );

    console.log(`[Notify Agent] Final grade notification sent to student: ${submissionData.studentEmail}`);
  }
}

// Helper function to format feedback with proper line breaks
function formatFeedback(content: string): string {
  // Convert the HTML feedback to have better spacing
  return content
    // Add extra line breaks before major sections (numbered sections)
    .replace(/<li><strong>(\d+\.|[★•])/g, '<div style="margin-top: 40px;"></div><li><strong>$1')
    // Style main section headers
    .replace(/<li><strong>(\**\d+\..*?)<\/strong>/g, '<li style="margin-bottom: 25px;"><strong style="color: #1a407c; font-size: 16px; display: block; margin-bottom: 20px; padding: 15px; background-color: #f0f4ff; border-left: 4px solid #1a407c; border-radius: 4px;">$1</strong>')
    // Style subsection headers
    .replace(/<strong>(.*?a\)|.*?b\)|.*?c\)|.*?d\).*?)<\/strong>/g, '<strong style="color: #2563eb; display: block; margin-top: 20px; margin-bottom: 10px; font-size: 15px;">$1</strong>')
    // Style excerpts (em tags)
    .replace(/<em>(.*?)<\/em>/g, '<div style="background-color: #fef3c7; padding: 12px 15px; margin: 15px 0; border-radius: 4px; border-left: 4px solid #f59e0b; color: #92400e; line-height: 1.8;">$1</div>')
    // Style "Marks:" lines
    .replace(/<strong>Marks:\*\*<\/strong>/g, '<strong style="color: #059669; margin-top: 10px; display: inline-block;">Marks:</strong>')
    // Style section totals
    .replace(/<strong>(Section Total|Total Score):\*\*<\/strong>/g, '<div style="margin-top: 30px;"></div><strong style="color: #0369a1; background-color: #e0f2fe; padding: 12px 15px; display: block; border-radius: 6px; margin-top: 20px; font-size: 15px;">$1:</strong>')
    // Add spacing after list items
    .replace(/<\/li>/g, '</li><div style="margin-bottom: 20px;"></div>')
    // Clean up lists
    .replace(/<ul>/g, '<ul style="list-style: none; padding-left: 0; margin: 0;">')
    .replace(/<ul style="list-style: none; padding-left: 0; margin: 0;"><ul/g, '<ul style="list-style: none; padding-left: 20px; margin-top: 15px;"><ul')
    // Remove nested ul duplication
    .replace(/<ul><ul/g, '<ul')
    .replace(/<\/ul><\/ul>/g, '</ul>');
}
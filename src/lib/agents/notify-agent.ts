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
    // Send to STUDENT with final grade and PROPERLY FORMATTED feedback
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8; 
            color: #333; 
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          /* Small score banner */
          .score-banner {
            background-color: #1a407c;
            color: white;
            padding: 20px 30px;
            text-align: center;
            font-size: 24px;
            font-weight: 600;
          }
          
          .content { 
            padding: 40px; 
          }
          
          .section-title {
            color: #1a407c;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 30px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #1a407c;
          }
          
          /* Feedback content area */
          .feedback-content { 
            background-color: white; 
            padding: 20px; 
            line-height: 2.0;
          }
          
          /* Remove default list styling */
          .feedback-content ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          /* Top-level sections (like "1. Mechanism of Action") */
          .feedback-content > ul > li {
            margin-bottom: 50px !important;
            padding: 25px;
            background-color: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #1a407c;
          }
          
          /* Section headers */
          .feedback-content strong {
            color: #1a407c;
            font-size: 16px;
            font-weight: 600;
            display: block;
            margin-bottom: 20px;
          }
          
          /* Subsections */
          .feedback-content ul ul {
            padding-left: 0;
            margin-top: 20px;
          }
          
          .feedback-content ul ul li {
            margin-bottom: 25px !important;
            padding: 15px;
            background-color: white;
            border-radius: 6px;
            border-left: 3px solid #60a5fa;
          }
          
          /* Sub-subsections */
          .feedback-content ul ul ul {
            padding-left: 20px;
            margin-top: 15px;
          }
          
          .feedback-content ul ul ul li {
            margin-bottom: 15px !important;
            padding: 10px;
            background-color: #fefefe;
            border-left: 2px solid #93c5fd;
          }
          
          /* Student excerpts (em tags) */
          .feedback-content em {
            background-color: #fef3c7;
            padding: 8px 12px;
            border-radius: 4px;
            font-style: normal;
            color: #92400e;
            display: block;
            margin: 12px 0;
            line-height: 1.8;
            border-left: 3px solid #f59e0b;
          }
          
          /* Paragraphs */
          .feedback-content p {
            margin: 15px 0;
            line-height: 2.0;
          }
          
          /* "Section Total" styling */
          .feedback-content p strong:contains("Section Total"),
          .feedback-content p strong:contains("Total Score") {
            background-color: #e0f2fe;
            padding: 15px;
            border-radius: 6px;
            display: block;
            margin-top: 25px;
            color: #0369a1;
          }
          
          /* Add space before "Marks:" */
          .feedback-content p:has(strong) {
            margin-top: 10px;
          }
          
          .footer {
            text-align: center;
            color: #666;
            padding: 30px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          
          .submission-id {
            color: #999; 
            font-size: 12px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Small score banner -->
          <div class="score-banner">
            Final Score: ${submissionData.finalGrade?.score || 'N/A'}/100
          </div>
          
          <div class="content">
            <h2 class="section-title">Detailed Feedback</h2>
            
            <div class="feedback-content">
              ${reportContent}
            </div>
            
            <div class="footer">
              <p style="font-size: 14px; color: #333; margin: 0;">
                View your complete results in your student dashboard
              </p>
              <p class="submission-id">Submission ID: ${data.submissionId}</p>
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
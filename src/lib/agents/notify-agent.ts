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
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 800px; 
            margin: 20px auto; 
            background-color: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #1a407c 0%, #2563eb 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h2 { 
            margin: 0; 
            font-size: 28px;
            font-weight: 600;
          }
          .score-box {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 25px;
            margin: 30px;
            text-align: center;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .score-box .score {
            font-size: 48px;
            font-weight: bold;
            margin: 10px 0;
          }
          .content { 
            padding: 40px; 
          }
          .section-title {
            color: #1a407c;
            font-size: 22px;
            font-weight: 600;
            margin: 30px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 3px solid #1a407c;
          }
          .feedback-content { 
            background-color: #f9fafb; 
            padding: 30px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #1a407c;
          }
          
          /* Major section headings (h2) */
          .feedback-content > ul > li > strong {
            display: block;
            font-size: 18px;
            color: #1a407c;
            margin-top: 40px;
            margin-bottom: 20px;
            padding: 10px 0;
            border-bottom: 2px solid #e5e7eb;
          }
          
          /* First level headings */
          .feedback-content h2, .feedback-content > ul > li {
            margin-top: 40px !important;
            margin-bottom: 25px !important;
            padding-bottom: 15px;
          }
          
          /* Subsection headings (h3) */
          .feedback-content h3 {
            color: #1a407c;
            font-size: 16px;
            font-weight: 600;
            margin-top: 30px !important;
            margin-bottom: 15px !important;
          }
          
          /* All lists */
          .feedback-content ul {
            margin: 20px 0;
            padding-left: 25px;
            list-style: none;
          }
          
          /* Nested lists */
          .feedback-content ul ul {
            padding-left: 30px;
            margin-top: 15px;
          }
          
          /* All list items - MORE SPACING */
          .feedback-content li {
            margin: 20px 0 !important;
            line-height: 2.0;
            position: relative;
            padding-left: 0;
          }
          
          /* Top-level list items - EXTRA spacing */
          .feedback-content > ul > li {
            margin: 35px 0 !important;
            padding-bottom: 20px;
          }
          
          /* Bullet points */
          .feedback-content ul > li::before {
            content: "▸";
            color: #1a407c;
            font-weight: bold;
            position: absolute;
            left: -20px;
          }
          
          /* Strong text styling */
          .feedback-content strong {
            color: #1a407c;
            font-weight: 600;
            display: inline-block;
            margin-top: 10px;
          }
          
          /* Highlighted excerpts from student */
          .feedback-content em {
            background-color: #fef3c7;
            padding: 6px 10px;
            border-radius: 4px;
            font-style: normal;
            color: #92400e;
            display: block;
            margin: 10px 0;
            line-height: 1.6;
          }
          
          /* Paragraphs */
          .feedback-content p {
            margin: 20px 0;
            line-height: 2.0;
          }
          
          /* Section totals */
          .feedback-content > ul > li:last-child {
            background-color: #e0f2fe;
            padding: 20px;
            border-radius: 8px;
            margin-top: 40px !important;
          }
          
          hr { 
            border: none; 
            border-top: 2px solid #e5e7eb; 
            margin: 40px 0; 
          }
          
          .footer {
            text-align: center;
            color: #666;
            padding: 30px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 10px 0;
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
          <div class="header">
            <h2>🎓 Your Submission Has Been Graded</h2>
          </div>
          
          <div class="score-box">
            <div style="font-size: 16px; opacity: 0.9;">Final Score</div>
            <div class="score">${submissionData.finalGrade?.score || 'N/A'}/100</div>
          </div>
          
          <div class="content">
            <h2 class="section-title">📝 Detailed Feedback</h2>
            
            <div class="feedback-content">
              ${reportContent}
            </div>
            
            <hr>
            
            <div class="footer">
              <p style="font-size: 16px; color: #333;">
                <strong>View your complete results in your student dashboard</strong>
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
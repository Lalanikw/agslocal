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
          .button { display: inline-block; background-color: #1a407c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
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
            <a href="${process.env.NEXTAUTH_URL}/teacher/submissions/${submission._id}" class="button">Review Submission</a>
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
    // Send to STUDENT with final grade
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background-color: #1a407c; 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 8px 8px 0 0;
          }
          .header h2 { margin: 0; }
          .score-box {
            background-color: #e8f4f8;
            border-left: 4px solid #1a407c;
            padding: 20px;
            margin: 20px 0;
            font-size: 18px;
          }
          .content { 
            background-color: white; 
            padding: 30px; 
            border: 1px solid #ddd;
            border-radius: 0 0 8px 8px;
          }
          .feedback { 
            background-color: #f9f9f9; 
            padding: 20px; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .feedback h2, .feedback h3 {
            color: #1a407c;
            margin-top: 20px;
          }
          .feedback ul {
            margin-left: 20px;
            padding-left: 0;
          }
          .feedback li {
            margin: 10px 0;
            line-height: 1.8;
          }
          .feedback strong {
            color: #1a407c;
          }
          .feedback em {
            background-color: #fef3c7;
            padding: 2px 6px;
            border-radius: 3px;
            font-style: normal;
            color: #92400e;
          }
          hr { 
            border: none; 
            border-top: 2px solid #ddd; 
            margin: 30px 0; 
          }
          .footer {
            text-align: center;
            color: #666;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Your Submission Has Been Graded</h2>
          </div>
          <div class="content">
            <div class="score-box">
              <strong>Final Score:</strong> ${submissionData.finalGrade?.score || 'N/A'}/100
            </div>
            
            <div class="feedback">
              <h3>Detailed Feedback:</h3>
              ${reportContent}
            </div>
            
            <div class="footer">
              <p>View your full results in your student dashboard</p>
              <p style="color: #999; font-size: 12px;">Submission ID: ${data.submissionId}</p>
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
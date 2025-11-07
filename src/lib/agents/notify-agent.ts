import { sendEmail } from "@/lib/db/helpers";
import { getSubmissionById } from "@/lib/db/helpers";
import User from "@/models/User";
import Question from "@/models/Question";

interface NotificationData {
  type: string;
  submissionId: string;
  report: string | unknown;
  teacherNotes?: string;
  teacherName?: string;
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

  const submissionData = submission as unknown as SubmissionWithDetails;

  if (data.type === "teacher_review_needed") {
    // EMAIL TO TEACHER
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
        <meta charset="UTF-8">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px;">
          <div style="background-color: #1a407c; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0;">New Submission Ready for Review</h2>
          </div>
          <div style="margin: 20px 0;">
            <p><strong>Student:</strong> ${submissionData.studentName} (${submissionData.studentEmail})</p>
            <p><strong>Question:</strong> ${question.title}</p>
            
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p>Please review this submission in your teacher dashboard:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/teacher/submissions/${submission._id}" style="display: inline-block; background-color: #1a407c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">Review Submission</a>
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
    // EMAIL TO STUDENT
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 800px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 40px;">
          
          ${data.teacherNotes ? `
          <!-- Teacher Feedback -->
          <div style="border: 2px solid #1a407c; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; color: #1a407c;">Teacher's Feedback</h3>
            <p style="line-height: 1.8; margin: 0;">${data.teacherNotes.replace(/\n/g, '<br>')}</p>
            ${data.teacherName ? `<p style="margin: 15px 0 0 0; color: #666;">— ${data.teacherName}</p>` : ''}
          </div>
          ` : ''}
          
          <h2 style="color: #1a407c; margin-bottom: 25px; border-bottom: 2px solid #1a407c; padding-bottom: 10px;">Grading Report</h2>
          
          <!-- Formatted feedback WITHOUT section totals and total score -->
          <div style="line-height: 2.0; color: #333;">
            ${formatFeedback(reportContent)}
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">
          <p style="text-align: center; color: #999; font-size: 12px;">Submission ID: ${data.submissionId}</p>
          
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

// Format feedback and REMOVE section totals and total score
function formatFeedback(content: string): string {
  return content
    // Major section numbers - bold, larger
    .replace(/<li><strong>(\d+\..*?)<\/strong>/g, '<li style="margin: 30px 0 20px 0;"><strong style="font-size: 17px; color: #1a407c;">$1</strong>')
    // Subsection letters - bold, normal size
    .replace(/<strong>([a-d]\).*?)<\/strong>/g, '<div style="margin: 20px 0 10px 0;"><strong style="font-size: 15px; color: #333;">$1</strong></div>')
    // Student excerpts - simple italic with light background
    .replace(/<em>Excerpt:(.*?)<\/em>/g, '<div style="background-color: #f9fafb; padding: 12px; margin: 10px 0; border-left: 3px solid #d1d5db; font-style: italic; color: #555;">Student answer:$1</div>')
    // Marks awarded - bold green (KEEP THIS)
    .replace(/Marks awarded: (\d+\/\d+)/g, '<strong style="color: #059669;">Marks: $1</strong>')
    
    // REMOVE "Section Totals: X/X, Y/Y, Z/Z"
    .replace(/Section\s+Totals?:\s*[\d\/,\s]+/gi, '')
    
    // REMOVE Section totals with various formats
    .replace(/<p style="[^"]*"><strong style="[^"]*">Section\s+\d*\s*Total:.*?<\/strong><\/p>/gi, '')
    .replace(/<p><strong>Section\s+\d*\s*Total:.*?<\/strong><\/p>/gi, '')
    .replace(/<strong>Section\s+\d*\s*Total:.*?<\/strong>/gi, '')
    .replace(/<div[^>]*>📊\s*Section\s+Total:.*?<\/div>/gi, '')
    .replace(/<div[^>]*>Section\s+Total:.*?<\/div>/gi, '')
    .replace(/Section\s+\d*\s*Total:\s*\d+\/\d+/gi, '')
    
    // REMOVE "Total Score" AND "Final Score" at bottom
    .replace(/<p style="[^"]*"><strong style="[^"]*">(Total|Final)\s+Score:.*?<\/strong><\/p>/gi, '')
    .replace(/<p><strong>(Total|Final)\s+Score:.*?<\/strong><\/p>/gi, '')
    .replace(/<strong>(Total|Final)\s+Score:.*?<\/strong>/gi, '')
    .replace(/<div[^>]*>(Total|Final)\s+Score:.*?<\/div>/gi, '')
    .replace(/(Total|Final)\s+Score:\s*\d+\/100/gi, '')
    
    // Clean up lists
    .replace(/<ul>/g, '<ul style="list-style: none; padding-left: 0; margin: 10px 0;">')
    .replace(/<ul style="list-style: none; padding-left: 0; margin: 10px 0;"><ul/g, '<ul style="list-style: none; padding-left: 20px; margin: 10px 0;"><ul')
    .replace(/<ul><ul/g, '<ul')
    .replace(/<\/ul><\/ul>/g, '</ul>');
}
import { sendEmail } from "@/lib/db/helpers";
import { getSubmissionById } from "@/lib/db/helpers";
import User from "@/models/User";
import Question from "@/models/Question";

interface NotificationData {
  type: string;
  submissionId: string;
  report: string | unknown;
}

export async function sendNotification(data: NotificationData) {
  const submission = await getSubmissionById(data.submissionId);

  if (!submission) {
    throw new Error("Submission not found");
  }

  const reportContent = typeof data.report === 'string' 
    ? data.report 
    : JSON.stringify(data.report, null, 2);

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
      <h2>New Submission Ready for Review</h2>
      <p><strong>Student:</strong> ${submission.studentName} (${submission.studentEmail})</p>
      <p><strong>Question:</strong> ${question.title}</p>
      <p><strong>AI Score:</strong> ${submission.aiEvaluation?.score || 'N/A'}/100</p>
      <hr>
      <p>Please review this submission in your teacher dashboard:</p>
      <p><a href="${process.env.NEXTAUTH_URL}/teacher/submissions/${submission._id}">Review Submission</a></p>
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
      <h2>Your Submission Has Been Graded</h2>
      <p>Submission ID: ${data.submissionId}</p>
      <p><strong>Final Score:</strong> ${submission.finalGrade?.score || 'N/A'}/100</p>
      <hr>
      <div>${reportContent}</div>
      <hr>
      <p>View your full results in your student dashboard.</p>
    `;

    await sendEmail(
      submission.studentEmail,
      "Your Submission Has Been Graded - AGS",
      emailBody
    );

    console.log(`[Notify Agent] Final grade notification sent to student: ${submission.studentEmail}`);
  }
}
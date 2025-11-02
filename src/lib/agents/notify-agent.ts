import { sendEmail } from "@/lib/db/helpers";
import { getSubmissionById } from "@/lib/db/helpers";

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

  const emailBody = `
    <h2>Your Submission Has Been Evaluated</h2>
    <p>Submission ID: ${data.submissionId}</p>
    <hr>
    <div>${reportContent}</div>
  `;

  // Send to student
  await sendEmail(
    submission.studentEmail,
    "Your Submission Has Been Graded",
    emailBody
  );

  console.log(`[Notify Agent] Email sent to ${submission.studentEmail}`);
}
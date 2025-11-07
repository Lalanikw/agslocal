"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Submission {
  _id: string;
  questionId: { title: string; rubric: Record<string, unknown> };
  studentName: string;
  studentEmail: string;
  content: string;
  submittedAt: string;
  aiEvaluation: {
    score: number;
    feedback: string;
    detailedBreakdown: Record<string, unknown>;
  };
}

export default function ReviewSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<"accept" | "decline" | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchSubmission = useCallback(async () => {
    try {
      const response = await fetch(`/api/teacher/submissions/${id}`);
      const data = await response.json();
      setSubmission(data.submission);
    } catch (error) {
      console.error("Error fetching submission:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

 // Helper function to remove only section totals and total score (keep individual marks)
const removeScoreTotalsFromFeedback = (htmlContent: string): string => {
  return htmlContent
    // Remove "Section Totals: X/X, Y/Y, Z/Z" (comma-separated format)
    .replace(/Section\s+Totals?:\s*[\d\/,\s]+/gi, '')
    
    // Remove "Section X Total: XX/XX"
    .replace(/<p>\s*<strong>\s*Section\s+\d*\s*Total:\s*\d+\/\d+\s*<\/strong>\s*<\/p>/gi, '')
    .replace(/<strong>\s*Section\s+\d*\s*Total:\s*\d+\/\d+\s*<\/strong>/gi, '')
    .replace(/<div[^>]*>\s*📊\s*Section\s+Total:\s*\d+\/\d+\s*<\/div>/gi, '')
    .replace(/<div[^>]*>\s*Section\s+\d*\s*Total:\s*\d+\/\d+\s*<\/div>/gi, '')
    .replace(/Section\s+\d*\s*Total:\s*\d+\/\d+/gi, '')
    .replace(/Section\s+Total:\s*\d+\/\d+/gi, '')
    
    // Remove "Total Score: XX/100" AND "Final Score: XX/100"
    .replace(/<p>\s*<strong>\s*(Total|Final)\s+Score:\s*\d+\/100\s*<\/strong>\s*<\/p>/gi, '')
    .replace(/<strong>\s*(Total|Final)\s+Score:\s*\d+\/100\s*<\/strong>/gi, '')
    .replace(/<div[^>]*>\s*(Total|Final)\s+Score:\s*\d+\/100\s*<\/div>/gi, '')
    .replace(/(Total|Final)\s+Score:\s*\d+\/100/gi, '');
};

  const handleSubmit = async () => {
    if (!decision) return;

    setSubmitting(true);
    try {
      const endpoint = decision === "accept" 
        ? "/api/teacher/accept-grade"
        : "/api/teacher/decline-grade";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: id,
          notes,
          reason: notes,
        }),
      });

      if (response.ok) {
        router.push("/teacher/submissions");
      }
    } catch (error) {
      console.error("Error submitting decision:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!submission) {
    return <div className="min-h-screen flex items-center justify-center">Submission not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-[#1a407c] hover:text-[#1a407c]/80"
          >
            ← Back to Submissions
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Review Submission</h1>

          {/* Student Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h2 className="font-semibold text-lg mb-2">{submission.questionId.title}</h2>
            <p className="text-gray-600">Student: {submission.studentName}</p>
            <p className="text-gray-600">Email: {submission.studentEmail}</p>
            <p className="text-gray-500 text-sm">
              Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>

          {/* AI Grade - NO TOP SCORE, KEEP INDIVIDUAL MARKS */}
          <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-200 rounded">
            <h2 className="text-xl font-bold text-[#1a407c] mb-4">AI Evaluation</h2>
            <div className="bg-white p-6 rounded max-h-[600px] overflow-y-auto">
              <h3 className="font-semibold mb-4 text-lg">Detailed Feedback:</h3>
              {/* Render HTML with individual marks, but no section/total scores */}
              <div 
                className="prose max-w-none"
                style={{ lineHeight: '1.8' }}
                dangerouslySetInnerHTML={{ 
                  __html: removeScoreTotalsFromFeedback(submission.aiEvaluation.feedback) 
                }}
              />
            </div>
          </div>

          {/* Student Answer */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Student Answer</h2>
            <div className="p-4 bg-gray-50 rounded max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {submission.content}
              </pre>
            </div>
          </div>

          {/* Decision Section */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Decision</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Notes (optional for accept, required for decline)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a407c]/80 h-32"
                placeholder="Add your comments or reasons for declining..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setDecision("accept");
                  setTimeout(handleSubmit, 0);
                }}
                disabled={submitting}
                className="flex-1 bg-[#1a407c] text-white py-3 rounded-lg font-semibold hover:bg-[#1a407c]/80 disabled:bg-gray-400"
              >
                {submitting && decision === "accept" ? "Accepting..." : "Accept Grade"}
              </button>
              <button
                onClick={() => {
                  if (!notes.trim()) {
                    alert("Please provide a reason for declining");
                    return;
                  }
                  setDecision("decline");
                  setTimeout(handleSubmit, 0);
                }}
                disabled={submitting}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400"
              >
                {submitting && decision === "decline" ? "Declining..." : "Decline & Request Re-grade"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
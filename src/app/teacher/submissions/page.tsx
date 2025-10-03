"use client";

import { useEffect, useState } from "react";
//import { useRouter } from "next/navigation";
import Link from "next/link";

interface Submission {
  _id: string;
  questionId: { title: string };
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  status: string;
  aiEvaluation?: {
    score: number;
    feedback: string;
  };
}

export default function SubmissionsPage() {
  //const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/teacher/submissions");
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Pending Reviews</h1>
          <Link
            href="/teacher/dashboard"
            className="text-[#1a407c] hover:text-[#1a407c]/80"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">No submissions pending review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {submission.questionId.title}
                    </h3>
                    <p className="text-gray-600 mb-1">
                      Student: {submission.studentName} ({submission.studentEmail})
                    </p>
                    <p className="text-gray-500 text-sm">
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                    {submission.aiEvaluation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="font-semibold text-[#1a407c]">
                          AI Score: {submission.aiEvaluation.score}/100
                        </p>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/teacher/submissions/${submission._id}`}
                    className="bg-[#1a407c] text-white px-6 py-2 rounded-lg hover:bg-[#1a407c]/80"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
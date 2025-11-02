"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Submission {
  _id: string;
  questionId: { title: string };
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  status: string;
  finalGrade?: {
    score: number;
  };
}

export default function AllSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/teacher/submissions/all");
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      grading: "bg-[#008080]/10 text-[#008080]/20 border-[#008080]/30",
      teacher_review: "bg-violet-100 text-violet-700 border-violet-200",
      accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
      declined: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status as keyof typeof styles] || "bg-slate-100 text-slate-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">All Submissions</h1>
          <Link
            href="/teacher/dashboard"
            className="text-[#1a407c]/70 hover:text-[#1a407c]"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-slate-100">
            <p className="text-slate-600 text-lg">No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission._id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {submission.questionId.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(submission.status)}`}>
                        {submission.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-1">
                      Student: {submission.studentName} ({submission.studentEmail})
                    </p>
                    <p className="text-slate-500 text-sm">
                      Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                    {submission.finalGrade && (
                      <p className="text-[#1a407c]/80 font-semibold mt-2">
                        Score: {submission.finalGrade.score}/100
                      </p>
                    )}
                  </div>
                  {submission.status === "teacher_review" && (
                    <Link
                      href={`/teacher/submissions/${submission._id}`}
                      className="bg-[#1a407c]/70 text-white px-6 py-2 rounded-lg hover:bg-[#1a407c]"
                    >
                      Review
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
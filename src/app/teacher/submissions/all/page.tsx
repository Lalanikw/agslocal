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
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDelete = async (submissionId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}'s submission? This action cannot be undone.`)) {
      return;
    }

    setDeleting(submissionId);
    try {
      const response = await fetch(`/api/teacher/submissions/${submissionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSubmissions(submissions.filter(s => s._id !== submissionId));
      } else {
        alert("Failed to delete submission");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete submission");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      grading: "bg-[#1a407c]/10 text-[#1a407c]/80 border-[#1a407c]/20",
      teacher_review: "bg-[#1a407c]/80 text-[#1a407c]/80 border-[#1a407c]/20",
      accepted: "bg-[#1a407c]/10 text-[#1a407c] border-[#1a407c]/20",
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
            className="text-[#1a407c] hover:text-[#1a407c]/80"
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
                      <p className="mt-2">
  <span className="inline-block bg-amber-100 text-[#1a407c] px-2 py-1 rounded-lg font-semibold">
    Score: {submission.finalGrade.score}/100
  </span>
</p>
      )}
    </div>
    <div className="ml-4 flex gap-2">
      {submission.status === "teacher_review" && (
        <Link
          href={`/teacher/submissions/${submission._id}`}
          className="text-[#1a407c] hover:text-[#1a407c]/80 px-6 py-2 rounded-lg"
        >
          Review
        </Link>
      )}
      <button
        onClick={() => handleDelete(submission._id, submission.studentName)}
        disabled={deleting === submission._id}
        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50"
      >
        {deleting === submission._id ? "Deleting..." : "Delete"}
      </button>
    </div>
  </div>
</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
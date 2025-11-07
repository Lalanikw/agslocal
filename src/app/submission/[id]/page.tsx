"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Submission {
  _id: string;
  studentName: string;
  status: string;
  submittedAt: string;
  finalGrade?: {
    score: number;
    feedback: string;
  };
}

export default function SubmissionStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  let isMounted = true;
  let intervalId: NodeJS.Timeout | null = null;

  const fetchStatus = async () => {
    if (!isMounted) return;
    
    try {
      const response = await fetch(`/api/submission/${id}`);
      const data = await response.json();
      
      if (isMounted) {
        setSubmission(data.submission);
        
        // Stop polling if status is final
        if (data.submission?.status === "accepted" || 
            data.submission?.status === "declined") {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  // Initial fetch
  fetchStatus();
  
  // Set up polling only for in-progress submissions
  intervalId = setInterval(fetchStatus, 5000);
  
  // Cleanup
  return () => {
    isMounted = false;
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Submission not found</div>
      </div>
    );
  }

  const getStatusDisplay = () => {
    switch (submission.status) {
      case "pending":
        return { text: "Pending", color: "yellow", message: "Your submission is queued for grading" };
      case "grading":
        return { text: "Grading in Progress", color: "blue", message: "AI is evaluating your work..." };
      case "teacher_review":
        return { text: "Under Teacher Review", color: "purple", message: "AI grading complete. Awaiting teacher approval." };
      case "accepted":
        return { text: "Graded", color: "green", message: "Your work has been graded!" };
      default:
        return { text: submission.status, color: "gray", message: "Processing..." };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-yellow-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Submission Status</h1>

          <div className="mb-6 p-4 bg-gray-50 rounded">
            <p className="text-gray-600">Student: {submission.studentName}</p>
            <p className="text-gray-500 text-sm">
              Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>

          <div className={`mb-6 p-6 bg-${status.color}-50 border-2 border-${status.color}-200 rounded-lg`}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Status: {status.text}</h2>
            <p className="text-gray-700">{status.message}</p>
          </div>

          {submission.finalGrade && (
            <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h2 className="text-xl font-bold text-[#1a407c] mb-3">Your Grade</h2>
              <p className="text-4xl font-bold text-[#1a407c]/80 mb-4">
                {submission.finalGrade.score}/100
              </p>
              <div className="bg-white p-4 rounded">
                <h3 className="font-semibold mb-2">Feedback:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{submission.finalGrade.feedback}</p>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="block text-center bg-[#1a407c]/70 text-white py-3 rounded-lg hover:bg-[#1a407c]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
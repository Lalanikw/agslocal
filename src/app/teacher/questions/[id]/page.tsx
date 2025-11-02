"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
  _id: string;
  title: string;
  description: string;
  rubric: {
    totalMarks: number;
    gradingInstructions: string;
  };
  createdAt: string;
}

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    try {
      const response = await fetch(`/api/teacher/questions/${id}`);
      const data = await response.json();
      setQuestion(data.question);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false);
    }
  };

  const submissionLink = `${window.location.origin}/submit/${id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(submissionLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Question not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/teacher/dashboard"
            className="text-[#1a407c] hover:text-[#1a407c]/80"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{question.title}</h1>
            <p className="text-gray-500 text-sm">
              Created: {new Date(question.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Submission Link Section */}
          <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h2 className="text-xl font-bold text-[#1a407c] mb-3">
              📎 Submission Link
            </h2>
            <p className="text-gray-700 mb-4">
              Share this link with your students so they can submit their homework:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={submissionLink}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm"
              />
              <button
                onClick={copyLink}
                className="px-6 py-2 bg-[#1a407c]/60 text-white rounded-lg hover:bg-[#1a407c] font-semibold"
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Question Details */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{question.description}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Total Marks</h2>
            <p className="text-3xl font-bold text-[#1a407c]">{question.rubric.totalMarks}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Grading Rubric</h2>
            <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {question.rubric.gradingInstructions}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <Link
              href="/teacher/submissions"
              className="flex-1 bg-[#1a407c] text-white py-3 rounded-lg hover:bg-[#1a407c]/80 text-center font-semibold"
            >
              View Submissions
            </Link>
            <button
              onClick={() => router.push("/teacher/dashboard")}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
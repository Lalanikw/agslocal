"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  rubric: {
    totalMarks: number;
  };
}

export default function AllQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (questionId: string, title: string) => {
  if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
    return;
  }

  setDeleting(questionId);
  try {
    const response = await fetch(`/api/teacher/questions/${questionId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setQuestions(questions.filter(q => q._id !== questionId));
    } else {
      alert("Failed to delete question");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("Failed to delete question");
  } finally {
    setDeleting(null);
  }
};

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/teacher/questions");
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">All Questions</h1>
          <div className="flex gap-4">
            <Link
              href="/teacher/questions/create"
              className="bg-[#1a407c]  text-white px-6 py-2 rounded-lg hover:bg-[#1a407c]/80"
            >
              Create New Question
            </Link>
            <Link
              href="/teacher/dashboard"
              className="text-[#1a407c]  hover:text-[#1a407c]/80"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">No questions created yet</p>
            <Link
              href="/teacher/questions/create"
              className="inline-block bg-[#1a407c]  text-white px-6 py-3 rounded-lg hover:bg-[#1a407c]/80"
            >
              Create Your First Question
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {questions.map((question) => (
  <div key={question._id} className="bg-[#008080]/1 rounded-xl shadow-sm p-6 border border-slate-100">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {question.title}
        </h3>
        <p className="text-slate-600 mb-3 line-clamp-2">
          {question.description}
        </p>
        <div className="flex gap-4 text-sm text-slate-500">
          <span>Total Marks: {question.rubric.totalMarks}</span>
          <span>•</span>
          <span>
            Created: {new Date(question.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="ml-4 flex gap-2">
        <Link
          href={`/teacher/questions/${question._id}`}
          className="bg-[#008080]/70 text-white px-6 py-2 rounded-lg hover:bg-[#008080]/50"
        >
          View Details
        </Link>
        <button
          onClick={() => handleDelete(question._id, question.title)}
          disabled={deleting === question._id}
          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50"
        >
          {deleting === question._id ? "Deleting..." : "Delete"}
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
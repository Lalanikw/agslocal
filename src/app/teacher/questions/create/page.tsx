"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateQuestionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalMarks: 100,
    rubricText: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/teacher/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create question");
      }

      router.push(`/teacher/questions/${data.questionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-[#1a407c] hover:text-[#1a407c]/80 flex items-center gap-2"
          >
            ← Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Question</h1>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Question Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a407c]/50"
                placeholder="e.g., Pharmacological basis of ACE Inhibitors"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Question Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a407c]/50  h-32"
                placeholder="Provide detailed instructions for students..."
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Total Marks *
              </label>
              <input
                type="number"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a407c]/50"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Grading Rubric *
              </label>
              <textarea
                value={formData.rubricText}
                onChange={(e) => setFormData({ ...formData, rubricText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a407c] h-64 font-mono text-sm"
                placeholder="Paste your detailed rubric here. Include sections, criteria, and mark breakdowns..."
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Paste your complete rubric. The AI will use this to grade student submissions.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#1a407c] text-white py-3 rounded-lg font-semibold hover:bg-[#1a407c]/80 disabled:bg-gray-400"
              >
                {loading ? "Creating..." : "Create Question & Get Submission Link"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
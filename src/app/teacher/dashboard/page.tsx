"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  pendingReviews: number;
  totalSubmissions: number;
  questionsCreated: number;
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    pendingReviews: 0,
    totalSubmissions: 0,
    questionsCreated: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?role=teacher");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/teacher/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">AGS - Teacher Portal</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, {session?.user?.name}</span>
              <button
                onClick={() => router.push("/api/auth/signout")}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-4">
        {/* Stats Cards */}
        
<div className="grid md:grid-cols-3 gap-6 mb-8">
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <h3 className="text-lg font-semibold text-slate-700 mb-2">Pending Reviews</h3>
    <p className="text-4xl font-bold text-[#1a407c]">{stats.pendingReviews}</p>
    <p className="text-sm text-slate-500 mt-2">Awaiting your approval</p>
  </div>
  <Link href="/teacher/submissions/all" className="block">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-[#008080]/20 transition-colors cursor-pointer">
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Total Submissions</h3>
      <p className="text-4xl font-bold text-[#1a407c]">{stats.totalSubmissions}</p>
      <p className="text-sm text-slate-500 mt-2">Click to view all</p>
    </div>
  </Link>
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <h3 className="text-lg font-semibold text-slate-700 mb-2">Questions Created</h3>
    <p className="text-4xl font-bold text-[#1a407c]">{stats.questionsCreated}</p>
    <p className="text-sm text-slate-500 mt-2">Active assignments</p>
  </div>
</div>

{/* Quick Actions */}
<div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
  <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
  <div className="grid md:grid-cols-3 gap-4">
    <Link
      href="/teacher/questions/create"
      className="block bg-[#1a407c] text-[#FFDF29] py-4 rounded-lg hover:bg-[#1a407c]/80 text-center font-semibold transition-colors"
    >
      Create New Question
    </Link>
    <Link
      href="/teacher/submissions"
      className="block bg-[#FFDF29] text-[#1a407c] py-4 rounded-lg hover:bg-[#FFF48D] text-center font-semibold transition-colors"
    >
      View Pending Reviews ({stats.pendingReviews})
    </Link>
    <Link
      href="/teacher/questions"
      className="block bg-[#1a407c] text-[#FFDF29] py-4 rounded-lg hover:bg-[#1a407c] text-center font-semibold transition-colors"
    >
      View All Questions
    </Link>
  </div>
</div>
      </div>
    </div>
  );
}
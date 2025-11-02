import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        
        {/* Header */}
        <div className="text-center mb-16">
          
          <p className="text-4xl text-[#1a407c] font-bold mb-2">
            Automated Grading System
          </p>
          <p className="text-lg text-gray-600 mt-4">
            AI-powered homework grading with teacher oversight
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Teacher Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-[#1a407c]">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#1a407c][#008080] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-[#1a407c] mb-4">Teacher Portal</h2>
              <p className="text-gray-700 mb-6">
                Create questions, review AI grading, and manage student submissions
              </p>
              <Link
                href="/login?role=teacher"
                className="inline-block bg-[#FFDF29] text-[#1a407c] px-8 py-3 rounded-lg font-bold hover:bg-[#FFF48D] transition-colors text-lg shadow-md"
              >
                Teacher Login
              </Link>
            </div>
          </div>

          {/* Student Info Section */}
          <div className="bg-[#f0f9f9] rounded-xl shadow-md p-8 border-2 border-[#1a407c]/80">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#FFF48D] rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-[#1a407c]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#1a407c] mb-2">For Students</h3>
                <p className="text-gray-700 mb-3">
                  Your teacher will provide you with a unique submission link for each assignment. 
                  Simply click the link, enter your details, and upload your homework.
                </p>
                <p className="text-sm text-[#1a407c]/80 italic font-medium">
                  No account or login required - just use the link your teacher shares with you!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-[#1a407c] mb-8">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-[#FFDF29] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#1a407c]">1</span>
              </div>
              <h4 className="font-semibold text-[#1a407c] mb-2">Teacher Creates Question</h4>
              <p className="text-gray-600 text-sm">
                Teachers create assignments with detailed rubrics and get a submission link
              </p>
            </div>
            <div className="text-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-[#FFDF29] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#1a407c]">2</span>
              </div>
              <h4 className="font-semibold text-[#1a407c] mb-2">Students Submit</h4>
              <p className="text-gray-600 text-sm">
                Students use the link to upload their work - AI grades it automatically
              </p>
            </div>
            <div className="text-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-[#FFDF29] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#1a407c]">3</span>
              </div>
              <h4 className="font-semibold text-[#1a407c] mb-2">Teacher Reviews</h4>
              <p className="text-gray-600 text-sm">
                Teachers review AI grades and approve or request re-grading if needed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
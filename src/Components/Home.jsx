// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-md mb-3">
          QA
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          QuickMark Attendance
        </h1>
        <p className="text-sm text-gray-500 mt-2 text-center">
          Welcome! Please select an option to begin.
        </p>
      </div>

      {/* Menu Cards */}
      <div className="space-y-4">
        {/* Generate */}
        <button
          onClick={() => navigate("/generate")}
          className="w-full flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-4 rounded-2xl shadow-md hover:shadow-lg transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl">
            {/* simple icon */}
            <span>👤</span>
          </div>
          <div className="text-left">
            <div className="font-semibold text-base">Generate QR</div>
            <div className="text-xs text-blue-100">
              Get your personal attendance code.
            </div>
          </div>
        </button>

        {/* Scan */}
        <button
          onClick={() => navigate("/scan")}
          className="w-full flex items-center gap-4 bg-green-600 hover:bg-green-700 text-white px-5 py-4 rounded-2xl shadow-md hover:shadow-lg transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl">
            <span>📷</span>
          </div>
          <div className="text-left">
            <div className="font-semibold text-base">Scan QR</div>
            <div className="text-xs text-green-100">
              Log your attendance (In or Out).
            </div>
          </div>
        </button>

        {/* Reports */}
        <button
          onClick={() => navigate("/reports")}
          className="w-full flex items-center gap-4 bg-orange-500 hover:bg-orange-600 text-white px-5 py-4 rounded-2xl shadow-md hover:shadow-lg transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl">
            <span>📊</span>
          </div>
          <div className="text-left">
            <div className="font-semibold text-base">Reports</div>
            <div className="text-xs text-orange-100">
              View attendance history and logs.
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

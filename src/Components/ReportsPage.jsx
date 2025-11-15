// src/pages/ReportsPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "qr_attendance_v2";

function loadAttendance() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { map: {}, logs: [] };
  } catch {
    return { map: {}, logs: [] };
  }
}

export default function ReportsPage() {
  const [attendance, setAttendance] = useState(loadAttendance);
  const [search, setSearch] = useState("");

  // keep in sync if localStorage changes from other pages in same tab
  useEffect(() => {
    const handleStorage = () => setAttendance(loadAttendance());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const exportCSV = useCallback(() => {
    const rows = [["Roll", "Action", "Timestamp"]];
    const logsToExport = [...(attendance.logs || [])].reverse();
    logsToExport.forEach((log) => {
      rows.push([log.roll, log.action, new Date(log.at).toLocaleString()]);
    });
    const csv = rows
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_logs_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [attendance]);

  const filteredLogs = (attendance.logs || []).filter((log) =>
    search ? String(log.roll).includes(search.trim()) : true
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Get your attendance history and export logs as CSV.
          </p>
        </div>

        {/* Search + Export */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch sm:items-center">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-gray-400 text-lg">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Roll Number..."
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm"
          >
            ⬆️ Export CSV
          </button>
        </div>

        {/* Table card */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              No attendance records yet. Start scanning to see data here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-4 py-2 text-left">Roll No.</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-2 border-t border-gray-100">
                        {log.roll}
                      </td>
                      <td className="px-4 py-2 border-t border-gray-100">
                        <span
                          className={`font-semibold ${
                            log.action === "IN" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-t border-gray-100">
                        {new Date(log.at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

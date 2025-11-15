// src/pages/ScanPage.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

const STORAGE_KEY = "qr_attendance_v2";
const SCAN_COOLDOWN_MS = 2500;

function readPayload(data) {
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    return parsed?.roll ? String(parsed.roll) : null;
  } catch (e) {
    return String(data).trim();
  }
}

function loadAttendance() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { map: {}, logs: [] };
  } catch (e) {
    return { map: {}, logs: [] };
  }
}

export default function ScanPage() {
  const [attendance, setAttendance] = useState(loadAttendance);
  const [scanning, setScanning] = useState(false);
  const [scanNotice, setScanNotice] = useState(null);
  const [visibleLog, setVisibleLog] = useState(null);
  const lastScanRef = useRef({});
  const html5Ref = useRef(null);

  // keep localStorage in sync whenever attendance changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attendance));
  }, [attendance]);

  const handleScanData = useCallback((data) => {
    const roll = readPayload(data);
    if (!roll) {
      setScanNotice({ ok: false, msg: "Disapproved: Invalid QR code." });
      return;
    }
    const now = Date.now();
    const last = lastScanRef.current[roll] || 0;
    if (now - last < SCAN_COOLDOWN_MS) {
      setScanNotice({ ok: false, msg: "Disapproved: Duplicate scan." });
      return;
    }
    lastScanRef.current[roll] = now;

    setAttendance((prev) => {
      const isIn = !!prev.map[roll];
      const action = isIn ? "OUT" : "IN";
      const map = { ...prev.map };
      if (action === "IN") map[roll] = { inAt: new Date().toISOString() };
      else delete map[roll];
      const newLog = { roll, action, at: new Date().toISOString() };
      const logs = [newLog, ...(prev.logs || [])].slice(0, 500);
      setScanNotice({ ok: true, msg: `Approved: Student ${roll} ${action === "IN" ? "Checked IN" : "Checked OUT"}` });
      setVisibleLog(newLog);
      return { map, logs };
    });
  }, []);

  // auto-hide notice after 5s
  useEffect(() => {
    if (!scanNotice) return;
    const t = setTimeout(() => setScanNotice(null), 5000);
    return () => clearTimeout(t);
  }, [scanNotice]);

  // auto-hide latest log card after 5s
  useEffect(() => {
    if (!visibleLog) return;
    const t = setTimeout(() => setVisibleLog(null), 5000);
    return () => clearTimeout(t);
  }, [visibleLog]);

  // start/stop scanner via useEffect watching `scanning`
  useEffect(() => {
    if (!scanning) return;

    const html5QrCode = new Html5Qrcode("reader");
    html5Ref.current = html5QrCode;

    const success = (decodedText) => {
      handleScanData(decodedText);
    };
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode
      .start({ facingMode: "environment" }, config, success)
      .catch((err) => {
        console.error("Unable to start scanning.", err);
        setScanNotice({ ok: false, msg: "Unable to start camera. Check permissions." });
        setScanning(false);
      });

    return () => {
      html5QrCode
        .stop()
        .then(() => {
          // stopped
        })
        .catch((err) => {
          console.error("Failed to stop QR code scanner.", err);
        });
    };
  }, [scanning, handleScanData]);

  return (
    <div className="w-full max-w-md mx-auto">
      

      <div className="bg-white rounded-2xl shadow-md p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Scan QR for Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Allow camera access and scan the student&apos;s QR to toggle IN / OUT.
          </p>
        </div>

        {/* Scanner area */}
        <div className="rounded-2xl bg-gray-100 overflow-hidden">
          {scanning ? (
            <div id="reader" className="w-full h-64" />
          ) : (
            <div className="w-full h-64 flex flex-col items-center justify-center text-gray-400 text-sm">
              <div className="text-4xl mb-2">📷</div>
              <p className="mb-1">Allow camera access to start scanning.</p>
              <p className="text-xs">Hold the QR code inside the frame.</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setScanning((s) => !s)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-all ${
            scanning
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <span>📷</span>
          <span>{scanning ? "Stop Scanner" : "Start Scanner"}</span>
        </button>

        {/* Result card */}
        {visibleLog && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                visibleLog.action === "IN" ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <span className={visibleLog.action === "IN" ? "text-green-600" : "text-red-600"}>
                ✓
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Student: <span className="font-semibold">{visibleLog.roll}</span>
              </p>
              <p
                className={`text-sm font-semibold ${
                  visibleLog.action === "IN" ? "text-green-600" : "text-red-600"
                }`}
              >
                Checked {visibleLog.action}
              </p>
              <p className="text-xs text-gray-400">
                at {new Date(visibleLog.at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        {scanNotice && (
          <div
            className={`text-xs mt-1 p-2 rounded ${
              scanNotice.ok
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {scanNotice.msg}
          </div>
        )}
      </div>
    </div>
  );
}

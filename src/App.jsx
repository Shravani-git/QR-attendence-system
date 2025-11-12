

import React, { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "react-qr-code";
import { Html5Qrcode } from "html5-qrcode";

const STORAGE_KEY = "qr_attendance_v2";
const SCAN_COOLDOWN_MS = 2500; // ignore repeat scans for same roll within this time

function makePayload(roll) {
  return JSON.stringify({ type: "student-roll", roll: String(roll) });
}

function readPayload(data) {
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    return parsed?.roll ? String(parsed.roll) : null;
  } catch (e) {
    // if not JSON, maybe plain text
    return String(data).trim();
  }
}

export default function App() {
  const [rollInput, setRollInput] = useState("101");
  const [generatedFor, setGeneratedFor] = useState(null);
  const [attendance, setAttendance] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || { map: {}, logs: [] }
      );
    } catch (e) {
      return { map: {}, logs: [] };
    }
  });

  const [scanning, setScanning] = useState(false);
  const lastScanRef = useRef({}); // { roll: timestamp }
  const qrRef = useRef(null);
  const [scanNotice, setScanNotice] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    if (scanNotice) {
      const timer = setTimeout(() => {
        setScanNotice(null);
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [scanNotice]);

  const handleGenerate = useCallback(() => {
    if (!rollInput) return;
    setGeneratedFor(rollInput.trim());
  }, [rollInput]);

  // download svg to png
  const downloadQrPNG = useCallback((roll) => {
    const container = qrRef.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `qr_${roll}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const printQr = useCallback((roll) => {
    const container = qrRef.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const w = window.open("", "_blank");
    w.document.write(
      '<html><head><title>Print QR</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0">'
    );
    w.document.write(svgStr);
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(() => w.print(), 250);
  }, []);

  const addLog = useCallback((roll, action) => {
    setAttendance((prev) => {
      const map = { ...prev.map };
      const logs = [
        { roll, action, at: new Date().toISOString() },
        ...prev.logs,
      ].slice(0, 500);
      if (action === "IN") map[roll] = { inAt: new Date().toISOString() };
      if (action === "OUT") {
        delete map[roll];
      }
      return { map, logs };
    });
  }, []);

  const handleScanData = useCallback((data) => {
    const roll = readPayload(data);
    if (!roll) {
      setScanNotice({ ok: false, msg: "Invalid QR" });
      return;
    }
    const now = Date.now();
    const last = lastScanRef.current[roll] || 0;
    if (now - last < SCAN_COOLDOWN_MS) {
      // ignore rapid duplicate reads
      setScanNotice({ ok: true, msg: `Ignored duplicate scan for ${roll}` });
      return;
    }
    lastScanRef.current[roll] = now;

    setAttendance((prev) => {
      const isIn = !!prev.map[roll];
      const action = isIn ? "OUT" : "IN";
      const map = { ...prev.map };
      if (action === "IN") map[roll] = { inAt: new Date().toISOString() };
      else delete map[roll];
      const logs = [
        { roll, action, at: new Date().toISOString() },
        ...prev.logs,
      ].slice(0, 500);
      setScanNotice({ ok: true, msg: `${roll} ${action}` });
      return { map, logs };
    });
  }, []);

  // manual toggle helper
  const manualToggle = useCallback(
    (roll) => {
      handleScanData(JSON.stringify({ roll }));
    },
    [handleScanData]
  );

  // Export attendance to CSV
  const exportCSV = useCallback(() => {
    const rows = [["Roll", "Action", "Timestamp"]];
    // Logs are stored in reverse chronological order, so we reverse them for export.
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

  // Batch generate: generate QR for range like 101-120
  const [batchRange, setBatchRange] = useState("101-110");
  const handleBatchGenerate = useCallback(() => {
    const [a, b] = batchRange.split("-").map((s) => Number(s.trim()));
    if (Number.isFinite(a) && Number.isFinite(b) && a <= b && b - a <= 500) {
      // produce an array of rolls to show as generated previews (first N)
      const arr = Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
      setGeneratedFor(arr[0]);
      // store previews in state if needed (for now we just set first and let user iterate)
    } else {
      alert("Enter a valid numeric range like 101-120 (max 500 rolls)");
    }
  }, [batchRange]);

  useEffect(() => {
    if (!scanning) {
      return;
    }

    const html5QrCode = new Html5Qrcode("reader");
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      handleScanData(decodedText);
    };
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode
      .start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
      .catch((err) => {
        console.error("Unable to start scanning.", err);
      });

    return () => {
      html5QrCode
        .stop()
        .then((ignore) => {
          // QR Code scanning is stopped.
        })
        .catch((err) => {
          console.error("Failed to stop QR code scanner.", err);
        });
    };
  }, [scanning, handleScanData]);

  // Responsive helpers
  const inList = attendance.map ? Object.entries(attendance.map) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">
              QR Attendance
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Smart Attendance System for Students
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setAttendance({ map: {}, logs: [] });
              }}
              className="bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm"
            >
              Clear Data
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generate column */}
          <section className="col-span-1 lg:col-span-1 bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-3">Generate QR</h2>
            <label className="block text-sm text-gray-600 mb-1">
              Roll number
            </label>
            <input
              value={rollInput}
              onChange={(e) => setRollInput(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
              placeholder="e.g. 101"
            />
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleGenerate}
                className="bg-green-600 text-white px-3 py-2 rounded"
              >
                Generate
              </button>
              <button
                onClick={() => {
                  setRollInput("");
                  setGeneratedFor(null);
                }}
                className="border px-3 py-2 rounded"
              >
                Reset
              </button>
            </div>

            {/* <div className="mt-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Batch generation</h3>
              <input value={batchRange} onChange={(e) => setBatchRange(e.target.value)} className="w-full border rounded px-3 py-2 mb-2" placeholder="e.g. 101-120" />
              <div className="flex gap-2">
                <button onClick={handleBatchGenerate} className="bg-blue-600 text-white px-3 py-2 rounded">Preview Batch</button>
                <button onClick={() => { navigator.clipboard?.writeText(batchRange); }} className="border px-3 py-2 rounded">Copy Range</button>
              </div>
            </div> */}

            {generatedFor && (
              <div className="mt-4">
                <div ref={qrRef} className="inline-block bg-white p-4 rounded">
                  <div className="flex flex-col items-center gap-2">
                    <QRCode value={makePayload(generatedFor)} size={180} />
                    <div className="text-sm font-medium">{generatedFor}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => downloadQrPNG(generatedFor)}
                    className="px-3 py-2 border rounded"
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={() => printQr(generatedFor)}
                    className="px-3 py-2 border rounded"
                  >
                    Print
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Scanner column */}
          <section className="col-span-1 lg:col-span-1 bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-3">Scanner</h2>
            <p className="text-sm text-gray-500 mb-3">
              Start the camera and point to the student's QR. Tapping the scan
              result toggles IN / OUT.
            </p>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setScanning((s) => !s)}
                className={`px-3 py-2 rounded ${
                  scanning ? "bg-red-500 text-white" : "bg-green-600 text-white"
                }`}
              >
                {scanning ? "Stop Scanner" : "Start Scanner"}
              </button>
            </div>

            <div
              className="rounded-md overflow-hidden bg-gray-100"
              style={{ minHeight: 260 }}
            >
              {scanning ? (
                <div id="reader" style={{ width: "100%" }}></div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Scanner is off
                </div>
              )}
            </div>

            <div className="mt-3">
              {scanNotice && (
                <div
                  className={`p-2 rounded text-sm ${
                    scanNotice.ok
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {scanNotice.msg}
                </div>
              )}
            </div>
          </section>

          {/* Attendance & Logs column */}
          <section className="col-span-1 lg:col-span-1 bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-3">
              Currently IN ({inList.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-auto">
              {inList.length === 0 && (
                <div className="text-sm text-gray-500">
                  No one is logged in.
                </div>
              )}
              {inList.map(([roll, info]) => (
                <div
                  key={roll}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <div className="font-medium">{roll}</div>
                    <div className="text-xs text-gray-500">
                      In at: {new Date(info.inAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => manualToggle(roll)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-md font-medium mt-4">Recent scans</h3>
            <div className="mt-2 max-h-48 overflow-auto text-sm text-gray-700">
              {attendance.logs && attendance.logs.length === 0 && (
                <div className="text-gray-500">No scans yet</div>
              )}
              <ol className="list-decimal pl-5 space-y-2">
                {(attendance.logs || []).slice(0, 50).map((it, idx) => (
                  <li key={idx} className="flex justify-between">
                    <div>
                      {it.roll} —{" "}
                      <span className="font-medium">{it.action}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(it.at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </main>

        <footer className="mt-6 text-xs text-gray-500">
          Prototype.Testing Version.Aru Developer. 12-11-2025
        </footer>
      </div>
    </div>
  );
}

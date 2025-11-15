// src/pages/GeneratePage.jsx
import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";

const STORAGE_KEY = "qr_attendance_v2";

function makePayload(roll) {
  return JSON.stringify({ type: "student-roll", roll: String(roll) });
}

export default function GeneratePage() {
  const [rollInput, setRollInput] = useState("");
  const [generatedFor, setGeneratedFor] = useState(null);
  const qrRef = useRef(null);

  const handleGenerate = useCallback(() => {
    if (!rollInput.trim()) return;
    setGeneratedFor(rollInput.trim());
  }, [rollInput]);

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
    img.onerror = () => URL.revokeObjectURL(url);
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

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header with back arrow */}
    

      <div className="bg-white rounded-2xl shadow-md p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Generate Your QR Code
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Please enter Roll Number to generate your unique attendance QR code.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Roll Number
          </label>
          <input
            value={rollInput}
            onChange={(e) => setRollInput(e.target.value)}
            placeholder="e.g., 2023001, CS101"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleGenerate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm shadow-sm transition-all"
          >
            Generate QR
          </button>
        </div>

        {/* QR Preview */}
        <div className="bg-gray-50 rounded-xl p-4 mt-2">
          

          {generatedFor ? (
            <div ref={qrRef} className="flex flex-col items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Your Generated QR Code
          </h2>
              <QRCode value={makePayload(generatedFor)} size={160} />
              <p className="text-xs text-gray-500">
                Roll Number:{" "}
                <span className="font-medium text-gray-700">
                  {generatedFor}
                </span>
              </p>

              <div className="flex w-full gap-2 mt-3">
                <button
                  onClick={() => downloadQrPNG(generatedFor)}
                  className="flex-1 flex items-center justify-center gap-2 border border-blue-600 text-blue-600 rounded-lg py-2 text-sm hover:bg-blue-50"
                >
                  ⬇️ <span>Download</span>
                </button>
                <button
                  onClick={() => printQr(generatedFor)}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-400 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
                >
                  🖨️ <span>Print</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-6">
              No QR generated yet. Enter a roll number and click{" "}
              <span className="font-semibold">Generate QR</span>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

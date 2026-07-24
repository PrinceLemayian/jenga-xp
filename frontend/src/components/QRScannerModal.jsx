import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QRScannerModal({ onScanSuccess, onClose }) {
  const [scanError, setScanError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader-container",
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        console.log("QR Code Scanned:", decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear().catch((e) => console.error("Error clearing scanner:", e));
        }
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Ignored noise logs
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e) => console.error("Error unmounting scanner:", e));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="surface p-6 max-w-md w-full space-y-4 relative animate-in fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary p-1.5 rounded-lg text-sm z-10"
        >
          ✕
        </button>

        <div className="text-center space-y-1">
          <span className="text-3xl">📷</span>
          <h3 className="text-[17px] font-bold text-primary">Scan Check-In QR Code</h3>
          <p className="text-[12px] text-secondary">
            Point your camera at the Event QR Code or Member Wallet QR Code.
          </p>
        </div>

        <div className="overflow-hidden rounded-[16px] border border-subtle bg-black min-h-[260px] flex items-center justify-center text-[12px] text-secondary">
          <div id="qr-reader-container" className="w-full text-white" />
        </div>

        {scanError && (
          <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 p-3 text-[12px] text-red-400 text-center">
            {scanError}
          </div>
        )}

        <button
          onClick={onClose}
          className="secondary-button w-full !h-10 !text-[13px]"
        >
          Cancel Scanning
        </button>
      </div>
    </div>
  );
}

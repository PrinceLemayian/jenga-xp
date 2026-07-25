import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export default function QRScannerModal({ onScanSuccess, onClose }) {
  const [scanError, setScanError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader-container",
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1,
      },
      false,
    );

    scannerRef.current = scanner;
    scanner.render(
      (decodedText) => {
        scannerRef.current?.clear().catch(() => {});
        onScanSuccess(decodedText);
      },
      () => {
        setScanError(null);
      },
    );

    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="surface relative w-full max-w-md space-y-4 p-6 animate-in fade-in">
        <button
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-secondary hover:text-primary"
          onClick={onClose}
          type="button"
        >
          <Icon name="x" size={16} />
        </button>

        <div className="space-y-1 text-center">
          <span className="text-3xl">📷</span>
          <h3 className="text-[17px] font-bold text-primary">Scan QR Code</h3>
          <p className="text-[12px] leading-5 text-secondary">
            Point your camera at an event QR code or member wallet QR code.
          </p>
        </div>

        <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-[16px] border border-subtle bg-black text-[12px] text-secondary">
          <div className="w-full text-white" id="qr-reader-container" />
        </div>

        {scanError && (
          <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 p-3 text-center text-[12px] text-red-400">
            {scanError}
          </div>
        )}

        <button className="secondary-button w-full !h-10 !text-[13px]" onClick={onClose} type="button">
          Cancel Scanning
        </button>
      </div>
    </div>
  );
}

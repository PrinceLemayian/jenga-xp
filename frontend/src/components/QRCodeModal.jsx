import React from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodeModal({ title, subtitle, value, onClose }) {
  if (!value) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="surface p-6 max-w-sm w-full space-y-4 text-center relative animate-in fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary p-1 rounded-lg text-sm"
        >
          ✕
        </button>

        <div>
          <span className="text-3xl inline-block mb-1">📱</span>
          <h3 className="text-[17px] font-bold text-primary">{title || "Event Check-In QR Code"}</h3>
          <p className="text-[12px] text-secondary mt-1">{subtitle || "Scan this QR code with your camera to check in."}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl inline-block mx-auto border border-gray-200">
          <QRCodeSVG value={value} size={200} level="H" includeMargin={true} />
        </div>

        <div className="rounded-[14px] border border-subtle bg-elevated-2 p-3 text-[11px] text-tertiary font-mono break-all text-center">
          {value}
        </div>

        <button
          onClick={onClose}
          className="secondary-button w-full !h-10 !text-[13px]"
        >
          Close QR Code
        </button>
      </div>
    </div>
  );
}

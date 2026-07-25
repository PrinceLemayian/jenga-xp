import { QRCodeSVG } from "qrcode.react";
import Icon from "./Icon";

export default function QRCodeModal({ title, subtitle, value, onClose }) {
  if (!value) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="surface relative w-full max-w-sm space-y-4 p-6 text-center animate-in fade-in">
        <button
          className="absolute right-4 top-4 rounded-lg p-1 text-secondary hover:text-primary"
          onClick={onClose}
          type="button"
        >
          <Icon name="x" size={16} />
        </button>

        <div>
          <span className="mb-1 inline-block text-3xl">📱</span>
          <h3 className="text-[17px] font-bold text-primary">{title || "QR Code"}</h3>
          <p className="mt-1 text-[12px] leading-5 text-secondary">{subtitle}</p>
        </div>

        <div className="mx-auto inline-block rounded-2xl border border-gray-200 bg-white p-4">
          <QRCodeSVG includeMargin level="H" size={200} value={value} />
        </div>

        <div className="break-all rounded-[14px] border border-subtle bg-elevated-2 p-3 text-center font-mono text-[11px] text-tertiary">
          {value}
        </div>

        <button className="secondary-button w-full !h-10 !text-[13px]" onClick={onClose} type="button">
          Close QR Code
        </button>
      </div>
    </div>
  );
}

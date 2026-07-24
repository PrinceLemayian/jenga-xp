import React, { useState } from "react";
import Icon from "./Icon";
import QRCodeModal from "./QRCodeModal";
import QRScannerModal from "./QRScannerModal";

export default function OrganizerPanel({
  onCreateEvent,
  onCheckIn,
  eventsList = [],
  txLoading,
  txError,
  txHash,
}) {
  const [eventName, setEventName] = useState("");
  const [memberAddress, setMemberAddress] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("0");
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventName.trim()) return;
    const res = await onCreateEvent(eventName.trim());
    if (res && res.success) {
      setEventName("");
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!memberAddress.trim()) return;
    const res = await onCheckIn(memberAddress.trim(), selectedEventId);
    if (res && res.success) {
      setMemberAddress("");
    }
  };

  const handleScanMemberSuccess = (scannedText) => {
    setShowScanner(false);
    let addr = scannedText.trim();
    if (addr.includes("ethereum:")) {
      addr = addr.split("ethereum:")[1].split("?")[0];
    } else if (addr.includes("eventId=")) {
      const urlParams = new URLSearchParams(addr.split("?")[1]);
      if (urlParams.has("eventId")) {
        setSelectedEventId(urlParams.get("eventId"));
      }
    }
    if (addr.startsWith("0x")) {
      setMemberAddress(addr);
    }
  };

  const showEventQR = (eventId, name) => {
    const checkInPayload = `${window.location.origin}/?eventId=${eventId}`;
    setQrCodeData({
      title: `Event #${eventId}: ${name}`,
      subtitle: "Members can scan this QR code with their camera to check in.",
      value: checkInPayload,
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Workspace Banner */}
      <section className="surface p-6 relative overflow-hidden bg-gradient-to-br from-[#16161A] to-[#1E1E24] border-amber/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber/10 text-amber text-2xl border border-amber/20">
              👑
            </div>
            <div>
              <span className="eyebrow text-amber">Organizer Workspace</span>
              <h2 className="text-[22px] font-extrabold text-primary leading-tight">Event Management Hub</h2>
            </div>
          </div>
          <span className="hidden sm:inline-flex rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[11px] font-bold text-amber">
            Authority Active
          </span>
        </div>

        <p className="mt-3 text-[13px] text-secondary leading-relaxed max-w-md">
          Create events, display live check-in QR codes for members to scan, and mint soulbound badges directly on Avalanche Fuji.
        </p>

        {/* Quick Stats Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-subtle pt-4">
          <div className="rounded-[14px] bg-elevated-2 p-3 text-center border border-subtle">
            <p className="eyebrow">Created Events</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{eventsList.length}</p>
          </div>
          <div className="rounded-[14px] bg-elevated-2 p-3 text-center border border-subtle">
            <p className="eyebrow">Target Network</p>
            <p className="mt-1 text-[13px] font-bold text-amber">Avalanche Fuji</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-[14px] bg-elevated-2 p-3 text-center border border-subtle">
            <p className="eyebrow">Badges Standard</p>
            <p className="mt-1 text-[13px] font-bold text-purple-400">ERC-721 Soulbound</p>
          </div>
        </div>
      </section>

      {/* Transaction Notifications */}
      {txHash && (
        <div className="rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 p-4 text-[13px] text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>Transaction Confirmed On-Chain!</span>
          </div>
          <a
            href={`https://testnet.snowtrace.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="font-bold underline hover:text-emerald-300 flex items-center gap-1 text-[12px]"
          >
            Snowtrace ↗
          </a>
        </div>
      )}

      {txError && (
        <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-400">
          <p className="font-bold">Transaction Reverted:</p>
          <p className="break-all mt-0.5 text-[12px]">{txError}</p>
        </div>
      )}

      {/* 2-Column Action Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Section 1: Create Event */}
        <form onSubmit={handleCreateEvent} className="surface p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-subtle pb-3">
            <span className="text-lg">📅</span>
            <h3 className="text-[15px] font-bold text-primary">1. Create New Event</h3>
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Event Name</label>
            <input
              type="text"
              placeholder="e.g. Avalanche Fuji Hackathon Meetup"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="input-field text-[14px]"
              disabled={txLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={txLoading || !eventName.trim()}
            className="primary-button !h-11 !text-[14px] w-full"
          >
            {txLoading ? (
              <span className="inline-flex items-center gap-2">
                <Icon className="animate-spin" name="loader" size={16} />
                Broadcasting to Fuji...
              </span>
            ) : (
              "+ Create Event On-Chain"
            )}
          </button>
        </form>

        {/* Section 2: Check-In Member */}
        <form onSubmit={handleCheckIn} className="surface p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-subtle pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎟️</span>
              <h3 className="text-[15px] font-bold text-primary">2. Check In Member</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="secondary-button !h-8 !px-2.5 !text-[11px] border-amber/30 text-amber"
            >
              📷 Scan Member QR
            </button>
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Select Active Event</label>
            {eventsList.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="input-field text-[14px]"
                  disabled={txLoading}
                >
                  {eventsList.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      Event #{evt.id}: {evt.name} ({evt.attendeeCount} attended)
                    </option>
                  ))}
                </select>

                {eventsList.find((e) => String(e.id) === String(selectedEventId)) && (
                  <button
                    type="button"
                    onClick={() => {
                      const evt = eventsList.find((e) => String(e.id) === String(selectedEventId));
                      showEventQR(evt.id, evt.name);
                    }}
                    className="secondary-button w-full !h-9 !text-[12px] border-amber/40 text-amber font-bold"
                  >
                    📱 Display Event Check-In QR Code
                  </button>
                )}
              </div>
            ) : (
              <input
                type="number"
                min="0"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                placeholder="Event ID (0)"
                className="input-field text-[14px]"
                disabled={txLoading}
                required
              />
            )}
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Member Wallet Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={memberAddress}
              onChange={(e) => setMemberAddress(e.target.value)}
              className="input-field text-[13px] font-mono"
              disabled={txLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={txLoading || !memberAddress.trim()}
            className="primary-button !h-11 !text-[14px] w-full"
          >
            {txLoading ? (
              <span className="inline-flex items-center gap-2">
                <Icon className="animate-spin" name="loader" size={16} />
                Minting & Checking In...
              </span>
            ) : (
              "⚡ Submit Check-In & Mint Badge"
            )}
          </button>
        </form>
      </div>

      {/* List of Created Events & QR Actions */}
      {eventsList.length > 0 && (
        <section className="surface p-5 space-y-3">
          <span className="eyebrow">Active Event Catalog</span>
          <h3 className="text-[16px] font-bold text-primary">Generated Event QR Codes</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {eventsList.map((evt) => (
              <div
                key={evt.id}
                className="rounded-[16px] border border-subtle bg-elevated-2 p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-amber bg-amber/10 border border-amber/20 px-2 py-0.5 rounded-full">
                      ID #{evt.id}
                    </span>
                    <span className="text-[11px] text-tertiary">
                      {evt.attendeeCount} Check-ins
                    </span>
                  </div>
                  <h4 className="text-[15px] font-bold text-primary mt-2">{evt.name}</h4>
                </div>

                <button
                  type="button"
                  onClick={() => showEventQR(evt.id, evt.name)}
                  className="secondary-button w-full !h-9 !text-[12px] justify-center gap-1.5"
                >
                  <span>📱</span> Show QR Code
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {qrCodeData && (
        <QRCodeModal
          title={qrCodeData.title}
          subtitle={qrCodeData.subtitle}
          value={qrCodeData.value}
          onClose={() => setQrCodeData(null)}
        />
      )}

      {showScanner && (
        <QRScannerModal
          onScanSuccess={handleScanMemberSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

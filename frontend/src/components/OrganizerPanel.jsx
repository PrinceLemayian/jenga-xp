import { useState } from "react";
import Icon from "./Icon";
import QRCodeModal from "./QRCodeModal";
import QRScannerModal from "./QRScannerModal";

export default function OrganizerPanel({
  isOrganizer = true,
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
      {/* Organizer Command Center Banner */}
      <section className="surface border-amber/30 bg-gradient-to-br from-[#16161A] to-[#1E1E24] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber/20 bg-amber/10 text-2xl text-amber">
              👑
            </div>
            <div>
              <span className="eyebrow text-amber">Organizer Workspace</span>
              <h2 className="text-[22px] font-extrabold leading-tight text-primary">Event Command Hub</h2>
            </div>
          </div>
          <span className="hidden rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[11px] font-bold text-amber sm:inline-flex">
            {isOrganizer ? "Organizer Active" : "Organizer Preview"}
          </span>
        </div>

        {!isOrganizer && (
          <div className="mt-4 rounded-[14px] border border-amber/30 bg-amber/10 p-3 text-[12px] text-amber">
            ℹ️ <span className="font-semibold">Notice:</span> Your connected wallet is not the designated contract organizer. Connect with the deployer wallet to submit live on-chain check-in transactions.
          </div>
        )}

        <p className="mt-3 max-w-md text-[13px] leading-relaxed text-secondary">
          Create events, generate member check-in QR codes, scan member wallet addresses, and mint Soulbound NFT Badges on Avalanche Fuji.
        </p>

        {/* Quick Stats Row */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-subtle pt-4 sm:grid-cols-3">
          <div className="rounded-[14px] border border-subtle bg-elevated-2 p-3 text-center">
            <p className="eyebrow">Created Events</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{eventsList.length}</p>
          </div>
          <div className="rounded-[14px] border border-subtle bg-elevated-2 p-3 text-center">
            <p className="eyebrow">Target Network</p>
            <p className="mt-1 text-[13px] font-bold text-amber">Avalanche Fuji</p>
          </div>
          <div className="col-span-2 rounded-[14px] border border-subtle bg-elevated-2 p-3 text-center sm:col-span-1">
            <p className="eyebrow">Badges Standard</p>
            <p className="mt-1 text-[13px] font-bold text-purple-400">ERC-721 Soulbound</p>
          </div>
        </div>
      </section>

      {/* Transaction Notifications */}
      {txHash && (
        <div className="flex items-center justify-between rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 p-4 text-[13px] text-emerald-400">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>Transaction Confirmed On-Chain!</span>
          </div>
          <a
            className="flex items-center gap-1 text-[12px] font-bold underline hover:text-emerald-300"
            href={`https://testnet.snowtrace.io/tx/${txHash}`}
            rel="noreferrer"
            target="_blank"
          >
            Snowtrace ↗
          </a>
        </div>
      )}

      {txError && (
        <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-400">
          <p className="font-bold">Transaction Reverted:</p>
          <p className="mt-0.5 break-all text-[12px]">{txError}</p>
        </div>
      )}

      {/* 2-Column Action Layout */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Section 1: Create Event */}
        <form className="surface space-y-4 p-5" onSubmit={handleCreateEvent}>
          <div className="flex items-center gap-2 border-b border-subtle pb-3">
            <span className="text-lg">📅</span>
            <h3 className="text-[15px] font-bold text-primary">1. Create New Event</h3>
          </div>

          <div>
            <label className="eyebrow mb-1.5 block">Event Name</label>
            <input
              className="input-field text-[14px]"
              disabled={txLoading}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Avalanche Fuji Hackathon Meetup"
              required
              type="text"
              value={eventName}
            />
          </div>

          <button
            className="primary-button w-full !h-11 !text-[14px]"
            disabled={txLoading || !eventName.trim()}
            type="submit"
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
        <form className="surface space-y-4 p-5" onSubmit={handleCheckIn}>
          <div className="flex items-center justify-between border-b border-subtle pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎟️</span>
              <h3 className="text-[15px] font-bold text-primary">2. Check In Member</h3>
            </div>
            <button
              className="secondary-button border-amber/30 text-amber !h-8 !px-2.5 !text-[11px]"
              onClick={() => setShowScanner(true)}
              type="button"
            >
              📷 Scan Member QR
            </button>
          </div>

          <div>
            <label className="eyebrow mb-1.5 block">Select Active Event</label>
            {eventsList.length > 0 ? (
              <div className="space-y-2">
                <select
                  className="input-field text-[14px]"
                  disabled={txLoading}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  value={selectedEventId}
                >
                  {eventsList.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      Event #{evt.id}: {evt.name} ({evt.attendeeCount} attended)
                    </option>
                  ))}
                </select>

                {eventsList.find((e) => String(e.id) === String(selectedEventId)) && (
                  <button
                    className="secondary-button border-amber/40 text-amber font-bold w-full !h-9 !text-[12px]"
                    onClick={() => {
                      const evt = eventsList.find((e) => String(e.id) === String(selectedEventId));
                      showEventQR(evt.id, evt.name);
                    }}
                    type="button"
                  >
                    📱 Display Event Check-In QR Code
                  </button>
                )}
              </div>
            ) : (
              <input
                className="input-field text-[14px]"
                disabled={txLoading}
                min="0"
                onChange={(e) => setSelectedEventId(e.target.value)}
                placeholder="Event ID (0)"
                required
                type="number"
                value={selectedEventId}
              />
            )}
          </div>

          <div>
            <label className="eyebrow mb-1.5 block">Member Wallet Address</label>
            <input
              className="input-field font-mono text-[13px]"
              disabled={txLoading}
              onChange={(e) => setMemberAddress(e.target.value)}
              placeholder="0x..."
              required
              type="text"
              value={memberAddress}
            />
          </div>

          <button
            className="primary-button w-full !h-11 !text-[14px]"
            disabled={txLoading || !memberAddress.trim()}
            type="submit"
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
        <section className="surface space-y-3 p-5">
          <span className="eyebrow">Active Event Catalog</span>
          <h3 className="text-[16px] font-bold text-primary">Generated Event QR Codes</h3>

          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            {eventsList.map((evt) => (
              <div
                className="flex flex-col justify-between space-y-3 rounded-[16px] border border-subtle bg-elevated-2 p-4"
                key={evt.id}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-amber/20 bg-amber/10 px-2 py-0.5 text-[11px] font-extrabold text-amber">
                      ID #{evt.id}
                    </span>
                    <span className="text-[11px] text-tertiary">
                      {evt.attendeeCount} Check-ins
                    </span>
                  </div>
                  <h4 className="mt-2 text-[15px] font-bold text-primary">{evt.name}</h4>
                </div>

                <button
                  className="secondary-button w-full justify-center gap-1.5 !h-9 !text-[12px]"
                  onClick={() => showEventQR(evt.id, evt.name)}
                  type="button"
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
          onClose={() => setQrCodeData(null)}
          subtitle={qrCodeData.subtitle}
          title={qrCodeData.title}
          value={qrCodeData.value}
        />
      )}

      {showScanner && (
        <QRScannerModal
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanMemberSuccess}
        />
      )}
    </div>
  );
}

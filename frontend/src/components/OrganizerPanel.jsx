import { isAddress } from "ethers";
import { useState } from "react";
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
  const [localError, setLocalError] = useState(null);

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setLocalError(null);
    if (!eventName.trim()) return;

    const result = await onCreateEvent(eventName.trim());
    if (result?.success) setEventName("");
  };

  const handleCheckIn = async (event) => {
    event.preventDefault();
    setLocalError(null);

    if (!isAddress(memberAddress.trim())) {
      setLocalError("Enter a valid wallet address before checking in a member.");
      return;
    }

    const result = await onCheckIn(memberAddress.trim(), selectedEventId);
    if (result?.success) setMemberAddress("");
  };

  const handleScanMemberSuccess = (scannedText) => {
    setShowScanner(false);
    setLocalError(null);

    let value = scannedText.trim();
    if (value.includes("ethereum:")) {
      value = value.split("ethereum:")[1].split("?")[0];
    }

    if (isAddress(value)) {
      setMemberAddress(value);
      return;
    }

    setLocalError("That QR code did not contain a valid wallet address.");
  };

  const showEventQR = (eventId, name) => {
    setQrCodeData({
      title: `Event #${eventId}: ${name}`,
      subtitle: "Members can scan this QR code, then show their wallet QR to the organizer.",
      value: `${window.location.origin}/?eventId=${eventId}`,
    });
  };

  const selectedEvent = eventsList.find((event) => String(event.id) === String(selectedEventId));

  return (
    <div className="space-y-5 animate-in fade-in">
      <section className="surface relative overflow-hidden border-amber/30 bg-gradient-to-br from-[#16161A] to-[#1E1E24] p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber/20 bg-amber/10 text-2xl text-amber">
              👑
            </div>
            <div>
              <span className="eyebrow text-amber">Organizer Workspace</span>
              <h2 className="text-[22px] font-extrabold leading-tight text-primary">Event Management Hub</h2>
            </div>
          </div>
          <span className="hidden rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[11px] font-bold text-amber sm:inline-flex">
            Authority Active
          </span>
        </div>

        <p className="mt-3 max-w-md text-[13px] leading-relaxed text-secondary">
          Create events, display check-in QR codes, and check members in on Avalanche Fuji.
        </p>

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
            <p className="eyebrow">Badges</p>
            <p className="mt-1 text-[13px] font-bold text-purple-400">Soulbound NFTs</p>
          </div>
        </div>
      </section>

      {txHash && (
        <div className="flex items-center justify-between gap-3 rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 p-4 text-[13px] text-emerald-400">
          <span className="inline-flex items-center gap-2">
            <Icon name="check" size={16} />
            Transaction confirmed on-chain.
          </span>
          <a
            className="inline-flex items-center gap-1 text-[12px] font-bold underline hover:text-emerald-300"
            href={`https://testnet.snowtrace.io/tx/${txHash}`}
            rel="noreferrer"
            target="_blank"
          >
            Snowtrace
            <Icon name="external" size={12} />
          </a>
        </div>
      )}

      {(txError || localError) && (
        <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-400">
          <p className="font-bold">Action failed</p>
          <p className="mt-0.5 break-all text-[12px]">{localError || txError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <form className="surface space-y-4 p-5" onSubmit={handleCreateEvent}>
          <div className="border-b border-subtle pb-3">
            <h3 className="text-[15px] font-bold text-primary">Create New Event</h3>
          </div>

          <div>
            <label className="eyebrow mb-1.5 block">Event Name</label>
            <input
              className="input-field text-[14px]"
              disabled={txLoading}
              onChange={(event) => setEventName(event.target.value)}
              placeholder="Avalanche Fuji Hackathon Meetup"
              required
              type="text"
              value={eventName}
            />
          </div>

          <button
            className="primary-button !h-11 w-full !text-[14px]"
            disabled={txLoading || !eventName.trim()}
            type="submit"
          >
            {txLoading ? (
              <span className="inline-flex items-center gap-2">
                <Icon className="animate-spin" name="loader" size={16} />
                Broadcasting to Fuji
              </span>
            ) : (
              "Create Event On-Chain"
            )}
          </button>
        </form>

        <form className="surface space-y-4 p-5" onSubmit={handleCheckIn}>
          <div className="flex items-center justify-between gap-3 border-b border-subtle pb-3">
            <h3 className="text-[15px] font-bold text-primary">Check In Member</h3>
            <button
              className="secondary-button !h-8 !px-2.5 !text-[11px] text-amber"
              onClick={() => setShowScanner(true)}
              type="button"
            >
              Scan Member QR
            </button>
          </div>

          <div>
            <label className="eyebrow mb-1.5 block">Select Active Event</label>
            {eventsList.length > 0 ? (
              <div className="space-y-2">
                <select
                  className="input-field text-[14px]"
                  disabled={txLoading}
                  onChange={(event) => setSelectedEventId(event.target.value)}
                  value={selectedEventId}
                >
                  {eventsList.map((event) => (
                    <option key={event.id} value={event.id}>
                      Event #{event.id}: {event.name} ({event.attendeeCount} attended)
                    </option>
                  ))}
                </select>

                {selectedEvent && (
                  <button
                    className="secondary-button w-full !h-9 !text-[12px] font-bold text-amber"
                    onClick={() => showEventQR(selectedEvent.id, selectedEvent.name)}
                    type="button"
                  >
                    Display Event Check-In QR Code
                  </button>
                )}
              </div>
            ) : (
              <input
                className="input-field text-[14px]"
                disabled={txLoading}
                min="0"
                onChange={(event) => setSelectedEventId(event.target.value)}
                placeholder="Event ID"
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
              onChange={(event) => setMemberAddress(event.target.value)}
              placeholder="0x..."
              required
              type="text"
              value={memberAddress}
            />
          </div>

          <button
            className="primary-button !h-11 w-full !text-[14px]"
            disabled={txLoading || !memberAddress.trim()}
            type="submit"
          >
            {txLoading ? (
              <span className="inline-flex items-center gap-2">
                <Icon className="animate-spin" name="loader" size={16} />
                Checking in
              </span>
            ) : (
              "Submit Check-In"
            )}
          </button>
        </form>
      </div>

      {eventsList.length > 0 && (
        <section className="surface space-y-3 p-5">
          <span className="eyebrow">Active Event Catalog</span>
          <h3 className="text-[16px] font-bold text-primary">Generated Event QR Codes</h3>

          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            {eventsList.map((event) => (
              <div
                className="flex flex-col justify-between space-y-3 rounded-[16px] border border-subtle bg-elevated-2 p-4"
                key={event.id}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-amber/20 bg-amber/10 px-2 py-0.5 text-[11px] font-extrabold text-amber">
                      ID #{event.id}
                    </span>
                    <span className="text-[11px] text-tertiary">{event.attendeeCount} check-ins</span>
                  </div>
                  <h4 className="mt-2 text-[15px] font-bold text-primary">{event.name}</h4>
                </div>

                <button
                  className="secondary-button w-full !h-9 justify-center gap-1.5 !text-[12px]"
                  onClick={() => showEventQR(event.id, event.name)}
                  type="button"
                >
                  Show QR Code
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
        <QRScannerModal onClose={() => setShowScanner(false)} onScanSuccess={handleScanMemberSuccess} />
      )}
    </div>
  );
}

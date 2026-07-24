import { useState } from "react";
import Icon from "./Icon";

const SNOWTRACE_TX = "https://testnet.snowtrace.io/tx/";

export default function OrganizerPanel({ onCreateEvent, onCheckIn, txLoading, txError, onRefetch }) {
  const [eventName, setEventName] = useState("");
  const [memberAddress, setMemberAddress] = useState("");
  const [eventId, setEventId] = useState("");
  const [success, setSuccess] = useState(null);
  const [localError, setLocalError] = useState(null);

  const submitCreateEvent = async (event) => {
    event.preventDefault();
    setLocalError(null);
    setSuccess(null);

    if (!eventName.trim()) {
      setLocalError("Add an event name first.");
      return;
    }

    const result = await onCreateEvent(eventName.trim());
    if (result.success) {
      setEventName("");
      setSuccess({ label: "Event created", hash: result.txHash });
      onRefetch?.();
    } else {
      setLocalError(result.error);
    }
  };

  const submitCheckIn = async (event) => {
    event.preventDefault();
    setLocalError(null);
    setSuccess(null);

    if (!memberAddress.trim() || eventId === "") {
      setLocalError("Enter a wallet address and event ID.");
      return;
    }

    const result = await onCheckIn(memberAddress.trim(), eventId);
    if (result.success) {
      setMemberAddress("");
      setEventId("");
      setSuccess({ label: "Member checked in", hash: result.txHash });
      onRefetch?.();
    } else {
      setLocalError(result.error);
    }
  };

  return (
    <section className="mt-7 pb-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-subtle" />
        <p className="eyebrow">Organizer Tools</p>
        <div className="h-px flex-1 bg-subtle" />
      </div>

      <div className="space-y-4">
        <form className="surface p-5" onSubmit={submitCreateEvent}>
          <h3 className="text-[20px] font-semibold">Create Event</h3>
          <input
            className="input-field mt-4"
            onChange={(event) => setEventName(event.target.value)}
            placeholder="Monthly meetup"
            value={eventName}
          />
          <button className="primary-button mt-3" disabled={txLoading} type="submit">
            {txLoading ? (
              <span className="inline-flex items-center gap-2">
                <Icon className="animate-spin" name="loader" size={17} />
                Creating
              </span>
            ) : (
              "Create Event"
            )}
          </button>
        </form>

        <form className="surface p-5" onSubmit={submitCheckIn}>
          <h3 className="text-[20px] font-semibold">Check In Member</h3>
          <div className="mt-4 space-y-3">
            <input
              className="input-field"
              onChange={(event) => setMemberAddress(event.target.value)}
              placeholder="0x member wallet"
              value={memberAddress}
            />
            <input
              className="input-field"
              min="0"
              onChange={(event) => setEventId(event.target.value)}
              placeholder="Event ID"
              type="number"
              value={eventId}
            />
          </div>
          <button className="primary-button mt-3" disabled={txLoading} type="submit">
            {txLoading ? (
              <span className="inline-flex items-center gap-2">
                <Icon className="animate-spin" name="loader" size={17} />
                Checking in
              </span>
            ) : (
              "Check In"
            )}
          </button>
        </form>

        {(localError || txError) && (
          <div className="flex items-start gap-3 rounded-[16px] border border-red-400/20 bg-red-500/10 p-3 text-[13px] font-medium leading-5 text-red-200">
            <Icon className="mt-0.5 shrink-0" name="alert" size={17} />
            <p className="flex-1">{localError || txError}</p>
            <button className="text-red-200 active:scale-[0.97]" onClick={() => setLocalError(null)} type="button">
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="rounded-[16px] border border-green-400/20 bg-green-500/10 p-3">
            <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-green-300">
              <Icon name="check" size={16} />
              {success.label}
            </p>
            <a
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-secondary underline-offset-4 hover:underline"
              href={`${SNOWTRACE_TX}${success.hash}`}
              rel="noreferrer"
              target="_blank"
            >
              View transaction
              <Icon name="external" size={12} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

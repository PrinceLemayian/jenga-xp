import { useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import Icon from "./components/Icon";
import MemberDashboard from "./components/MemberDashboard";
import OrganizerPanel from "./components/OrganizerPanel";
import { useJengaXP } from "./hooks/useJengaXP";
import { useWallet } from "./hooks/useWallet";

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function App() {
  const [copied, setCopied] = useState(false);
  const {
    address,
    provider,
    signer,
    error: walletError,
    connecting,
    isWrongNetwork,
    connect,
    switchToFuji,
  } = useWallet();

  const {
    memberData,
    communityAverage,
    memberCount,
    nextAction,
    xpToNext,
    badges,
    isOrganizer,
    loading,
    txLoading,
    txError,
    contractsReady,
    createEvent,
    checkIn,
    refetch,
  } = useJengaXP(signer, provider, address);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  if (!address) {
    return (
      <ConnectWallet
        connecting={connecting}
        error={walletError}
        onConnect={connect}
        onSwitchNetwork={switchToFuji}
      />
    );
  }

  if (isWrongNetwork) {
    return (
      <main className="min-h-screen bg-app px-5 py-8 text-primary">
        <section className="mx-auto flex min-h-[80vh] max-w-md items-center">
          <div className="surface w-full p-5">
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 text-amber" name="alert" size={22} />
              <div className="flex-1">
                <p className="text-[15px] font-semibold">Avalanche Fuji required</p>
                <p className="mt-1 text-[13px] leading-5 text-secondary">
                  Switch networks to view your Jenga XP dashboard and submit check-ins.
                </p>
              </div>
            </div>
            <button className="primary-button mt-5" onClick={switchToFuji} type="button">
              Switch to Avalanche Fuji
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app px-5 py-5 text-primary">
      <div className="mx-auto max-w-md">
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-elevated text-xl">🌱</span>
            <div>
              <p className="text-[15px] font-bold leading-tight">Jenga XP</p>
              <p className="text-[12px] text-tertiary">Community reputation</p>
            </div>
          </div>

          <button
            className="inline-flex h-9 items-center gap-2 rounded-full border border-subtle bg-elevated-2 px-3 text-[12px] font-medium text-secondary active:scale-[0.97]"
            onClick={copyAddress}
            type="button"
          >
            <Icon name={copied ? "check" : "copy"} size={14} />
            {copied ? "Copied" : shortAddress(address)}
          </button>
        </header>

        {!contractsReady && (
          <div className="mb-4 rounded-[16px] border border-subtle bg-elevated-2 p-4 text-[13px] leading-5 text-secondary">
            Contract addresses are not set yet. The app is showing the first-time member state until deployment is ready.
          </div>
        )}

        <MemberDashboard
          badges={badges}
          communityAverage={communityAverage}
          loading={loading}
          memberCount={memberCount}
          memberData={memberData}
          nextAction={nextAction}
          xpToNext={xpToNext}
        />

        {isOrganizer && (
          <OrganizerPanel
            onCheckIn={checkIn}
            onCreateEvent={createEvent}
            onRefetch={refetch}
            txError={txError}
            txLoading={txLoading}
          />
        )}
      </div>
    </main>
  );
}

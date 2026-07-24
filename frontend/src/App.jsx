import { useState, useEffect } from "react";
import ConnectWallet from "./components/ConnectWallet";
import Icon from "./components/Icon";
import MemberDashboard from "./components/MemberDashboard";
import OrganizerPanel from "./components/OrganizerPanel";
import QRCodeModal from "./components/QRCodeModal";
import QRScannerModal from "./components/QRScannerModal";
import { useJengaXP } from "./hooks/useJengaXP";
import { useWallet } from "./hooks/useWallet";

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function App() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("member"); // 'member' | 'organizer'
  const [walletQrVisible, setWalletQrVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannedEventId, setScannedEventId] = useState(null);

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
    eventsList,
    isOrganizer,
    loading,
    txLoading,
    txError,
    txHash,
    contractsReady,
    createEvent,
    checkIn,
    refetch,
  } = useJengaXP(signer, provider, address);

  // Default organizer address to organizer tab if organizer wallet connects
  useEffect(() => {
    if (isOrganizer) {
      setActiveTab("organizer");
    }
  }, [isOrganizer]);

  // Check URL query parameters for scanned eventId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("eventId")) {
      setScannedEventId(params.get("eventId"));
      setActiveTab("member");
    }
  }, []);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const handleScanSuccess = (decodedText) => {
    setScannerVisible(false);
    let scanned = decodedText.trim();
    if (scanned.includes("eventId=")) {
      const urlParams = new URLSearchParams(scanned.split("?")[1]);
      if (urlParams.has("eventId")) {
        setScannedEventId(urlParams.get("eventId"));
        setActiveTab("member");
      }
    } else if (scanned.startsWith("0x")) {
      if (isOrganizer && activeTab === "organizer") {
        // Handled in OrganizerPanel
      } else {
        alert(`Scanned Member Wallet: ${scanned}`);
      }
    }
  };

  const handleCheckInScannedEvent = async (eventId) => {
    if (!address) return;
    const res = await checkIn(address, eventId);
    if (res && res.success) {
      setScannedEventId(null);
    }
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
          <div className="surface w-full p-5 text-center space-y-4">
            <div className="flex items-start justify-center gap-3">
              <Icon className="mt-0.5 text-amber" name="alert" size={24} />
              <div className="text-left">
                <p className="text-[16px] font-bold">Avalanche Fuji Network Required</p>
                <p className="mt-1 text-[13px] leading-5 text-secondary">
                  Please switch your MetaMask network to Avalanche Fuji Testnet (Chain ID 43113) to interact with Jenga XP.
                </p>
              </div>
            </div>
            <button className="primary-button mt-4" onClick={switchToFuji} type="button">
              Switch to Avalanche Fuji
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app px-4 py-5 text-primary selection:bg-amber selection:text-black">
      <div className="mx-auto max-w-md space-y-5">
        {/* Header Bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-elevated text-2xl border border-subtle">
              🌱
            </span>
            <div>
              <p className="text-[16px] font-extrabold leading-tight">Jenga XP</p>
              <p className="text-[11px] text-tertiary">Avalanche Fuji Testnet</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-9 items-center gap-1 rounded-full border border-subtle bg-elevated-2 px-3 text-[12px] font-medium text-secondary active:scale-[0.97]"
              onClick={() => setScannerVisible(true)}
              type="button"
              title="Scan QR Code"
            >
              <span>📷</span> Scan
            </button>

            <button
              className="inline-flex h-9 items-center gap-1 rounded-full border border-subtle bg-elevated-2 px-3 text-[12px] font-medium text-secondary active:scale-[0.97]"
              onClick={() => setWalletQrVisible(true)}
              type="button"
              title="My Wallet QR"
            >
              <span>📱</span> QR
            </button>

            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-subtle bg-elevated-2 px-3 text-[12px] font-medium text-secondary active:scale-[0.97]"
              onClick={copyAddress}
              type="button"
            >
              <Icon name={copied ? "check" : "copy"} size={13} />
              {copied ? "Copied" : shortAddress(address)}
            </button>
          </div>
        </header>

        {/* Dedicated Role Switcher Tabs */}
        <nav className="surface p-1.5 flex items-center gap-1">
          <button
            onClick={() => setActiveTab("member")}
            className={`flex-1 py-2.5 text-[13px] font-bold rounded-[14px] transition-all flex items-center justify-center gap-2 ${
              activeTab === "member"
                ? "bg-elevated-2 text-primary shadow-sm border border-subtle"
                : "text-tertiary hover:text-secondary"
            }`}
          >
            <span>👤</span> Member Portal
          </button>

          <button
            onClick={() => setActiveTab("organizer")}
            className={`flex-1 py-2.5 text-[13px] font-bold rounded-[14px] transition-all flex items-center justify-center gap-2 relative ${
              activeTab === "organizer"
                ? "bg-elevated-2 text-amber shadow-sm border border-amber/30"
                : "text-tertiary hover:text-secondary"
            }`}
          >
            <span>👑</span> Organizer Hub
            {isOrganizer && (
              <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
            )}
          </button>
        </nav>

        {!contractsReady && (
          <div className="rounded-[16px] border border-subtle bg-elevated-2 p-4 text-[13px] leading-5 text-secondary">
            Contract addresses are not configured. Launching preview mode.
          </div>
        )}

        {/* Tab 1: Member Page */}
        {activeTab === "member" && (
          <MemberDashboard
            badges={badges}
            communityAverage={communityAverage}
            loading={loading}
            memberCount={memberCount}
            memberData={memberData}
            nextAction={nextAction}
            xpToNext={xpToNext}
            scannedEventId={scannedEventId}
            onOpenScanner={() => setScannerVisible(true)}
            onOpenWalletQr={() => setWalletQrVisible(false)}
            onCheckInScannedEvent={handleCheckInScannedEvent}
            txLoading={txLoading}
          />
        )}

        {/* Tab 2: Organizer Page */}
        {activeTab === "organizer" && (
          <OrganizerPanel
            onCheckIn={checkIn}
            onCreateEvent={createEvent}
            onRefetch={refetch}
            eventsList={eventsList}
            txError={txError}
            txLoading={txLoading}
            txHash={txHash}
          />
        )}
      </div>

      {walletQrVisible && (
        <QRCodeModal
          title="My Wallet QR Code"
          subtitle="Show this QR code to event organizers for instant check-in."
          value={address}
          onClose={() => setWalletQrVisible(false)}
        />
      )}

      {scannerVisible && (
        <QRScannerModal
          onScanSuccess={handleScanSuccess}
          onClose={() => setScannerVisible(false)}
        />
      )}
    </main>
  );
}

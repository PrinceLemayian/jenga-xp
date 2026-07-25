import { useEffect, useState } from "react";
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
  const [activeTab, setActiveTab] = useState("member");
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

  useEffect(() => {
    if (!isOrganizer && activeTab === "organizer") {
      setActiveTab("member");
    }
  }, [activeTab, isOrganizer]);

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
    const scanned = decodedText.trim();

    if (scanned.includes("eventId=")) {
      const urlParams = new URLSearchParams(scanned.split("?")[1]);
      if (urlParams.has("eventId")) {
        setScannedEventId(urlParams.get("eventId"));
        setActiveTab("member");
      }
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
          <div className="surface w-full space-y-4 p-5 text-center">
            <div className="flex items-start justify-center gap-3">
              <Icon className="mt-0.5 text-amber" name="alert" size={24} />
              <div className="text-left">
                <p className="text-[16px] font-bold">Avalanche Fuji Network Required</p>
                <p className="mt-1 text-[13px] leading-5 text-secondary">
                  Switch MetaMask to Avalanche Fuji Testnet, Chain ID 43113, to use Jenga XP.
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
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-subtle bg-elevated text-2xl">
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
              title="Scan QR Code"
              type="button"
            >
              Scan
            </button>

            <button
              className="inline-flex h-9 items-center gap-1 rounded-full border border-subtle bg-elevated-2 px-3 text-[12px] font-medium text-secondary active:scale-[0.97]"
              onClick={() => setWalletQrVisible(true)}
              title="My Wallet QR"
              type="button"
            >
              QR
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

        {isOrganizer && (
          <nav className="surface flex items-center gap-1 p-1.5">
            <button
              className={`flex-1 rounded-[14px] py-2.5 text-[13px] font-bold transition-all ${
                activeTab === "member"
                  ? "border border-subtle bg-elevated-2 text-primary shadow-sm"
                  : "text-tertiary hover:text-secondary"
              }`}
              onClick={() => setActiveTab("member")}
              type="button"
            >
              Member Portal
            </button>

            <button
              className={`flex-1 rounded-[14px] py-2.5 text-[13px] font-bold transition-all ${
                activeTab === "organizer"
                  ? "border border-amber/30 bg-elevated-2 text-amber shadow-sm"
                  : "text-tertiary hover:text-secondary"
              }`}
              onClick={() => setActiveTab("organizer")}
              type="button"
            >
              Organizer Hub
            </button>
          </nav>
        )}

        {!contractsReady && (
          <div className="rounded-[16px] border border-subtle bg-elevated-2 p-4 text-[13px] leading-5 text-secondary">
            Contract addresses are not configured. Add them to frontend/.env after deployment.
          </div>
        )}

        {activeTab === "member" && (
          <MemberDashboard
            badges={badges}
            communityAverage={communityAverage}
            loading={loading}
            memberCount={memberCount}
            memberData={memberData}
            nextAction={nextAction}
            onOpenScanner={() => setScannerVisible(true)}
            onOpenWalletQr={() => setWalletQrVisible(true)}
            scannedEventId={scannedEventId}
            xpToNext={xpToNext}
          />
        )}

        {isOrganizer && activeTab === "organizer" && (
          <OrganizerPanel
            eventsList={eventsList}
            onCheckIn={checkIn}
            onCreateEvent={createEvent}
            onRefetch={refetch}
            txError={txError}
            txHash={txHash}
            txLoading={txLoading}
          />
        )}
      </div>

      {walletQrVisible && (
        <QRCodeModal
          onClose={() => setWalletQrVisible(false)}
          subtitle="Show this QR code to event organizers for instant check-in."
          title="My Wallet QR Code"
          value={address}
        />
      )}

      {scannerVisible && (
        <QRScannerModal
          onClose={() => setScannerVisible(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </main>
  );
}

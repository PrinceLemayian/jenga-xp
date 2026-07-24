import Icon from "./Icon";

export default function ConnectWallet({ connecting, error, onConnect, onSwitchNetwork }) {
  const shouldOfferSwitch = error?.toLowerCase().includes("chain") || error?.toLowerCase().includes("network");

  return (
    <main className="relative min-h-screen overflow-hidden bg-app px-5 text-primary">
      <div className="absolute left-1/2 top-[30%] h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/5 blur-3xl" />

      <section className="relative mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-[20px] border border-subtle bg-elevated text-5xl shadow-ios">
          🌱
        </div>

        <h1 className="text-[40px] font-extrabold leading-none tracking-[-0.02em]">Jenga XP</h1>
        <p className="mt-3 text-[15px] font-medium text-secondary">Build your community reputation on-chain.</p>

        <div className="mt-14 w-full">
          {error && (
            <div className="mb-4 rounded-[16px] border border-subtle bg-elevated-2 p-3 text-left">
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 shrink-0 text-amber" name="alert" size={18} />
                <p className="text-[13px] font-medium leading-5 text-secondary">{error}</p>
              </div>
              {shouldOfferSwitch && (
                <button className="secondary-button mt-3" onClick={onSwitchNetwork} type="button">
                  Switch Network
                </button>
              )}
            </div>
          )}

          <button className="primary-button" disabled={connecting} onClick={onConnect} type="button">
            {connecting ? (
              <span className="inline-flex items-center gap-2">
                <Icon className="animate-spin" name="loader" size={18} />
                Connecting
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Icon name="wallet" size={18} />
                Connect Wallet
              </span>
            )}
          </button>

          <p className="mt-4 text-[12px] font-normal text-tertiary">Requires MetaMask on Avalanche Fuji</p>
        </div>
      </section>
    </main>
  );
}

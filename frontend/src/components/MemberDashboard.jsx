import { LEVELS } from "../constants";
import BadgeCollection from "./BadgeCollection";
import CommunityStats from "./CommunityStats";
import LevelLadder from "./LevelLadder";
import NextActionCard from "./NextActionCard";
import StreakDisplay from "./StreakDisplay";
import XPBar from "./XPBar";

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="surface p-6">
        <div className="skeleton h-14 w-14 rounded-[18px]" />
        <div className="skeleton mt-5 h-3 w-28 rounded-full" />
        <div className="skeleton mt-3 h-10 w-52 rounded-full" />
        <div className="skeleton mt-8 h-3 w-full rounded-full" />
      </div>
      <div className="surface space-y-3 p-5">
        <div className="skeleton h-3 w-32 rounded-full" />
        <div className="skeleton h-10 w-full rounded-full" />
        <div className="skeleton h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export default function MemberDashboard({
  badges = [],
  communityAverage = 0,
  loading,
  memberCount = 0,
  memberData,
  nextAction,
  xpToNext,
  scannedEventId,
  onOpenScanner,
  onOpenWalletQr,
}) {
  if (loading) return <DashboardSkeleton />;

  const data = memberData || { xp: 0, totalAttendance: 0, streak: 0, level: 1, exists: false };
  const currentLevel = LEVELS[data.level] || LEVELS[1];
  const nextLevel = LEVELS[data.level + 1] || null;
  const displayAction = data.exists
    ? nextAction
    : "Attend your first event to start building your reputation.";

  return (
    <div className="space-y-4 animate-in fade-in">
      {scannedEventId !== null && scannedEventId !== undefined && (
        <div className="surface space-y-3 border-amber/40 bg-amber/10 p-5 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎟️</span>
              <div>
                <span className="eyebrow text-amber">Event QR Scanned</span>
                <h3 className="text-[16px] font-extrabold text-primary">Event #{scannedEventId}</h3>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
              Ready
            </span>
          </div>

          <p className="text-[13px] leading-5 text-secondary">
            Show your wallet QR code to the organizer. They will complete the on-chain check-in from the Organizer Hub.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button className="primary-button !h-10 flex-1 !text-[13px]" onClick={onOpenWalletQr} type="button">
              Show My Wallet QR
            </button>
            <button className="secondary-button !h-10 !text-[13px]" onClick={onOpenScanner} type="button">
              Scan Again
            </button>
          </div>
        </div>
      )}

      {!data.exists && (
        <div className="surface space-y-3 border-subtle bg-elevated-2 p-5 text-center">
          <span className="inline-block text-3xl">👋</span>
          <h3 className="text-[17px] font-extrabold text-primary">Welcome to Jenga XP</h3>
          <p className="mx-auto max-w-sm text-[13px] leading-5 text-secondary">
            You have not been checked in yet. Ask an organizer to scan your wallet QR code to earn your first XP.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              className="primary-button !h-10 !w-auto !px-5 !text-[13px]"
              onClick={onOpenWalletQr}
              type="button"
            >
              My Wallet QR
            </button>
            <button className="secondary-button !h-10 !text-[13px]" onClick={onOpenScanner} type="button">
              Scan Event QR
            </button>
          </div>
        </div>
      )}

      <section className="surface elevated-hero relative overflow-hidden p-6">
        <div className="flex items-start gap-4">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] text-5xl transition-transform hover:scale-105"
            style={{
              background: `color-mix(in srgb, ${currentLevel.color} 12%, #16161A)`,
              boxShadow:
                data.level >= 5
                  ? `0 0 28px color-mix(in srgb, ${currentLevel.color} 30%, transparent)`
                  : undefined,
            }}
          >
            {currentLevel.emoji}
          </div>

          <div className="min-w-0 flex-1">
            <p className="eyebrow">Current reputation rank</p>
            <h2
              className="mt-1 text-[38px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ color: currentLevel.color }}
            >
              {currentLevel.name}
            </h2>
            <p className="mt-1 text-[12px] text-tertiary">Level {data.level} of 5</p>
          </div>
        </div>

        <div className="mt-8">
          <XPBar currentLevel={data.level} currentXP={data.xp} nextLevel={nextLevel} xpToNext={xpToNext} />
        </div>
      </section>

      <LevelLadder currentLevel={data.level} />
      <CommunityStats attendance={data.totalAttendance} average={communityAverage} memberCount={memberCount} />
      <NextActionCard message={displayAction} />
      <StreakDisplay streak={data.streak} />
      <BadgeCollection badges={badges} />
    </div>
  );
}

import React from "react";
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
  badges,
  communityAverage,
  loading,
  memberCount,
  memberData,
  nextAction,
  xpToNext,
  scannedEventId,
  onOpenScanner,
  onOpenWalletQr,
  onCheckInScannedEvent,
  txLoading,
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
      {/* Scanned Event Check-In Action Card */}
      {scannedEventId !== null && scannedEventId !== undefined && (
        <div className="surface p-5 border-amber/40 bg-amber/10 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎟️</span>
              <div>
                <span className="eyebrow text-amber">Event QR Scanned</span>
                <h3 className="text-[16px] font-extrabold text-primary">Check-In for Event #{scannedEventId}</h3>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              +{data.streak >= 3 ? "150 XP Bonus" : "100 XP"}
            </span>
          </div>

          <p className="text-[13px] text-secondary">
            Present your QR code to the organizer or submit your check-in directly below to claim your XP and mint milestone badges.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onCheckInScannedEvent && onCheckInScannedEvent(scannedEventId)}
              disabled={txLoading}
              className="primary-button !h-10 !text-[13px] flex-1"
            >
              {txLoading ? "Submitting Check-In..." : "⚡ Claim Check-In & Earn XP"}
            </button>
            <button
              onClick={onOpenWalletQr}
              className="secondary-button !h-10 !text-[13px]"
            >
              📱 Show My QR
            </button>
          </div>
        </div>
      )}

      {/* First-Time Member Welcome Card */}
      {!data.exists && (
        <div className="surface p-5 text-center space-y-3 border-subtle bg-elevated-2">
          <span className="text-3xl inline-block">👋</span>
          <h3 className="text-[17px] font-extrabold text-primary">Welcome to Jenga XP</h3>
          <p className="text-[13px] text-secondary max-w-sm mx-auto">
            You haven't been checked in to a community event yet. Ask an organizer to check your wallet address in or scan an event QR code to earn your first XP!
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenScanner}
              className="primary-button !h-10 !w-auto !px-5 !text-[13px] inline-flex items-center gap-1.5"
            >
              <span>📷</span> Scan Event QR
            </button>
            <button
              onClick={onOpenWalletQr}
              className="secondary-button !h-10 !text-[13px] inline-flex items-center gap-1.5"
            >
              <span>📱</span> My Wallet QR
            </button>
          </div>
        </div>
      )}

      {/* Hero Level Banner */}
      <section className="surface elevated-hero p-6 relative overflow-hidden">
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
            <p className="text-[12px] text-tertiary mt-1">Level {data.level} of 5</p>
          </div>
        </div>

        <div className="mt-8">
          <XPBar
            currentLevel={data.level}
            currentXP={data.xp}
            nextLevel={nextLevel}
            xpToNext={xpToNext}
          />
        </div>
      </section>

      {/* Routledge Feedback System: Three Core Surfaces */}
      <LevelLadder currentLevel={data.level} />
      <CommunityStats attendance={data.totalAttendance} average={communityAverage} memberCount={memberCount} />
      <NextActionCard message={displayAction} />
      <StreakDisplay streak={data.streak} />
      <BadgeCollection badges={badges} />
    </div>
  );
}

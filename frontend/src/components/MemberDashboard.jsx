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
}) {
  if (loading) return <DashboardSkeleton />;

  const data = memberData || { xp: 0, totalAttendance: 0, streak: 0, level: 1, exists: false };
  const currentLevel = LEVELS[data.level] || LEVELS[1];
  const nextLevel = LEVELS[data.level + 1] || null;
  const displayAction = data.exists ? nextAction : "Attend your first event to start building your reputation.";

  return (
    <div className="space-y-4">
      <section className="surface elevated-hero p-6">
        <div className="flex items-start gap-4">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] text-5xl"
            style={{
              background: `color-mix(in srgb, ${currentLevel.color} 12%, #16161A)`,
              boxShadow: data.level >= 5 ? `0 0 28px color-mix(in srgb, ${currentLevel.color} 30%, transparent)` : undefined,
            }}
          >
            {currentLevel.emoji}
          </div>

          <div className="min-w-0 flex-1">
            <p className="eyebrow">Current level</p>
            <h2
              className="mt-1 text-[40px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ color: currentLevel.color }}
            >
              {currentLevel.name}
            </h2>
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

      <LevelLadder currentLevel={data.level} />
      <CommunityStats attendance={data.totalAttendance} average={communityAverage} memberCount={memberCount} />
      <NextActionCard message={displayAction} />
      <StreakDisplay streak={data.streak} />
      <BadgeCollection badges={badges} />
    </div>
  );
}

import { LEVELS } from "../constants";

export default function XPBar({ currentXP = 0, currentLevel = 1, nextLevel, xpToNext = 0 }) {
  const level = LEVELS[currentLevel] || LEVELS[1];
  const isMax = currentLevel >= 5 || !nextLevel;
  const nextLevelXP = isMax ? LEVELS[5].xpRequired : nextLevel.xpRequired;
  const currentFloor = level.xpRequired;
  const span = Math.max(nextLevelXP - currentFloor, 1);
  const progress = isMax ? 100 : Math.min(Math.max(((currentXP - currentFloor) / span) * 100, 0), 100);

  return (
    <div>
      <div className="h-3 overflow-hidden rounded-full bg-elevated-2">
        <div
          className="h-full rounded-full transition-[width] duration-[850ms] ease-out"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${level.color}, color-mix(in srgb, ${level.color} 72%, white))`,
            boxShadow: `0 0 18px color-mix(in srgb, ${level.color} 45%, transparent)`,
          }}
        />
      </div>
      <p
        className="mt-2 text-right text-[12px] font-normal text-secondary"
        style={isMax ? { color: level.color } : undefined}
      >
        {isMax ? "Maximum level reached" : `${currentXP} / ${nextLevelXP} XP`}
      </p>
    </div>
  );
}

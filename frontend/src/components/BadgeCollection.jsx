import { LEVELS } from "../constants";
import Icon from "./Icon";

export default function BadgeCollection({ badges = [] }) {
  return (
    <section className="pb-2">
      <p className="mb-3 px-1 text-[15px] font-semibold text-primary">Your Badges</p>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none">
        {LEVELS.slice(1).map((level, index) => {
          const levelNumber = index + 1;
          const earned = badges.includes(levelNumber);

          return (
            <article
              className={`relative flex h-[150px] w-[120px] shrink-0 flex-col items-center justify-between overflow-hidden rounded-[16px] border p-4 text-center shadow-ios transition ${
                earned ? "opacity-100" : "opacity-40 grayscale"
              }`}
              key={level.name}
              style={{
                borderColor: earned ? level.color : "#2A2A30",
                background: earned ? "#16161A" : "#1E1E23",
                boxShadow: earned ? `0 0 18px color-mix(in srgb, ${level.color} 22%, transparent)` : undefined,
              }}
            >
              {earned && <div className="absolute inset-0 bg-card-sheen" />}
              <span className="relative mt-1 text-5xl">{level.emoji}</span>
              <div className="relative">
                <p className="text-[13px] font-semibold text-primary">{level.name}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-elevated-2 px-2 py-1 text-[11px] font-medium text-secondary">
                  <Icon name="lock" size={11} />
                  Soulbound
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

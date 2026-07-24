import { LEVELS } from "../constants";
import Icon from "./Icon";

export default function LevelLadder({ currentLevel = 1 }) {
  return (
    <section className="surface p-5">
      <p className="eyebrow">Where am I going?</p>

      <div className="relative mt-4 space-y-1">
        <div className="absolute bottom-6 left-[11px] top-6 w-px bg-subtle" />

        {LEVELS.slice(1).map((level, index) => {
          const levelNumber = index + 1;
          const completed = levelNumber < currentLevel;
          const current = levelNumber === currentLevel;

          return (
            <div
              className={`relative flex items-center gap-3 rounded-full py-2 pl-0 pr-3 transition-colors ${
                current ? "bg-elevated-2" : ""
              }`}
              key={level.name}
            >
              <span
                className="z-10 grid h-[23px] w-[23px] shrink-0 place-items-center rounded-full border text-[11px]"
                style={{
                  background: completed ? level.color : "#16161A",
                  borderColor: completed || current ? level.color : "#2A2A30",
                  color: completed ? "#0B0B0D" : current ? level.color : "#5C5C64",
                }}
              >
                {completed ? <Icon name="check" size={13} strokeWidth={3} /> : ""}
              </span>

              <p
                className="flex-1 text-[15px] font-semibold"
                style={{ color: current ? level.color : completed ? "#F5F5F7" : "#9B9BA3" }}
              >
                {level.name}
              </p>
              <p className="text-[12px] font-normal text-tertiary">{level.xpRequired} XP</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

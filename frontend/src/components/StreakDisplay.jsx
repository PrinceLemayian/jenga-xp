import Icon from "./Icon";

export default function StreakDisplay({ streak = 0 }) {
  const bonusActive = streak >= 3;
  const remaining = Math.max(3 - streak, 0);

  return (
    <section className="surface p-5">
      <div className="flex items-end gap-2">
        <p className="text-[36px] font-extrabold leading-none tracking-[-0.02em]">{streak}</p>
        <p className="pb-1 text-[15px] font-semibold text-secondary">month streak</p>
      </div>

      <div className="mt-4 flex gap-2">
        {[1, 2, 3].map((month) => {
          const active = streak >= month;
          return (
            <span
              className={`grid h-9 w-9 place-items-center rounded-full border ${
                bonusActive && active ? "animate-flame" : ""
              }`}
              key={month}
              style={{
                background: active ? "rgba(245, 158, 11, 0.12)" : "#1E1E23",
                borderColor: active ? "#F59E0B" : "#2A2A30",
                color: active ? "#F59E0B" : "#5C5C64",
              }}
            >
              <Icon name="flame" size={18} />
            </span>
          );
        })}
      </div>

      <p className="mt-3 text-[13px] font-medium leading-5 text-secondary">
        {bonusActive
          ? "Bonus XP active. You're earning 150 XP per check-in."
          : `Attend for ${remaining} more consecutive month${remaining === 1 ? "" : "s"} to unlock bonus XP.`}
      </p>
    </section>
  );
}

import Icon from "./Icon";

export default function CommunityStats({ attendance = 0, average = 0, memberCount = 0 }) {
  const empty = memberCount === 0;
  const above = attendance > average;

  return (
    <section className="surface p-5">
      <p className="eyebrow">How am I doing?</p>

      {empty ? (
        <div className="mt-4">
          <p className="text-[28px] font-bold tracking-[-0.01em]">First</p>
          <p className="mt-1 text-[13px] font-medium text-secondary">You're the first one here.</p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center">
            <div>
              <p className="text-[28px] font-bold tracking-[-0.01em]">{attendance}</p>
              <p className="text-[12px] font-normal text-tertiary">You</p>
            </div>
            <div className="h-12 w-px bg-subtle" />
            <div className="text-right">
              <p className="text-[28px] font-bold tracking-[-0.01em]">{average}</p>
              <p className="text-[12px] font-normal text-tertiary">Community avg</p>
            </div>
          </div>

          <p
            className={`mt-4 inline-flex items-center gap-2 text-[13px] font-semibold ${
              above ? "text-green-400" : "text-secondary"
            }`}
          >
            <Icon name={above ? "trendingUp" : "trendingDown"} size={16} />
            {above ? "You're above average" : "Keep attending to move ahead"}
          </p>
        </>
      )}
    </section>
  );
}

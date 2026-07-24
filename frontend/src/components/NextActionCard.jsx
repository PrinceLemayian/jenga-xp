import Icon from "./Icon";

export default function NextActionCard({ message }) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-subtle bg-elevated-2 p-6 shadow-ios">
      <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-amber" />
      <div className="flex items-center gap-2">
        <Icon className="text-amber" name="compass" size={17} />
        <p className="eyebrow">What's next?</p>
      </div>
      <p className="mt-3 text-[20px] font-semibold leading-7 text-primary">
        {message || "Attend your first event to start building your reputation."}
      </p>
    </section>
  );
}

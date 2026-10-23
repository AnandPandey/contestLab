import type { ContestPhase } from "@/lib/dates";

const META: Record<ContestPhase, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "text-ink-2 border-line-strong" },
  live: { label: "Live", className: "text-ink border-accent/60 bg-accent/15" },
  ended: { label: "Ended · practice open", className: "text-ink-2 border-line-strong" },
  undated: { label: "Practice set", className: "text-ink-2 border-line-strong" },
};

export function ContestPhaseBadge({ phase }: { phase: ContestPhase }) {
  const { label, className } = META[phase];
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${className}`}>{label}</span>;
}

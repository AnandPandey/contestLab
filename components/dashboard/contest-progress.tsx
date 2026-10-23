import Link from "next/link";
import { Trophy } from "lucide-react";
import type { Progress } from "@/lib/progress";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/meter";
import { Panel } from "@/components/ui/panel";

export function ContestProgress({ contests }: { contests: Progress["byContest"] }) {
  return (
    <Panel title="Contests" action={<span className="text-xs text-ink-muted">{contests.length}</span>}>
      {contests.length === 0 ? (
        <EmptyState icon={Trophy} title="No contests yet">
          Contests you add will appear here with per-contest progress.
        </EmptyState>
      ) : (
        <ul className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
          {contests.map((c) => (
            <li key={c.id} className="bg-surface p-4">
              <Link
                href={`/contests/${c.slug}`}
                className="block truncate text-sm font-medium text-ink hover:text-accent-strong"
                title={c.title}
              >
                {c.title}
              </Link>
              <p className="mt-0.5 text-xs text-ink-muted">
                {c.startTime ? formatDate(c.startTime) : "No date"}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Meter value={c.solved} total={c.total} label={c.title} />
                <span className="shrink-0 text-xs tabular-nums text-ink-2">
                  {c.total === 0 ? "No problems" : `${c.solved} / ${c.total}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

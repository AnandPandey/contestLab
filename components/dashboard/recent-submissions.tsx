import { Send } from "lucide-react";
import type { Progress } from "@/lib/progress";
import { formatRelative } from "@/lib/format";
import { LANGUAGE_LABELS } from "@/constants/languages";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";

export function RecentSubmissions({
  submissions,
  now,
}: {
  submissions: Progress["recentSubmissions"];
  now: number;
}) {
  return (
    <Panel title="Recent submissions">
      {submissions.length === 0 ? (
        <EmptyState icon={Send} title="No submissions yet">
          Runs and submissions will be listed here with their verdicts.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {submissions.map((s) => (
            <li key={s.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm text-ink" title={s.problem.title}>
                  {s.problem.title}
                </p>
                <time
                  className="shrink-0 text-xs text-ink-muted"
                  dateTime={s.createdAt.toISOString()}
                  title={s.createdAt.toLocaleString()}
                >
                  {formatRelative(s.createdAt, now)}
                </time>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <StatusBadge status={s.status} />
                <span className="text-xs text-ink-muted">
                  {LANGUAGE_LABELS[s.language]}
                  {s.kind === "RUN" && " · run"}
                  {s.totalCount != null && ` · ${s.passedCount ?? 0}/${s.totalCount} tests`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

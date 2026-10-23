"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, History } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/client-api";
import type { SubmissionDetail, SubmissionListItem } from "@/lib/judge-types";
import { LANGUAGE_LABELS } from "@/constants/languages";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmissionResult } from "./submission-result";

export const submissionsKey = (problemId: string) => ["submissions", problemId] as const;

export function SubmissionHistory({
  problemId,
  onLoadCode,
}: {
  problemId: string;
  onLoadCode: (s: SubmissionDetail) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const { data, error, isPending } = useQuery({
    queryKey: submissionsKey(problemId),
    queryFn: () =>
      apiFetch<{ submissions: SubmissionListItem[] }>(`/api/submissions?problemId=${problemId}&limit=50`).then(
        (r) => r.submissions,
      ),
  });

  if (selected) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1 px-4 pt-3 text-xs text-ink-muted hover:text-ink"
        >
          <ChevronLeft className="size-3.5" aria-hidden /> All submissions
        </button>
        <SubmissionResult id={selected} onLoadCode={onLoadCode} />
      </div>
    );
  }

  if (isPending) return <p className="p-4 text-sm text-ink-muted">Loading submissions…</p>;
  if (error) return <p className="p-4 text-sm text-ink-muted">Couldn&apos;t load submissions.</p>;
  if (data.length === 0) {
    return (
      <EmptyState icon={History} title="No submissions yet">
        Runs and submissions for this problem will appear here.
      </EmptyState>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {data.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => setSelected(s.id)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-2"
          >
            <span className="w-44 shrink-0">
              <StatusBadge status={s.status} />
            </span>
            <span className="text-xs text-ink-2">{LANGUAGE_LABELS[s.language]}</span>
            <span className="text-xs text-ink-muted">{s.kind === "RUN" ? "run" : "submit"}</span>
            {s.totalCount != null && (
              <span className="text-xs tabular-nums text-ink-muted">
                {s.passedCount ?? 0}/{s.totalCount}
              </span>
            )}
            <time className="ml-auto text-xs text-ink-muted" dateTime={s.createdAt}>
              {new Date(s.createdAt).toLocaleString()}
            </time>
          </button>
        </li>
      ))}
    </ul>
  );
}

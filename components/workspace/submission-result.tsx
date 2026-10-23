"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, Cpu, FileCode, Lock, TriangleAlert } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { isPendingStatus, type SubmissionDetail, type TestResult } from "@/lib/judge-types";
import { LANGUAGE_LABELS } from "@/constants/languages";
import { STATUS_META, StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/form";

const pre = "max-h-40 overflow-auto rounded-md bg-canvas p-2.5 font-mono text-xs whitespace-pre-wrap text-ink-2";

export function useSubmission(id: string | null) {
  return useQuery({
    queryKey: ["submission", id],
    enabled: Boolean(id),
    queryFn: () => apiFetch<{ submission: SubmissionDetail }>(`/api/submissions/${id}`).then((r) => r.submission),
    // Keep polling while the judge is still working on it.
    refetchInterval: (q) => (q.state.data && isPendingStatus(q.state.data.status) ? 1000 : false),
  });
}

/** A failure to run at all (judge unavailable, not configured, rate limited) — not a verdict. */
export function ServiceError({ code, message }: { code: string; message: string }) {
  const notConfigured = code === "judge_not_configured";
  return (
    <div className="m-4 flex gap-3 rounded-lg border border-warning/40 bg-warning/5 p-3">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <div className="space-y-1 text-sm">
        <p className="font-medium text-ink">
          {notConfigured ? "Code execution isn't set up yet" : "Couldn't run your code"}
        </p>
        <p className="text-ink-2">
          {notConfigured
            ? "The Judge0 execution service has not been configured, so nothing was run or recorded. Your code is saved."
            : message}
        </p>
        {!notConfigured && (
          <p className="text-xs text-ink-muted">This is a service problem, not a verdict on your solution.</p>
        )}
      </div>
    </div>
  );
}

function TestRow({ t }: { t: TestResult }) {
  return (
    <details className="group rounded-lg border border-line open:bg-canvas/30">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2 text-sm">
        <StatusBadge status={t.status} />
        <span className="text-xs text-ink-muted">
          {t.isSample ? `Sample ${t.index + 1}` : (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" aria-hidden /> Hidden test {t.index + 1}
            </span>
          )}
        </span>
        <span className="ml-auto text-xs tabular-nums text-ink-muted">
          {t.timeMs != null && `${t.timeMs} ms`}
          {t.memoryKb != null && ` · ${Math.round(t.memoryKb / 1024)} MB`}
        </span>
      </summary>
      {t.isSample ? (
        <div className="grid gap-2 px-3 pb-3 sm:grid-cols-3">
          {[
            ["Input", t.input],
            ["Expected", t.expectedOutput],
            ["Your output", t.actualOutput],
          ].map(([label, text]) => (
            <div key={label}>
              <p className="mb-1 text-xs text-ink-muted">{label}</p>
              <pre className={pre}>{text || " "}</pre>
            </div>
          ))}
          {t.stderr && (
            <div className="sm:col-span-3">
              <p className="mb-1 text-xs text-ink-muted">stderr</p>
              <pre className={pre}>{t.stderr}</pre>
            </div>
          )}
        </div>
      ) : (
        <p className="px-3 pb-3 text-xs text-ink-muted">Hidden test data is not shown.</p>
      )}
    </details>
  );
}

export function SubmissionResult({
  id,
  onLoadCode,
}: {
  id: string;
  onLoadCode?: (s: SubmissionDetail) => void;
}) {
  const { data: s, error, isPending } = useSubmission(id);

  if (isPending) return <p className="p-4 text-sm text-ink-muted">Loading result…</p>;
  if (error || !s) return <ServiceError code="load_failed" message="The result could not be loaded." />;

  const pending = isPendingStatus(s.status);
  const meta = STATUS_META[s.status];
  const Icon = meta.icon;

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
          <Icon className={`size-5 ${meta.color} ${pending ? "animate-spin" : ""}`} aria-hidden />
          {pending ? (s.status === "PENDING" ? "Queued…" : "Running…") : meta.label}
        </span>
        <span className="text-xs text-ink-muted">
          {s.kind === "RUN" ? "Run on samples" : "Submission"} · {LANGUAGE_LABELS[s.language]}
        </span>
        {s.totalCount != null && !pending && (
          <span className="text-sm text-ink-2">
            {s.passedCount ?? 0} / {s.totalCount} tests passed
          </span>
        )}
        <span className="ml-auto flex items-center gap-3 text-xs tabular-nums text-ink-muted">
          {s.timeMs != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden /> {s.timeMs} ms
            </span>
          )}
          {s.memoryKb != null && (
            <span className="inline-flex items-center gap-1">
              <Cpu className="size-3.5" aria-hidden /> {Math.round(s.memoryKb / 1024)} MB
            </span>
          )}
        </span>
      </div>

      {s.status === "INTERNAL_ERROR" && (
        <p className="text-xs text-ink-muted">The judge failed on its side; this does not count against you.</p>
      )}

      {s.compileOutput && (
        <div>
          <p className="mb-1 text-xs text-ink-muted">Compiler output</p>
          <pre className={pre}>{s.compileOutput}</pre>
        </div>
      )}
      {s.errorMessage && (
        <div>
          <p className="mb-1 text-xs text-ink-muted">Details</p>
          <pre className={pre}>{s.errorMessage}</pre>
        </div>
      )}

      {s.results && s.results.length > 0 && (
        <div className="space-y-1.5">
          {s.results.map((t) => (
            <TestRow key={`${t.isSample}-${t.index}`} t={t} />
          ))}
        </div>
      )}

      {onLoadCode && (
        <Button variant="secondary" className="text-xs" onClick={() => onLoadCode(s)}>
          <FileCode className="size-3.5" aria-hidden />
          Load this code into the editor
        </Button>
      )}
    </div>
  );
}

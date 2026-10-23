import type { Progress } from "@/lib/progress";
import { Meter } from "@/components/ui/meter";
import { Skeleton } from "@/components/ui/skeleton";

function Tile({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {children}
    </div>
  );
}

export function StatTiles({ progress }: { progress: Progress }) {
  const { totalProblems, solvedProblems, attemptedProblems, completion } = progress;
  const unsolvedAttempts = attemptedProblems - solvedProblems;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile label="Total problems" value={String(totalProblems)}>
        <p className="mt-1 text-xs text-ink-muted">{progress.byContest.length} contests</p>
      </Tile>
      <Tile label="Solved" value={String(solvedProblems)}>
        <p className="mt-1 text-xs text-ink-muted">unique problems accepted</p>
      </Tile>
      <Tile label="Attempted" value={String(attemptedProblems)}>
        <p className="mt-1 text-xs text-ink-muted">
          {unsolvedAttempts} not yet solved · {progress.totalSubmissions} submissions
        </p>
      </Tile>
      <Tile label="Completion" value={`${completion}%`}>
        <Meter
          className="mt-3"
          value={solvedProblems}
          total={totalProblems}
          label="Overall completion"
        />
      </Tile>
    </div>
  );
}

export function StatTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-8 w-14" />
          <Skeleton className="mt-3 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

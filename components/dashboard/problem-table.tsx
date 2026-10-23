import Link from "next/link";
import { Circle, CircleCheck, CircleDot, ListChecks, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/form";
import type { ProblemSummary } from "@/lib/problems";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

function SolveState({ state }: { state: ProblemSummary["state"] }) {
  if (state?.solved) {
    return <CircleCheck className="size-4 text-good" aria-label="Solved" />;
  }
  if (state && state.attempts > 0) {
    return <CircleDot className="size-4 text-ink-2" aria-label="Attempted" />;
  }
  return <Circle className="size-4 text-line-strong" aria-label="Not attempted" />;
}

export function ProblemTable({
  problems,
  filtered,
}: {
  problems: ProblemSummary[];
  filtered: boolean;
}) {
  if (problems.length === 0) {
    return filtered ? (
      <EmptyState icon={ListChecks} title="No problems match these filters" />
    ) : (
      <EmptyState icon={ListChecks} title="No problems yet">
        <p>Add a contest and its problems to start practicing.</p>
        <div className="mt-3 flex justify-center gap-2">
          <ButtonLink href="/contests/new" className="py-1.5 text-xs">
            <Plus className="size-3.5" aria-hidden />
            New contest
          </ButtonLink>
          <ButtonLink href="/problems/new" variant="secondary" className="py-1.5 text-xs">
            New problem
          </ButtonLink>
        </div>
      </EmptyState>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-ink-muted">
          <tr className="border-b border-line">
            <th className="w-10 px-4 py-2 font-normal">
              <span className="sr-only">Status</span>
            </th>
            <th className="py-2 pr-4 font-normal">Problem</th>
            <th className="hidden py-2 pr-4 font-normal md:table-cell">Topics</th>
            <th className="py-2 pr-4 font-normal">Difficulty</th>
            <th className="py-2 pr-4 text-right font-normal">Attempts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {problems.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-surface-2">
              <td className="px-4 py-3">
                <SolveState state={p.state} />
              </td>
              <td className="py-3 pr-4">
                <Link href={`/problems/${p.slug}`} className="font-medium text-ink hover:text-accent-strong">
                  {p.label && <span className="mr-1.5 text-ink-muted">{p.label}.</span>}
                  {p.title}
                </Link>
                {p.contest && (
                  <Link
                    href={`/contests/${p.contest.slug}`}
                    className="mt-0.5 block text-xs text-ink-muted hover:text-ink-2"
                  >
                    {p.contest.title}
                  </Link>
                )}
              </td>
              <td className="hidden py-3 pr-4 md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {p.topics.map((t) => (
                    <span key={t} className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink-2">
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 pr-4">
                <DifficultyBadge difficulty={p.difficulty} />
              </td>
              <td className="py-3 pr-4 text-right tabular-nums text-ink-2">{p.state?.attempts ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProblemTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

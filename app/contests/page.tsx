import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Plus, Trophy } from "lucide-react";
import { getProgress } from "@/lib/progress";
import { contestPhase } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { ContestPhaseBadge } from "@/components/contests/contest-phase";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/form";
import { Meter } from "@/components/ui/meter";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Contests" };

async function ContestList() {
  await connection();
  const { byContest: contests, generatedAt } = await getProgress();
  if (contests.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <EmptyState icon={Trophy} title="No contests yet">
          Create a contest, then add its problems and test cases.
        </EmptyState>
      </div>
    );
  }
  const now = generatedAt.getTime();
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {contests.map((c) => (
        <li key={c.id}>
          <Link
            href={`/contests/${c.slug}`}
            className="block h-full rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate font-medium text-ink" title={c.title}>
                {c.title}
              </p>
              <ContestPhaseBadge phase={contestPhase(c.startTime, c.endTime, now)} />
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {[c.platform, c.startTime && formatDate(c.startTime)].filter(Boolean).join(" · ") || "—"}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Meter value={c.solved} total={c.total} label={c.title} />
              <span className="shrink-0 text-xs tabular-nums text-ink-2">
                {c.total === 0 ? "No problems" : `${c.solved} / ${c.total}`}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ContestsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        title="Contests"
        description="Past contests you can practice anytime."
        actions={
          <ButtonLink href="/contests/new">
            <Plus className="size-4" aria-hidden />
            New contest
          </ButtonLink>
        }
      />
      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        }
      >
        <ContestList />
      </Suspense>
    </div>
  );
}

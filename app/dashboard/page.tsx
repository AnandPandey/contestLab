import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getProgress } from "@/lib/progress";
import { listProblems, type ProblemFilters as Filters } from "@/lib/problems";
import { Difficulty } from "@/app/generated/prisma/enums";
import { ContestProgress } from "@/components/dashboard/contest-progress";
import { DifficultyBreakdown } from "@/components/dashboard/difficulty-breakdown";
import { ProblemFilters } from "@/components/dashboard/problem-filters";
import { ProblemTable, ProblemTableSkeleton } from "@/components/dashboard/problem-table";
import { RecentSubmissions } from "@/components/dashboard/recent-submissions";
import { StatTiles, StatTilesSkeleton } from "@/components/dashboard/stat-tiles";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Dashboard" };

type SearchParams = PageProps<"/dashboard">["searchParams"];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const STATUSES = ["solved", "attempted", "unattempted"] as const;

/** Unknown filter values are ignored rather than treated as errors. */
function parseFilters(sp: Awaited<SearchParams>): Filters {
  const difficulty = first(sp.difficulty);
  const status = first(sp.status);
  const topic = first(sp.topic)?.trim().slice(0, 50);
  return {
    difficulty: Object.values(Difficulty).find((d) => d === difficulty),
    status: STATUSES.find((s) => s === status),
    topic: topic || undefined,
  };
}

async function Overview() {
  await connection();
  return <StatTiles progress={await getProgress()} />;
}

async function Problems({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  const [problems, progress] = await Promise.all([listProblems(filters), getProgress()]);
  const filtered = Boolean(filters.difficulty || filters.status || filters.topic);
  return (
    <>
      <ProblemFilters filters={filters} topics={progress.byTopic} />
      <ProblemTable problems={problems} filtered={filtered} />
    </>
  );
}

async function Difficulties() {
  await connection();
  return <DifficultyBreakdown byDifficulty={(await getProgress()).byDifficulty} />;
}

async function Recent() {
  await connection();
  const { recentSubmissions, generatedAt } = await getProgress();
  return <RecentSubmissions submissions={recentSubmissions} now={generatedAt.getTime()} />;
}

async function Contests() {
  await connection();
  return <ContestProgress contests={(await getProgress()).byContest} />;
}

function SidePanelSkeleton({ title }: { title: string }) {
  return (
    <Panel title={title}>
      <div className="space-y-4 p-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-6" />
        ))}
      </div>
    </Panel>
  );
}

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">Your practice progress across all contests.</p>
      </header>

      <Suspense fallback={<StatTilesSkeleton />}>
        <Overview />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Problems" className="min-w-0 lg:col-span-2">
          <Suspense fallback={<ProblemTableSkeleton />}>
            <Problems searchParams={searchParams} />
          </Suspense>
        </Panel>

        <div className="space-y-6">
          <Suspense fallback={<SidePanelSkeleton title="By difficulty" />}>
            <Difficulties />
          </Suspense>
          <Suspense fallback={<SidePanelSkeleton title="Recent submissions" />}>
            <Recent />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<SidePanelSkeleton title="Contests" />}>
        <Contests />
      </Suspense>
    </div>
  );
}

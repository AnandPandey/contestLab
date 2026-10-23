import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ExternalLink, ListChecks, Pencil, Plus } from "lucide-react";
import { getContest } from "@/lib/contests";
import { contestPhase } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { ContestPhaseBadge } from "@/components/contests/contest-phase";
import { PageHeader } from "@/components/layout/page-header";
import { DeleteButton } from "@/components/ui/delete-button";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/form";
import { Meter } from "@/components/ui/meter";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = { title: "Contest" };

type Params = PageProps<"/contests/[slug]">["params"];

async function ContestDetail({ params }: { params: Params }) {
  const { slug } = await params;
  await connection();
  const contest = await getContest(slug);
  if (!contest) notFound();

  const solved = contest.problems.filter((p) => p.state?.solved).length;
  const now = contest.loadedAt.getTime();
  const dates = [contest.startTime && formatDate(contest.startTime), contest.endTime && formatDate(contest.endTime)]
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/contests", label: "Contests" }}
        title={contest.title}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ContestPhaseBadge phase={contestPhase(contest.startTime, contest.endTime, now)} />
            {contest.platform && <span>{contest.platform}</span>}
            {dates && <span>{dates}</span>}
            {contest.url && (
              <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:text-accent-strong"
              >
                Original <ExternalLink className="size-3" aria-hidden />
              </a>
            )}
          </span>
        }
        actions={
          <>
            <ButtonLink variant="secondary" href={`/contests/${contest.slug}/edit`}>
              <Pencil className="size-4" aria-hidden />
              Edit
            </ButtonLink>
            <DeleteButton
              endpoint={`/api/contests/${contest.id}`}
              redirectTo="/contests"
              confirmText={`Delete "${contest.title}"? This permanently deletes its ${contest.problems.length} problem(s), their test cases, submissions and progress.`}
            />
          </>
        }
      />

      {contest.description && (
        <p className="whitespace-pre-wrap text-sm text-ink-2">{contest.description}</p>
      )}

      <Panel
        title={
          <span className="flex items-center gap-3">
            Problems
            <span className="text-xs font-normal text-ink-muted">
              {solved} / {contest.problems.length} solved
            </span>
          </span>
        }
        action={
          <ButtonLink href={`/problems/new?contest=${contest.slug}`} className="py-1.5 text-xs">
            <Plus className="size-3.5" aria-hidden />
            Add problem
          </ButtonLink>
        }
      >
        {contest.problems.length > 0 && (
          <div className="border-b border-line px-4 py-3">
            <Meter value={solved} total={contest.problems.length} label={`${contest.title} progress`} />
          </div>
        )}
        {contest.problems.length === 0 ? (
          <EmptyState icon={ListChecks} title="No problems in this contest yet">
            Add the contest&apos;s problems with their statements and test cases.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {contest.problems.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/problems/${p.slug}`} className="font-medium text-ink hover:text-accent-strong">
                    {p.label && <span className="mr-1.5 text-ink-muted">{p.label}.</span>}
                    {p.title}
                  </Link>
                  {p.topics.length > 0 && <p className="mt-0.5 text-xs text-ink-muted">{p.topics.join(", ")}</p>}
                </div>
                <DifficultyBadge difficulty={p.difficulty} />
                <span className="w-36 text-xs text-ink-muted">
                  {p.state?.lastStatus ? <StatusBadge status={p.state.lastStatus} /> : "Not attempted"}
                </span>
                <Link
                  href={`/problems/${p.slug}/edit`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-2 hover:bg-surface-2 hover:text-ink"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export default function ContestPage({ params }: PageProps<"/contests/[slug]">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-16 w-2/3" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        }
      >
        <ContestDetail params={params} />
      </Suspense>
    </div>
  );
}

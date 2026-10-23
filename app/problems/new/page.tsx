import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { listContestOptions } from "@/lib/contests";
import { PageHeader } from "@/components/layout/page-header";
import { ProblemForm } from "@/components/problems/problem-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "New problem" };

type SearchParams = PageProps<"/problems/new">["searchParams"];

async function NewProblem({ searchParams }: { searchParams: SearchParams }) {
  const { contest } = await searchParams;
  await connection();
  const contests = await listContestOptions();
  const key = Array.isArray(contest) ? contest[0] : contest;
  const preset = contests.find((c) => c.id === key || c.slug === key);
  const back = preset
    ? { href: `/contests/${preset.slug}`, label: preset.title }
    : { href: "/dashboard", label: "Dashboard" };

  return (
    <>
      <PageHeader
        title="New problem"
        description="Enter the statement and details. You can add test cases right after creating it."
        back={back}
      />
      <ProblemForm
        contests={contests}
        defaultContestId={preset?.id ?? null}
        cancelHref={back.href}
      />
    </>
  );
}

export default function NewProblemPage({ searchParams }: PageProps<"/problems/new">) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-xl" />}>
        <NewProblem searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

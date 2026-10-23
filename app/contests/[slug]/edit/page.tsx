import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getContest } from "@/lib/contests";
import { ContestForm } from "@/components/contests/contest-form";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Edit contest" };

async function EditContest({ params }: { params: PageProps<"/contests/[slug]/edit">["params"] }) {
  const { slug } = await params;
  await connection();
  const contest = await getContest(slug);
  if (!contest) notFound();
  return (
    <>
      <PageHeader title="Edit contest" back={{ href: `/contests/${contest.slug}`, label: contest.title }} />
      <ContestForm
        initial={{
          id: contest.id,
          slug: contest.slug,
          title: contest.title,
          platform: contest.platform,
          url: contest.url,
          description: contest.description,
          startTime: contest.startTime,
          endTime: contest.endTime,
        }}
      />
    </>
  );
}

export default function EditContestPage({ params }: PageProps<"/contests/[slug]/edit">) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <EditContest params={params} />
      </Suspense>
    </div>
  );
}

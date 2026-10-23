import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { listContestOptions } from "@/lib/contests";
import { getProblemForEdit } from "@/lib/problems";
import type { FunctionSpec } from "@/lib/templates";
import { PageHeader } from "@/components/layout/page-header";
import type { Example } from "@/components/problems/examples-editor";
import { ProblemForm } from "@/components/problems/problem-form";
import type { Templates } from "@/components/problems/starter-editor";
import { TestCaseManager, type ClientTestCase } from "@/components/problems/test-case-manager";
import { DeleteButton } from "@/components/ui/delete-button";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Edit problem" };

async function EditProblem({ params }: { params: PageProps<"/problems/[slug]/edit">["params"] }) {
  const { slug } = await params;
  await connection();
  const [problem, contests] = await Promise.all([getProblemForEdit(slug), listContestOptions()]);
  if (!problem) notFound();

  const back = problem.contest
    ? { href: `/contests/${problem.contest.slug}`, label: problem.contest.title }
    : { href: "/dashboard", label: "Dashboard" };

  return (
    <>
      <PageHeader
        title={problem.title}
        description="Edit the problem and manage its test cases."
        back={back}
        actions={
          <DeleteButton
            endpoint={`/api/problems/${problem.id}`}
            redirectTo={back.href}
            label="Delete problem"
            confirmText={`Delete "${problem.title}"? Its test cases, submissions and progress are deleted too.`}
          />
        }
      />
      <ProblemForm
        contests={contests}
        cancelHref={back.href}
        initial={{
          id: problem.id,
          slug: problem.slug,
          contestId: problem.contestId,
          label: problem.label,
          order: problem.order,
          title: problem.title,
          difficulty: problem.difficulty,
          mode: problem.mode,
          topics: problem.topics,
          statement: problem.statement,
          inputFormat: problem.inputFormat,
          outputFormat: problem.outputFormat,
          constraints: problem.constraints,
          examples: problem.examples as Example[],
          functionSpec: problem.functionSpec as FunctionSpec | null,
          starterTemplates: problem.starterTemplates as Templates,
          timeLimitMs: problem.timeLimitMs,
          memoryLimitKb: problem.memoryLimitKb,
        }}
      />
      <div id="test-cases" className="scroll-mt-20">
        <Panel title="Test cases">
          <div className="p-5">
            <TestCaseManager problemId={problem.id} initial={problem.testCases as ClientTestCase[]} />
          </div>
        </Panel>
      </div>
    </>
  );
}

export default function EditProblemPage({ params }: PageProps<"/problems/[slug]/edit">) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-xl" />}>
        <EditProblem params={params} />
      </Suspense>
    </div>
  );
}

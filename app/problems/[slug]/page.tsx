import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { getWorkspaceData } from "@/lib/problems";
import { ProblemStatement } from "@/components/workspace/problem-statement";
import { Workspace } from "@/components/workspace/workspace";

export const metadata: Metadata = { title: "Solve" };

async function WorkspaceLoader({ params }: { params: PageProps<"/problems/[slug]">["params"] }) {
  const { slug } = await params;
  await connection();
  const data = await getWorkspaceData(slug);
  if (!data) notFound();
  const { problem, savedCode } = data;

  return (
    <Workspace
      problem={{
        id: problem.id,
        mode: problem.mode,
        functionSpec: problem.functionSpec,
        starterTemplates: problem.starterTemplates,
        sampleTestCases: problem.sampleTestCases.map(({ id, input, expectedOutput }) => ({ id, input, expectedOutput })),
        hiddenTestCount: problem.hiddenTestCount,
      }}
      savedCode={savedCode}
      statement={<ProblemStatement problem={problem} />}
    />
  );
}

export default function ProblemPage({ params }: PageProps<"/problems/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center gap-2 text-sm text-ink-muted">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Loading problem…
        </div>
      }
    >
      <WorkspaceLoader params={params} />
    </Suspense>
  );
}

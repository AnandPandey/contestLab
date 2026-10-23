import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api";
import type { Prisma } from "@/app/generated/prisma/client";
import type { Difficulty } from "@/app/generated/prisma/enums";

/** Single-user mode until auth exists. */
export const LOCAL_USER = "local";

/** Look up by id or slug so URLs can use either. */
export const byIdOrSlug = (key: string) => ({ OR: [{ id: key }, { slug: key }] });

export async function requireProblemId(key: string) {
  const problem = await prisma.problem.findFirst({ where: byIdOrSlug(key), select: { id: true } });
  if (!problem) throw notFound("Problem");
  return problem.id;
}

/** Fields safe to send to the client. Never includes hidden test case content. */
export const problemDetailInclude = {
  contest: { select: { id: true, title: true, slug: true } },
  testCases: {
    where: { isSample: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, input: true, expectedOutput: true, order: true },
  },
  states: {
    where: { userId: LOCAL_USER },
    select: { solved: true, solvedAt: true, attempts: true, lastStatus: true, lastSubmittedAt: true },
  },
  _count: { select: { testCases: { where: { isSample: false } } } },
} satisfies Prisma.ProblemInclude;

type ProblemDetailRow = Prisma.ProblemGetPayload<{ include: typeof problemDetailInclude }>;

export function serializeProblemDetail(p: ProblemDetailRow) {
  const { testCases, states, _count, ...rest } = p;
  return {
    ...rest,
    sampleTestCases: testCases,
    hiddenTestCount: _count.testCases,
    state: states[0] ?? null,
  };
}

export const problemSummarySelect = {
  id: true,
  slug: true,
  title: true,
  label: true,
  order: true,
  difficulty: true,
  mode: true,
  topics: true,
  contestId: true,
  createdAt: true,
  contest: { select: { id: true, title: true, slug: true } },
  states: {
    where: { userId: LOCAL_USER },
    select: { solved: true, attempts: true, lastStatus: true, lastSubmittedAt: true },
  },
} satisfies Prisma.ProblemSelect;

type ProblemSummaryRow = Prisma.ProblemGetPayload<{ select: typeof problemSummarySelect }>;

export function serializeProblemSummary({ states, ...rest }: ProblemSummaryRow) {
  return { ...rest, state: states[0] ?? null };
}

export type ProblemSummary = ReturnType<typeof serializeProblemSummary>;

export type ProblemFilters = {
  contestId?: string;
  difficulty?: Difficulty;
  topic?: string;
  status?: "solved" | "attempted" | "unattempted";
  q?: string;
};

/** Problem summaries matching the filters, newest first. Shared by the API and pages. */
export async function listProblems({ contestId, difficulty, topic, status, q }: ProblemFilters) {
  const local = { userId: LOCAL_USER };
  const statusFilter: Prisma.ProblemWhereInput | undefined =
    status === "solved"
      ? { states: { some: { ...local, solved: true } } }
      : status === "attempted"
        ? { states: { some: { ...local, solved: false, attempts: { gt: 0 } } } }
        : status === "unattempted"
          ? { states: { none: { ...local, attempts: { gt: 0 } } } }
          : undefined;

  const problems = await prisma.problem.findMany({
    where: {
      contestId,
      difficulty,
      topics: topic ? { has: topic } : undefined,
      title: q ? { contains: q, mode: "insensitive" } : undefined,
      ...statusFilter,
    },
    orderBy: [{ createdAt: "desc" }],
    select: problemSummarySelect,
  });
  return problems.map(serializeProblemSummary);
}

/** Everything the problem editor needs. Hidden test cases come back as metadata only. */
export async function getProblemForEdit(key: string) {
  const problem = await prisma.problem.findFirst({
    where: byIdOrSlug(key),
    include: {
      contest: { select: { id: true, title: true, slug: true } },
      testCases: { orderBy: [{ isSample: "desc" }, { order: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!problem) return null;
  const { testCases, ...rest } = problem;
  return { ...rest, testCases: testCases.map(serializeTestCase) };
}

/** Hidden cases expose only metadata; their input/output stays on the server. */
export function serializeTestCase(tc: {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  order: number;
}) {
  if (tc.isSample) return tc;
  return {
    id: tc.id,
    isSample: false,
    order: tc.order,
    inputBytes: Buffer.byteLength(tc.input),
    outputBytes: Buffer.byteLength(tc.expectedOutput),
  };
}

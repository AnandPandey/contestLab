import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api";
import type { Prisma } from "@/app/generated/prisma/client";

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

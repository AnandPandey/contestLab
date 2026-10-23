import { json, parseBody, route } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireProblemId, serializeTestCase } from "@/lib/problems";
import { testCaseBulkCreateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** Sample cases are returned in full; hidden cases only as metadata. */
export const GET = route<Ctx>(async (_req, { params }) => {
  const problemId = await requireProblemId((await params).id);
  const testCases = await prisma.testCase.findMany({
    where: { problemId },
    orderBy: [{ isSample: "desc" }, { order: "asc" }, { createdAt: "asc" }],
  });
  return json({ testCases: testCases.map(serializeTestCase) });
});

export const POST = route<Ctx>(async (req, { params }) => {
  const problemId = await requireProblemId((await params).id);
  const { testCases } = await parseBody(req, testCaseBulkCreateSchema);
  const base = await prisma.testCase.count({ where: { problemId } });
  const created = await prisma.testCase.createManyAndReturn({
    data: testCases.map((tc, i) => ({ ...tc, problemId, order: tc.order ?? base + i })),
  });
  return json({ testCases: created.map(serializeTestCase) }, 201);
});

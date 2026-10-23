import { json, notFound, parseBody, route } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireProblemId, serializeTestCase } from "@/lib/problems";
import { testCaseUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string; testCaseId: string }> };

async function requireTestCase(params: Ctx["params"]) {
  const { id, testCaseId } = await params;
  const problemId = await requireProblemId(id);
  const testCase = await prisma.testCase.findFirst({
    where: { id: testCaseId, problemId },
    select: { id: true },
  });
  if (!testCase) throw notFound("Test case");
  return testCase.id;
}

export const PATCH = route<Ctx>(async (req, { params }) => {
  const id = await requireTestCase(params);
  const data = await parseBody(req, testCaseUpdateSchema);
  const testCase = await prisma.testCase.update({ where: { id }, data });
  return json({ testCase: serializeTestCase(testCase) });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const id = await requireTestCase(params);
  await prisma.testCase.delete({ where: { id } });
  return json({ deleted: true });
});

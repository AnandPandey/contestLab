import { ApiError, json, notFound, parseBody, route } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { byIdOrSlug, problemDetailInclude, serializeProblemDetail } from "@/lib/problems";
import { problemUpdateSchema } from "@/lib/validation";
import { Prisma } from "@/app/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const problem = await prisma.problem.findFirst({
    where: byIdOrSlug((await params).id),
    include: problemDetailInclude,
  });
  if (!problem) throw notFound("Problem");
  return json({ problem: serializeProblemDetail(problem) });
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const existing = await prisma.problem.findFirst({
    where: byIdOrSlug((await params).id),
    select: { id: true, mode: true, functionSpec: true },
  });
  if (!existing) throw notFound("Problem");

  const { functionSpec, ...data } = await parseBody(req, problemUpdateSchema);
  const mode = data.mode ?? existing.mode;
  const spec = functionSpec !== undefined ? functionSpec : existing.functionSpec;
  if (mode === "FUNCTION" && spec == null) {
    throw new ApiError(400, "validation_error", "FUNCTION mode problems require a functionSpec");
  }

  const problem = await prisma.problem.update({
    where: { id: existing.id },
    data: {
      ...data,
      functionSpec:
        functionSpec === undefined ? undefined : functionSpec === null ? Prisma.DbNull : functionSpec,
    },
    include: problemDetailInclude,
  });
  return json({ problem: serializeProblemDetail(problem) });
});

/** Deletes the problem and, via cascade, its test cases, submissions and progress. */
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const existing = await prisma.problem.findFirst({
    where: byIdOrSlug((await params).id),
    select: { id: true },
  });
  if (!existing) throw notFound("Problem");
  await prisma.problem.delete({ where: { id: existing.id } });
  return json({ deleted: true });
});

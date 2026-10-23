import { ApiError, json, notFound, parseBody, route } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { byIdOrSlug, problemSummarySelect, serializeProblemSummary } from "@/lib/problems";
import { contestUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function requireContest(key: string) {
  const contest = await prisma.contest.findFirst({ where: byIdOrSlug(key) });
  if (!contest) throw notFound("Contest");
  return contest;
}

export const GET = route<Ctx>(async (_req, { params }) => {
  const contest = await requireContest((await params).id);
  const problems = await prisma.problem.findMany({
    where: { contestId: contest.id },
    orderBy: [{ order: "asc" }, { label: "asc" }, { createdAt: "asc" }],
    select: problemSummarySelect,
  });
  return json({ contest: { ...contest, problems: problems.map(serializeProblemSummary) } });
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const existing = await requireContest((await params).id);
  const data = await parseBody(req, contestUpdateSchema);
  const startTime = data.startTime !== undefined ? data.startTime : existing.startTime;
  const endTime = data.endTime !== undefined ? data.endTime : existing.endTime;
  if (startTime && endTime && endTime < startTime) {
    throw new ApiError(400, "validation_error", "endTime must be after startTime");
  }
  const contest = await prisma.contest.update({ where: { id: existing.id }, data });
  return json({ contest });
});

/** Deletes the contest and, via cascade, its problems, test cases, submissions and progress. */
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const existing = await requireContest((await params).id);
  const problemsDeleted = await prisma.problem.count({ where: { contestId: existing.id } });
  await prisma.contest.delete({ where: { id: existing.id } });
  return json({ deleted: true, problemsDeleted });
});

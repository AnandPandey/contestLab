import { ApiError, json, parseBody, parseQuery, route } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireProblemId } from "@/lib/problems";
import { submissionCreateSchema, submissionQuerySchema } from "@/lib/validation";

export const GET = route(async (req) => {
  const { problemId, status, kind, limit, cursor } = parseQuery(req, submissionQuerySchema);
  const rows = await prisma.submission.findMany({
    where: {
      problemId: problemId ? await requireProblemId(problemId) : undefined,
      status,
      kind,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    // Code is omitted from the list; fetch /api/submissions/[id] for it.
    select: {
      id: true,
      kind: true,
      language: true,
      status: true,
      passedCount: true,
      totalCount: true,
      timeMs: true,
      memoryKb: true,
      createdAt: true,
      completedAt: true,
      problem: { select: { id: true, slug: true, title: true } },
    },
  });
  const hasMore = rows.length > limit;
  const submissions = hasMore ? rows.slice(0, limit) : rows;
  return json({ submissions, nextCursor: hasMore ? submissions.at(-1)!.id : null });
});

/**
 * Code execution arrives with the Judge0 integration (Milestone E). Until then the
 * request is validated but rejected rather than stored with a fabricated verdict.
 */
export const POST = route(async (req) => {
  const body = await parseBody(req, submissionCreateSchema);
  await requireProblemId(body.problemId);
  throw new ApiError(
    503,
    "judge_not_configured",
    "Code execution is not configured yet (Judge0 integration is pending)",
  );
});
